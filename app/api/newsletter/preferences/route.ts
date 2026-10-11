import { NextResponse } from "next/server";
import { newsletterRuntime, readNewsletterBody } from "@/lib/newsletter/runtime";
import { saveNewsletterPreferences, validToken, tokenDigest } from "@/lib/newsletter/subscription";
export const runtime = "nodejs";
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed = await readNewsletterBody(req);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch { return reply({ ok: false, error: "Invalid request." }, 400); }
  if (!validToken(body.token)) return reply({ ok: false, error: "This link is invalid. Request a new link." }, 400);
  const { store, provider } = newsletterRuntime();
  if (!store || !provider) return reply({ ok: false, error: "Email preferences are temporarily unavailable. Please try again later." }, 503);
  if (body.action === "save") {
    const result = await saveNewsletterPreferences({ token: body.token, preferences: body.preferences, store, provider });
    return reply(result, result.httpStatus);
  }
  if (body.action !== "read") return reply({ ok: false, error: "Invalid action." }, 400);
  try {
    const request = await store.read(tokenDigest(body.token));
    if (!request) return reply({ ok: false, error: "This link has expired or was already used. Request a new link." }, 410);
    const preferences = request.intent === "subscribe" ? request.preferences : await provider.preferences(request.email);
    return reply({ ok: true, preferences });
  } catch { return reply({ ok: false, error: "We couldn’t load your preferences. Please try again later." }, 502); }
}
