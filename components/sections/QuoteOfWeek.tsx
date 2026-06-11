import { quotes, quoteOfTheWeek } from "@/data/quotes";
import Reveal from "@/components/Reveal";

export default function QuoteOfWeek() {
  return (
    <section
      id="quote"
      className="relative mx-auto max-w-4xl scroll-mt-24 px-6 py-32 text-center md:px-10"
    >
      <Reveal>
        <p className="label mb-10 text-starlight/70">
          PSR J1184+22 · QUOTE OF THE WEEK
        </p>
        <span
          aria-hidden
          className="mx-auto mb-10 block h-2 w-2 animate-pulse rounded-full bg-starlight shadow-[0_0_24px_6px_rgba(212,184,134,0.45)]"
        />
        <blockquote className="font-serif text-[clamp(1.7rem,4vw,3rem)] font-medium italic leading-snug text-ink">
          “{quoteOfTheWeek.text}”
        </blockquote>
        <p className="label mt-9 !text-[10px] text-faint">
          — {quoteOfTheWeek.source}
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mt-20 space-y-3 border-t border-[rgba(232,230,225,0.08)] pt-8">
          <p className="label !text-[9px] text-dim">PREVIOUS PULSES</p>
          {quotes.slice(1).map((q) => (
            <p key={q.week} className="font-serif text-base italic text-faint">
              “{q.text}” <span className="label !text-[8px] text-dim">· {q.source}</span>
            </p>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
