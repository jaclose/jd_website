import Link from "next/link";
import { essays, dispatchDate, readingTime } from "@/lib/content";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";

export default function EssaysIndex() {
  return (
    <section id="essays" className="mx-auto max-w-5xl px-6 py-28 md:px-10">
      <Reveal>
        <SectionHeading index="01" designation="JD-1184 b · GAS GIANT" title="Essays" />
      </Reveal>
      <ol>
        {essays.map((e, i) => (
          <Reveal key={e.slug} delay={i * 0.05}>
            <li className="group border-b border-[rgba(232,230,225,0.08)]">
              <Link
                href={`/essays/${e.slug}`}
                className="flex flex-col gap-1 py-7 transition-colors md:flex-row md:items-baseline md:gap-8"
              >
                <span className="label !text-[10px] text-dim md:w-10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-[clamp(1.4rem,3vw,2.3rem)] font-light leading-tight text-ink transition-colors duration-300 group-hover:text-starlight">
                  {e.title}
                </span>
                <span className="label ml-auto shrink-0 !text-[10px] text-dim">
                  {dispatchDate(e.date)} · {readingTime(e.words)}
                </span>
              </Link>
            </li>
          </Reveal>
        ))}
      </ol>
      <Reveal>
        <p className="label mt-8 !text-[10px] text-dim">
          {essays.length} TRANSMISSIONS · THREE MOST RECENT VISIBLE AS MOONS
        </p>
      </Reveal>
    </section>
  );
}
