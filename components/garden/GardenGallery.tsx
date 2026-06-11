"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { skills, STAGE_NAMES } from "@/data/garden";
import TreeGlyph from "@/components/TreeGlyph";
import { dispatchDate } from "@/lib/content";

/**
 * The rows. Vertical scroll walks the camera sideways through the garden —
 * the next trees are visible in the distance before you reach them.
 */
export default function GardenGallery() {
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });

  // each plot is ~76vw on mobile, ~44vw on desktop; CSS handles the width,
  // we just slide the full row left by (n-1) plots
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${(skills.length - 1) * 100}%`]);
  const xBg = useTransform(scrollYProgress, [0, 1], ["0%", `-${(skills.length - 1) * 88}%`]);

  return (
    <section ref={track} className="relative" style={{ height: `${skills.length * 90}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        {/* distant treeline, drifting slower — what's coming next */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-[34%] left-[16vw] flex items-end opacity-[0.13] blur-[1.5px]"
          style={{ x: xBg }}
        >
          {skills.map((s) => (
            <div key={`bg-${s.id}`} className="flex w-[60vw] shrink-0 justify-center md:w-[36vw]">
              <TreeGlyph skill={s} height={120 + s.stage * 16} />
            </div>
          ))}
        </motion.div>

        {/* the row being walked */}
        <motion.div className="flex items-stretch" style={{ x }}>
          {skills.map((s, i) => (
            <article
              key={s.id}
              className="flex w-screen shrink-0 items-center justify-center px-8"
            >
              <div className="grid w-full max-w-3xl items-end gap-8 md:grid-cols-[auto_1fr] md:gap-14">
                <TreeGlyph skill={s} height={210 + s.stage * 22} className="mx-auto" />
                <div className="pb-4 text-center md:text-left">
                  <p className="label !text-[9px] text-leaf/80">
                    PLOT {String(i + 1).padStart(2, "0")} ·{" "}
                    {STAGE_NAMES[s.stage].toUpperCase()} · {s.domain.toUpperCase()}
                  </p>
                  <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.4rem)] font-light leading-none text-ink">
                    {s.name}
                  </h2>
                  <p className="label mt-4 !text-[9px] text-dim">
                    PLANTED {dispatchDate(s.planted)}
                  </p>
                  <p className="mt-5 max-w-md font-serif text-lg italic leading-relaxed text-faint">
                    {s.note}
                  </p>
                  {/* growth meter */}
                  <div className="mt-6 flex items-center justify-center gap-1.5 md:justify-start">
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={`h-1 w-7 ${
                          n <= s.stage ? "bg-leaf" : "bg-[rgba(232,230,225,0.12)]"
                        }`}
                      />
                    ))}
                    <span className="label ml-3 !text-[8px] text-dim">
                      STAGE {s.stage} / 5
                    </span>
                  </div>
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
          <p className="label mt-3 text-center !text-[8px] text-dim">
            WALKING THE ROWS · {skills.length} PLOTS
          </p>
        </div>
      </div>
    </section>
  );
}
