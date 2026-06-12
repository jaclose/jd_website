"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  skills,
  biosphere,
  STAGE_NAMES,
  speciesOf,
  DOMAIN_SPECIES,
  type Species,
} from "@/data/garden";
import TreeGlyph from "@/components/TreeGlyph";
import { unlockVisitor } from "@/lib/visitor";

/**
 * The Garden as a biome. Scrolling down from space, the page lands in a
 * forest: parallax ridgelines, drifting mist, and a cutscene that plays
 * inside a still frame the moment the section enters view — a seed falls,
 * strikes the soil, a sprout unfurls as a projection, and the frame fades
 * into the garden as it actually stands, with survey trails pointing to
 * what grows (or will grow) deeper in the forest.
 */

type Phase = "idle" | "falling" | "landed" | "sprouting" | "garden";

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
      // conifer
      d += `L${x + w * 0.5},${height - h} L${x + w},${height * 0.96} `;
    } else if (kind < 0.85) {
      // broadleaf blob
      d += `L${x + w * 0.15},${height - h * 0.55} Q${x + w * 0.5},${height - h} ${x + w * 0.85},${height - h * 0.55} L${x + w},${height * 0.96} `;
    } else {
      // flat-top acacia
      d += `L${x + w * 0.3},${height - h * 0.8} L${x + w * 0.75},${height - h * 0.8} L${x + w},${height * 0.96} `;
    }
    x += w;
  }
  d += `L${width},${height} Z`;
  return d;
}

const SPECIES_LABEL: Record<Species, string> = {
  spruce: "spruce · mind",
  oak: "oak · craft",
  palm: "palm · body",
  acacia: "acacia · spirit",
};

