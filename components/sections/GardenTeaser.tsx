import Link from "next/link";
import { skills, biosphere, STAGE_NAMES } from "@/data/garden";
import TreeGlyph from "@/components/TreeGlyph";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";

export default function GardenTeaser() {
  const bio = biosphere();
  const barren = bio.count === 0;

  return (
    <section id="garden" className="mx-auto max-w-6xl px-6 py-28 md:px-10">
      <Reveal>
        <SectionHeading
          index="02"
          designation={
            barren
              ? "JD-1184 c · TERRESTRIAL, AWAITING TERRAFORM"
              : "JD-1184 c · TERRESTRIAL, TERRAFORMING"
          }
          title="The Garden"
        />
      </Reveal>

      {barren ? (
        <>
          {/* the prepared ground — one seed waits at the first plot */}
          <Reveal>
            <div className="relative flex h-[230px] items-end justify-center border-b border-[rgba(232,230,225,0.14)]">
              <span className="label absolute left-0 top-2 !text-[8px] text-dim">
                SURFACE SURVEY · REGOLITH
              </span>
              <div className="relative text-center">
                <TreeGlyph skill={{ id: "first-seed", stage: 0 }} height={130} />
                <span className="label absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap !text-[8px] text-dim">
                  PLOT 01 · UNSOWN
                </span>
              </div>
              <span className="label absolute right-0 top-2 !text-[8px] text-dim">
                BIOSPHERE 0 PTS
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-20 grid gap-12 md:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="max-w-xl font-serif text-2xl leading-relaxed text-[rgba(232,230,225,0.85)]">
                  The ground is prepared. <em>Nothing has been planted yet.</em>
                </p>
                <p className="mt-5 max-w-xl font-serif text-lg leading-relaxed text-faint">
                  Every skill will be a tree here. As each one deepens it grows
                  through six stages — and the planet overhead keeps the score.
                  At fifteen growth points the green shows from orbit. At
                  fifty, the first seas condense.
                </p>
                <Link
                  href="/garden"
                  className="label mt-9 inline-flex items-center gap-3 !text-[11px] !tracking-[0.3em] text-leaf transition-colors hover:text-ink"
                >
                  SURVEY THE GROUND <span aria-hidden>⟶</span>
                </Link>
              </div>
              <dl className="grid grid-cols-2 content-start gap-x-12 gap-y-5 font-mono md:grid-cols-1">
                {[
                  ["TREES PLANTED", "0"],
                  ["GROWTH POINTS", "0 / 50"],
                  ["VEGETATION", "0%"],
                  ["HYDROSPHERE", "0%"],
                  ["STATUS", "AWAITING FIRST SEED"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-4">
                    <dt className="label !text-[8px] text-dim">{k}</dt>
                    <dd className="ml-auto text-sm text-starlight">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          {/* what will grow — the six stages, surveyed in ghost lines */}
          <Reveal delay={0.15}>
            <div className="mt-24">
              <p className="label mb-8 !text-[9px] text-dim">
                PROJECTED GROWTH · STAGES 0–5
              </p>
              <div className="grid grid-cols-3 gap-y-10 border border-[rgba(232,230,225,0.07)] px-4 py-10 sm:grid-cols-6">
                {STAGE_NAMES.map((name, stage) => (
                  <div key={name} className="text-center">
                    <TreeGlyph
                      skill={{ id: "projection", stage: stage as 0 | 1 | 2 | 3 | 4 | 5 }}
                      height={86 + stage * 8}
                      ghost
                      className="mx-auto"
                    />
                    <span className="label mt-3 block !text-[7px] !tracking-[0.22em] text-dim">
                      {stage} · {name.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </>
      ) : (
        <>
          <Reveal>
            {/* the forest so far, standing in a row */}
            <div className="flex items-end justify-center gap-1 overflow-x-auto border-b border-[rgba(232,230,225,0.14)] pb-0 md:gap-3">
              {skills.map((s) => (
                <div key={s.id} className="group relative shrink-0 text-center">
                  <TreeGlyph skill={s} height={120 + s.stage * 14} />
                  <span className="label pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap !text-[8px] text-dim opacity-0 transition-opacity group-hover:opacity-100">
                    {s.name} · {STAGE_NAMES[s.stage]}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-16 grid gap-10 md:grid-cols-[1fr_auto]">
              <div>
                <p className="max-w-xl font-serif text-xl leading-relaxed text-[rgba(232,230,225,0.8)]">
                  Every skill is a tree. As the work deepens, the trees grow —
                  and the planet above changes with them. Fifteen growth points
                  and the green shows from orbit. Fifty, and the first seas
                  condense.
                </p>
                <Link
                  href="/garden"
                  className="label mt-8 inline-flex items-center gap-3 !text-[11px] !tracking-[0.3em] text-leaf transition-colors hover:text-ink"
                >
                  ENTER THE GARDEN <span aria-hidden>⟶</span>
                </Link>
              </div>
              <dl className="grid grid-cols-2 content-start gap-x-12 gap-y-5 font-mono md:grid-cols-1">
                {[
                  ["TREES PLANTED", String(bio.count)],
                  ["FULLY GROWN", String(bio.grown)],
                  ["GROWTH POINTS", `${bio.points} / 50`],
                  ["VEGETATION", `${Math.round(bio.vegetation * 100)}%`],
                  ["HYDROSPHERE", `${Math.round(bio.water * 100)}%`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-4">
                    <dt className="label !text-[8px] text-dim">{k}</dt>
                    <dd className="ml-auto text-sm text-starlight">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </>
      )}
    </section>
  );
}
