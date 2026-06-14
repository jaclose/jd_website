"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { biosphere, STAGE_NAMES, DOMAIN_SPECIES } from "@/data/garden";
import { DOMAINS, domainSkills, type WalkState } from "@/components/garden/ForestCanvas";
import { unlockVisitor } from "@/lib/visitor";

const ForestCanvas = dynamic(() => import("@/components/garden/ForestCanvas"), {
  ssr: false,
});

/** the feel of each domain's grove, written into the survey notes */
const DOMAIN_FEEL: Record<string, { weather: string; note: string }> = {
  mind: {
    weather: "snow-dusted · evergreen",
    note: "The northern stand. Spruce holds its needles through every winter of study — disciplines of the mind grow here.",
  },
  craft: {
    weather: "autumn · broad canopy",
    note: "The oak grove. Load-bearing and slow — the crafts that one day shade whoever comes after.",
  },
  body: {
    weather: "coastal · storm-bent",
    note: "The palm line. Flexible where others snap — the practices of the body, bent but never broken.",
  },
  spirit: {
    weather: "golden · deep-rooted",
    note: "The acacia stand. Roots that reach water far below — the things of the spirit, oldest in the garden.",
  },
};

export default function ForestScene() {
  const bio = biosphere();
  const barren = bio.count === 0;
  const section = useRef<HTMLElement>(null);
  const near = useInView(section, { margin: "200px 0px 200px 0px" });
  const entered = useInView(section, { once: true, margin: "-30% 0px -30% 0px" });
  const walk = useRef<WalkState>({ route: 0, target: 0, current: 0 }).current;
  const [domain, setDomain] = useState(-1); // -1 = clearing, 0..3 = a grove
  const [begun, setBegun] = useState(false);

  useEffect(() => {
    if (entered && !begun) {
      setBegun(true);
      unlockVisitor("gardener-eye");
    }
  }, [entered, begun]);

  const select = (i: number) => {
    setDomain(i);
    walk.route = i;
    walk.target = 1;
    unlockVisitor("wanderer");
  };
  const returnToClearing = () => {
    setDomain(-1);
    walk.target = 0;
  };

  const current = domain >= 0 ? DOMAINS[domain] : null;
  const grovePlanted = current ? domainSkills(current.id) : [];

  return (
    <section ref={section} id="garden" className="biome-forest relative min-h-svh overflow-hidden">
      {/* the forest itself — click a trail to walk it, open ground to return */}
      <div className="absolute inset-0">
        {begun && <ForestCanvas walk={walk} active={near} onSelect={select} onReturn={returnToClearing} />}
      </div>

      {/* survey vignette */}
      <div aria-hidden className="forest-vignette pointer-events-none absolute inset-0" />

      {/* heading */}
      <div className="pointer-events-none absolute left-6 top-24 z-20 md:left-12">
        <p className="label mb-3 text-leaf/80 [text-shadow:0_1px_10px_rgba(3,8,5,0.9)]">
          02 · JD-1184 c · BIOSPHERE VIABILITY SURVEY
        </p>
        <h2 className="font-display text-[clamp(2rem,4.5vw,3.6rem)] font-light leading-none text-ink [text-shadow:0_2px_22px_rgba(3,8,5,0.95)]">
          The Garden
        </h2>
        <p className="label mt-3 text-[8px]! tracking-[0.26em]! text-leaf/60 [text-shadow:0_1px_8px_rgba(3,8,5,0.9)]">
          {current ? `WALKING THE ${current.label.toUpperCase()} TRAIL` : "FOUR TRAILS DIVERGE · CLICK ONE TO WALK IT"}
        </p>
      </div>

      {/* survey corner brackets */}
      {["left-4 top-20 border-l border-t", "right-4 top-20 border-r border-t", "left-4 bottom-4 border-l border-b", "right-4 bottom-4 border-r border-b"].map(
        (pos) => (
          <span key={pos} aria-hidden className={`pointer-events-none absolute z-20 h-5 w-5 border-leaf/40 ${pos}`} />
        )
      )}

      {/* route tracker, top right */}
      <div className="absolute right-6 top-24 z-20 hidden text-right md:right-12 md:block">
        <p className="label text-[8px]! tracking-[0.28em]! text-leaf/70">
          {current ? `GROVE · ${DOMAIN_SPECIES[current.id].toUpperCase()}` : "TRAILHEAD · THE CLEARING"}
        </p>
        <p className="label mt-1.5 text-[8px]! text-dim">{current ? DOMAIN_FEEL[current.id].weather.toUpperCase() : "FOG LIGHT · NOMINAL"}</p>
      </div>

      {/* survey panel — the clearing's four paths, or the current grove */}
      <AnimatePresence mode="wait">
        <motion.div
          key={domain}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: begun ? 1 : 0, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-20 left-1/2 z-20 w-[min(94vw,560px)] -translate-x-1/2 border border-hairline bg-[rgba(5,10,7,0.84)] backdrop-blur-md"
        >
          {current ? (
            <>
              <div className="flex items-baseline justify-between border-b border-[rgba(232,230,225,0.08)] px-5 py-2.5">
                <span className="label text-[8px]! tracking-[0.26em]! text-leaf/80">
                  THE {current.label.toUpperCase()} GROVE · {DOMAIN_SPECIES[current.id].toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={returnToClearing}
                  className="label text-[8px]! tracking-[0.24em]! text-dim transition-colors hover:text-leaf"
                >
                  ⟵ CLEARING
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="font-serif text-[0.98rem] italic leading-snug text-faint">
                  {DOMAIN_FEEL[current.id].note}
                </p>
                {grovePlanted.length ? (
                  <ul className="mt-3 space-y-1.5">
                    {grovePlanted.map((s) => (
                      <li key={s.id} className="flex items-baseline justify-between gap-3 font-mono text-[0.72rem]">
                        <span className="truncate text-ink">{s.name}</span>
                        <span className="shrink-0 text-leaf/80">
                          {STAGE_NAMES[s.stage]} · {s.stage}/5
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="label mt-3 text-[8px]! tracking-[0.22em]! text-dim">
                    NOTHING PLANTED HERE YET · FAINT PROJECTIONS SHOWN · PLANT A {DOMAIN_SPECIES[current.id].toUpperCase()} IN data/garden.ts
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between border-b border-[rgba(232,230,225,0.08)] px-5 py-2.5">
                <span className="label text-[8px]! tracking-[0.26em]! text-leaf/80">FOUR DOMAINS OF LIFE</span>
                <span className="label text-[7px]! text-dim">CHOOSE A PATH</span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-[rgba(232,230,225,0.06)] sm:grid-cols-4">
                {DOMAINS.map((d, i) => {
                  const n = domainSkills(d.id).length;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => select(i)}
                      className="group flex flex-col items-center gap-1 bg-[rgba(5,10,7,0.6)] px-3 py-3.5 text-center transition-colors hover:bg-[rgba(10,18,12,0.9)]"
                    >
                      <span
                        aria-hidden
                        className="mb-1 h-2.5 w-2.5 rounded-full"
                        style={{ background: d.sign }}
                      />
                      <span className="label text-[9px]! tracking-[0.2em]! text-ink transition-colors group-hover:text-leaf">
                        {d.label.toUpperCase()}
                      </span>
                      <span className="label text-[7px]! tracking-[0.14em]! text-dim">
                        {DOMAIN_SPECIES[d.id].toUpperCase()}
                      </span>
                      <span className="label text-[7px]! text-leaf/70">
                        {n ? `${n} PLANTED` : "UNSOWN"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* domain selector dots */}
      <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4">
        <button
          type="button"
          onClick={returnToClearing}
          aria-label="Return to the clearing"
          className={`label text-[8px]! tracking-[0.28em]! transition-colors ${
            domain < 0 ? "text-leaf" : "text-dim hover:text-leaf"
          }`}
        >
          CLEARING
        </button>
        {DOMAINS.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => select(i)}
            aria-label={`Walk the ${d.label} trail`}
            className={`h-1.5 w-6 transition-colors ${
              domain === i ? "bg-leaf" : "bg-[rgba(232,230,225,0.18)] hover:bg-leaf/50"
            }`}
          />
        ))}
      </div>

      {/* biosphere strip + door */}
      <div className="absolute bottom-20 left-6 z-20 hidden md:block">
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
      <div className="absolute bottom-20 right-6 z-20 hidden md:block">
        <Link
          href="/garden"
          className="label text-[8px]! tracking-[0.26em]! text-leaf transition-colors hover:text-ink"
        >
          {barren ? "FULL SURVEY ⟶" : "ENTER THE GARDEN ⟶"}
        </Link>
      </div>
    </section>
  );
}
