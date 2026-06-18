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
 *   SEGMENT_ESSAYS_ID           Resend segment for essay subscribers
 *   SEGMENT_FIELDNOTES_ID       Resend segment for field-note subscribers
 *   RESEND_TOPIC_ID             optional Resend topic for granular unsubscribes
 *   PUBLISH_WEBHOOK_SECRET      guards the broadcast route
 *   NEXT_PUBLIC_SITE_URL        canonical origin (falls back to SITE_URL)
 */
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const SEGMENT_ESSAYS_ID = process.env.SEGMENT_ESSAYS_ID || "";
export const SEGMENT_FIELDNOTES_ID = process.env.SEGMENT_FIELDNOTES_ID || "";
export const RESEND_TOPIC_ID = process.env.RESEND_TOPIC_ID || "";

export const NEWSLETTER_SEGMENTS = {
  essays: SEGMENT_ESSAYS_ID,
  fieldNotes: SEGMENT_FIELDNOTES_ID,
};

export const RESEND_FROM = (() => {
  const name = process.env.RESEND_FROM_NAME || "Jafar Dabbagh";
  const email = process.env.RESEND_FROM_EMAIL || "";
  return email ? `${name} <${email}>` : "";
})();

export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;

export function canSubscribe(): boolean {
  return !!resend && !!SEGMENT_ESSAYS_ID && !!SEGMENT_FIELDNOTES_ID;
}

export function segmentIdForPublication(type: "essay" | "field_note"): string {
  return type === "essay" ? SEGMENT_ESSAYS_ID : SEGMENT_FIELDNOTES_ID;
}

export function canBroadcast(type: "essay" | "field_note"): boolean {
  return !!resend && !!RESEND_FROM && !!segmentIdForPublication(type);
}

export const DRY_RUN = process.env.DRY_RUN_EMAILS === "true";
