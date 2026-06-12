"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TreeGlyph from "@/components/TreeGlyph";
import Reveal from "@/components/Reveal";
import type { Species } from "@/data/garden";
import {
  visitorState,
  addJournalEntry,
  setStarter,
  unlockVisitor,
  onVisitorChange,
  type JournalEntry,
} from "@/lib/visitor";

const STARTERS: { sp: Species; line: string }[] = [
  { sp: "spruce", line: "patient · evergreen · keeps its needles through winter" },
  { sp: "oak", line: "broad · load-bearing · shade for whoever comes after" },
  { sp: "palm", line: "flexible · storm-bent · thrives where others snap" },
  { sp: "acacia", line: "deep-rooted · wide canopy · water found far below" },
];

/** every three entries grows the visitor's tree one stage, capped at 5 */
function stageFor(entries: number): 0 | 1 | 2 | 3 | 4 | 5 {
  return Math.min(5, Math.floor(entries / 3) + (entries > 0 ? 1 : 0)) as
    | 0 | 1 | 2 | 3 | 4 | 5;
}

export default function VaultConsole() {
  const [ready, setReady] = useState(false);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [starter, setStarterState] = useState<Species | undefined>();
  const [text, setText] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const read = () => {
      const s = visitorState();
      setJournal(s.journal);
      setStarterState(s.starter);
    };
    read();
    setReady(true);
    return onVisitorChange(read);
  }, []);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addJournalEntry(trimmed, name.trim() || undefined);
    setText("");
  };

  const stage = stageFor(journal.length);

  return (
    <>
      <Reveal>
        <p className="label mb-4 text-[#aeb8c4]/80">
          STN V-1184 · HOLLOWED ASTEROID · OPEN TO ALL CALLSIGNS
        </p>
        <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-light leading-none text-ink">
          The Vault
        </h1>
        <p className="mt-6 max-w-xl font-serif text-xl italic leading-relaxed text-faint">
          A station for travelers. Sign the log, choose a starter seed, and
          tend a garden that is entirely yours — it grows one stage for every
          few entries you leave.
        </p>
      </Reveal>

      {/* ——— starter seed ——— */}
      <Reveal delay={0.08}>
        <section className="mt-16">
          <h2 className="label mb-6 !text-[10px] !tracking-[0.3em] text-starlight/80">
            {starter ? "YOUR SEED" : "CHOOSE YOUR STARTER SEED"}
          </h2>
          <div className="grid grid-cols-2 gap-px border border-[rgba(232,230,225,0.1)] bg-[rgba(232,230,225,0.1)] md:grid-cols-4">
            {STARTERS.map(({ sp, line }) => {
              const chosen = starter === sp;
              const dimmed = starter && !chosen;
              return (
                <button
                  key={sp}
                  type="button"
                  disabled={!!starter}
                  onClick={() => {
                    setStarter(sp);
                    unlockVisitor("starter-seed");
                  }}
                  className={`group flex flex-col items-center gap-2 bg-space p-5 text-center transition-all duration-300 ${
                    chosen
                      ? "bg-[#0a0e14]"
                      : dimmed
                        ? "opacity-35"
                        : "hover:bg-[#0a0e14]"
                  }`}
                >
                  <TreeGlyph
                    skill={{ id: `starter-${sp}`, stage: 4 }}
                    species={sp}
                    ghost={!chosen}
                    height={84}
                  />
                  <span
                    className={`label !text-[9px] !tracking-[0.26em] ${
                      chosen ? "text-leaf" : "text-faint group-hover:text-ink"
                    }`}
                  >
                    {sp.toUpperCase()} {chosen && "✓"}
                  </span>
                  <span className="label !text-[7px] !tracking-[0.14em] text-dim">
                    {line.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
          {!starter && (
            <p className="label mt-4 !text-[8px] !tracking-[0.24em] text-dim">
              CHOOSE CAREFULLY — EVERY GARDENER REMEMBERS THEIR FIRST
            </p>
          )}
        </section>
      </Reveal>

      {/* ——— your garden ——— */}
      <Reveal delay={0.1}>
        <section className="mt-16 border border-[rgba(232,230,225,0.1)] p-8 text-center">
          <h2 className="label mb-2 !text-[10px] !tracking-[0.3em] text-leaf/80">
            YOUR GARDEN
          </h2>
          {ready && (
            <>
              <TreeGlyph
                skill={{ id: `visitor-${starter ?? "seed"}`, stage: starter ? stage : 0 }}
                species={starter ?? "oak"}
                height={130 + stage * 14}
                className="mx-auto"
              />
              <p className="label mt-2 !text-[8px] !tracking-[0.24em] text-dim">
                {starter
                  ? `${starter.toUpperCase()} · STAGE ${stage} / 5 · ${journal.length} ${
                      journal.length === 1 ? "ENTRY" : "ENTRIES"
                    } LOGGED`
                  : "A SEED AWAITS ITS GARDENER"}
              </p>
            </>
          )}
        </section>
      </Reveal>

      {/* ——— the log ——— */}
      <Reveal delay={0.12}>
        <section className="mt-16">
          <h2 className="label mb-6 !text-[10px] !tracking-[0.3em] text-starlight/80">
            SIGN THE STATION LOG
          </h2>
          <div className="border border-[rgba(232,230,225,0.12)]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Callsign (optional)"
              maxLength={40}
              className="w-full border-b border-[rgba(232,230,225,0.08)] bg-transparent px-5 py-3 font-mono text-sm text-ink placeholder:text-dim focus:outline-none"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What are you carrying through your own season of testing?"
              rows={4}
              maxLength={2000}
              className="w-full resize-none bg-transparent px-5 py-4 font-serif text-lg leading-relaxed text-ink placeholder:text-dim focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-[rgba(232,230,225,0.08)] px-5 py-3">
              <span className="label !text-[8px] text-dim">
                STORED IN THIS BROWSER · THE SUPABASE RELAY WILL CARRY ENTRIES TO THE SHARED ARCHIVE
              </span>
              <button
                type="button"
                onClick={submit}
                disabled={!text.trim()}
                className="label border border-[rgba(212,184,134,0.4)] px-4 py-2 !text-[9px] !tracking-[0.3em] text-starlight transition-colors hover:bg-starlight/10 disabled:opacity-30"
              >
                TRANSMIT ⏎
              </button>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            <AnimatePresence initial={false}>
              {[...journal].reverse().map((e) => (
                <motion.article
                  key={e.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative border-l border-[rgba(174,184,196,0.3)] pl-6"
                >
                  <span
                    aria-hidden
                    className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-[#aeb8c4]"
                  />
                  <p className="label !text-[8px] text-dim">
                    {new Date(e.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).toUpperCase()}
                    {e.name ? ` · ${e.name.toUpperCase()}` : " · ANONYMOUS TRAVELER"}
                  </p>
                  <p className="mt-2 font-serif text-lg leading-relaxed text-[rgba(232,230,225,0.85)]">
                    {e.text}
                  </p>
                </motion.article>
              ))}
            </AnimatePresence>
            {ready && journal.length === 0 && (
              <p className="font-serif text-lg italic text-dim">
                The log is open. No entries yet — yours would be the first.
              </p>
            )}
          </div>
        </section>
      </Reveal>
    </>
  );
}
