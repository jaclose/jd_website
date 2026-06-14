/**
 * Visitor-side state — achievements earned by exploring, the Vault
 * journal, and the starter seed. Lives in localStorage until the
 * Supabase relay comes online; every reader gets their own record.
 */
import type { Species } from "@/data/garden";
import { completionistTargets } from "@/data/achievements";

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
  /** the visitor's chosen name — their way back in */
  callsign?: string;
  /** ISO dates they've visited, for streaks */
  visits?: string[];
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
      callsign: parsed.callsign,
      visits: parsed.visits ?? [],
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

/** fire the Xbox/Steam-style toast for a freshly unlocked achievement.
 *  Deferred a tick so an unlock that fires during a page's mount still
 *  lands after the toast listener has attached (effects run children-first). */
function announce(id: string) {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("jd1184-achievement", { detail: { id } }));
  }, 80);
}

/** unlock a visitor achievement; returns true the first time */
export function unlockVisitor(id: string): boolean {
  const state = visitorState();
  if (state.achievements[id]) return false;
  state.achievements[id] = new Date().toISOString().slice(0, 10);
  // The Completionist crowns a full run
  let crowned = false;
  if (id !== "completionist" && !state.achievements.completionist) {
    const have = new Set(Object.keys(state.achievements));
    if (completionistTargets.every((t) => have.has(t))) {
      state.achievements.completionist = new Date().toISOString().slice(0, 10);
      crowned = true;
    }
  }
  save(state);
  announce(id);
  if (crowned) setTimeout(() => announce("completionist"), 900);
  return true;
}

export function setCallsign(name: string) {
  const state = visitorState();
  state.callsign = name.slice(0, 40);
  save(state);
  unlockVisitor("callsign");
}

/**
 * Record this visit and award time-of-day / return-streak achievements.
 * Safe to call on every page load.
 */
export function registerVisit() {
  const state = visitorState();
  const today = new Date().toISOString().slice(0, 10);
  const hour = new Date().getHours();
  const visits = new Set(state.visits ?? []);
  const returned = visits.size > 0 && !visits.has(today);
  visits.add(today);
  state.visits = [...visits].slice(-30);
  save(state);
  if (hour >= 0 && hour < 5) unlockVisitor("night-owl");
  if (returned) unlockVisitor("return-traveler");
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
