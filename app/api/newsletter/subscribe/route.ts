import { NextResponse } from "next/server";
import { resend, RESEND_AUDIENCE_ID, canSubscribe } from "@/lib/resend/client";

/**
 * Adds a contact to the Resend newsletter audience. Server-only — the API key
 * never reaches the client. Honeypot + a best-effort in-memory rate limit
 * guard against casual abuse; add Turnstile later if spam appears.
 */

// best-effort per-instance rate limit (serverless instances are ephemeral)
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (limited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many attempts — try again shortly." }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // honeypot — bots fill hidden fields; pretend success, do nothing
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true, status: "subscribed" });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const firstName = String(body.firstName ?? "").trim().slice(0, 80) || undefined;
  const source = String(body.source ?? "").slice(0, 60) || undefined;
  const contentSlug = String(body.contentSlug ?? "").slice(0, 120) || undefined;
  const contentType = String(body.contentType ?? "").slice(0, 40) || undefined;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "That doesn't look like an email." }, { status: 400 });
  }

  if (!canSubscribe() || !resend) {
    return NextResponse.json({ ok: false, error: "The mailing list isn't configured yet." }, { status: 503 });
  }

  // audit (don't log full lists; one line per signup is fine)
  console.log(`[newsletter] subscribe ${email} source=${source ?? "-"} ${contentType ?? "-"}/${contentSlug ?? "-"}`);

  try {
    const res = await resend.contacts.create({
      email,
      firstName,
      unsubscribed: false,
      audienceId: RESEND_AUDIENCE_ID,
    });
    if (res.error) {
      const msg = res.error.message?.toLowerCase() ?? "";
      if (msg.includes("already") || msg.includes("exist")) {
        return NextResponse.json({ ok: true, status: "already_subscribed" });
      }
      // don't leak raw Resend errors
      return NextResponse.json({ ok: false, error: "Couldn't sign you up just now." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, status: "subscribed" });
  } catch {
    return NextResponse.json({ ok: false, error: "The relay is down — try again shortly." }, { status: 502 });
  }
}
