"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  skills,
  biosphere,
  STAGE_NAMES,
  speciesOf,
  type Species,
} from "@/data/garden";
import TreeGlyph from "@/components/TreeGlyph";
import { unlockVisitor } from "@/lib/visitor";

/**
 * The Garden as a full-bleed biome. The whole viewport is the frame:
 * parallax ridgelines, mist, fireflies, a grass-tufted soil line. On
 * first approach a single seed falls out of the canopy light, shakes
 * the frame, and rests at the foreground plot. Survey trails lead off
 * to the other stands — each with its own weather (snow, autumn, mist) —
 * and clicking a trail walks the camera to that tree.
 */

type Phase = "idle" | "falling" | "landed" | "garden";

interface Stand {
  key: string;
  /** % of scene width where the stand grows */
  x: number;
  glyph: { id: string; stage: 0 | 1 | 2 | 3 | 4 | 5 };
  species: Species;
  ghost: boolean;
  theme: "none" | "snow" | "autumn" | "mist";
  height: number;
  title: string;
  sub: string;
  note: string;
}

/* the stands: real skills when planted, themed projections while barren */
function buildStands(): Stand[] {
  if (skills.length > 0) {
    const latest = skills[skills.length - 1];
    const others = skills.slice(0, -1).slice(-2);
    const themes: Stand["theme"][] = ["snow", "autumn"];
    return [
      {
        key: latest.id,
        x: 50,
        glyph: latest,
        species: speciesOf(latest),
        ghost: false,
        theme: "none",
        height: 200 + latest.stage * 18,
        title: latest.name,
        sub: `${STAGE_NAMES[latest.stage]} · ${latest.domain}`,
        note: latest.note,
      },
      ...others.map((s, i) => ({
        key: s.id,
        x: i === 0 ? 22 : 80,
        glyph: s,
        species: speciesOf(s),
        ghost: false,
        theme: themes[i],
        height: 150 + s.stage * 16,
        title: s.name,
        sub: `${STAGE_NAMES[s.stage]} · ${s.domain}`,
        note: s.note,
      })),
    ];
  }
  return [
    {
      key: "unsown",
      x: 50,
      glyph: { id: "first-seed", stage: 0 },
      species: "oak",
      ghost: false,
      theme: "none",
      height: 120,
      title: "The First Seed",
      sub: "plot 01 · unsown",
      note: "It landed today. Nothing has been planted yet — what it becomes depends on the work that follows.",
    },
    {
      key: "proj-spruce",
      x: 21,
      glyph: { id: "proj-spruce", stage: 3 },
      species: "spruce",
      ghost: true,
      theme: "snow",
      title: "Northern Stand",
      sub: "projection · spruce · mind",
      note: "A patient evergreen for the disciplines of the mind — it will keep its needles through every winter of study.",
      height: 160,
    },
    {
      key: "proj-oak",
      x: 81,
      glyph: { id: "proj-oak", stage: 4 },
      species: "oak",
      ghost: true,
      theme: "autumn",
      title: "The Far Oak",
      sub: "projection · oak · craft",
      note: "Broad and load-bearing, deeper in the forest — the craft that will one day shade whoever comes after.",
      height: 210,
    },
  ];
}

/* deterministic ridge of mixed tree silhouettes */
function ridgePath(seed: number, width: number, height: number, density: number): string {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  let d = `M0,${height} `;
  let x = 0;
  while (x < width) {
    const w = 14 + rnd() * 26 * (2 - density);
    const h = height * (0.35 + rnd() * 0.6);
    const kind = rnd();
    if (kind < 0.55) {
      d += `L${x + w * 0.5},${height - h} L${x + w},${height * 0.96} `;
    } else if (kind < 0.85) {
      d += `L${x + w * 0.15},${height - h * 0.55} Q${x + w * 0.5},${height - h} ${x + w * 0.85},${height - h * 0.55} L${x + w},${height * 0.96} `;
    } else {
      d += `L${x + w * 0.3},${height - h * 0.8} L${x + w * 0.75},${height - h * 0.8} L${x + w},${height * 0.96} `;
    }
    x += w;
  }
  d += `L${width},${height} Z`;
  return d;
}

