import type { Metadata } from "next";
import { fieldNotes, dispatchDate } from "@/lib/content";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import EssaySignup from "@/components/newsletter/EssaySignup";
import FieldNotesTable from "@/components/field-notes/FieldNotesTable";

export const metadata: Metadata = {
  title: "Field Notes — Jafar Dabbagh",
  description:
    "A desk of letters left behind over time — dispatches from study, faith, and the battle to stay present.",
  alternates: { canonical: "/field-notes" },
};

/**
 * Field Notes are living fragments, not preserved artifacts — so the page is a
 * candlelit table scattered with one physical letter per published note
 * (drag, throw, open). The full dispatch log keeps the writing server-rendered
 * beneath the scene: readable without JS, indexable, and home to the signup.
 */
export default function FieldNotesPage() {
  return (
    <>
      <SiteHeader current="field-notes" />
      <main>
        <FieldNotesTable />

        {/* the quiet log — same letters, archival form */}
        <section
          aria-label="Dispatch log"
          className="mx-auto max-w-3xl px-6 pb-28 pt-24 md:px-8"
        >
          <p className="label mb-16 text-center text-[9px]! text-dim">
            THE DISPATCH LOG · EVERY LETTER, TRANSCRIBED
          </p>
          <div className="space-y-20">
            {fieldNotes.map((n, i) => (
              <Reveal key={n.slug} delay={i * 0.05}>
                <article
                  id={n.slug}
                  className="relative scroll-mt-28 border-l border-[rgba(159,216,232,0.25)] pl-8 md:pl-10"
                >
                  <span
                    aria-hidden
                    className="absolute -left-1.25 top-1 h-2.5 w-2.5 rounded-full bg-comet shadow-[0_0_14px_2px_rgba(159,216,232,0.5)]"
                  />
                  <p className="label text-[9px]! text-comet/80">
                    DISPATCH · {dispatchDate(n.date)}
                  </p>
                  <h2 className="mt-3 font-display text-[clamp(1.5rem,3.5vw,2.2rem)] font-light leading-tight text-ink">
                    {n.title}
                  </h2>
                  <div
                    className="prose-space mt-6 text-[1.15rem]!"
                    dangerouslySetInnerHTML={{ __html: n.html }}
                  />
                  <div className="mt-10">
                    <EssaySignup slug={n.slug} type="field_note" />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="label mt-16 text-center text-[9px]! text-dim">
            THE COMET RETURNS · NEXT PERIHELION UNKNOWN
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
