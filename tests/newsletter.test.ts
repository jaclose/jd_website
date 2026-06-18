import assert from "node:assert/strict";
import test from "node:test";
import {
  createNewsletterRateLimiter,
  subscribeToNewsletter,
  type NewsletterResendClient,
} from "../lib/newsletter/subscription";

type FakeError = { message: string; name?: string; statusCode?: number | null };

function fakeResend({
  createError = null,
  addError = null,
}: {
  createError?: FakeError | null;
  addError?: FakeError | null;
} = {}) {
  const calls = {
    create: [] as unknown[],
    add: [] as unknown[],
  };

  const client: NewsletterResendClient = {
    contacts: {
      async create(payload) {
        calls.create.push(payload);
        return createError
          ? { data: null, error: createError }
          : { data: { id: "contact_123" }, error: null };
      },
      segments: {
        async add(payload) {
          calls.add.push(payload);
          return addError ? { data: null, error: addError } : { data: { id: payload.segmentId }, error: null };
        },
      },
    },
  };

  return { client, calls };
}

const segments = {
  essays: "seg_essays",
  fieldNotes: "seg_fieldnotes",
};

test("subscribes a new essay reader to the essay segment", async () => {
  const { client, calls } = fakeResend();

  const result = await subscribeToNewsletter({
    body: {
      email: " Reader@Example.com ",
      firstName: " Reader ",
      source: "essay_footer",
      slug: "a-real-essay",
      contentType: "essay",
    },
    resend: client,
    segments,
    ip: "203.0.113.10",
  });

  assert.deepEqual(result, { ok: true, status: "subscribed", httpStatus: 200 });
  assert.deepEqual(calls.create, [
    { email: "reader@example.com", firstName: "Reader", unsubscribed: false },
  ]);
  assert.deepEqual(calls.add, [{ email: "reader@example.com", segmentId: "seg_essays" }]);
});

test("adds an existing contact to the requested segment and reports already_subscribed", async () => {
  const { client, calls } = fakeResend({
    createError: { message: "Contact already exists", statusCode: 409 },
  });

  const result = await subscribeToNewsletter({
    body: { email: "reader@example.com", contentType: "field_note", source: "fieldnote_footer" },
    resend: client,
    segments,
    ip: "203.0.113.10",
  });

  assert.deepEqual(result, { ok: true, status: "already_subscribed", httpStatus: 200 });
  assert.equal(calls.create.length, 1);
  assert.deepEqual(calls.add, [{ email: "reader@example.com", segmentId: "seg_fieldnotes" }]);
});

test("site footer signups join both publication segments", async () => {
  const { client, calls } = fakeResend();

  const result = await subscribeToNewsletter({
    body: { email: "reader@example.com", contentType: "all", source: "site_footer" },
    resend: client,
    segments,
    ip: "203.0.113.10",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(calls.add, [
    { email: "reader@example.com", segmentId: "seg_essays" },
    { email: "reader@example.com", segmentId: "seg_fieldnotes" },
  ]);
});

test("rejects invalid emails before calling Resend", async () => {
  const { client, calls } = fakeResend();

  const result = await subscribeToNewsletter({
    body: { email: "not-an-email", contentType: "essay" },
    resend: client,
    segments,
    ip: "203.0.113.10",
  });

  assert.deepEqual(result, {
    ok: false,
    error: "That doesn't look like an email.",
    httpStatus: 400,
  });
  assert.equal(calls.create.length, 0);
  assert.equal(calls.add.length, 0);
});

test("returns a safe error when Resend segment enrollment fails", async () => {
  const { client } = fakeResend({
    addError: { message: "Resend internal error", name: "internal_server_error", statusCode: 500 },
  });

  const result = await subscribeToNewsletter({
    body: { email: "reader@example.com", contentType: "essay" },
    resend: client,
    segments,
    ip: "203.0.113.10",
  });

  assert.deepEqual(result, {
    ok: false,
    error: "Couldn't sign you up just now.",
    httpStatus: 502,
  });
});

test("rate-limits repeated attempts by email and ip", async () => {
  const { client, calls } = fakeResend();
  const rateLimiter = createNewsletterRateLimiter({ maxPerIp: 1, maxPerEmail: 1, windowMs: 60_000 });

  await subscribeToNewsletter({
    body: { email: "reader@example.com", contentType: "essay" },
    resend: client,
    segments,
    rateLimiter,
    ip: "203.0.113.10",
  });

  const result = await subscribeToNewsletter({
    body: { email: "reader@example.com", contentType: "essay" },
    resend: client,
    segments,
    rateLimiter,
    ip: "203.0.113.10",
  });

  assert.deepEqual(result, {
    ok: false,
    error: "Too many attempts - try again shortly.",
    httpStatus: 429,
  });
  assert.equal(calls.create.length, 1);
});
