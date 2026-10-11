import { createHmac } from "node:crypto";
import { resend, RESEND_FROM, SITE_ORIGIN, NEWSLETTER_CHANNELS, canSubscribe } from "@/lib/resend/client";
import { createNewsletterProvider } from "./provider";
import { createNewsletterStore } from "./store";

export function newsletterRuntime() {
  const allowed = process.env.VERCEL_ENV !== "preview" || process.env.NEWSLETTER_ALLOW_PREVIEW === "true";
  const configured = allowed && canSubscribe();
  return {
    store: configured ? createNewsletterStore() : null,
    provider: configured && resend ? createNewsletterProvider(resend, RESEND_FROM, NEWSLETTER_CHANNELS) : null,
    origin: SITE_ORIGIN,
  };
}
export function requestIpHash(req: Request) {
  // Vercel overwrites this header. Do not trust a client-supplied generic XFF.
  const ip = process.env.VERCEL ? req.headers.get("x-vercel-forwarded-for") || "unknown" : "local";
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY || "unconfigured").update(ip).digest("hex");
}
export async function readNewsletterBody(req: Request): Promise<unknown> {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) throw new Error("Invalid origin");
  if (!req.headers.get("content-type")?.startsWith("application/json")) throw new Error("Invalid content type");
  const reader = req.body?.getReader();
  if (!reader) throw new Error("Missing body");
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 8192) { await reader.cancel(); throw new Error("Request too large"); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
