import { changelog } from "@/data/changelog";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";

const TYPE_COLOR: Record<string, string> = {
  feat: "text-starlight",
  fix: "text-comet",
  life: "text-ink",
  garden: "text-leaf",
  essay: "text-[#c9a0e8]",
  note: "text-comet",
};

export default function TransmissionLog() {
  return (
    <section id="log" className="mx-auto max-w-5xl px-6 py-28 md:px-10">
      <Reveal>
        <SectionHeading
          index="04"
          designation="MISSION RECORD · COMMITS TO THIS UNIVERSE"
          title="Transmission Log"
        />
      </Reveal>
      <Reveal>
        <div className="font-mono text-[0.8rem]">
          {changelog.map((c, i) => (
            <div
              key={i}
              className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-1 border-b border-[rgba(232,230,225,0.07)] py-4 sm:grid-cols-[7.5rem_4.5rem_1fr_auto]"
            >
              <span className="text-[0.68rem] tracking-wider text-dim">{c.date}</span>
              <span className={`text-[0.68rem] uppercase tracking-widest ${TYPE_COLOR[c.type]}`}>
                {c.type}
              </span>
              <span className="col-span-2 text-[rgba(232,230,225,0.85)] sm:col-span-1">
                {c.message}
              </span>
              <span className="col-start-2 text-[0.7rem] sm:col-start-4 sm:text-right">
                <span className="text-leaf">+{c.additions.toLocaleString()}</span>{" "}
                <span className="text-[#d77a7a]">−{c.deletions.toLocaleString()}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="label mt-8 !text-[9px] text-dim">
          SITE WORK AND LIFE EVENTS SHARE ONE HISTORY · NEXT: SUPABASE LINK-UP, GUESTBOOK ACHIEVEMENTS
        </p>
      </Reveal>
    </section>
  );
}
