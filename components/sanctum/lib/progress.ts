"use client";
import { create } from "zustand";
import {
  achievementById,
  ALL_FEATURE_IDS,
  sanctumQuests,
  sanctumSecrets,
  secretById,
  WANDERER_METRES,
} from "./quests";

/**
 * Persistent visitor progress: which landmarks were reached, which secrets were
 * found, which achievements unlocked, how far they've walked, and which quest is
 * tracked. A plain zustand store (external state) so it works on both sides of
 * the R3F boundary — the canvas sensor writes, the DOM tracker reads. Hydration
 * from localStorage happens explicitly after mount (never during SSR render) so
 * server and first client render always agree.
 */

export interface ProgressToast {
  key: number;
  kicker: string;
  title: string;
  secret?: boolean;
}

interface ProgressState {
  hydrated: boolean;
  storageError: string;
  visited: Record<string, true>;
  secrets: Record<string, true>;
  achievements: Record<string, number>;
  metresWalked: number;
  trackedQuestId: string | null;
  toasts: ProgressToast[];
  hydrate: () => void;
  visit: (id: string) => void;
  discover: (secretId: string) => void;
  addMetres: (m: number) => void;
  trackQuest: (id: string | null) => void;
  dismissToast: (key: number) => void;
}

const STORAGE_KEY = "jd1184-sanctum-progress-v1";
let toastKey = 1;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(get: () => ProgressState) {
  if (typeof window === "undefined") return;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const { visited, secrets, achievements, metresWalked, trackedQuestId } = get();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ visited, secrets, achievements, metresWalked, trackedQuestId }),
      );
      useProgress.setState({ storageError: "" });
    } catch {
      useProgress.setState({ storageError: "This browser couldn’t save your progress. Export your journal before leaving." });
    }
  }, 400);
}

/** unlock an achievement (idempotent) and queue its toast. */
function unlock(
  id: string,
  state: Pick<ProgressState, "achievements" | "toasts">,
): Partial<Pick<ProgressState, "achievements" | "toasts">> {
  if (state.achievements[id]) return {};
  const a = achievementById.get(id);
  if (!a) return {};
  return {
    achievements: { ...state.achievements, [id]: Date.now() },
    toasts: [
      ...state.toasts,
      { key: toastKey++, kicker: a.secret ? "Secret found" : "Achievement", title: a.title, secret: a.secret },
    ],
  };
}

/** evaluate quest/collection achievements after a visit or discovery. */
function evaluate(state: ProgressState): Partial<ProgressState> {
  let patch: Partial<ProgressState> = {};
  const merged = () => ({ ...state, ...patch }) as ProgressState;

  for (const q of sanctumQuests) {
    const done = q.objectives.every((o) => merged().visited[o.id] || merged().secrets[o.id]);
    if (done) patch = { ...patch, ...unlock(q.achievementId, merged()) };
  }
  if (ALL_FEATURE_IDS.every((id) => merged().visited[id])) {
    patch = { ...patch, ...unlock("every-chapter", merged()) };
  }
  if (sanctumSecrets.every((s) => merged().secrets[s.id])) {
    patch = { ...patch, ...unlock("keeper-of-quiet-things", merged()) };
  }
  return patch;
}

export const useProgress = create<ProgressState>((set, get) => ({
  hydrated: false,
  storageError: "",
  visited: {},
  secrets: {},
  achievements: {},
  metresWalked: 0,
  trackedQuestId: "first-signal",
  toasts: [],

  hydrate: () => {
    if (get().hydrated || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<ProgressState>;
        if (!p || typeof p !== "object") throw new Error("Invalid journal");
        const flags = (value: unknown, ids: string[]) => Object.fromEntries(Object.entries(value && typeof value === "object" ? value : {}).filter(([id, v]) => ids.includes(id) && v === true)) as Record<string, true>;
        set({
          hydrated: true,
          visited: { ...flags(p.visited, [...ALL_FEATURE_IDS, "trailhead"]), ...(p.visited?.noctyrium ? { axom: true as const } : {}) },
          secrets: flags(p.secrets, sanctumSecrets.map(s => s.id)),
          achievements: Object.fromEntries(Object.entries(p.achievements && typeof p.achievements === "object" ? p.achievements : {}).filter(([id, v]) => achievementById.has(id) && typeof v === "number" && Number.isFinite(v) && v > 0)),
          metresWalked: typeof p.metresWalked === "number" && Number.isFinite(p.metresWalked) ? Math.max(0, p.metresWalked) : 0,
          trackedQuestId: p.trackedQuestId === null || sanctumQuests.some(q => q.id === p.trackedQuestId) ? p.trackedQuestId! : "first-signal",
        });
        return;
      }
    } catch {
      set({ storageError: "This browser couldn’t open your saved progress. You can explore and export this session." });
    }
    set({ hydrated: true });
  },

  visit: (id) => {
    if (id !== "trailhead" && !ALL_FEATURE_IDS.includes(id)) return;
    const s = get();
    if (s.visited[id]) return;
    let patch: Partial<ProgressState> = { visited: { ...s.visited, [id]: true } };
    if (id === "trailhead") patch = { ...patch, ...unlock("first-light", { ...s, ...patch } as ProgressState) };
    patch = { ...patch, ...evaluate({ ...s, ...patch } as ProgressState) };
    set(patch);
    scheduleSave(get);
  },

  discover: (secretId) => {
    const s = get();
    if (s.secrets[secretId]) return;
    const secret = secretById.get(secretId);
    if (!secret) return;
    let patch: Partial<ProgressState> = { secrets: { ...s.secrets, [secretId]: true } };
    patch = { ...patch, ...unlock(secretId, { ...s, ...patch } as ProgressState) };
    patch = { ...patch, ...evaluate({ ...s, ...patch } as ProgressState) };
    set(patch);
    scheduleSave(get);
  },

  addMetres: (m) => {
    if (!Number.isFinite(m) || m <= 0) return;
    const s = get();
    const metresWalked = s.metresWalked + m;
    let patch: Partial<ProgressState> = { metresWalked };
    if (metresWalked >= WANDERER_METRES) patch = { ...patch, ...unlock("wanderer", s) };
    set(patch);
    // distance ticks constantly — persist opportunistically (debounced anyway)
    scheduleSave(get);
  },

  trackQuest: (id) => {
    if (id !== null && !sanctumQuests.some(q => q.id === id)) return;
    set({ trackedQuestId: id });
    scheduleSave(get);
  },

  dismissToast: (key) => set((s) => ({ toasts: s.toasts.filter((t) => t.key !== key) })),
}));

/** quest completion snapshot for the tracker UI. */
export function questProgress(
  questId: string,
  visited: Record<string, true>,
  secrets: Record<string, true>,
) {
  const q = sanctumQuests.find((x) => x.id === questId);
  if (!q) return { done: 0, total: 0, complete: false };
  const done = q.objectives.filter((o) => visited[o.id] || secrets[o.id]).length;
  return { done, total: q.objectives.length, complete: done === q.objectives.length };
}
