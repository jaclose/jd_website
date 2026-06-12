/**
 * Visitor-side state — achievements earned by exploring, the Vault
 * journal, and the starter seed. Lives in localStorage until the
 * Supabase relay comes online; every reader gets their own record.
 */
import type { Species } from "@/data/garden";

const KEY = "jd1184-visitor";

export interface JournalEntry {
  id: string;
  date: string; // ISO
  text: string;
  name?: string;
}

export interface VisitorState {
  /** achievement id → ISO date unlocked */
  achievements: Record<string, string>;
  journal: JournalEntry[];
  starter?: Species;
}

const EMPTY: VisitorState = { achievements: {}, journal: [] };

export function visitorState(): VisitorState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, achievements: {}, journal: [] };
    const parsed = JSON.parse(raw) as VisitorState;
    return {
      achievements: parsed.achievements ?? {},
      journal: parsed.journal ?? [],
      starter: parsed.starter,
    };
  } catch {
    return { ...EMPTY, achievements: {}, journal: [] };
  }
}

function save(state: VisitorState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("jd1184-visitor-change"));
  } catch {
    /* private mode — the universe forgets, and that's fine */
  }
}

export function hasVisitor(id: string): boolean {
  return id in visitorState().achievements;
}

/** unlock a visitor achievement; returns true the first time */
export function unlockVisitor(id: string): boolean {
  const state = visitorState();
  if (state.achievements[id]) return false;
  state.achievements[id] = new Date().toISOString().slice(0, 10);
  save(state);
  return true;
}

export function addJournalEntry(text: string, name?: string): JournalEntry {
  const state = visitorState();
  const entry: JournalEntry = {
    id: Math.random().toString(36).slice(2, 10),
    date: new Date().toISOString(),
    text,
    name,
  };
  state.journal.push(entry);
  save(state);
  return entry;
}

export function setStarter(species: Species) {
  const state = visitorState();
  state.starter = species;
  save(state);
}

export function onVisitorChange(fn: () => void): () => void {
  window.addEventListener("jd1184-visitor-change", fn);
  return () => window.removeEventListener("jd1184-visitor-change", fn);
}
