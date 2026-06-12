import type { Metadata } from "next";
import { fieldNotes, dispatchDate } from "@/lib/content";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Field Notes — Jafar Dabbagh",
  description:
    "Dispatches from study, faith, and the battle to stay present.",
};

export default function FieldNotesPage() {
  return (
    <>
      <SiteHeader current="field-notes" />
      <main className="mx-auto max-w-3xl px-6 pb-28 pt-36 md:px-8">
        <Reveal>
          <p className="label mb-4 text-comet/80">
            C/2025 JD · PERIODIC COMET · {fieldNotes.length} DISPATCHES
          </p>
          <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-light leading-none text-ink">
            Field Notes
          </h1>
          <p className="mt-6 max-w-xl font-serif text-xl italic leading-relaxed text-faint">
            Dispatches from study, faith, and the battle to stay present.
          </p>
        </Reveal>

        <div className="mt-20 space-y-20">
          {fieldNotes.map((n, i) => (
            <Reveal key={n.slug} delay={i * 0.05}>
              <article
                id={n.slug}
                className="relative scroll-mt-28 border-l border-[rgba(159,216,232,0.25)] pl-8 md:pl-10"
              >
                <span
                  aria-hidden
                  className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-comet shadow-[0_0_14px_2px_rgba(159,216,232,0.5)]"
                />
                <p className="label !text-[9px] text-comet/80">
                  DISPATCH · {dispatchDate(n.date)}
                </p>
                <h2 className="mt-3 font-display text-[clamp(1.5rem,3.5vw,2.2rem)] font-light leading-tight text-ink">
                  {n.title}
                </h2>
                <div
                  className="prose-space mt-6 !text-[1.15rem]"
                  dangerouslySetInnerHTML={{ __html: n.html }}
                />
              </article>
            </Reveal>
          ))}
        </div>

        <p className="label mt-24 text-center !text-[9px] text-dim">
          THE COMET RETURNS · NEXT PERIHELION UNKNOWN
        </p>
      </main>
      <Footer />
    </>
  );
}
