import {
  resend,
  RESEND_FROM,
  RESEND_TOPIC_ID,
  canBroadcast,
  DRY_RUN,
  segmentIdForPublication,
} from "@/lib/resend/client";
import {
  publicationPreviewText,
  publicationSubject,
  renderPublicationBroadcastHtml,
  renderPublicationBroadcastText,
  type PublicationPayload,
} from "@/lib/email/templates/publicationBroadcast";

export interface BroadcastResult {
  ok: boolean;
  status: "dry_run" | "draft_created" | "sent" | "scheduled" | "failed";
  broadcastId?: string;
  subject: string;
  error?: string;
}

/**
 * Create a Resend Broadcast for a published essay/field note. By default it
 * creates a DRAFT (review before sending); pass sendImmediately to send. In
 * DRY_RUN it renders + writes a preview to /tmp and makes no Resend calls.
 */
export async function sendPublicationBroadcast(
  payload: PublicationPayload,
  opts: { sendImmediately?: boolean; scheduledAt?: string } = {}
): Promise<BroadcastResult> {
  const subject = publicationSubject(payload);
  const html = renderPublicationBroadcastHtml(payload);
  const text = renderPublicationBroadcastText(payload);

  if (DRY_RUN) {
    try {
      const fs = await import("node:fs");
      fs.writeFileSync("/tmp/email-preview.html", html);
      fs.writeFileSync("/tmp/email-preview.txt", text);
    } catch {
      /* preview is best-effort */
    }
    return { ok: true, status: "dry_run", subject };
  }

  if (!canBroadcast(payload.type) || !resend) {
    return { ok: false, status: "failed", subject, error: "Resend broadcast env not configured." };
  }

  try {
    const segmentId = segmentIdForPublication(payload.type);
    const name = `${subject} · ${new Date().toISOString().slice(0, 10)}`;
    const shouldSend = opts.sendImmediately || !!opts.scheduledAt;
    const base = {
      segmentId,
      from: RESEND_FROM,
      subject,
      html,
      text,
      name,
      previewText: publicationPreviewText(payload),
      topicId: RESEND_TOPIC_ID || undefined,
    };
    const created = await resend.broadcasts.create(
      shouldSend
        ? { ...base, send: true, ...(opts.scheduledAt ? { scheduledAt: opts.scheduledAt } : {}) }
        : { ...base, send: false }
    );
    if (created.error) {
      return { ok: false, status: "failed", subject, error: created.error.message };
    }
    const broadcastId = created.data?.id;
    if (!broadcastId) {
      return { ok: false, status: "failed", subject, error: "No broadcast id returned." };
    }
    const status = opts.scheduledAt ? "scheduled" : opts.sendImmediately ? "sent" : "draft_created";
    return { ok: true, status, subject, broadcastId };
  } catch (e) {
    return { ok: false, status: "failed", subject, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
