import Image from "next/image";
import Link from "next/link";
import { fieldNotes, dispatchDate } from "@/lib/content";
import { noteMeta } from "@/data/meta";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";

export default function FieldNotesSection() {
  return (
    <section id="field-notes" className="mx-auto max-w-6xl px-6 py-28 md:px-10">
      <Reveal>
        <SectionHeading
          index="03"
          designation="C/2025 JD · COMET, PERIODIC"
          title="Field Notes"
        />
      </Reveal>

      {/* the monitor strip — worry, then time heals */}
      <Reveal>
        <figure className="relative mb-16 h-[150px] overflow-hidden border border-[rgba(232,230,225,0.08)] md:h-[190px]">
          <Image
            src="/images/ecg.jpg"
            alt="An ECG trace labelled worry, settling into a slow wave labelled time heals"
            fill
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-space via-transparent to-space" />
          <figcaption className="label absolute bottom-3 right-4 !text-[8px] !tracking-[0.3em] text-dim">
            TELEMETRY · THE PULSE SETTLES
          </figcaption>
        </figure>
      </Reveal>

      <div className="grid gap-10 md:grid-cols-3 md:gap-8">
        {fieldNotes.map((n, i) => {
          const m = noteMeta[n.slug];
          return (
            <Reveal key={n.slug} delay={i * 0.08}>
              <Link href={`/field-notes#${n.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden">
                  {m && (
                    <Image
                      src={m.cover}
                      alt={m.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-[transform,filter] duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] [filter:saturate(0.8)] group-hover:scale-[1.05] group-hover:[filter:saturate(1)]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-space/85 via-space/10 to-transparent" />
                  <span className="label absolute bottom-4 left-4 !text-[8px] text-comet/90">
                    DISPATCH · {dispatchDate(n.date)}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-light leading-snug text-ink transition-colors duration-300 group-hover:text-comet">
                  {n.title}
                </h3>
                <p className="mt-3 font-serif text-[1.02rem] leading-relaxed text-faint">
                  {n.excerpt.slice(0, 130)}…
                </p>
                <span className="label mt-4 inline-block !text-[8px] text-dim transition-colors group-hover:text-comet/80">
                  READ THE NOTE ↳
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
