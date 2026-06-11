import type { Metadata } from "next";
import Link from "next/link";
import { essays, dispatchDate, readingTime } from "@/lib/content";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Essays — Jafar Dabbagh",
  description: "Long-form thought from the JD-1184 system.",
};

export default function EssaysPage() {
  return (
    <>
      <SiteHeader current="essays" />
      <main className="mx-auto max-w-5xl px-6 pb-28 pt-36 md:px-10">
        <Reveal>
          <p className="label mb-4 text-starlight/70">JD-1184 b · GAS GIANT · {essays.length} TRANSMISSIONS</p>
          <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-light leading-none text-ink">
            Essays
          </h1>
          <p className="mt-6 max-w-xl font-serif text-xl italic leading-relaxed text-faint">
            Long-form thought. The three most recent orbit the hero as moons.
          </p>
        </Reveal>

        <div className="mt-20">
          {essays.map((e, i) => (
            <Reveal key={e.slug} delay={i * 0.04}>
              <article className="group border-b border-[rgba(232,230,225,0.08)]">
                <Link href={`/essays/${e.slug}`} className="block py-10">
                  <div className="flex items-baseline justify-between gap-6">
                    <span className="label !text-[10px] text-dim">
                      {String(i + 1).padStart(2, "0")} · {dispatchDate(e.date)}
                    </span>
                    <span className="label !text-[10px] text-dim">{readingTime(e.words)}</span>
                  </div>
                  <h2 className="mt-3 font-display text-[clamp(1.6rem,4vw,2.8rem)] font-light leading-tight text-ink transition-colors duration-300 group-hover:text-starlight">
                    {e.title}
                  </h2>
                  <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-faint">
                    {e.excerpt.slice(0, 220)}…
                  </p>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
