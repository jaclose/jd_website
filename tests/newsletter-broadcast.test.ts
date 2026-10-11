import test from "node:test";
import assert from "node:assert/strict";
// A fake key only constructs the SDK. Every provider method is mocked below.
process.env.RESEND_API_KEY = "re_local_test_only";
process.env.RESEND_FROM_EMAIL = "letters@example.com";
process.env.SEGMENT_NEWSLETTER_ID = "essay-segment";
process.env.TOPIC_ESSAYS_ID = "essay-topic";
let resend: typeof import("../lib/resend/client").resend;
let sendPublicationBroadcast: typeof import("../lib/email/sendPublicationBroadcast").sendPublicationBroadcast;
test.before(async () => {
  ({ resend } = await import("../lib/resend/client"));
  ({ sendPublicationBroadcast } = await import("../lib/email/sendPublicationBroadcast"));
});
const payload = { type: "essay" as const, slug: "test-essay", title: "A test essay" };
const ok = <T,>(data: T) => ({ data, error: null, headers: null });
test("publication creates a topic-filtered draft by default", async t => {
  t.mock.method(resend!.broadcasts, "list", async () => ok({ data: [], has_more: false }));
  const create = t.mock.method(resend!.broadcasts, "create", async () => ok({ id: "draft1" }));
  const send = t.mock.method(resend!.broadcasts, "send", async () => ok({ id: "draft1" }));
  const result = await sendPublicationBroadcast(payload);
  assert.equal(result.status, "draft_created"); assert.equal(send.mock.callCount(), 0);
  const call = create.mock.calls[0].arguments[0] as { send: boolean; topicId: string; segmentId: string };
  assert.equal(call.send, false); assert.equal(call.topicId, "essay-topic"); assert.equal(call.segmentId, "essay-segment");
});
test("rerun recovers provider draft and sends that same ID", async t => {
  t.mock.method(resend!.broadcasts, "list", async () => ok({ data: [{ id: "draft1", name: "jd1184:essay:test-essay", status: "draft" }], has_more: false }));
  const create = t.mock.method(resend!.broadcasts, "create", async () => { throw new Error("must not create duplicate"); });
  t.mock.method(resend!.broadcasts, "update", async () => ok({ id: "draft1" }));
  const send = t.mock.method(resend!.broadcasts, "send", async () => ok({ id: "draft1" }));
  assert.equal((await sendPublicationBroadcast(payload, { sendImmediately: true })).status, "sent");
  assert.equal(create.mock.callCount(), 0); assert.equal(send.mock.calls[0].arguments[0], "draft1");
});
test("already-sent provider record cannot be sent again", async t => {
  t.mock.method(resend!.broadcasts, "list", async () => ok({ data: [{ id: "sent1", name: "jd1184:essay:test-essay", status: "sent" }], has_more: false }));
  const send = t.mock.method(resend!.broadcasts, "send", async () => { throw new Error("must not send twice"); });
  assert.equal((await sendPublicationBroadcast(payload, { sendImmediately: true })).status, "sent"); assert.equal(send.mock.callCount(), 0);
});
test("queued delivery is recovered without another send", async t => {
  t.mock.method(resend!.broadcasts, "list", async () => ok({ data: [{ id: "queued1", name: "jd1184:essay:test-essay", status: "queued" }], has_more: false }));
  const send = t.mock.method(resend!.broadcasts, "send", async () => { throw new Error("must not send twice"); });
  assert.equal((await sendPublicationBroadcast(payload, { sendImmediately: true })).status, "scheduled");
  assert.equal(send.mock.callCount(), 0);
});
test("a held or unknown provider state stops this publication for review", async t => {
  t.mock.method(resend!.broadcasts, "list", async () => ok({ data: [{ id: "held1", name: "jd1184:essay:test-essay", status: "failed" }], has_more: false }));
  const send = t.mock.method(resend!.broadcasts, "send", async () => { throw new Error("must not override a held publication"); });
  assert.equal((await sendPublicationBroadcast(payload, { sendImmediately: true })).ok, false);
  assert.equal(send.mock.callCount(), 0);
});
