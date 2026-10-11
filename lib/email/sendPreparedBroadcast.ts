import { resendRequest } from "@/lib/resend/request";
import { resend, NEWSLETTER_CHANNELS, RESEND_FROM } from "@/lib/resend/client";
import type { NewsletterPreference } from "@/lib/newsletter/preferences";
export interface PreparedBroadcast { channel: NewsletterPreference; name: string; subject: string; html: string; text: string; previewText: string }

/** All dispatch workflows share one non-cancelling concurrency group. The stable
 * provider name recovers a draft/send after timeouts without a bot commit to main.
 */
export async function sendPreparedBroadcast(mail: PreparedBroadcast, opts: { sendImmediately?: boolean; scheduledAt?: string } = {}) {
  const channel = NEWSLETTER_CHANNELS[mail.channel];
  if (!resend || !RESEND_FROM || !channel.segmentId || !channel.topicId) throw new Error("Resend sender, topic and segment must be configured.");
  let after: string | undefined;
  let existing: { id: string; status: string } | undefined;
  do {
    const list = await resendRequest(() => resend!.broadcasts.list({ limit: 100, ...(after ? { after } : {}) }));
    if (list.error) throw new Error(list.error.message);
    existing = list.data?.data.find(b => b.name === mail.name);
    after = !existing && list.data?.has_more ? list.data.data.at(-1)?.id : undefined;
  } while (after);
  if (existing?.status === "sent" || existing?.status === "queued") return { status: existing.status === "sent" ? "sent" as const : "scheduled" as const, broadcastId: existing.id };
  if (existing && existing.status !== "draft") throw new Error(`Broadcast needs review: ${existing.status}`);
  const base = { segmentId: channel.segmentId, topicId: channel.topicId, from: RESEND_FROM, subject: mail.subject, html: mail.html, text: mail.text, name: mail.name, previewText: mail.previewText };
  let id = existing?.id;
  if (!id) {
    const created = await resendRequest(() => resend!.broadcasts.create({ ...base, send: false }));
    if (created.error || !created.data?.id) throw new Error(created.error?.message || "Missing broadcast ID.");
    id = created.data.id;
  } else {
    // A reviewed draft must reflect the current, already-live content.
    const updated = await resendRequest(() => resend!.broadcasts.update(id!, base));
    if (updated.error) throw new Error(updated.error.message);
  }
  if (opts.sendImmediately || opts.scheduledAt) {
    const result = await resendRequest(() => resend!.broadcasts.send(id!, opts.scheduledAt ? { scheduledAt: opts.scheduledAt } : undefined));
    if (result.error) throw new Error(result.error.message);
  }
  return { broadcastId: id, status: opts.scheduledAt ? "scheduled" as const : opts.sendImmediately ? "sent" as const : "draft_created" as const };
}
