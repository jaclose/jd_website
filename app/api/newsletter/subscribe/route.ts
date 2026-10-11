import { NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/lib/newsletter/subscription";
import { newsletterRuntime, readNewsletterBody, requestIpHash } from "@/lib/newsletter/runtime";
export const runtime = "nodejs";
export async function POST(req: Request) {
  let body: unknown;
  try { body = await readNewsletterBody(req); }
  catch { return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 }); }
  const result = await subscribeToNewsletter({ body, ...newsletterRuntime(), ipHash: requestIpHash(req) });
  return NextResponse.json(result, { status: result.httpStatus, headers: { "Cache-Control": "no-store", ...(result.httpStatus === 429 ? { "Retry-After": "3600" } : {}) } });
}
