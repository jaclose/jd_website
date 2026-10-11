export interface ReadingEntry { startedAt: number; completedAt?: number; position: number; reflection: string }
export type ReadingEntries = Record<string, ReadingEntry>;
export const READING_KEY = "jd1184-reading-journal-v1";
export function parseReadingEntries(raw: unknown): ReadingEntries {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Your reading journal could not be read.");
  const entries: ReadingEntries = {};
  for (const [slug, value] of Object.entries(raw)) {
    if (!/^[a-z0-9-]{1,160}$/.test(slug) || !value || typeof value !== "object") continue;
    const v = value as Partial<ReadingEntry>;
    if (typeof v.startedAt !== "number" || !Number.isFinite(v.startedAt) || v.startedAt <= 0) continue;
    entries[slug] = { startedAt: v.startedAt, position: typeof v.position === "number" && Number.isFinite(v.position) ? Math.max(0, Math.min(1, v.position)) : 0, reflection: typeof v.reflection === "string" ? v.reflection.slice(0, 1600) : "", ...(typeof v.completedAt === "number" && Number.isFinite(v.completedAt) && v.completedAt > 0 ? { completedAt: v.completedAt } : {}) };
  }
  return entries;
}
