import Link from "next/link";
import { fieldNotes, dispatchDate } from "@/lib/content";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";

export default function FieldNotesSection() {
  return (
    <section id="field-notes" className="mx-auto max-w-5xl px-6 py-28 md:px-10">
      <Reveal>
        <SectionHeading
          index="03"
          designation="C/2025 JD · COMET, PERIODIC"
          title="Field Notes"
        />
      </Reveal>
      <div className="grid gap-px overflow-hidden border border-[rgba(232,230,225,0.1)] bg-[rgba(232,230,225,0.1)] md:grid-cols-3">
        {fieldNotes.map((n, i) => (
          <Reveal key={n.slug} delay={i * 0.07} className="bg-space">
            <Link
              href="/field-notes"
              className="group flex h-full flex-col gap-4 p-7 transition-colors hover:bg-[#0a0c14]"
            >
              <span className="label !text-[9px] text-comet/80">
                DISPATCH · {dispatchDate(n.date)}
              </span>
              <h3 className="font-display text-xl font-light leading-snug text-ink transition-colors group-hover:text-comet">
                {n.title}
              </h3>
              <p className="font-serif text-[1.02rem] leading-relaxed text-faint">
                {n.excerpt.slice(0, 150)}…
              </p>
              <span className="label mt-auto !text-[8px] text-dim transition-colors group-hover:text-comet/70">
                READ THE NOTE ↳
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
