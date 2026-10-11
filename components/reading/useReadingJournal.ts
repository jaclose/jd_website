"use client";
import { create } from "zustand";
import { parseReadingEntries, READING_KEY, type ReadingEntries, type ReadingEntry } from "@/lib/readingProgress";

interface Journal { hydrated: boolean; entries: ReadingEntries; error: string; hydrate: () => void; update: (slug: string, patch: Partial<ReadingEntry>) => void }
export const useReadingJournal = create<Journal>((set, get) => ({
  hydrated: false, entries: {}, error: "",
  hydrate: () => {
    if (get().hydrated) return;
    try { const saved = localStorage.getItem(READING_KEY); set({ entries: saved ? parseReadingEntries(JSON.parse(saved)) : {}, hydrated: true }); }
    catch { set({ hydrated: true, error: "This browser couldn’t open your saved journal. You can still read and export this session." }); }
  },
  update: (slug, patch) => {
    get().hydrate();
    const entry = { ...(get().entries[slug] ?? { startedAt: Date.now(), position: 0, reflection: "" }), ...patch };
    const entries = { ...get().entries, [slug]: entry };
    set({ entries });
    try { localStorage.setItem(READING_KEY, JSON.stringify(entries)); set({ error: "" }); }
    catch { set({ error: "Your browser couldn’t save this change. Keep this tab open and export your journal." }); }
  },
}));

export function downloadJournal(data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...Object(data) }, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = "JD-1184-journal.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
