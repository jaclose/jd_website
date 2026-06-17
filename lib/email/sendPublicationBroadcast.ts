import {
  resend,
  RESEND_AUDIENCE_ID,
  RESEND_FROM,
  canBroadcast,
  DRY_RUN,
} from "@/lib/resend/client";
import {
  publicationSubject,
  renderPublicationBroadcastHtml,
  renderPublicationBroadcastText,
  type PublicationPayload,
} from "@/lib/email/templates/publicationBroadcast";

export interface BroadcastResult {
  ok: boolean;
  status: "dry_run" | "draft_created" | "sent" | "failed";
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
  opts: { sendImmediately?: boolean } = {}
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

  if (!canBroadcast() || !resend) {
    return { ok: false, status: "failed", subject, error: "Resend broadcast env not configured." };
  }

  try {
    const created = await resend.broadcasts.create({
      audienceId: RESEND_AUDIENCE_ID,
      from: RESEND_FROM,
      subject,
      html,
      text,
      name: `${subject} · ${new Date().toISOString().slice(0, 10)}`,
    });
    const broadcastId = created.data?.id;
    if (!broadcastId) {
      return { ok: false, status: "failed", subject, error: created.error?.message || "No broadcast id returned." };
    }
    if (opts.sendImmediately) {
      const sent = await resend.broadcasts.send(broadcastId);
      if (sent.error) {
        return { ok: false, status: "failed", subject, broadcastId, error: sent.error.message };
      }
      return { ok: true, status: "sent", subject, broadcastId };
    }
    return { ok: true, status: "draft_created", subject, broadcastId };
  } catch (e) {
    return { ok: false, status: "failed", subject, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
