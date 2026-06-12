"use client";
import { useEffect, useState } from "react";
import { visitorAchievements } from "@/data/achievements";
import { visitorState, onVisitorChange } from "@/lib/visitor";

const TIER_LABEL: Record<string, string> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  rare: "RARE",
  legendary: "LEGENDARY",
};
const TIER_COLOR: Record<string, string> = {
  common: "text-faint",
  uncommon: "text-leaf",
  rare: "text-comet",
  legendary: "text-starlight",
};

/**
 * The visitor's own record — Steam-style. Hidden achievements stay
 * masked as ??? until earned; unlocks shine. Stored in this browser
 * until the relay (Supabase) carries them to the shared archive.
 */
export default function VisitorRecord() {
  const [unlocked, setUnlocked] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const read = () => setUnlocked(visitorState().achievements);
    read();
    setReady(true);
    return onVisitorChange(read);
  }, []);

  const count = visitorAchievements.filter((a) => unlocked[a.id]).length;

  return (
    <div className="mt-20">
      <div className="mb-8 flex items-end justify-between border-b border-hairline pb-4">
        <div>
          <p className="label mb-2 text-[9px]! text-comet/80">
            YOUR RECORD · EARNED BY EXPLORING
          </p>
          <h3 className="font-display text-2xl font-light text-ink">
            Visitor Achievements
          </h3>
        </div>
        <span className="label text-[10px]! text-comet">
          {ready ? `${count} / ${visitorAchievements.length}` : "— / —"}
        </span>
      </div>

      <div className="grid gap-px overflow-hidden border border-[rgba(232,230,225,0.1)] bg-[rgba(232,230,225,0.1)] sm:grid-cols-2 lg:grid-cols-3">
        {visitorAchievements.map((a) => {
          const date = unlocked[a.id];
          const masked = a.hidden && !date;
          return (
            <div
              key={a.id}
              className={`relative flex h-full gap-4 overflow-hidden bg-space p-5 ${
                date ? "" : "opacity-60"
              }`}
            >
              {date && (
                <span aria-hidden className="achievement-shine absolute inset-0" />
              )}
              <span
                aria-hidden
                className={`flex h-11 w-11 shrink-0 items-center justify-center border font-mono text-xl ${
                  date
                    ? "border-starlight/50 text-starlight [text-shadow:0_0_16px_rgba(212,184,134,0.7)]"
                    : "border-[rgba(232,230,225,0.14)] text-dim"
                }`}
              >
                {masked ? "?" : a.icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-3">
                  <h4 className="truncate font-display text-base font-light text-ink">
                    {masked ? "???" : a.title}
                  </h4>
                  <span className={`label shrink-0 text-[7px]! tracking-[0.22em]! ${TIER_COLOR[a.tier]}`}>
                    {TIER_LABEL[a.tier]}
                  </span>
                </div>
                <p className="mt-1.5 font-serif text-[0.92rem] leading-snug text-faint">
                  {masked
                    ? "Hidden achievement — keep exploring the system."
                    : date
                      ? a.description
                      : a.condition}
                </p>
                <p className="label mt-2 text-[7px]! tracking-[0.22em]! text-dim">
                  {date ? `UNLOCKED ${date}` : masked ? "UNDISCOVERED" : "LOCKED"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="label mt-6 text-[8px]! tracking-[0.24em]! text-dim">
        YOUR RECORD LIVES IN THIS BROWSER · THE SUPABASE RELAY WILL CARRY IT TO THE SHARED ARCHIVE
      </p>
    </div>
  );
}
