import { quotes, quoteOfTheWeek } from "@/data/quotes";
import Reveal from "@/components/Reveal";

export default function QuoteOfWeek() {
  return (
    <section
      id="quote"
      className="relative flex min-h-svh scroll-mt-24 items-center justify-center overflow-hidden px-6 py-24 text-center md:px-10"
      style={{
        background:
          "radial-gradient(70% 60% at 50% 42%, rgba(160,140,210,0.08) 0%, rgba(160,140,210,0.02) 45%, transparent 70%)",
      }}
    >
      {/* pulsar sweep */}
      <span
        aria-hidden
        className="absolute left-1/2 top-[30%] h-px w-[70vw] -translate-x-1/2 bg-linear-to-r from-transparent via-[rgba(200,180,255,0.14)] to-transparent"
      />
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <p className="label mb-10 text-starlight/70">
            PSR J1184+22 · QUOTE OF THE WEEK
          </p>
          <span
            aria-hidden
            className="mx-auto mb-10 block h-2 w-2 animate-pulse rounded-full bg-starlight shadow-[0_0_24px_6px_rgba(212,184,134,0.45)]"
          />
          <blockquote>
            {quoteOfTheWeek.arabic && (
              <p
                lang="ar"
                className="arabic mb-7 text-[clamp(2rem,5vw,3.6rem)] leading-relaxed text-starlight"
              >
                {quoteOfTheWeek.arabic}
              </p>
            )}
            <p className="font-serif text-[clamp(1.7rem,4vw,3rem)] font-medium italic leading-snug text-ink">
              “{quoteOfTheWeek.text}”
            </p>
          </blockquote>
          <p className="label mt-9 text-[10px]! text-faint">
            — {quoteOfTheWeek.source}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-16 space-y-3 border-t border-[rgba(232,230,225,0.08)] pt-8">
            <p className="label text-[9px]! text-dim">PREVIOUS PULSES</p>
            {quotes.slice(1).map((q) => (
              <p key={q.week} className="font-serif text-base italic text-faint">
                “{q.text}” <span className="label text-[8px]! text-dim">· {q.source}</span>
              </p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
