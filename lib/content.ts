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
export const fieldNotes: Writing[] = notesJson as Writing[];
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
