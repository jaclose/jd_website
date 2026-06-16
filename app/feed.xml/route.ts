import { essays, fieldNotes } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * RSS of new essays + field notes — also the source for Buttondown's
 * RSS-to-email automation (point a Buttondown automation at this URL and
 * every new transmission emails the list).
 */
export async function GET() {
  const items = [
    ...essays.map((e) => ({
      title: `Essay: ${e.title}`,
      link: `${SITE_URL}/essays/${e.slug}`,
      date: e.date,
      desc: e.excerpt,
    })),
    ...fieldNotes.map((n) => ({
      title: `Field Note: ${n.title}`,
      link: `${SITE_URL}/field-notes#${n.slug}`,
      date: n.date,
      desc: n.excerpt,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const body = items
    .map(
      (i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${i.link}</link>
      <guid>${i.link}</guid>
      <pubDate>${new Date(`${i.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(i.desc)}</description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Jafar Dabbagh — Transmissions</title>
    <link>${SITE_URL}</link>
    <description>New essays and field notes from the JD-1184 system.</description>
    <language>en-us</language>
${body}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
