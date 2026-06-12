"use client";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * The opening cutscene. The frame holds still — the seed moves within it:
 * falls, lands in the soil, kicks up dust, and a sprout unfurls. Then the
 * visitor is invited to scroll down the rows.
 */
export default function SeedCutscene() {
  const [stage, setStage] = useState<"falling" | "landed" | "grown">("falling");
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setStage("grown");
      return;
    }
    const t1 = setTimeout(() => setStage("landed"), 1700);
    const t2 = setTimeout(() => setStage("grown"), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduced]);

  const groundY = "72%";

  return (
    <section className="relative h-screen overflow-hidden">
      {/* sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-space-deep via-space to-[#0b0d08]" />
      {/* a few fixed stars in the frame */}
      {[
        [12, 18], [28, 9], [44, 22], [63, 12], [78, 20], [90, 8], [55, 6], [8, 32], [85, 35],
      ].map(([x, y], i) => (
        <span
          key={i}
          aria-hidden
          className="absolute h-px w-px rounded-full bg-ink/70"
          style={{ left: `${x}%`, top: `${y}%`, boxShadow: "0 0 6px 1px rgba(232,230,225,0.4)" }}
        />
      ))}

      {/* soil */}
      <div
        className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-[#171410] to-[#0c0a07]"
        style={{ top: groundY }}
      />
      <div className="absolute inset-x-0 h-px bg-[rgba(232,230,225,0.18)]" style={{ top: groundY }} />

      {/* the seed — falls within the still frame */}
      {!reduced && (
        <motion.span
          aria-hidden
          className="absolute left-1/2 h-4 w-3 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-[#b88d5c]"
          style={{ marginLeft: -6 }}
          initial={{ top: "-6%", rotate: -30, opacity: 1 }}
          animate={
            stage === "falling"
              ? { top: "-6%" }
              : { top: `calc(${groundY} - 14px)`, rotate: 14, opacity: stage === "grown" ? 0 : 1 }
          }
          transition={{
            top: { duration: 1.5, ease: [0.45, 0.02, 0.78, 0.6] }, // gravity
            rotate: { duration: 1.5 },
            opacity: { delay: 1.2, duration: 0.6 },
          }}
        />
      )}

      {/* impact dust + shockwave ripple */}
      {stage !== "falling" && !reduced && (
        <div className="absolute left-1/2" style={{ top: groundY }}>
          {[-38, -22, -9, 9, 22, 38].map((dx, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute h-1 w-1 rounded-full bg-[#8a7a5c]"
              initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
              animate={{ x: dx, y: -14 - Math.abs(dx) * 0.35, opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.9, delay: i * 0.03, ease: "easeOut" }}
            />
          ))}
          {[0, 0.18].map((delay, i) => (
            <motion.span
              key={`r-${i}`}
              aria-hidden
              className="absolute rounded-[50%] border border-[#8a7a5c]"
              style={{ width: 56, height: 14, marginLeft: -28, marginTop: -7 }}
              initial={{ scale: 0.2, opacity: 0.7 }}
              animate={{ scale: 2.6 + i, opacity: 0 }}
              transition={{ duration: 1.1, delay, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      {/* the sprout unfurls from where the seed landed */}
      <svg
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: `calc(${groundY} - 110px)` }}
        width="120"
        height="112"
        viewBox="0 0 120 112"
        fill="none"
        aria-hidden
      >
        {stage === "grown" && (
          <>
            <motion.path
              d="M60 110 C58 92 62 80 60 62"
              stroke="#6f9c66"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
            <motion.path
              d="M60 74 Q40 66 38 46"
              stroke="#6f9c66"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.55, ease: "easeOut" }}
            />
            <motion.path
              d="M60 64 Q82 56 84 36"
              stroke="#6f9c66"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.8, ease: "easeOut" }}
            />
            <motion.circle
              cx="60"
              cy="60"
              r="2.4"
              fill="#9fce8f"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.3, type: "spring", stiffness: 300 }}
            />
          </>
        )}
      </svg>

      {/* copy */}
      <div className="absolute inset-x-0 top-[14%] text-center">
        <motion.p
          className="label text-leaf/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          JD-1184 c · SURFACE
        </motion.p>
        <motion.h1
          className="mt-5 font-display text-[clamp(2.4rem,6vw,4.6rem)] font-light text-ink"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          The Garden
        </motion.h1>
        <motion.p
          className="mx-auto mt-5 max-w-md px-6 font-serif text-xl italic leading-relaxed text-faint"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage === "grown" ? 1 : 0 }}
          transition={{ duration: 1.2 }}
        >
          Every skill begins as a seed. The work is the water.
        </motion.p>
      </div>

      <motion.p
        className="label absolute bottom-8 left-1/2 -translate-x-1/2 !text-[9px] text-dim"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === "grown" ? 1 : 0 }}
        transition={{ delay: 0.6, duration: 1 }}
      >
        SCROLL TO WALK THE ROWS ↓
      </motion.p>
    </section>
  );
}
