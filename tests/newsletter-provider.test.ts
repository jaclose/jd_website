import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Resend } from "resend";
import { createNewsletterProvider, type NewsletterChannels } from "../lib/newsletter/provider";
const channels: NewsletterChannels = { essay: { segmentId: "s-site", topicId: "t-e" }, field_note: { segmentId: "s-site", topicId: "t-f" }, project: { segmentId: "s-site", topicId: "t-p" }, weekly: { segmentId: "s-site", topicId: "t-w" }, monthly: { segmentId: "s-site", topicId: "t-m" } };
type Call = { method: string; path: string; body: Record<string, unknown> };
async function withProvider(existing: boolean, run: (provider: ReturnType<typeof createNewsletterProvider>, calls: Call[]) => Promise<void>, failPath?: string) {
  const calls: Call[] = [];
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString();
    calls.push({ method: req.method!, path: decodeURIComponent(req.url!), body: raw ? JSON.parse(raw) : {} });
    res.setHeader("content-type", "application/json");
    if (decodeURIComponent(req.url!) === failPath) { res.statusCode = 500; res.end(JSON.stringify({ name: "application_error", message: "provider failed" })); return; }
    if (req.method === "GET" && !req.url?.includes("topics")) {
      res.statusCode = existing ? 200 : 404;
      res.end(JSON.stringify(existing ? { id: "c1", email: "reader@example.com", unsubscribed: false } : { name: "not_found", statusCode: 404, message: "not found" })); return;
    }
    if (req.url?.includes("topics") && req.method === "GET") { res.end(JSON.stringify({ data: [{ id: "t-p", subscription: "opt_in" }, { id: "t-w", subscription: "opt_out" }, { id: "t-m", subscription: "opt_out" }], has_more: false })); return; }
    res.end(JSON.stringify({ id: "c1" }));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address(); if (!address || typeof address === "string") throw new Error("No port");
  const client = new Resend("re_local_test_only", { baseUrl: `http://127.0.0.1:${address.port}` });
  try { await run(createNewsletterProvider(client, "Jafar <letters@example.com>", channels), calls); }
  finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}
test("real Resend SDK serializes new contact with exact segment and all topic choices", async () => {
  await withProvider(false, async (provider, calls) => {
    await provider.save("reader@example.com", ["project"]);
    const create = calls.find(c => c.method === "POST")!;
    assert.deepEqual(create.body.segments, [{ id: "s-site" }]);
    assert.deepEqual(create.body.topics, [{ id: "t-e", subscription: "opt_out" }, { id: "t-f", subscription: "opt_out" }, { id: "t-p", subscription: "opt_in" }, { id: "t-w", subscription: "opt_out" }, { id: "t-m", subscription: "opt_out" }]);
    assert.equal(create.body.unsubscribed, false);
  });
});
test("unsubscribe opts out of every topic and retains the preference audience", async () => {
  await withProvider(true, async (provider, calls) => {
    await provider.save("reader@example.com", []);
    const topics = calls.find(c => c.method === "PATCH" && c.path.endsWith("topics"))!;
    assert.ok(topics); assert.equal((topics.body as unknown as { subscription: string }[]).every(t => t.subscription === "opt_out"), true);
    assert.equal(calls.filter(c => c.method === "DELETE").length, 0);
    assert.ok(calls.every(c => c.body.unsubscribed !== false));
  });
});
test("provider preference reads match project topic; provider errors propagate", async () => {
  await withProvider(true, async provider => assert.deepEqual(await provider.preferences("reader@example.com"), ["project"]));
  await withProvider(true, async (provider, calls) => {
    await assert.rejects(provider.save("reader@example.com", ["essay"]));
    assert.equal(calls.filter(c => c.method === "DELETE" || c.method === "POST").length, 0);
  }, "/contacts/reader@example.com/topics");
});

test("email identifiers are encoded as path segments", async () => {
  await withProvider(true, async (provider, calls) => {
    await provider.preferences("reader+study#1@example.com");
    assert.equal(calls[0].path, "/contacts/reader+study#1@example.com");
    assert.equal(calls[1].path, "/contacts/reader+study#1@example.com/topics?limit=100");
  });
});
