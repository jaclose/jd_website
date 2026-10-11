import { Resend } from "resend";
import type { NewsletterChannels } from "@/lib/newsletter/provider";
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
 *   TOPIC_{ESSAYS,FIELDNOTES,PROJECTS}_ID  three required opt-out-by-default topics
 *   PUBLISH_WEBHOOK_SECRET      guards the broadcast route
 *   NEXT_PUBLIC_SITE_URL        canonical origin (falls back to SITE_URL)
 */
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const SEGMENT_ESSAYS_ID = process.env.SEGMENT_ESSAYS_ID || "";
export const SEGMENT_FIELDNOTES_ID = process.env.SEGMENT_FIELDNOTES_ID || "";
/** Project updates require their own explicit subscription. */
export const SEGMENT_DEPLOYMENTS_ID = process.env.SEGMENT_DEPLOYMENTS_ID || "";

export const NEWSLETTER_CHANNELS: NewsletterChannels = {
  essay: { segmentId: SEGMENT_ESSAYS_ID, topicId: process.env.TOPIC_ESSAYS_ID || "" },
  field_note: { segmentId: SEGMENT_FIELDNOTES_ID, topicId: process.env.TOPIC_FIELDNOTES_ID || "" },
  project: { segmentId: SEGMENT_DEPLOYMENTS_ID, topicId: process.env.TOPIC_PROJECTS_ID || "" },
};
export function topicIdForPublication(type: "essay" | "field_note" | "deployment") {
  return NEWSLETTER_CHANNELS[type === "deployment" ? "project" : type].topicId;
}

export const RESEND_FROM = (() => {
  const name = process.env.RESEND_FROM_NAME || "Jafar Dabbagh";
  const email = process.env.RESEND_FROM_EMAIL || "";
  return email ? `${name} <${email}>` : "";
})();

export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;

export function canSubscribe(): boolean {
  const channels = Object.values(NEWSLETTER_CHANNELS);
  return !!resend && !!RESEND_FROM && channels.every(c => c.segmentId && c.topicId)
    && new Set(channels.map(c => c.segmentId)).size === 3
    && new Set(channels.map(c => c.topicId)).size === 3;
}

export function segmentIdForPublication(type: "essay" | "field_note" | "deployment"): string {
  if (type === "deployment") return SEGMENT_DEPLOYMENTS_ID;
  return type === "essay" ? SEGMENT_ESSAYS_ID : SEGMENT_FIELDNOTES_ID;
}

export function canBroadcast(type: "essay" | "field_note" | "deployment"): boolean {
  return !!resend && !!RESEND_FROM && !!segmentIdForPublication(type) && !!topicIdForPublication(type);
}

export const DRY_RUN = process.env.DRY_RUN_EMAILS === "true";
