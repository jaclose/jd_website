"use client";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { skills } from "@/data/garden";

/**
 * The opening cutscene. The frame holds still — the seed moves within it.
 * Letterboxed like a film: the seed falls out of the night, strikes the
 * regolith, the frame shudders, dust lifts — and then it simply rests.
 * Nothing has been planted yet. (When the first skill is added, a sprout
 * will unfurl here instead.)
 */
export default function SeedCutscene() {
  const [stage, setStage] = useState<"void" | "falling" | "landed" | "settled">(
    "void"
  );
  const reduced = useReducedMotion();
  const hasTrees = skills.length > 0;

  useEffect(() => {
    if (reduced) {
      setStage("settled");
      return;
    }
    const t0 = setTimeout(() => setStage("falling"), 900);
    const t1 = setTimeout(() => setStage("landed"), 2500);
    const t2 = setTimeout(() => setStage("settled"), 3400);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduced]);

  const groundY = "72%";
  const landed = stage === "landed" || stage === "settled";

  return (
    <section className="relative h-screen overflow-hidden bg-[#05060c]">
      {/* sky — pre-dawn indigo with a breath of warmth at the horizon */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#04050b] via-[#0a0e1e] to-[#1a1610]" />
      <div
        aria-hidden
        className="absolute inset-x-0 h-[34vh]"
        style={{
          top: `calc(${groundY} - 34vh)`,
          background:
            "radial-gradient(120% 100% at 50% 100%, rgba(196,138,64,0.16) 0%, rgba(90,70,90,0.1) 38%, transparent 70%)",
        }}
      />

      {/* stars */}
      {[
        [12, 18], [28, 9], [44, 22], [63, 12], [78, 20], [90, 8], [55, 6],
        [8, 32], [85, 35], [35, 30], [70, 28], [18, 45], [94, 48],
      ].map(([x, y], i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute h-px w-px rounded-full bg-ink/70"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            boxShadow: "0 0 6px 1px rgba(232,230,225,0.4)",
          }}
          animate={reduced ? {} : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4 + (i % 5), repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* distant terrain — two silhouette ridges */}
      <svg
        aria-hidden
        className="absolute inset-x-0"
        style={{ top: `calc(${groundY} - 9vh)` }}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        height="9vh"
        width="100%"
      >
        <path
          d="M0,120 L0,84 Q140,58 300,76 T620,70 Q780,52 940,72 T1260,66 Q1360,60 1440,70 L1440,120 Z"
          fill="#0b0a10"
        />
        <path
          d="M0,120 L0,102 Q200,84 420,98 T860,94 Q1100,82 1290,96 T1440,98 L1440,120 Z"
          fill="#120f0e"
        />
      </svg>

      {/* soil */}
      <div
        className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-[#1b1712] to-[#0b0906]"
        style={{ top: groundY }}
      />
      <div
        className="absolute inset-x-0 h-px bg-[rgba(232,230,225,0.2)]"
        style={{ top: groundY }}
      />
      {/* scattered rocks */}
      {[
        [22, 5, 8], [37, 9, 5], [68, 4, 10], [81, 10, 6], [12, 12, 7], [55, 13, 4],
      ].map(([x, dy, wpx], i) => (
        <span
          key={i}
          aria-hidden
          className="absolute rounded-[40%] bg-[#26201a]"
          style={{
            left: `${x}%`,
            top: `calc(${groundY} + ${dy}px)`,
            width: wpx,
            height: Math.max(3, wpx * 0.5),
            boxShadow: "inset -1px 1px 0 rgba(232,230,225,0.08)",
          }}
        />
      ))}

      {/* drifting dust motes */}
      {!reduced &&
        [14, 30, 48, 66, 84].map((x, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute h-[2px] w-[2px] rounded-full bg-[#9a8a64]/40"
            style={{ left: `${x}%`, top: `calc(${groundY} - ${30 + i * 18}px)` }}
            animate={{ y: [-6, -26], x: [0, i % 2 ? 14 : -12], opacity: [0, 0.7, 0] }}
            transition={{ duration: 7 + i * 1.4, repeat: Infinity, ease: "linear", delay: i * 1.1 }}
          />
        ))}

      {/* the frame shudders on impact */}
      <motion.div
        className="absolute inset-0"
        animate={
          stage === "landed" && !reduced
            ? { x: [0, -4, 3, -2, 1, 0], y: [0, 2, -2, 1, 0, 0] }
            : { x: 0, y: 0 }
        }
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* the seed — falls within the still frame, with an after-image trail */}
        {!reduced && stage !== "void" && (
          <>
            {[0, 0.08, 0.16].map((lag, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute left-1/2 h-4 w-3 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-[#b88d5c]"
                style={{ marginLeft: -6, opacity: i === 0 ? 1 : 0.22 - i * 0.06 }}
                initial={{ top: "-6%", rotate: -30 }}
                animate={
                  stage === "falling"
                    ? { top: "-6%" }
                    : {
                        top: `calc(${groundY} - 13px)`,
                        rotate: 14,
                        opacity: i === 0 ? 1 : 0,
                      }
                }
                transition={{
                  top: {
                    duration: 1.5,
                    delay: lag,
                    ease: [0.45, 0.02, 0.78, 0.6], // gravity
                  },
                  rotate: { duration: 1.5, delay: lag },
                  opacity: { duration: 0.3, delay: 1.2 },
                }}
              />
            ))}
          </>
        )}
        {/* at rest — the seed stays in the furrow it made */}
        {(landed || reduced) && (
          <motion.span
            aria-hidden
            className="absolute left-1/2 h-4 w-3 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-[#b88d5c]"
            style={{ marginLeft: -6, top: `calc(${groundY} - 13px)`, rotate: 14 }}
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <span className="absolute left-[2px] top-[2px] h-[7px] w-[4px] rounded-full bg-[#d8b288]/80" />
          </motion.span>
        )}
        {/* the furrow */}
        {(landed || reduced) && (
          <motion.span
            aria-hidden
            className="absolute left-1/2 h-[7px] w-7 -translate-x-1/2 rounded-[50%] border-b border-[rgba(232,230,225,0.25)]"
            style={{ top: `calc(${groundY} - 3px)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* impact dust + shockwave ripple */}
        {landed && !reduced && (
          <div className="absolute left-1/2" style={{ top: groundY }}>
            {[-46, -30, -16, -6, 6, 16, 30, 46].map((dx, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute h-1 w-1 rounded-full bg-[#8a7a5c]"
                initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
                animate={{ x: dx, y: -16 - Math.abs(dx) * 0.4, opacity: 0, scale: 0.4 }}
                transition={{ duration: 1, delay: i * 0.025, ease: "easeOut" }}
              />
            ))}
            {[0, 0.18, 0.36].map((delay, i) => (
              <motion.span
                key={`r-${i}`}
                aria-hidden
                className="absolute rounded-[50%] border border-[#8a7a5c]"
                style={{ width: 56, height: 14, marginLeft: -28, marginTop: -7 }}
                initial={{ scale: 0.2, opacity: 0.7 }}
                animate={{ scale: 2.6 + i * 1.2, opacity: 0 }}
                transition={{ duration: 1.2, delay, ease: "easeOut" }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* letterbox bars — cinema, then they retract */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 bg-black"
        initial={{ height: "11vh" }}
        animate={{ height: stage === "settled" ? "0vh" : "11vh" }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-10 bg-black"
        initial={{ height: "11vh" }}
        animate={{ height: stage === "settled" ? "0vh" : "11vh" }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* copy */}
      <div className="absolute inset-x-0 top-[16%] z-20 text-center">
        <motion.p
          className="label text-leaf/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          JD-1184 c · SURFACE · SOL 1
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
          className="mx-auto mt-6 max-w-md px-6 font-serif text-xl italic leading-relaxed text-faint"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage === "settled" ? 1 : 0 }}
          transition={{ duration: 1.4 }}
        >
          {hasTrees
            ? "Every skill begins as a seed. The work is the water."
            : "The first seed has arrived. Nothing has been planted yet — the ground is prepared, and the planet waits."}
        </motion.p>
      </div>

      <motion.p
        className="label absolute bottom-8 left-1/2 z-20 -translate-x-1/2 !text-[9px] text-dim"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === "settled" ? 1 : 0 }}
        transition={{ delay: 0.6, duration: 1 }}
      >
        {hasTrees ? "SCROLL TO WALK THE ROWS ↓" : "SCROLL TO SURVEY THE PLOTS ↓"}
      </motion.p>
    </section>
  );
}
