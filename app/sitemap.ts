import type { MetadataRoute } from "next";
import { essays, fieldNotes } from "@/lib/content";
import { works } from "@/data/works";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

/** Every indexable URL on the site, absolute to the www host. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const latestEssay = essays[0]?.date ? new Date(essays[0].date) : now;
  const latestNote = fieldNotes[0]?.date ? new Date(fieldNotes[0].date) : now;

  const core: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/essays`, lastModified: latestEssay, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/field-notes`, lastModified: latestNote, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/garden`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/vault`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const essayUrls: MetadataRoute.Sitemap = essays.map((e) => ({
    url: `${SITE_URL}/essays/${e.slug}`,
    lastModified: new Date(e.date),
    changeFrequency: "yearly",
    priority: 0.8,
  }));

  // the Archive PDFs are indexable documents
  const workUrls: MetadataRoute.Sitemap = works.map((w) => ({
    url: `${SITE_URL}${w.pdf}`,
    lastModified: new Date(`${w.year}-01-01`),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...core, ...essayUrls, ...workUrls];
}
