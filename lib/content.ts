import essaysJson from "@/content/essays.json";
import notesJson from "@/content/field-notes.json";
import aboutJson from "@/content/about.json";

export interface Writing {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  words: number;
  html: string;
}

export const essays: Writing[] = essaysJson as Writing[];

/**
 * The WordPress import kept each note's in-post masthead ("Field Note" +
 * a superscript date) inside both the excerpt and the body HTML, so cards
 * and hover panels read "Field Note23.11.2025 We live in…". The JSON is
 * generated (never hand-edit it) — strip the masthead at load time instead,
 * and settle the excerpt's trailing WordPress "[…]" into a clean ellipsis.
 */
const MASTHEAD_TEXT = /^Field Note\s*\d{2}\.\d{2}\.\d{4}\s*/;
const MASTHEAD_HTML = /^\s*<p>(?:<br \/>)?\s*Field Note<sup>[^<]*<\/sup><\/p>\s*/;

function cleanNote(note: Writing): Writing {
  return {
    ...note,
    excerpt: note.excerpt.replace(MASTHEAD_TEXT, "").replace(/\s*\[…\]\s*$/, "…"),
    html: note.html.replace(MASTHEAD_HTML, ""),
  };
}

export const fieldNotes: Writing[] = (notesJson as Writing[]).map(cleanNote);
export const about = aboutJson as { title: string; html: string };

export function essayBySlug(slug: string): Writing | undefined {
  return essays.find((e) => e.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** "23.11.2025" — dispatch style for field notes */
export function dispatchDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function readingTime(words: number): string {
  return `${Math.max(1, Math.round(words / 220))} min`;
}
