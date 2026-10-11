import { essays, fieldNotes, readingTime } from "@/lib/content";
import { deployments } from "@/data/deployments";
import { projectUpdates } from "@/data/projectUpdates";
import { essayMeta } from "@/data/meta";
import { SITE_URL } from "@/lib/seo";
import type { PublicationPayload } from "./templates/publicationBroadcast";

/** Public content only. This module has no provider, account or subscriber data. */
export function publicationCatalog(): PublicationPayload[] {
  return [
    ...essays.map(e => ({ type: "essay" as const, slug: e.slug, title: e.title, excerpt: e.excerpt, publishedAt: e.date, url: `${SITE_URL}/essays/${e.slug}`, readingTime: readingTime(e.words), ...(essayMeta[e.slug]?.cover ? { heroImage: `${SITE_URL}${essayMeta[e.slug].cover}` } : {}) })),
    ...fieldNotes.map(n => ({ type: "field_note" as const, slug: n.slug, title: n.title, excerpt: n.excerpt, publishedAt: n.date, url: `${SITE_URL}/field-notes#${n.slug}`, readingTime: readingTime(n.words) })),
    ...deployments.map(d => ({ type: "deployment" as const, slug: d.id, title: d.name, excerpt: d.effect, publishedAt: d.deployedAt, url: d.webUrl ?? `${SITE_URL}/#deployments` })),
    ...projectUpdates.map(p => ({ type: "deployment" as const, slug: p.slug, title: p.title, excerpt: p.excerpt, publishedAt: p.date, url: p.url, heroImage: p.image })),
  ];
}
