"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { visitorAchievements, type VisitorAchievement } from "@/data/achievements";

const TIER_RING: Record<string, string> = {
  common: "rgba(138,143,152,0.75)",
  uncommon: "rgba(159,206,143,0.85)",
  rare: "rgba(159,216,232,0.9)",
  legendary: "rgba(212,184,134,0.95)",
};
const TIER_LABEL: Record<string, string> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  rare: "RARE",
  legendary: "LEGENDARY",
};

const byId = new Map(visitorAchievements.map((a) => [a.id, a]));
const DURATION = 9000; // ~9s on screen, then it leaves

interface Shown extends VisitorAchievement {
  key: number;
}

/**
 * Xbox/Steam-style unlock toast. Listens for `jd1184-achievement` events,
 * queues them, and slides a plate UP from the bottom (so it never blocks
 * the nav pill). Dedupes so a flurry can't stack the same unlock; shows
 * one at a time and auto-dismisses.
 */
export default function AchievementToast() {
  const [queue, setQueue] = useState<Shown[]>([]);
  const [current, setCurrent] = useState<Shown | null>(null);
  // ids already shown or queued this session — prevents stacking/repeats
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onUnlock = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (!id || seen.current.has(id)) return;
      const a = byId.get(id);
      if (!a) return;
      seen.current.add(id);
      setQueue((q) => [...q, { ...a, key: Date.now() + Math.random() }]);
    };
    window.addEventListener("jd1184-achievement", onUnlock);
    return () => window.removeEventListener("jd1184-achievement", onUnlock);
  }, []);

  // pump: when nothing is showing, take the next from the queue
  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue((q) => q.slice(1));
  }, [queue, current]);

  // dismiss: an independent timer keyed only on the shown toast, so a
  // re-render can never clear it early (the bug that made it persist)
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), DURATION);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-120 flex justify-center">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.key}
            initial={{ y: 110, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 110, opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-7 flex w-[min(92vw,400px)] items-center gap-4 overflow-hidden rounded-md border border-hairline bg-[rgba(7,9,14,0.94)] px-5 py-3.5 shadow-[0_18px_55px_rgba(0,0,0,0.65)] backdrop-blur-xl"
          >
            {/* unlock shine sweep */}
            <span aria-hidden className="achievement-shine pointer-events-none absolute inset-0" />
            {/* badge */}
            <motion.span
              aria-hidden
              initial={{ rotate: -25, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 14 }}
              className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full font-mono text-xl text-ink"
              style={{
                border: `2px solid ${TIER_RING[current.tier]}`,
                boxShadow: `0 0 18px ${TIER_RING[current.tier]}`,
              }}
            >
              {current.icon}
            </motion.span>
            {/* copy */}
            <div className="relative min-w-0">
              <p className="label text-[7px]! tracking-[0.3em]! text-starlight/80">
                ACHIEVEMENT UNLOCKED ·{" "}
                <span style={{ color: TIER_RING[current.tier] }}>
                  {TIER_LABEL[current.tier]}
                </span>
              </p>
              <p className="mt-1 truncate font-display text-lg font-light text-ink">
                {current.title}
              </p>
              <p className="truncate font-serif text-[0.84rem] italic leading-snug text-faint">
                {current.description}
              </p>
            </div>
            {/* drain bar — shows the dwell time ticking down */}
            <motion.span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-starlight/50"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: DURATION / 1000, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
