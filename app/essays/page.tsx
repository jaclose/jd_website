import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { essays, dispatchDate, readingTime } from "@/lib/content";
import { essayMeta, essayHighlights } from "@/data/meta";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import FallbackCover from "@/components/FallbackCover";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Essays — Jafar Dabbagh",
  description: "Long-form thought from the JD-1184 system.",
};

export default function EssaysPage() {
  const [lead, ...rest] = essays;
  const leadMeta = essayMeta[lead.slug];

  return (
    <>
      <SiteHeader current="essays" />
      <main className="mx-auto max-w-6xl px-6 pb-28 pt-36 md:px-10">
        <Reveal>
          <p className="label mb-4 text-starlight/70">
            JD-1184 b · GAS GIANT · {essays.length} TRANSMISSIONS
          </p>
          <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-light leading-none text-ink">
            Essays
          </h1>
          <p className="mt-6 max-w-xl font-serif text-xl italic leading-relaxed text-faint">
            Long-form thought. The three most recent orbit the hero as moons.
          </p>
        </Reveal>

        {/* lead transmission — full spread */}
        <Reveal>
          <Link
            href={`/essays/${lead.slug}`}
            className="group mt-20 grid gap-8 border-b border-[rgba(232,230,225,0.08)] pb-16 md:grid-cols-2 md:items-center md:gap-14"
          >
            <div
              className={`relative overflow-hidden ${
                leadMeta?.aspect === "portrait"
                  ? "aspect-[3/4] md:max-h-[560px]"
                  : leadMeta?.aspect === "square"
                    ? "aspect-square"
                    : "aspect-[3/2]"
              }`}
            >
              {leadMeta ? (
                <Image
                  src={leadMeta.cover}
                  alt={leadMeta.alt}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
              ) : (
                <FallbackCover title={lead.title} index="01" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-space/60 to-transparent" />
            </div>
            <div>
              <p className="label !text-[10px] text-dim">
                01 · {dispatchDate(lead.date)} · {readingTime(lead.words)}
              </p>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3rem)] font-light leading-[1.08] text-ink transition-colors duration-300 group-hover:text-starlight">
                {lead.title}
              </h2>
              {leadMeta && (
                <p className="mt-6 border-l border-starlight/50 pl-5 font-serif text-xl italic leading-relaxed text-[rgba(232,230,225,0.75)]">
                  “{leadMeta.highlight}”
                </p>
              )}
              <span className="label mt-8 inline-flex items-center gap-3 !text-[10px] text-starlight">
                READ <span aria-hidden>⟶</span>
              </span>
            </div>
          </Link>
        </Reveal>

        {/* the rest of the orbit */}
        <div className="mt-16 grid gap-x-10 gap-y-16 sm:grid-cols-2">
          {rest.map((e, i) => {
            const m = essayMeta[e.slug];
            const highlight = m?.highlight ?? essayHighlights[e.slug];
            return (
              <Reveal key={e.slug} delay={(i % 2) * 0.08}>
                <Link href={`/essays/${e.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {m ? (
                      <Image
                        src={m.cover}
                        alt={m.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover transition-[transform,filter] duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] [filter:saturate(0.85)] group-hover:scale-[1.045] group-hover:[filter:saturate(1)]"
                      />
                    ) : (
                      <FallbackCover title={e.title} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-space/70 via-transparent to-transparent" />
                    <span className="label absolute bottom-3 left-4 !text-[8px] text-ink/75">
                      {String(i + 2).padStart(2, "0")} · {dispatchDate(e.date)} ·{" "}
                      {readingTime(e.words).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="mt-5 font-display text-[1.55rem] font-light leading-tight text-ink transition-colors duration-300 group-hover:text-starlight">
                    {e.title}
                  </h2>
                  {highlight && (
                    <p className="mt-3 font-serif text-[1.05rem] italic leading-relaxed text-faint">
                      “{highlight}”
                    </p>
                  )}
                </Link>
              </Reveal>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
