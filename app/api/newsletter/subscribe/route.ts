import { NextResponse } from "next/server";
import { NEWSLETTER_SEGMENTS, resend } from "@/lib/resend/client";
import {
  createNewsletterRateLimiter,
  subscribeToNewsletter,
  type NewsletterResendClient,
} from "@/lib/newsletter/subscription";

export const runtime = "nodejs";

const rateLimiter = createNewsletterRateLimiter();

function requestIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const result = await subscribeToNewsletter({
    body,
    resend: resend as NewsletterResendClient | null,
    segments: NEWSLETTER_SEGMENTS,
    rateLimiter,
    ip: requestIp(req),
  });

  if (result.ok) {
    return NextResponse.json({ ok: true, status: result.status }, { status: result.httpStatus });
  }

  return NextResponse.json({ ok: false, error: result.error }, { status: result.httpStatus });
}
