"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { skills, STAGE_NAMES, type Skill } from "@/data/garden";
import TreeGlyph from "@/components/TreeGlyph";
import { dispatchDate } from "@/lib/content";

/**
 * The rows. Vertical scroll walks the camera sideways through the garden —
 * the next plots are visible in the distance before you reach them.
 * While nothing is planted, the walk surveys the projected plots: what
 * each growth stage will look like when the first skills take root.
 */

const STAGE_NOTES = [
  "A pursuit named, and nothing more. The hardest stage — it asks only to be begun.",
  "First green. A habit held for weeks against the wind.",
  "Structure forms. Months of practice you can lean on.",
  "First fruit — the work starts teaching someone besides you.",
  "A full canopy. Counted on in every season.",
  "It blossoms. The tree gives more than it takes.",
];

interface Plot {
  key: string;
  glyph: { id: string; stage: 0 | 1 | 2 | 3 | 4 | 5 };
  ghost: boolean;
  kicker: string;
  title: string;
  sub?: string;
  note: string;
  stage: number;
}

function buildPlots(): Plot[] {
  if (skills.length > 0) {
    return skills.map((s: Skill, i) => ({
      key: s.id,
      glyph: { id: s.id, stage: s.stage },
      ghost: false,
      kicker: `PLOT ${String(i + 1).padStart(2, "0")} · ${STAGE_NAMES[s.stage].toUpperCase()} · ${s.domain.toUpperCase()}`,
      title: s.name,
      sub: `PLANTED ${dispatchDate(s.planted)}`,
      note: s.note,
      stage: s.stage,
    }));
  }
  // barren: the unsown first plot, then the five projected stages
  return [
    {
      key: "unsown",
      glyph: { id: "first-seed", stage: 0 },
      ghost: false,
      kicker: "PLOT 01 · UNSOWN",
      title: "The First Seed",
      sub: "AWAITING A NAME",
      note: "It landed today. What it becomes depends entirely on the work that follows.",
      stage: 0,
    },
    ...([1, 2, 3, 4, 5] as const).map((stage) => ({
      key: `stage-${stage}`,
      glyph: { id: "projection", stage },
      ghost: true,
      kicker: `PROJECTION · STAGE ${stage} OF 5`,
      title: STAGE_NAMES[stage]
        .split(" ")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" "),
      sub: "NOT YET GROWN",
      note: STAGE_NOTES[stage],
      stage,
    })),
  ];
}

export default function GardenGallery() {
  const track = useRef<HTMLDivElement>(null);
  const plots = buildPlots();
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${(plots.length - 1) * 100}%`]);
  const xBg = useTransform(scrollYProgress, [0, 1], ["0%", `-${(plots.length - 1) * 88}%`]);

  return (
    <section ref={track} className="relative" style={{ height: `${plots.length * 90}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        {/* distant treeline, drifting slower — what's coming next */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-[34%] left-[16vw] flex items-end opacity-[0.13] blur-[1.5px]"
          style={{ x: xBg }}
        >
          {plots.map((p) => (
            <div key={`bg-${p.key}`} className="flex w-[60vw] shrink-0 justify-center md:w-[36vw]">
              <TreeGlyph skill={p.glyph} ghost={p.ghost} height={120 + p.stage * 16} />
            </div>
          ))}
        </motion.div>

        {/* the row being walked */}
        <motion.div className="flex items-stretch" style={{ x }}>
          {plots.map((p, i) => (
            <article
              key={p.key}
              className="flex w-screen shrink-0 items-center justify-center px-8"
            >
              <div className="grid w-full max-w-3xl items-end gap-8 md:grid-cols-[auto_1fr] md:gap-14">
                <TreeGlyph
                  skill={p.glyph}
                  ghost={p.ghost}
                  height={210 + p.stage * 22}
                  className="mx-auto"
                />
                <div className="pb-4 text-center md:text-left">
                  <p className="label text-[9px]! text-leaf/80">{p.kicker}</p>
                  <h2
                    className={`mt-3 font-display text-[clamp(2rem,5vw,3.4rem)] font-light leading-none ${
                      p.ghost ? "text-faint" : "text-ink"
                    }`}
                  >
                    {p.title}
                  </h2>
                  {p.sub && (
                    <p className="label mt-4 text-[9px]! text-dim">{p.sub}</p>
                  )}
                  <p className="mt-5 max-w-md font-serif text-lg italic leading-relaxed text-faint">
                    {p.note}
                  </p>
                  {/* growth meter */}
                  <div className="mt-6 flex items-center justify-center gap-1.5 md:justify-start">
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={`h-1 w-7 ${
                          n <= p.stage && !p.ghost
                            ? "bg-leaf"
                            : n <= p.stage
                              ? "bg-leaf/35"
                              : "bg-hairline"
                        }`}
                      />
                    ))}
                    <span className="label ml-3 text-[8px]! text-dim">
                      STAGE {p.stage} / 5
                    </span>
                  </div>
                  {i === 0 && skills.length === 0 && (
                    <p className="label mt-7 text-[8px]! tracking-[0.24em]! text-dim">
                      WHEN A SKILL IS PLANTED, IT GROWS HERE — AND THE PLANET GREENS
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </motion.div>

        {/* ground line across the whole frame */}
        <div aria-hidden className="absolute inset-x-0 bottom-[30%] h-px bg-[rgba(232,230,225,0.14)]" />

        {/* progress */}
        <div className="absolute bottom-10 left-1/2 w-44 -translate-x-1/2">
          <div className="h-px bg-[rgba(232,230,225,0.15)]">
            <motion.div
              className="h-px origin-left bg-leaf"
              style={{ scaleX: scrollYProgress }}
            />
          </div>
          <p className="label mt-3 text-center text-[8px]! text-dim">
            {skills.length > 0
              ? `WALKING THE ROWS · ${plots.length} PLOTS`
              : `SURVEYING PROJECTED PLOTS · ${plots.length} FRAMES`}
          </p>
        </div>
      </div>
    </section>
  );
}
