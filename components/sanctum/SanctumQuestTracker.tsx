"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  nextObjective,
  questById,
  sanctumAchievements,
  sanctumQuests,
  secretById,
} from "./lib/quests";
import { questProgress, useProgress } from "./lib/progress";
import { playerState } from "./lib/store";

/**
 * The quest log, top-right. Collapsed it's a single chip with the tracked
 * quest; open, it lists every walkable quest with live progress — choosing one
 * re-aims the in-canvas guide beacon (SanctumGuide reads the same store). The
 * secret quest stays a "???" tease until the first quiet thing is found.
 * Distance-to-objective ticks via rAF against `playerState`, straight into the
 * DOM node — no React state at frame rate.
 */
export default function SanctumQuestTracker({ visible }: { visible: boolean }) {
  const [open, setOpen] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const trackedQuestId = useProgress((s) => s.trackedQuestId);
  const visited = useProgress((s) => s.visited);
  const secrets = useProgress((s) => s.secrets);
  const achievements = useProgress((s) => s.achievements);
  const trackQuest = useProgress((s) => s.trackQuest);
  const distRef = useRef<HTMLSpanElement>(null);

  const secretsFound = Object.keys(secrets).length;
  const unlocked = Object.keys(achievements).length;
  const tracked = trackedQuestId ? questById.get(trackedQuestId) : null;
  const trackedProg = trackedQuestId ? questProgress(trackedQuestId, visited, secrets) : null;

  // live "distance to objective" readout without re-rendering
  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 350) return;
      last = t;
      const el = distRef.current;
      if (!el) return;
      const s = useProgress.getState();
      const q = s.trackedQuestId ? questById.get(s.trackedQuestId) : null;
      if (!q || q.secret) {
        el.textContent = q?.secret ? "no guide — wander" : "";
        return;
      }
      const o = nextObjective(q, s.visited, s.secrets, playerState.x, playerState.z);
      el.textContent = o ? `${Math.max(1, Math.round(Math.hypot(o.target[0] - playerState.x, o.target[2] - playerState.z)))} m` : "complete";
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, open]);

  if (!visible) return null;

  return (
    <div className="absolute right-5 top-[6.75rem] z-30 flex w-[min(88vw,300px)] flex-col items-end">
      {/* collapsed chip */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 border px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] backdrop-blur-md transition-colors ${
          open
            ? "border-leaf/55 bg-leaf/15 text-ink"
            : "border-hairline bg-[rgba(5,10,7,0.6)] text-leaf/85 hover:border-leaf/50 hover:text-ink"
        }`}
        aria-expanded={open}
      >
        <span aria-hidden>◈</span>
        {tracked && trackedProg ? (
          <span className="max-w-40 truncate">
            {tracked.title} {trackedProg.done}/{trackedProg.total}
          </span>
        ) : (
          <span>Quests</span>
        )}
        <span ref={distRef} className="text-leaf/60" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="mt-2 w-full border border-hairline bg-[rgba(5,10,7,0.82)] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            <p className="label mb-2 text-[7px]! tracking-[0.24em]! text-leaf/70">Quests of the Sanctum</p>
            <div className="space-y-1">
              {sanctumQuests.map((q) => {
                const revealed = !q.secret || secretsFound > 0;
                const p = questProgress(q.id, visited, secrets);
                const isTracked = trackedQuestId === q.id;
                if (!revealed) {
                  return (
                    <div key={q.id} className="border border-transparent px-2 py-1.5">
                      <p className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-dim">??? </p>
                      <p className="mt-0.5 font-mono text-[0.6rem] text-faint">Something rustles, off the trail.</p>
                    </div>
                  );
                }
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => trackQuest(isTracked ? null : q.id)}
                    className={`block w-full border px-2 py-1.5 text-left transition-colors ${
                      isTracked ? "border-leaf/45 bg-leaf/10" : "border-transparent hover:border-hairline"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`font-mono text-[0.66rem] uppercase tracking-[0.14em] ${p.complete ? "text-leaf/60 line-through" : "text-ink"}`}>
                        {q.title}
                      </span>
                      <span className="font-mono text-[0.6rem] text-faint">
                        {p.complete ? "✓" : `${p.done}/${p.total}`}
                      </span>
                    </div>
                    {isTracked && !p.complete ? (
                      <div className="mt-1.5 space-y-1">
                        <p className="font-mono text-[0.6rem] leading-relaxed text-faint">{q.brief}</p>
                        {q.objectives.map((o) => {
                          const done = !!(visited[o.id] || secrets[o.id]);
                          const label = q.secret && done ? secretById.get(o.id)?.title ?? o.label : o.label;
                          return (
                            <p key={o.id} className={`font-mono text-[0.62rem] ${done ? "text-leaf/55 line-through" : "text-leaf/90"}`}>
                              {done ? "●" : "○"} {label}
                            </p>
                          );
                        })}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* achievements drawer */}
            <button
              type="button"
              onClick={() => setShowAchievements((v) => !v)}
              className="mt-3 flex w-full items-baseline justify-between border-t border-[rgba(232,230,225,0.1)] pt-2 text-left"
            >
              <span className="label text-[7px]! tracking-[0.24em]! text-leaf/70">Achievements</span>
              <span className="font-mono text-[0.62rem] text-faint">
                {unlocked}/{sanctumAchievements.length} {showAchievements ? "−" : "+"}
              </span>
            </button>
            {showAchievements ? (
              <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
                {sanctumAchievements.map((a) => {
                  const has = !!achievements[a.id];
                  return (
                    <div key={a.id} className="flex items-start gap-2">
                      <span className={`mt-0.5 font-mono text-[0.6rem] ${has ? "text-starlight" : "text-dim"}`}>{has ? "✦" : "·"}</span>
                      <div className="min-w-0">
                        <p className={`font-mono text-[0.62rem] uppercase tracking-[0.12em] ${has ? "text-ink" : "text-dim"}`}>
                          {a.secret && !has ? "???" : a.title}
                        </p>
                        <p className="font-mono text-[0.58rem] leading-snug text-faint">
                          {a.secret && !has ? "A secret keeps itself." : a.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
