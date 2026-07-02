import { SITE_ORIGIN } from "@/lib/resend/client";

export interface PublicationPayload {
  type: "essay" | "field_note" | "deployment";
  title: string;
  slug?: string;
  excerpt?: string;
  publishedAt?: string;
  url?: string;
  heroImage?: string;
  tags?: string[];
}

const SITE_NAME = "Jafar Dabbagh";
const INK = "#e8e6e1";
const DIM = "#9aa0aa";
const GOLD = "#d4b886";
const BG = "#0a0e14";
const CARD = "#10151f";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function kind(type: PublicationPayload["type"]): string {
  if (type === "field_note") return "Field Note";
  if (type === "deployment") return "Deployment";
  return "Essay";
}

export function publicationSubject(p: PublicationPayload): string {
  if (p.type === "field_note") return `New Field Note: ${p.title}`;
  if (p.type === "deployment") return `New Deployment: ${p.title}`;
  return `New Essay: ${p.title}`;
}

function ctaLabel(type: PublicationPayload["type"]): string {
  if (type === "field_note") return "Read the field note";
  if (type === "deployment") return "See it on the duel field";
  return "Read the full essay";
}

export function publicationPreviewText(p: PublicationPayload): string {
  if (p.type === "field_note") return "A new field note has been logged.";
  if (p.type === "deployment") return "A new build has been summoned to the duel field.";
  return "A new essay has been published.";
}

function publicationUrl(p: PublicationPayload): string {
  if (p.url) return p.url;
  if (p.type === "deployment") return `${SITE_ORIGIN}/#deployments`;
  if (!p.slug) return SITE_ORIGIN;
  return p.type === "field_note" ? `${SITE_ORIGIN}/field-notes#${p.slug}` : `${SITE_ORIGIN}/essays/${p.slug}`;
}

function prettyDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** the literary, dark, minimal HTML email. {{{RESEND_UNSUBSCRIBE_URL}}} is
 *  Resend's broadcast unsubscribe token, substituted at send time. */
export function renderPublicationBroadcastHtml(p: PublicationPayload): string {
  const url = publicationUrl(p);
  const date = prettyDate(p.publishedAt);
  const preheader = publicationPreviewText(p);

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(publicationSubject(p))}</title></head>
<body style="margin:0;padding:0;background:${BG};color:${INK};font-family:Georgia,'Times New Roman',serif;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${CARD};border:1px solid rgba(232,230,225,0.1);border-radius:6px;">
      <tr><td style="padding:28px 32px 8px;">
        <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:${DIM};">${SITE_NAME} · JD-1184</div>
      </td></tr>
      ${p.heroImage ? `<tr><td style="padding:14px 32px 0;"><img src="${esc(p.heroImage)}" alt="" width="496" style="width:100%;border-radius:4px;display:block;"></td></tr>` : ""}
      <tr><td style="padding:18px 32px 0;">
        <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:${GOLD};">${kind(p.type)}${date ? ` · ${esc(date)}` : ""}</div>
        <h1 style="margin:12px 0 0;font-size:28px;font-weight:400;line-height:1.2;color:${INK};">${esc(p.title)}</h1>
      </td></tr>
      <tr><td style="padding:18px 32px 0;"><p style="margin:0;font-size:16px;line-height:1.6;color:rgba(232,230,225,0.86);">Hi {{{contact.first_name|there}}},</p></td></tr>
      ${p.excerpt ? `<tr><td style="padding:16px 32px 0;"><p style="margin:0;font-size:16px;font-style:italic;line-height:1.6;color:rgba(232,230,225,0.82);">${esc(p.excerpt)}</p></td></tr>` : ""}
      <tr><td style="padding:26px 32px 4px;">
        <a href="${esc(url)}" style="display:inline-block;background:rgba(212,184,134,0.12);border:1px solid rgba(212,184,134,0.5);color:${GOLD};text-decoration:none;font-family:'Courier New',monospace;font-size:12px;letter-spacing:.22em;text-transform:uppercase;padding:12px 22px;border-radius:4px;">${esc(ctaLabel(p.type))} &rarr;</a>
      </td></tr>
      <tr><td style="padding:28px 32px 30px;border-top:1px solid rgba(232,230,225,0.08);margin-top:20px;">
        <p style="margin:18px 0 0;font-family:'Courier New',monospace;font-size:11px;line-height:1.7;color:${DIM};">
          You're receiving this because you subscribed to new essays and field notes from ${SITE_NAME}.<br>
          <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${DIM};text-decoration:underline;">Unsubscribe</a> &middot; <a href="${SITE_ORIGIN}" style="color:${DIM};text-decoration:underline;">${esc(SITE_ORIGIN.replace(/^https?:\/\//, ""))}</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}

/** plain-text fallback */
export function renderPublicationBroadcastText(p: PublicationPayload): string {
  const url = publicationUrl(p);
  const date = prettyDate(p.publishedAt);
  return [
    `${SITE_NAME} — ${kind(p.type)}${date ? ` · ${date}` : ""}`,
    "",
    "Hi {{{contact.first_name|there}}},",
    "",
    p.title,
    p.excerpt ? `\n${p.excerpt}` : "",
    "",
    `${ctaLabel(p.type)}: ${url}`,
    "",
    "—",
    `You're receiving this because you subscribed to new essays and field notes from ${SITE_NAME}.`,
    `Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}
