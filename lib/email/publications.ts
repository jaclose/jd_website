import { essays, fieldNotes } from "@/lib/content";
import { deployments } from "@/data/deployments";
import { SITE_ORIGIN } from "@/lib/resend/client";
import type { PublicationPayload } from "./templates/publicationBroadcast";
export function publications(): PublicationPayload[] {
  return [
    ...essays.map(e => ({ type: "essay" as const, slug: e.slug, title: e.title, excerpt: e.excerpt, publishedAt: e.date, url: `${SITE_ORIGIN}/essays/${e.slug}` })),
    ...fieldNotes.map(n => ({ type: "field_note" as const, slug: n.slug, title: n.title, excerpt: n.excerpt, publishedAt: n.date, url: `${SITE_ORIGIN}/field-notes#${n.slug}` })),
    ...deployments.map(d => ({ type: "deployment" as const, slug: d.id, title: d.name, excerpt: d.effect, publishedAt: d.deployedAt, url: d.webUrl ?? `${SITE_ORIGIN}/#deployments` })),
  ];
}
export function selectPublication(type: string, slug: string): PublicationPayload | undefined {
  return publications().find(p => p.type === type && p.slug === slug);
}
