import { Resend } from "resend";
import { SITE_URL } from "@/lib/seo";

/**
 * Server-only Resend wiring. Never import this from a client component — it
 * reads the secret API key from the environment. All email/broadcast calls go
 * through here so the key stays on the server.
 *
 * Env (see .env.example + docs/email-system.md):
 *   RESEND_API_KEY              secret key (server only)
 *   RESEND_FROM_EMAIL           e.g. notes@jafardabbagh.com (verified domain)
 *   RESEND_FROM_NAME            e.g. Jafar Dabbagh
 *   RESEND_AUDIENCE_ID          the newsletter audience (a.k.a. segment) id
 *   PUBLISH_WEBHOOK_SECRET      guards the broadcast route
 *   NEXT_PUBLIC_SITE_URL        canonical origin (falls back to SITE_URL)
 */
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const RESEND_AUDIENCE_ID =
  process.env.RESEND_AUDIENCE_ID || process.env.RESEND_NEWSLETTER_SEGMENT_ID || "";

export const RESEND_FROM = (() => {
  const name = process.env.RESEND_FROM_NAME || "Jafar Dabbagh";
  const email = process.env.RESEND_FROM_EMAIL || "";
  return email ? `${name} <${email}>` : "";
})();

export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;

/** subscriptions only need the client + an audience */
export function canSubscribe(): boolean {
  return !!resend && !!RESEND_AUDIENCE_ID;
}

/** broadcasts also need a verified from-address */
export function canBroadcast(): boolean {
  return !!resend && !!RESEND_AUDIENCE_ID && !!RESEND_FROM;
}

export const DRY_RUN = process.env.DRY_RUN_EMAILS === "true";
