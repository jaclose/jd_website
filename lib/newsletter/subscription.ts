export type NewsletterContentType = "essay" | "field_note" | "all";
export type SubscribeStatus = "subscribed" | "already_subscribed";

type ResendError = {
  message?: string;
  name?: string;
  statusCode?: number | null;
};

type ResendResult<T = unknown> = {
  data: T | null;
  error: ResendError | null;
};

export type NewsletterResendClient = {
  contacts: {
    create(payload: {
      email: string;
      firstName?: string;
      unsubscribed?: boolean;
    }): Promise<ResendResult<{ id: string }>>;
    segments: {
      add(payload: { email: string; segmentId: string }): Promise<ResendResult<{ id: string }>>;
    };
  };
};

export type NewsletterSegmentConfig = {
  essays: string;
  fieldNotes: string;
};

export type NewsletterSubscribeInput = {
  email: string;
  firstName?: string;
  company?: string;
  source?: string;
  slug?: string;
  contentType: NewsletterContentType;
};

type ParseResult =
  | { ok: true; value: NewsletterSubscribeInput }
  | { ok: false; error: string; httpStatus: number };

export type SubscribeResult =
  | { ok: true; status: SubscribeStatus; httpStatus: number }
  | { ok: false; error: string; httpStatus: number };

export type NewsletterRateLimiter = {
  isLimited(input: { ip: string; email?: string; now?: number }): boolean;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function clean(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function parseContentType(value: unknown): NewsletterContentType | null {
  if (value === "essay" || value === "field_note" || value === "all") return value;
  return null;
}

export function parseNewsletterSubscribeBody(body: Record<string, unknown>): ParseResult {
  const email = clean(body.email, 320)?.toLowerCase() ?? "";
  const firstName = clean(body.firstName, 80);
  const company = clean(body.company, 120);
  const source = clean(body.source, 60);
  const slug = clean(body.slug ?? body.contentSlug, 120);
  const contentType = parseContentType(body.contentType ?? "all");

  if (company) {
    return {
      ok: true,
      value: { email: email || "honeypot@example.invalid", firstName, company, source, slug, contentType: contentType ?? "all" },
    };
  }

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "That doesn't look like an email.", httpStatus: 400 };
  }

  if (!contentType) {
    return { ok: false, error: "Invalid newsletter list.", httpStatus: 400 };
  }

  return { ok: true, value: { email, firstName, company, source, slug, contentType } };
}

export function createNewsletterRateLimiter({
  windowMs = 60_000,
  maxPerIp = 5,
  maxPerEmail = 3,
}: {
  windowMs?: number;
  maxPerIp?: number;
  maxPerEmail?: number;
} = {}): NewsletterRateLimiter {
  const hits = new Map<string, number[]>();

  function limited(key: string, max: number, now: number): boolean {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    return recent.length > max;
  }

  return {
    isLimited({ ip, email, now = Date.now() }) {
      const ipLimited = limited(`ip:${ip || "unknown"}`, maxPerIp, now);
      const emailLimited = email ? limited(`email:${email}`, maxPerEmail, now) : false;
      return ipLimited || emailLimited;
    },
  };
}

export function segmentIdsForContentType(
  contentType: NewsletterContentType,
  segments: NewsletterSegmentConfig
): string[] {
  if (contentType === "essay") return segments.essays ? [segments.essays] : [];
  if (contentType === "field_note") return segments.fieldNotes ? [segments.fieldNotes] : [];
  return segments.essays && segments.fieldNotes ? [segments.essays, segments.fieldNotes] : [];
}

function isAlreadyExists(error: ResendError | null | undefined): boolean {
  if (!error) return false;
  const haystack = `${error.name ?? ""} ${error.message ?? ""}`.toLowerCase();
  return error.statusCode === 409 || haystack.includes("already") || haystack.includes("exist") || haystack.includes("duplicate");
}

export async function subscribeToNewsletter({
  body,
  resend,
  segments,
  rateLimiter,
  ip,
}: {
  body: Record<string, unknown>;
  resend: NewsletterResendClient | null;
  segments: NewsletterSegmentConfig;
  rateLimiter?: NewsletterRateLimiter;
  ip: string;
}): Promise<SubscribeResult> {
  const parsed = parseNewsletterSubscribeBody(body);
  if (!parsed.ok) return parsed;

  const input = parsed.value;

  if (input.company) {
    return { ok: true, status: "subscribed", httpStatus: 200 };
  }

  if (rateLimiter?.isLimited({ ip, email: input.email })) {
    return { ok: false, error: "Too many attempts - try again shortly.", httpStatus: 429 };
  }

  if (!resend) {
    return { ok: false, error: "The mailing list isn't configured yet.", httpStatus: 503 };
  }

  const segmentIds = segmentIdsForContentType(input.contentType, segments);
  if (segmentIds.length === 0) {
    return { ok: false, error: "The mailing list isn't configured yet.", httpStatus: 503 };
  }

  let status: SubscribeStatus = "subscribed";

  const created = await resend.contacts.create({
    email: input.email,
    firstName: input.firstName,
    unsubscribed: false,
  });

  if (created.error) {
    if (!isAlreadyExists(created.error)) {
      return { ok: false, error: "Couldn't sign you up just now.", httpStatus: 502 };
    }
    status = "already_subscribed";
  }

  for (const segmentId of segmentIds) {
    const added = await resend.contacts.segments.add({ email: input.email, segmentId });
    if (added.error && !isAlreadyExists(added.error)) {
      return { ok: false, error: "Couldn't sign you up just now.", httpStatus: 502 };
    }
  }

  return { ok: true, status, httpStatus: 200 };
}
