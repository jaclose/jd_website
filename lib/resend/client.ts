import { Resend } from "resend";
import type { NewsletterChannels } from "@/lib/newsletter/provider";
import { SITE_URL } from "@/lib/seo";

/** Server-only. A single audience plus topic consent supports preferences changed
 * on this site and on Resend's hosted unsubscribe page without a sync webhook. */
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const segmentId = process.env.SEGMENT_NEWSLETTER_ID || "";
export const NEWSLETTER_CHANNELS: NewsletterChannels = {
  essay: { segmentId, topicId: process.env.TOPIC_ESSAYS_ID || "" },
  field_note: { segmentId, topicId: process.env.TOPIC_FIELDNOTES_ID || "" },
  project: { segmentId, topicId: process.env.TOPIC_PROJECTS_ID || "" },
  weekly: { segmentId, topicId: process.env.TOPIC_WEEKLY_ID || "" },
  monthly: { segmentId, topicId: process.env.TOPIC_MONTHLY_ID || "" },
};
export const RESEND_FROM = process.env.RESEND_FROM_EMAIL ? `${process.env.RESEND_FROM_NAME || "Jafar Dabbagh"} <${process.env.RESEND_FROM_EMAIL}>` : "";
export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL;
export function canSubscribe(): boolean {
  const channels = Object.values(NEWSLETTER_CHANNELS);
  return !!resend && !!RESEND_FROM && channels.every(c => c.segmentId && c.topicId)
    && new Set(channels.map(c => c.topicId)).size === channels.length;
}
export const DRY_RUN = process.env.DRY_RUN_EMAILS === "true";