export default function ForestScene() {
  const bio = biosphere();
  const barren = bio.count === 0;
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const inView = useInView(frame, { once: true, margin: "-25% 0px -25% 0px" });
  const [phase, setPhase] = useState<Phase>("idle");

  // cutscene timeline, armed by scrolling into the section
  useEffect(() => {
    if (!inView || phase !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("garden");
      return;
    }
    const t: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setPhase("falling"), 250),
      setTimeout(() => setPhase("landed"), 1650),
      setTimeout(() => setPhase("sprouting"), 2450),
      setTimeout(() => {
        setPhase("garden");
        unlockVisitor("gardener-eye");
      }, 4600),
    ];
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  // parallax ridges
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start end", "end start"],
  });
  const yFar = useTransform(scrollYProgress, [0, 1], [40, -30]);
  const yMid = useTransform(scrollYProgress, [0, 1], [70, -55]);
  const yNear = useTransform(scrollYProgress, [0, 1], [110, -85]);
  const mistX = useTransform(scrollYProgress, [0, 1], ["-4%", "5%"]);

  // what stands in the garden today + what the trails point to
  const latest = skills.length ? skills[skills.length - 1] : null;
  const others = skills.slice(0, -1).slice(-3);
  const groundY = "76%";

  return (
    <section
      ref={section}
      id="garden"
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #06070b 0%, #07110d 30%, #0a1a12 62%, #08120c 100%)",
      }}
    >
      {/* canopy light from above */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[40vh]"
        style={{
          background:
            "radial-gradient(80% 100% at 50% 0%, rgba(159,206,143,0.08) 0%, transparent 70%)",
        }}
      />

      {/* parallax ridgelines */}
      <motion.svg
        aria-hidden
        className="absolute inset-x-0 bottom-[26%] text-[#0c1812]"
        style={{ y: yFar }}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        height="120"
        width="100%"
      >
        <path d={ridgePath(11, 1440, 120, 0.8)} fill="currentColor" opacity={0.8} />
      </motion.svg>
      <motion.svg
        aria-hidden
        className="absolute inset-x-0 bottom-[18%] text-[#0a130d]"
        style={{ y: yMid }}
        viewBox="0 0 1440 150"
        preserveAspectRatio="none"
        height="150"
        width="100%"
      >
        <path d={ridgePath(47, 1440, 150, 1)} fill="currentColor" opacity={0.92} />
      </motion.svg>
      <motion.svg
        aria-hidden
        className="absolute inset-x-0 bottom-[8%] text-[#070d09]"
        style={{ y: yNear }}
        viewBox="0 0 1440 170"
        preserveAspectRatio="none"
        height="170"
        width="100%"
      >
        <path d={ridgePath(83, 1440, 170, 1.3)} fill="currentColor" />
      </motion.svg>

      {/* drifting mist */}
      <motion.div
        aria-hidden
        className="absolute inset-x-[-10%] bottom-[22%] h-20"
        style={{
          x: mistX,
          background:
            "linear-gradient(90deg, transparent, rgba(186,210,190,0.05) 30%, rgba(186,210,190,0.08) 50%, rgba(186,210,190,0.04) 75%, transparent)",
          filter: "blur(6px)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-24 md:px-10">
        <div className="mb-10 flex items-end justify-between border-b border-[rgba(232,230,225,0.12)] pb-5">
          <div>
            <p className="label mb-3 text-leaf/80">
              JD-1184 c · SURFACE BIOME{" "}
              {barren ? "· AWAITING TERRAFORM" : "· TERRAFORMING"}
            </p>
            <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light leading-none text-ink">
              The Garden
            </h2>
          </div>
          <span className="label hidden !text-[10px] text-dim sm:block">02</span>
        </div>

        {/* ——— the still frame: cutscene, then the garden as it stands ——— */}
        <div
          ref={frame}
          className="relative h-[52vh] min-h-[360px] overflow-hidden border border-[rgba(232,230,225,0.1)]"
          style={{
            background:
              "linear-gradient(180deg, rgba(4,6,10,0.4) 0%, rgba(10,22,16,0.55) 100%)",
          }}
        >
          {/* frame soil */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-[#141a12] to-[#0a0d08]"
            style={{ top: groundY }}
          />
          <div
            className="absolute inset-x-0 h-px bg-[rgba(232,230,225,0.18)]"
            style={{ top: groundY }}
          />

          {/* fireflies */}
          {[18, 38, 57, 74, 88].map((x, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute h-[3px] w-[3px] rounded-full bg-[#d9e8a8]"
              style={{ left: `${x}%`, top: `${30 + (i % 3) * 14}%` }}
              animate={{ opacity: [0, 0.8, 0], y: [-4, -16] }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 1.4,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* the seed falls within the frame */}
          {(phase === "falling" || phase === "landed" || phase === "sprouting") && (
            <motion.span
              aria-hidden
              className="absolute left-1/2 h-4 w-3 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-[#b88d5c]"
              style={{ marginLeft: -6 }}
              initial={{ top: "-6%", rotate: -30 }}
              animate={
                phase === "falling"
                  ? { top: `calc(${groundY} - 13px)`, rotate: 14 }
                  : { top: `calc(${groundY} - 13px)`, rotate: 14, opacity: phase === "sprouting" ? 0 : 1 }
              }
              transition={{
                top: { duration: 1.3, ease: [0.45, 0.02, 0.78, 0.6] },
                rotate: { duration: 1.3 },
                opacity: { duration: 0.5 },
              }}
            />
          )}

          {/* impact */}
          {phase === "landed" && (
            <div className="absolute left-1/2" style={{ top: groundY }}>
              {[-34, -20, -8, 8, 20, 34].map((dx, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute h-1 w-1 rounded-full bg-[#8a7a5c]"
                  initial={{ x: 0, y: 0, opacity: 0.9 }}
                  animate={{ x: dx, y: -12 - Math.abs(dx) * 0.4, opacity: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.03, ease: "easeOut" }}
                />
              ))}
              {[0, 0.16].map((delay, i) => (
                <motion.span
                  key={`r-${i}`}
                  aria-hidden
                  className="absolute rounded-[50%] border border-[#8a7a5c]"
                  style={{ width: 48, height: 12, marginLeft: -24, marginTop: -6 }}
                  initial={{ scale: 0.2, opacity: 0.7 }}
                  animate={{ scale: 2.4 + i, opacity: 0 }}
                  transition={{ duration: 1, delay, ease: "easeOut" }}
                />
              ))}
            </div>
          )}

          {/* the projected sprout unfurls… */}
          {phase === "sprouting" && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2"
              style={{ bottom: `calc(100% - ${groundY})` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <svg width="90" height="84" viewBox="35 106 90 84" aria-hidden>
                <motion.path
                  d="M80 188 C78 170 82 158 80 144"
                  stroke="#6f9c66"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
                <motion.path
                  d="M80 156 Q62 150 60 132"
                  stroke="#6f9c66"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
                />
                <motion.path
                  d="M80 148 Q99 141 101 122"
                  stroke="#6f9c66"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.75, ease: "easeOut" }}
                />
              </svg>
            </motion.div>
          )}

          {/* …then the frame settles on the truth */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "garden" ? 1 : 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          >
            {/* survey trails into the treeline */}
            <svg
              aria-hidden
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 1000 520"
              preserveAspectRatio="none"
            >
              {[
                { d: "M500,396 C580,360 660,330 760,300", o: 0.35 },
                { d: "M500,396 C420,356 330,330 240,316", o: 0.3 },
                { d: "M500,396 C560,388 700,392 850,372", o: 0.25 },
              ].map((t, i) => (
                <path
                  key={i}
                  d={t.d}
                  fill="none"
                  stroke="rgba(159,206,143,0.6)"
                  strokeOpacity={t.o}
                  strokeWidth="1"
                  strokeDasharray="2 7"
                />
              ))}
            </svg>

            {/* what stands at the foreground plot */}
            <div
              className="absolute left-1/2 -translate-x-1/2 text-center"
              style={{ bottom: `calc(100% - ${groundY} - 1px)` }}
            >
              {latest ? (
                <TreeGlyph
                  skill={latest}
                  species={speciesOf(latest)}
                  height={150 + latest.stage * 16}
                  className="mx-auto"
                />
              ) : (
                <TreeGlyph skill={{ id: "first-seed", stage: 0 }} height={110} className="mx-auto" />
              )}
            </div>
            <p
              className="label absolute left-1/2 -translate-x-1/2 text-center !text-[8px] !tracking-[0.26em] text-leaf/90"
              style={{ top: `calc(${groundY} + 18px)` }}
            >
              {latest
                ? `${latest.name.toUpperCase()} · ${STAGE_NAMES[latest.stage].toUpperCase()}`
                : "PLOT 01 · UNSOWN — THE FIRST SEED, RESTING"}
            </p>

            {/* what the trails reach — deeper in the forest */}
            {(latest ? others : [1, 2, 3]).map((item, i) => {
              const pos = [
                { left: "73%", bottom: "44%", h: 64 },
                { left: "21%", bottom: "41%", h: 56 },
                { left: "84%", bottom: "30%", h: 48 },
              ][i];
              if (!pos) return null;
              const isSkill = typeof item !== "number";
              const stage = (isSkill ? item.stage : item + 1) as 0 | 1 | 2 | 3 | 4 | 5;
              const label = isSkill
                ? `${item.name} · ${STAGE_NAMES[item.stage]}`
                : `projection · ${STAGE_NAMES[stage]}`;
              return (
                <div
                  key={i}
                  className="absolute -translate-x-1/2 text-center"
                  style={{ left: pos.left, bottom: pos.bottom }}
                >
                  <TreeGlyph
                    skill={isSkill ? item : { id: `proj-${i}`, stage }}
                    species={
                      isSkill
                        ? speciesOf(item)
                        : (["spruce", "oak", "acacia"] as Species[])[i]
                    }
                    ghost={!isSkill}
                    height={pos.h}
                    className="mx-auto opacity-80"
                  />
                  <span className="label mt-1 block whitespace-nowrap !text-[7px] !tracking-[0.2em] text-dim">
                    {label.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </motion.div>

          {/* frame captions */}
          <div className="absolute left-4 top-3.5 flex w-[calc(100%-2rem)] items-baseline justify-between">
            <span className="label !text-[8px] !tracking-[0.28em] text-leaf/70">
              {phase === "garden"
                ? barren
                  ? "SURFACE SURVEY · NOTHING PLANTED YET"
                  : "SURFACE SURVEY · LIVE"
                : phase === "sprouting"
                  ? "PROJECTION · WHAT A SEED BECOMES"
                  : "INCOMING SEED · TRACKING"}
            </span>
            <span className="label !text-[8px] text-dim">SOL 1 · 06:12</span>
          </div>
        </div>

        {/* ——— species legend ——— */}
        <div className="mt-10 grid grid-cols-2 gap-6 border border-[rgba(232,230,225,0.07)] px-6 py-6 sm:grid-cols-4">
          {(Object.keys(SPECIES_LABEL) as Species[]).map((sp) => (
            <div key={sp} className="flex items-end gap-3">
              <TreeGlyph
                skill={{ id: `legend-${sp}`, stage: 4 }}
                species={sp}
                ghost
                height={52}
              />
              <span className="label pb-1 !text-[8px] !tracking-[0.22em] text-faint">
                {SPECIES_LABEL[sp].toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* ——— biosphere strip + door ——— */}
        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <dl className="grid grid-cols-2 gap-x-10 gap-y-3 font-mono sm:grid-cols-4">
            {[
              ["TREES", String(bio.count)],
              ["POINTS", `${bio.points} / 50`],
              ["VEGETATION", `${Math.round(bio.vegetation * 100)}%`],
              ["HYDROSPHERE", `${Math.round(bio.water * 100)}%`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label !text-[8px] text-dim">{k}</dt>
                <dd className="mt-1 text-sm text-starlight">{v}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/garden"
            className="label inline-flex items-center gap-3 !text-[11px] !tracking-[0.3em] text-leaf transition-colors hover:text-ink"
          >
            {barren ? "SURVEY THE GROUND" : "ENTER THE GARDEN"} <span aria-hidden>⟶</span>
          </Link>
        </div>

        <p className="label mt-6 !text-[8px] !tracking-[0.24em] text-dim">
          {barren
            ? "EVERY SKILL PLANTED HERE GROWS THROUGH SIX STAGES — AT 15 POINTS THE PLANET GREENS, AT 50 THE SEAS CONDENSE · "
            : "THE PLANET KEEPS THE SCORE · "}
          DOMAIN DECIDES THE SPECIES — {Object.values(DOMAIN_SPECIES).join(" · ").toUpperCase()}
        </p>
      </div>
    </section>
  );
}
