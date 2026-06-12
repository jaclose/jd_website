import { changelog } from "@/data/changelog";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";

const TYPE_DOT: Record<string, string> = {
  feat: "#d4b886",
  fix: "#9fd8e8",
  life: "#e8e6e1",
  garden: "#9fce8f",
  essay: "#c9a0e8",
  note: "#9fd8e8",
};
const TYPE_TEXT: Record<string, string> = {
  feat: "text-starlight",
  fix: "text-comet",
  life: "text-ink",
  garden: "text-leaf",
  essay: "text-[#c9a0e8]",
  note: "text-comet",
};

/** deterministic short hash, git-style, derived from the message */
function shortHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

/** five diff blocks, GitHub style */
function DiffBlocks({ add, del }: { add: number; del: number }) {
  const total = add + del;
  const green = total === 0 ? 0 : Math.round((add / total) * 5);
  return (
    <span className="inline-flex gap-0.75" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className="h-1.75 w-1.75"
          style={{
            background:
              i < green
                ? "#5d8b54"
                : total > 0 && del > 0
                  ? "#a05050"
                  : "rgba(232,230,225,0.12)",
          }}
        />
      ))}
    </span>
  );
}

export default function TransmissionLog() {
  const totalAdd = changelog.reduce((s, c) => s + c.additions, 0);
  const totalDel = changelog.reduce((s, c) => s + c.deletions, 0);
  let lastYear = "";

  return (
    <section
      id="log"
      className="relative flex min-h-svh flex-col justify-center px-6 py-24 md:px-10"
      style={{
        background:
          "radial-gradient(80% 60% at 50% 100%, rgba(159,206,143,0.06) 0%, transparent 70%)",
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
      <Reveal>
        <SectionHeading
          index="05"
          designation="MISSION RECORD · COMMITS TO THIS UNIVERSE"
          title="Transmission Log"
        />
      </Reveal>

      <Reveal>
        <div className="border border-[rgba(232,230,225,0.1)]">
          {/* terminal header */}
          <div className="flex items-baseline justify-between gap-4 border-b border-[rgba(232,230,225,0.1)] bg-[rgba(232,230,225,0.025)] px-5 py-3 font-mono text-[0.7rem]">
            <span className="text-faint">
              <span className="text-starlight">jafar@jd-1184</span>
              <span className="text-dim"> ~ %</span> git log --universe
            </span>
            <span className="hidden text-dim sm:block">
              {changelog.length} COMMITS ·{" "}
              <span className="text-leaf">+{totalAdd.toLocaleString()}</span>{" "}
              <span className="text-[#d77a7a]">−{totalDel.toLocaleString()}</span>
            </span>
          </div>

          {/* the graph — scrolls inside its terminal */}
          <div className="relative max-h-[58svh] overflow-y-auto px-5 py-2">
            <span
              aria-hidden
              className="absolute bottom-4 left-6.75 top-4 w-px bg-hairline"
            />
            {changelog.map((c, i) => {
              const year = c.date.slice(0, 4);
              const showYear = year !== lastYear;
              lastYear = year;
              return (
                <div key={i}>
                  {showYear && (
                    <div className="relative flex items-center gap-4 py-3 pl-4.5">
                      <span
                        aria-hidden
                        className="relative z-10 -ml-0.75 h-2.25 w-2.25 rotate-45 border border-[rgba(232,230,225,0.35)] bg-space"
                      />
                      <span className="label text-[9px]! tracking-[0.4em]! text-faint">
                        {year}
                      </span>
                      <span className="h-px flex-1 bg-[rgba(232,230,225,0.07)]" />
                    </div>
                  )}
                  <div className="group relative grid grid-cols-[14px_1fr] items-baseline gap-x-4 py-3 pl-4.5 font-mono text-[0.78rem] transition-colors duration-300 hover:bg-[rgba(232,230,225,0.025)] sm:grid-cols-[14px_4.6rem_3.6rem_1fr_auto]">
                    <span className="relative z-10 self-center">
                      <span
                        aria-hidden
                        className="-ml-0.75 block h-2.25 w-2.25 rounded-full border-2 border-space transition-transform duration-300 group-hover:scale-125"
                        style={{ background: TYPE_DOT[c.type] }}
                      />
                    </span>
                    <span className="hidden text-[0.68rem] tracking-wider text-dim transition-colors group-hover:text-starlight sm:block">
                      {shortHash(c.message)}
                    </span>
                    <span
                      className={`hidden text-[0.62rem] uppercase tracking-widest sm:block ${TYPE_TEXT[c.type]}`}
                    >
                      {c.type}
                    </span>
                    <span className="text-[rgba(232,230,225,0.85)]">
                      {c.message}
                      <span className="ml-3 text-[0.65rem] tracking-wider text-dim sm:hidden">
                        {c.date}
                      </span>
                    </span>
                    <span className="col-start-2 flex items-center gap-3 text-[0.68rem] sm:col-start-5 sm:justify-end">
                      <span className="hidden tracking-wider text-dim lg:block">{c.date}</span>
                      <DiffBlocks add={c.additions} del={c.deletions} />
                      <span>
                        <span className="text-leaf">+{c.additions.toLocaleString()}</span>{" "}
                        <span className="text-[#d77a7a]">−{c.deletions.toLocaleString()}</span>
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* footer */}
          <div className="border-t border-[rgba(232,230,225,0.1)] px-5 py-3 font-mono text-[0.65rem] tracking-wider text-dim">
            SITE WORK AND LIFE EVENTS SHARE ONE HISTORY · NEXT: SUPABASE LINK-UP, GUESTBOOK ACHIEVEMENTS
          </div>
        </div>
      </Reveal>
      </div>
    </section>
  );
}
