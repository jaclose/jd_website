import { works } from "@/data/works";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";

/**
 * The Archive — deeper surveys. Four academic instruments, presented
 * the way his site framed them: "some of my most enjoyable works."
 */
export default function WorksArchive() {
  return (
    <section id="archive" className="mx-auto max-w-6xl px-6 py-28 md:px-10">
      <Reveal>
        <SectionHeading
          index="04"
          designation="DEEP SURVEYS · SOME OF MY MOST ENJOYABLE WORKS"
          title="The Archive"
        />
      </Reveal>

      <div>
        {works.map((w, i) => (
          <Reveal key={w.id} delay={i * 0.05}>
            <a
              href={w.pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid grid-cols-[2.6rem_1fr] items-baseline gap-5 border-b border-[rgba(232,230,225,0.08)] py-8 md:grid-cols-[2.6rem_1fr_auto] md:gap-8"
            >
              <span className="label !text-[10px] text-dim transition-colors group-hover:text-starlight">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block font-display text-[clamp(1.3rem,2.6vw,2rem)] font-light leading-tight text-ink transition-all duration-300 group-hover:translate-x-2 group-hover:text-starlight">
                  {w.title}
                  {w.subtitle && (
                    <span className="text-faint"> — {w.subtitle}</span>
                  )}
                </span>
                <span className="mt-2 block max-w-2xl font-serif text-[1.05rem] italic leading-relaxed text-faint">
                  {w.note}
                </span>
                <span className="label mt-3 block !text-[8px] !tracking-[0.26em] text-dim">
                  {w.venue.toUpperCase()}
                </span>
              </span>
              <span className="col-start-2 flex items-baseline gap-6 md:col-start-3 md:flex-col md:items-end md:gap-2">
                <span className="label border border-[rgba(212,184,134,0.3)] px-2.5 py-1 !text-[8px] !tracking-[0.24em] text-starlight/90">
                  {w.discipline.toUpperCase()}
                </span>
                <span className="label !text-[9px] text-dim">
                  {w.year} · <span className="link-reveal transition-colors group-hover:text-starlight">OPEN PDF ↗</span>
                </span>
              </span>
            </a>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <p className="label mt-8 !text-[9px] text-dim">
          INSTRUMENTS RETIRED TO THE ARCHIVE · CHEMISTRY, PSYCHOLOGY, GEOLOGY, BIOETHICS
        </p>
      </Reveal>
    </section>
  );
}
