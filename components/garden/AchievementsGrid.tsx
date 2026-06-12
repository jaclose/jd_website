import { achievements, unlockedCount } from "@/data/achievements";
import Reveal from "@/components/Reveal";
import ConstellationMap from "./ConstellationMap";
import VisitorRecord from "./VisitorRecord";

export default function AchievementsGrid() {
  return (
    <section id="achievements" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-28 md:px-10">
      <Reveal>
        <div className="mb-14 flex items-end justify-between border-b border-[rgba(232,230,225,0.12)] pb-5">
          <div>
            <p className="label mb-3 text-starlight/70">GLD-7 CLUSTER · THE RECORD</p>
            <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light leading-none text-ink">
              Achievements
            </h2>
          </div>
          <span className="label !text-[10px] text-starlight">
            {unlockedCount} / {achievements.length}
          </span>
        </div>
      </Reveal>

      <Reveal>
        <div className="mb-16">
          <ConstellationMap />
        </div>
      </Reveal>

      <div className="grid gap-px overflow-hidden border border-[rgba(232,230,225,0.1)] bg-[rgba(232,230,225,0.1)] sm:grid-cols-2 lg:grid-cols-4">
        {achievements.map((a, i) => (
          <Reveal key={a.id} delay={i * 0.04} className="bg-space">
            <div
              className={`flex h-full flex-col gap-3 p-6 ${
                a.unlocked ? "" : "opacity-50"
              }`}
            >
              <span
                aria-hidden
                className={`font-mono text-lg ${
                  a.unlocked
                    ? "text-starlight [text-shadow:0_0_14px_rgba(212,184,134,0.6)]"
                    : "text-dim"
                }`}
              >
                {a.unlocked ? "✦" : "✧"}
              </span>
              <h3 className="font-display text-lg font-light text-ink">{a.title}</h3>
              <p className="font-serif text-[0.95rem] leading-relaxed text-faint">
                {a.unlocked ? a.description : "Still locked."}
              </p>
              <p className="label mt-auto !text-[8px] text-dim">
                {a.unlocked && a.unlockedOn
                  ? `UNLOCKED ${a.unlockedOn}`
                  : a.condition.toUpperCase()}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <VisitorRecord />
      </Reveal>
    </section>
  );
}
