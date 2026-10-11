import test from "node:test";
import assert from "node:assert/strict";
import { digestPeriods, digestItems, eligiblePublications, publicationKey, publicationRevision } from "../lib/email/automation";
import { publicationCatalog } from "../lib/email/catalog";
import { renderDigest } from "../lib/email/templates/digest";
import { parsePreferences } from "../lib/newsletter/preferences";
import baseline from "../data/newsletter-baseline.json";
import { spawnSync } from "node:child_process";
const now = new Date("2026-10-11T13:17:00Z");
const start = new Date("2026-10-01T00:00:00Z");
const item = { type: "essay" as const, slug: "a-new-chapter", title: "A new chapter", publishedAt: "2026-10-08", url: "https://www.jafardabbagh.com/essays/a-new-chapter" };
const live = (items = [item]) => new Map(items.map(p => [publicationKey(p), publicationRevision(p)]));
test("activation never sweeps the existing archive", () => {
  const catalog = publicationCatalog();
  assert.deepEqual(eligiblePublications(catalog, baseline.archivedKeys, new Date("2000-01-01"), now, new Map(catalog.map(p => [publicationKey(p), publicationRevision(p)]))), []);
});
test("only content with the exact deployed revision after activation is eligible", () => {
  assert.deepEqual(eligiblePublications([item], [], start, now, live()), [item]);
  assert.deepEqual(eligiblePublications([{ ...item, title: "An undeployed change" }], [], start, now, live()), []);
  assert.deepEqual(eligiblePublications([item], [], start, now, new Map()), []);
  assert.deepEqual(eligiblePublications([item], [], new Date("2026-10-09T04:00:00Z"), now, live()), []);
  assert.deepEqual(eligiblePublications([{ ...item, publishedAt: "2026-11-01" }], [], start, now, live()), []);
  assert.throws(() => eligiblePublications([item], [], new Date("invalid"), now, live()));
  assert.throws(() => eligiblePublications([item,item], [], start, now, live()));
  assert.equal(eligiblePublications([item], [], new Date("2026-10-08T19:00:00Z"), now, live()).length, 1);
});
test("weekly dispatch is due Sunday at nine in Grenada and uses the completed local week", () => {
  const before = digestPeriods(new Date("2026-10-11T12:59:00Z"))[0];
  const after = digestPeriods(now)[0];
  assert.equal(before.key, "2026-10-04");
  assert.equal(after.key, "2026-10-11");
  assert.equal(after.start.toISOString(), "2026-10-04T04:00:00.000Z");
  assert.equal(after.end.toISOString(), "2026-10-11T04:00:00.000Z");
  assert.equal(digestPeriods(new Date("2026-10-13T17:00:00Z"))[0].key, after.key);
});
test("monthly boundaries handle year rollover and leap years", () => {
  const period = digestPeriods(new Date("2027-01-01T13:00:00Z"))[1];
  assert.equal(period.start.toISOString(), "2026-12-01T04:00:00.000Z");
  assert.equal(period.end.toISOString(), "2027-01-01T04:00:00.000Z");
  const leap = digestPeriods(new Date("2028-03-01T13:00:00Z"))[1];
  assert.equal((leap.end.getTime() - leap.start.getTime()) / 86400000, 29);
});
test("digests exclude empty periods and use inclusive start, exclusive end", () => {
  const p = digestPeriods(now)[0];
  assert.deepEqual(digestItems([], p), []);
  assert.equal(digestItems([item], p).length, 1);
  assert.equal(digestItems([{ ...item, publishedAt: p.start.toISOString() }], p).length, 1);
  assert.equal(digestItems([{ ...item, publishedAt: p.end.toISOString() }], p).length, 0);
});
test("digest escapes authored text and includes topic unsubscribe and preview links", () => {
  const result = renderDigest("monthly", "October", [{ ...item, title: '<img onerror="alert(1)">', excerpt: "A & B", readingTime: "4 min" }]);
  assert.ok(result.html.includes("&lt;img onerror=&quot;"));
  assert.ok(result.html.includes("A &amp; B"));
  assert.ok(result.html.includes(item.url));
  assert.ok(result.html.includes("{{{RESEND_UNSUBSCRIBE_URL}}}"));
  assert.ok(result.text.includes("monthly letters"));
});
test("digest cadence is explicit opt-in, never implied by an essay choice", () => {
  assert.deepEqual(parsePreferences(["essay"]), ["essay"]);
  assert.deepEqual(parsePreferences(["essay", "field_note", "project", "weekly", "monthly"]), ["essay", "field_note", "project", "weekly", "monthly"]);
  assert.equal(parsePreferences(["daily"]), null);
});
test("automatic command cannot send without explicit operator activation", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/automate-newsletter.ts", "--send"], { encoding: "utf8", env: { ...process.env, NEWSLETTER_AUTOMATION_ENABLED: "false", RESEND_API_KEY: "" } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Automation is disabled/);
});
