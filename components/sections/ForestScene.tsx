"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { skills, biosphere, STAGE_NAMES, speciesOf } from "@/data/garden";
import { WAYPOINTS, type WalkState } from "@/components/garden/ForestCanvas";
import { unlockVisitor } from "@/lib/visitor";

const ForestCanvas = dynamic(() => import("@/components/garden/ForestCanvas"), {
  ssr: false,
});

/**
 * The Garden as a field expedition. A real 3D forest fills the viewport —
 * trunks, roots, fog, god-rays — and the camera walks the trail between
 * survey stands like a biologist on rounds. The HUD reads like a
 * biosphere-viability survey: specimen reports, vitals, a route tracker.
 */

interface Specimen {
  designation: string;
  title: string;
  vitals: [string, string][];
  note: string;
}

function buildSpecimens(): Specimen[] {
  if (skills.length >= 3) {
    return skills.slice(-3).map((s, i) => ({
      designation: `SPECIMEN 0${i + 1} · ${speciesOf(s).toUpperCase()}`,
      title: s.name,
      vitals: [
        ["STAGE", `${s.stage}/5 — ${STAGE_NAMES[s.stage]}`],
        ["DOMAIN", s.domain],
        ["PLANTED", s.planted],
      ],
      note: s.note,
    }));
  }
  return [
    {
      designation: "SPECIMEN 01 · BROADLEAF",
      title: "The Near Stand",
      vitals: [
        ["CANOPY", "62% closure"],
        ["ROOTS", "anchored, exposed flare"],
        ["VIABILITY", "high — awaiting assignment"],
      ],
      note: "Healthy growth at the trailhead. When the first skill is planted, its record begins here.",
    },
    {
      designation: "SPECIMEN 02 · CONIFER",
      title: "The Middle Watch",
      vitals: [
        ["CANOPY", "five-tier bough structure"],
        ["SOIL", "moss-rich, well drained"],
        ["VIABILITY", "high — evergreen candidate"],
      ],
      note: "Holds its needles year-round — the survey recommends it for disciplines of the mind.",
    },
    {
      designation: "SPECIMEN 03 · ELDER",
      title: "The Elder at the Bend",
      vitals: [
        ["AGE CLASS", "old growth"],
        ["ROOT SPREAD", "6 buttresses, half-buried"],
        ["VIABILITY", "proven — the standard to grow toward"],
      ],
      note: "The largest organism on the route. Every planted skill is measured against this canopy.",
    },
  ];
}

export default function ForestScene() {
  const bio = biosphere();
  const barren = bio.count === 0;
  const specimens = useMemo(buildSpecimens, []);
  const section = useRef<HTMLElement>(null);
  const near = useInView(section, { margin: "200px 0px 200px 0px" });
  const entered = useInView(section, { once: true, margin: "-30% 0px -30% 0px" });
  const walk = useRef<WalkState>({ target: 0, current: 0 }).current;
  const [stop, setStop] = useState(0);
  const [begun, setBegun] = useState(false);

  // when the section first enters, begin the walk to the first stand
  useEffect(() => {
    if (entered && !begun) {
      setBegun(true);
      walk.target = WAYPOINTS[0];
      unlockVisitor("gardener-eye");
    }
  }, [entered, begun, walk]);

  const goTo = (i: number) => {
    const idx = Math.max(0, Math.min(specimens.length - 1, i));
    setStop(idx);
    walk.target = WAYPOINTS[idx];
    if (idx === specimens.length - 1) unlockVisitor("wanderer");
  };
  // clicking the forest itself walks you onward down the trail
  const advance = () => goTo((stop + 1) % specimens.length);

  return (
    <section ref={section} id="garden" className="biome-forest relative min-h-svh overflow-hidden">
      {/* the forest itself — click it to walk on */}
      <div className="absolute inset-0">
        {begun && <ForestCanvas walk={walk} active={near} onAdvance={advance} />}
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
          CLICK THE TRAIL TO WALK ON ↡
        </p>
      </div>

      {/* survey corner brackets */}
      {["left-4 top-20 border-l border-t", "right-4 top-20 border-r border-t", "left-4 bottom-4 border-l border-b", "right-4 bottom-4 border-r border-b"].map(
        (pos) => (
          <span
            key={pos}
            aria-hidden
            className={`pointer-events-none absolute z-20 h-5 w-5 border-leaf/40 ${pos}`}
          />
        )
      )}

      {/* route tracker, top right */}
      <div className="absolute right-6 top-24 z-20 hidden text-right md:right-12 md:block">
        <p className="label text-[8px]! tracking-[0.28em]! text-leaf/70">
          ROUTE {String(stop + 1).padStart(2, "0")} / {String(specimens.length).padStart(2, "0")} ·{" "}
          {barren ? "NOTHING PLANTED YET" : "LIVE RECORDS"}
        </p>
        <p className="label mt-1.5 text-[8px]! text-dim">
          TRAIL CONDITION NOMINAL · FOG LIGHT
        </p>
      </div>

      {/* specimen report */}
      <motion.div
        key={stop}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: begun ? 1 : 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="absolute bottom-16 left-1/2 z-20 w-[min(92vw,520px)] -translate-x-1/2 border border-hairline bg-[rgba(5,10,7,0.82)] backdrop-blur-md"
      >
        <div className="flex items-baseline justify-between border-b border-[rgba(232,230,225,0.08)] px-5 py-2.5">
          <span className="label text-[8px]! tracking-[0.26em]! text-leaf/80">
            {specimens[stop].designation}
          </span>
          <span className="label text-[7px]! text-dim">FIELD REPORT</span>
        </div>
        <div className="px-5 py-4">
          <h3 className="font-display text-xl font-light text-ink">
            {specimens[stop].title}
          </h3>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            {specimens[stop].vitals.map(([k, v]) => (
              <div key={k}>
                <dt className="label text-[7px]! text-dim">{k}</dt>
                <dd className="mt-0.5 font-mono text-[0.68rem] text-leaf/90">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 font-serif text-[0.98rem] italic leading-snug text-faint">
            {specimens[stop].note}
          </p>
        </div>
      </motion.div>

      {/* walk controls */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-5">
        <button
          type="button"
          onClick={() => goTo(stop - 1)}
          disabled={stop === 0}
          aria-label="Walk back"
          className="label text-[9px]! tracking-[0.3em]! text-dim transition-colors hover:text-leaf disabled:opacity-25"
        >
          ⟵ BACK
        </button>
        {specimens.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Walk to stand ${i + 1}`}
            className={`h-1.5 w-7 transition-colors ${
              stop === i ? "bg-leaf" : "bg-[rgba(232,230,225,0.18)] hover:bg-leaf/50"
            }`}
          />
        ))}
        <button
          type="button"
          onClick={() => goTo(stop + 1)}
          disabled={stop === specimens.length - 1}
          aria-label="Walk on"
          className="label text-[9px]! tracking-[0.3em]! text-leaf transition-colors hover:text-ink disabled:opacity-25"
        >
          WALK ON ⟶
        </button>
      </div>

      {/* biosphere strip + door */}
      <div className="absolute bottom-16 left-6 z-20 hidden md:block">
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
      <div className="absolute bottom-16 right-6 z-20 hidden md:block">
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