/** a real seed — husk gradient, sheen, scar */
function SeedGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 20 27" aria-hidden>
      <defs>
        <linearGradient id="seed-husk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8a468" />
          <stop offset="0.45" stopColor="#b88d5c" />
          <stop offset="1" stopColor="#7e5a36" />
        </linearGradient>
      </defs>
      <path
        d="M10 1 C15.5 6 18.5 12 18 18 C17.5 23 14.2 26 10 26 C5.8 26 2.5 23 2 18 C1.5 12 4.5 6 10 1 Z"
        fill="url(#seed-husk)"
      />
      <path
        d="M10 1 C15.5 6 18.5 12 18 18 C17.5 23 14.2 26 10 26"
        fill="none"
        stroke="#5e3f22"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <path
        d="M7 6 C5.5 9 4.8 13 5.2 17"
        fill="none"
        stroke="#ecd2a8"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.75"
      />
      <ellipse cx="10" cy="2.4" rx="1.5" ry="1" fill="#5e3f22" opacity="0.9" />
    </svg>
  );
}

/* weather layered over a stand */
function StandTheme({ theme, height }: { theme: Stand["theme"]; height: number }) {
  if (theme === "snow") {
    return (
      <>
        {[14, 30, 48, 62, 76, 38, 55].map((x, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute h-0.5 w-0.5 rounded-full bg-white/80"
            style={{ left: `${x}%`, top: `${8 + (i % 4) * 16}%` }}
            animate={{ y: [0, height * 0.5], opacity: [0, 0.9, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.9, ease: "linear" }}
          />
        ))}
        <span
          aria-hidden
          className="absolute inset-x-[12%] top-[18%] h-[10%] rounded-full bg-white/14 blur-[3px]"
        />
      </>
    );
  }
  if (theme === "mist") {
    return (
      <span
        aria-hidden
        className="absolute inset-x-[-25%] bottom-[6%] h-[26%] rounded-full bg-[#bac8c2]/12 blur-md"
      />
    );
  }
  return null;
}

const THEME_FILTER: Record<Stand["theme"], string> = {
  none: "",
  snow: "brightness(1.18) saturate(0.75) hue-rotate(165deg)",
  autumn: "sepia(0.45) hue-rotate(-26deg) saturate(1.5)",
  mist: "brightness(0.92) blur(0.4px)",
};

export default function ForestScene() {
  const bio = biosphere();
  const barren = bio.count === 0;
  const stands = useMemo(buildStands, []);
  const section = useRef<HTMLElement>(null);
  const inView = useInView(section, { once: true, margin: "-35% 0px -35% 0px" });
  const [phase, setPhase] = useState<Phase>("idle");
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    if (!inView || phase !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("garden");
      return;
    }
    const t = [
      setTimeout(() => setPhase("falling"), 200),
      setTimeout(() => setPhase("landed"), 1700),
      setTimeout(() => {
        setPhase("garden");
        unlockVisitor("gardener-eye");
      }, 2900),
    ];
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start end", "end start"],
  });
  const yFar = useTransform(scrollYProgress, [0, 1], [30, -24]);
  const yMid = useTransform(scrollYProgress, [0, 1], [55, -45]);
  const yNear = useTransform(scrollYProgress, [0, 1], [85, -70]);
  const mistX = useTransform(scrollYProgress, [0, 1], ["-4%", "5%"]);

  const focused = stands[focus];
  const groundPct = 74; // % from top where the soil line sits
  // walk the camera so the focused stand stands center-frame
  const camX = 50 - stands[focus].x;

  return (
    <section
      ref={section}
      id="garden"
      className="relative min-h-svh overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #06070b 0%, #07110d 26%, #0a1a12 60%, #08120c 100%)",
      }}
    >
      {/* canopy light */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[44vh]"
        style={{
          background:
            "radial-gradient(70% 100% at 50% 0%, rgba(159,206,143,0.1) 0%, transparent 70%)",
        }}
      />

      {/* parallax ridgelines */}
      <motion.svg aria-hidden className="absolute inset-x-0 text-[#0c1812]" style={{ y: yFar, bottom: "30%" }} viewBox="0 0 1440 120" preserveAspectRatio="none" height="120" width="100%">
        <path d={ridgePath(11, 1440, 120, 0.8)} fill="currentColor" opacity={0.85} />
      </motion.svg>
      <motion.svg aria-hidden className="absolute inset-x-0 text-[#0a130d]" style={{ y: yMid, bottom: "24%" }} viewBox="0 0 1440 150" preserveAspectRatio="none" height="150" width="100%">
        <path d={ridgePath(47, 1440, 150, 1)} fill="currentColor" opacity={0.95} />
      </motion.svg>
      <motion.svg aria-hidden className="absolute inset-x-0 text-[#070d09]" style={{ y: yNear, bottom: "20%" }} viewBox="0 0 1440 170" preserveAspectRatio="none" height="170" width="100%">
        <path d={ridgePath(83, 1440, 170, 1.3)} fill="currentColor" />
      </motion.svg>

      {/* mist */}
      <motion.div
        aria-hidden
        className="absolute inset-x-[-10%] h-24"
        style={{
          x: mistX,
          bottom: "25%",
          background:
            "linear-gradient(90deg, transparent, rgba(186,210,190,0.06) 30%, rgba(186,210,190,0.1) 50%, rgba(186,210,190,0.05) 75%, transparent)",
          filter: "blur(7px)",
        }}
      />

      {/* soil — layered, lit, stony */}
      <div className="absolute inset-x-0 bottom-0" style={{ top: `${groundPct}%` }}>
        <div className="absolute inset-0 bg-linear-to-b from-[#16200f] via-[#121708] to-[#0a0d05]" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 90% at 50% 0%, rgba(159,206,143,0.08) 0%, transparent 60%)",
          }}
        />
        {[8, 23, 41, 58, 71, 87, 94].map((x, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute rounded-[45%] bg-[#222b18]"
            style={{
              left: `${x}%`,
              top: `${10 + (i % 3) * 18}%`,
              width: 6 + (i % 4) * 4,
              height: 3 + (i % 3) * 2,
              boxShadow: "inset -1px 1px 0 rgba(232,230,225,0.1)",
            }}
          />
        ))}
      </div>
      <div
        className="absolute inset-x-0 h-px bg-[rgba(190,210,180,0.22)]"
        style={{ top: `${groundPct}%` }}
      />
      {/* grass tufts along the soil line */}
      <svg
        aria-hidden
        className="absolute inset-x-0"
        style={{ top: `calc(${groundPct}% - 11px)` }}
        viewBox="0 0 1440 12"
        preserveAspectRatio="none"
        width="100%"
        height="12"
      >
        {Array.from({ length: 90 }, (_, i) => {
          const x = (i / 90) * 1440 + ((i * 37) % 11);
          const h = 4 + ((i * 13) % 8);
          const lean = ((i * 7) % 5) - 2;
          return (
            <path
              key={i}
              d={`M${x},12 Q${x + lean},${12 - h * 0.7} ${x + lean * 1.6},${12 - h}`}
              stroke={i % 3 ? "#3f5c38" : "#557a4a"}
              strokeWidth="1"
              fill="none"
              opacity="0.8"
            />
          );
        })}
      </svg>

      {/* fireflies */}
      {[12, 28, 44, 60, 78, 90].map((x, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute h-[3px] w-[3px] rounded-full bg-[#d9e8a8] shadow-[0_0_8px_2px_rgba(217,232,168,0.5)]"
          style={{ left: `${x}%`, top: `${34 + (i % 3) * 12}%` }}
          animate={{ opacity: [0, 0.9, 0], y: [-6, -22], x: [0, i % 2 ? 10 : -8] }}
          transition={{ duration: 5 + i, repeat: Infinity, delay: i * 1.2, ease: "easeInOut" }}
        />
      ))}

      {/* ——— the falling seed (one seed, full lifecycle) ——— */}
      {phase !== "idle" && phase !== "garden" && (
        <motion.div
          aria-hidden
          className="absolute left-1/2 z-10 -translate-x-1/2"
          initial={{ top: "-8%", rotate: -36 }}
          animate={
            phase === "falling"
              ? { top: `calc(${groundPct}% - 26px)`, rotate: 10 }
              : { top: `calc(${groundPct}% - 26px)`, rotate: 10 }
          }
          transition={{ top: { duration: 1.4, ease: [0.5, 0.02, 0.82, 0.6] }, rotate: { duration: 1.4 } }}
        >
          <SeedGlyph />
        </motion.div>
      )}
      {/* impact */}
      {phase === "landed" && (
        <div className="absolute left-1/2 z-10" style={{ top: `${groundPct}%` }}>
          {[-40, -24, -10, 10, 24, 40].map((dx, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute h-1 w-1 rounded-full bg-[#6e5d44]"
              initial={{ x: 0, y: 0, opacity: 0.95 }}
              animate={{ x: dx, y: -14 - Math.abs(dx) * 0.45, opacity: 0 }}
              transition={{ duration: 0.85, delay: i * 0.03, ease: "easeOut" }}
            />
          ))}
          {[0, 0.16].map((delay, i) => (
            <motion.span
              key={`r-${i}`}
              aria-hidden
              className="absolute rounded-[50%] border border-[#8a7a5c]"
              style={{ width: 52, height: 13, marginLeft: -26, marginTop: -6 }}
              initial={{ scale: 0.2, opacity: 0.8 }}
              animate={{ scale: 2.5 + i, opacity: 0 }}
              transition={{ duration: 1, delay, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      {/* ——— the forest world: pans when a stand is focused ——— */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: phase === "garden" ? 1 : 0,
          x: `${camX}vw`,
        }}
        transition={{
          opacity: { duration: 1.1, ease: "easeInOut" },
          x: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
        }}
      >
        {/* survey trails between the stands */}
        <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
          {stands.slice(1).map((s, i) => {
            const from = stands[0].x * 10;
            const to = s.x * 10;
            const y0 = groundPct * 6 + 8;
            const dip = 26 + i * 10;
            return (
              <path
                key={s.key}
                d={`M${from},${y0} C${(from + to) / 2},${y0 - dip} ${(from + to) / 2},${y0 - dip} ${to},${y0 - 4}`}
                fill="none"
                stroke="rgba(159,206,143,0.55)"
                strokeWidth="1.1"
                strokeDasharray="2 8"
              />
            );
          })}
        </svg>

        {/* the stands */}
        {stands.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setFocus(i)}
            aria-label={`Walk to ${s.title}`}
            className="group absolute -translate-x-1/2 cursor-pointer text-center"
            style={{ left: `${s.x}%`, bottom: `calc(100% - ${groundPct}% - 1px)` }}
          >
            <motion.div
              className="relative"
              animate={{ scale: focus === i ? 1 : 0.92, opacity: focus === i ? 1 : 0.8 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "bottom center" }}
            >
              {s.key === "unsown" ? (
                <div className="relative flex h-28 w-24 items-end justify-center pb-0.5">
                  <SeedGlyph size={18} />
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-1/2 h-1.5 w-7 -translate-x-1/2 rounded-[50%] border-b border-[rgba(232,230,225,0.3)]"
                  />
                </div>
              ) : (
                <div className="relative" style={{ filter: THEME_FILTER[s.theme] || undefined }}>
                  <TreeGlyph
                    skill={s.glyph}
                    species={s.species}
                    ghost={s.ghost}
                    height={s.height}
                    className="mx-auto"
                  />
                  <StandTheme theme={s.theme} height={s.height} />
                </div>
              )}
            </motion.div>
            <span
              className={`label mt-1 block whitespace-nowrap text-[7px]! tracking-[0.22em]! transition-colors ${
                focus === i ? "text-leaf" : "text-dim group-hover:text-faint"
              }`}
            >
              {s.sub.toUpperCase()}
            </span>
          </button>
        ))}
      </motion.div>

      {/* ——— overlays ——— */}
      {/* heading */}
      <div className="absolute left-6 top-20 z-20 md:left-12 md:top-24">
        <p className="label mb-3 text-leaf/80 [text-shadow:0_1px_10px_rgba(3,8,5,0.9)]">
          02 · JD-1184 c · SURFACE BIOME {barren ? "· AWAITING TERRAFORM" : "· TERRAFORMING"}
        </p>
        <h2 className="font-display text-[clamp(2rem,4.5vw,3.6rem)] font-light leading-none text-ink [text-shadow:0_2px_22px_rgba(3,8,5,0.95)]">
          The Garden
        </h2>
      </div>

      {/* phase caption */}
      <div className="absolute right-6 top-20 z-20 hidden text-right md:right-12 md:top-24 md:block">
        <p className="label text-[8px]! tracking-[0.28em]! text-leaf/70">
          {phase === "garden"
            ? barren
              ? "SURFACE SURVEY · NOTHING PLANTED YET"
              : "SURFACE SURVEY · LIVE"
            : "INCOMING SEED · TRACKING"}
        </p>
        <p className="label mt-1.5 text-[8px]! text-dim">SOL 1 · 06:12</p>
      </div>

      {/* focused stand intel */}
      <motion.div
        key={focused.key}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: phase === "garden" ? 1 : 0, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute bottom-[7%] left-1/2 z-20 w-[min(92vw,520px)] -translate-x-1/2 border border-hairline bg-[rgba(6,10,7,0.78)] px-6 py-4 text-center backdrop-blur-md"
      >
        <p className="label text-[8px]! tracking-[0.26em]! text-leaf/80">
          {focused.sub.toUpperCase()}
        </p>
        <h3 className="mt-1.5 font-display text-xl font-light text-ink">{focused.title}</h3>
        <p className="mt-2 font-serif text-[0.98rem] italic leading-snug text-faint">
          {focused.note}
        </p>
        <div className="mt-3 flex items-center justify-center gap-4">
          {stands.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setFocus(i)}
              aria-label={`Walk to ${s.title}`}
              className={`h-1.5 w-6 transition-colors ${
                focus === i ? "bg-leaf" : "bg-[rgba(232,230,225,0.18)] hover:bg-leaf/50"
              }`}
            />
          ))}
          <Link
            href="/garden"
            className="label ml-3 text-[8px]! tracking-[0.26em]! text-leaf transition-colors hover:text-ink"
          >
            {barren ? "SURVEY THE GROUND ⟶" : "ENTER THE GARDEN ⟶"}
          </Link>
        </div>
      </motion.div>

      {/* biosphere readout */}
      <div className="absolute bottom-[7%] left-6 z-20 hidden md:block">
        <dl className="space-y-1 font-mono">
          {[
            ["TREES", String(bio.count)],
            ["POINTS", `${bio.points} / 50`],
            ["VEG", `${Math.round(bio.vegetation * 100)}%`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-3">
              <dt className="label text-[7px]! text-dim">{k}</dt>
              <dd className="ml-auto text-xs text-leaf/90">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* species legend */}
      <div className="absolute bottom-[7%] right-6 z-20 hidden text-right md:block">
        {(
          [
            ["spruce", "mind"],
            ["oak", "craft"],
            ["palm", "body"],
            ["acacia", "spirit"],
          ] as [Species, string][]
        ).map(([sp, domain]) => (
          <p key={sp} className="label text-[7px]! tracking-[0.22em]! text-dim">
            {sp.toUpperCase()} · <span className="text-faint">{domain.toUpperCase()}</span>
          </p>
        ))}
      </div>
    </section>
  );
}
