import Link from "next/link";
import { skills, biosphere, STAGE_NAMES } from "@/data/garden";
import TreeGlyph from "@/components/TreeGlyph";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";

export default function GardenTeaser() {
  const bio = biosphere();
  return (
    <section id="garden" className="mx-auto max-w-6xl px-6 py-28 md:px-10">
      <Reveal>
        <SectionHeading
          index="02"
          designation="JD-1184 c · TERRESTRIAL, TERRAFORMING"
          title="The Garden"
        />
      </Reveal>

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
              Every skill is a tree. As the work deepens, the trees grow — and
              the planet above changes with them. Fifteen growth points and the
              green shows from orbit. Fifty, and the first seas condense.
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
    </section>
  );
}
