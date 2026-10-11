import assert from "node:assert/strict";
import test from "node:test";
import { subscribeToNewsletter, saveNewsletterPreferences, tokenDigest, type NewsletterRequest, type NewsletterStore, type NewsletterProvider } from "../lib/newsletter/subscription";
import { parsePreferences } from "../lib/newsletter/preferences";
import { readNewsletterBody } from "../lib/newsletter/runtime";

function fixture() {
  const requests = new Map<string, NewsletterRequest>();
  const messages: { email: string; url: string }[] = [];
  const saves: { email: string; preferences: string[] }[] = [];
  const store: NewsletterStore = {
    async issue(request) { requests.set(request.tokenHash, request); return true; },
    async read(hash) { return requests.get(hash) ?? null; },
    async consume(hash) { const r = requests.get(hash); requests.delete(hash); return r ?? null; },
  };
  const provider: NewsletterProvider = {
    async sendLink(email, url) { messages.push({ email, url }); },
    async preferences() { return ["essay"]; },
    async save(email, preferences) { saves.push({ email, preferences }); },
  };
  const args = { store, provider, origin: "https://www.jafardabbagh.com", ipHash: "hashed-ip" };
  return { ...args, args, requests, messages, saves };
}
const signup = { email: " Reader@Example.com ", preferences: ["essay", "project"], consent: true };

test("signup emails a one-time link but does not enroll anyone", async () => {
  const f = fixture();
  const result = await subscribeToNewsletter({ ...f.args, body: signup });
  assert.equal(result.ok, true); assert.equal(f.saves.length, 0);
  assert.equal(f.messages[0].email, "reader@example.com");
  const url = new URL(f.messages[0].url);
  assert.equal(url.search, ""); assert.equal(url.pathname, "/newsletter/confirm");
  assert.match(url.hash, /^#[a-f0-9]{64}$/);
  assert.ok(f.requests.has(tokenDigest(url.hash.slice(1))));
});
test("valid confirmation applies exact choices, including projects, once", async () => {
  const f = fixture(); await subscribeToNewsletter({ ...f.args, body: signup });
  const token = new URL(f.messages[0].url).hash.slice(1);
  const result = await saveNewsletterPreferences({ ...f.args, token, preferences: ["project"] });
  assert.equal(result.ok, true); assert.deepEqual(f.saves, [{ email: "reader@example.com", preferences: ["project"] }]);
  assert.equal((await saveNewsletterPreferences({ ...f.args, token, preferences: ["essay"] })).httpStatus, 410);
  assert.equal(f.saves.length, 1);
});
test("empty confirmed selection unsubscribes all categories", async () => {
  const f = fixture(); await subscribeToNewsletter({ ...f.args, body: { email: signup.email, intent: "manage" } });
  const token = new URL(f.messages[0].url).hash.slice(1);
  await saveNewsletterPreferences({ ...f.args, token, preferences: [] });
  assert.deepEqual(f.saves[0].preferences, []);
});
test("rejects malformed bodies, invalid email, absent consent and unknown categories", async () => {
  for (const body of [null, [], "x", { ...signup, email: "a" }, { ...signup, consent: false }, { ...signup, preferences: [] }, { ...signup, preferences: ["ads"] }, { ...signup, email: `${"x".repeat(260)}@example.com` }]) {
    const f = fixture(); assert.equal((await subscribeToNewsletter({ ...f.args, body })).httpStatus, 400); assert.equal(f.messages.length, 0);
  }
});
test("honeypot makes no storage or email calls", async () => {
  const f = fixture(); await subscribeToNewsletter({ ...f.args, body: { ...signup, company: "spam" } });
  assert.equal(f.requests.size, 0); assert.equal(f.messages.length, 0);
});
test("missing configuration, durable rate limits and provider errors fail honestly", async () => {
  const f = fixture();
  assert.equal((await subscribeToNewsletter({ ...f.args, body: signup, provider: null })).httpStatus, 503);
  f.store.issue = async () => false;
  assert.equal((await subscribeToNewsletter({ ...f.args, body: signup })).httpStatus, 429);
  assert.equal(f.messages.length, 0);
  f.store.issue = async () => { throw new Error("db"); };
  assert.equal((await subscribeToNewsletter({ ...f.args, body: signup })).httpStatus, 502);
});
test("expired, tampered and replayed tokens never mutate contacts", async () => {
  const f = fixture();
  for (const token of [null, "bad", "a".repeat(64)]) {
    assert.equal((await saveNewsletterPreferences({ ...f.args, token, preferences: ["essay"] })).ok, false);
  }
  assert.equal(f.saves.length, 0);
});
test("a failed save consumes its token so old consent cannot be replayed", async () => {
  const f = fixture(); await subscribeToNewsletter({ ...f.args, body: signup });
  const token = new URL(f.messages[0].url).hash.slice(1);
  f.provider.save = async () => { throw new Error("Provider unavailable"); };
  assert.equal((await saveNewsletterPreferences({ ...f.args, token, preferences: ["essay"] })).httpStatus, 502);
  assert.equal((await saveNewsletterPreferences({ ...f.args, token, preferences: ["essay"] })).httpStatus, 410);
});
test("concurrent use of the same token makes only one provider write", async () => {
  const f = fixture(); await subscribeToNewsletter({ ...f.args, body: signup });
  const token = new URL(f.messages[0].url).hash.slice(1);
  const results = await Promise.all([1, 2].map(() => saveNewsletterPreferences({ ...f.args, token, preferences: ["essay"] })));
  assert.equal(results.filter(r => r.ok).length, 1); assert.equal(f.saves.length, 1);
});
test("preferences cannot broaden accidentally", () => {
  assert.deepEqual(parsePreferences(["essay", "essay"]), ["essay"]);
  assert.equal(parsePreferences("all"), null); assert.equal(parsePreferences(["essay", "unknown"]), null);
});
test("request boundary rejects cross-origin, wrong content type and oversized JSON", async () => {
  const req = (body: string, headers = {}) => new Request("https://www.jafardabbagh.com/api/newsletter/subscribe", { method: "POST", body, headers: { "Content-Type": "application/json", ...headers } });
  assert.deepEqual(await readNewsletterBody(req('{"email":"reader@example.com"}')), { email: "reader@example.com" });
  await assert.rejects(readNewsletterBody(req('{}', { origin: "https://evil.example" })));
  await assert.rejects(readNewsletterBody(req('{}', { "Content-Type": "text/plain" })));
  await assert.rejects(readNewsletterBody(req(JSON.stringify({ email: "x".repeat(9000) }))));
});
