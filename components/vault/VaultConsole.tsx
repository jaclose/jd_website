"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TreeGlyph from "@/components/TreeGlyph";
import Reveal from "@/components/Reveal";
import type { Species } from "@/data/garden";
import {
  visitorState,
  addJournalEntry,
  setStarter,
  setCallsign,
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

/** open-ended prompts — the station asks something new each time */
const PROMPTS = [
  "What are you carrying through your own season of testing?",
  "What did today ask of you that yesterday did not?",
  "What's one thing you're maintaining that no one claps for?",
  "What arrived dressed as inconvenience, and turned out to be mercy?",
  "What are you grateful for that you didn't choose?",
  "What would you tell the version of you from a year ago?",
  "What are you learning to hold loosely?",
  "Where did you choose empathy when apathy was easier?",
  "What's the quiet work you're proud of this week?",
  "What are you still becoming?",
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
  const [callsign, setCallsignState] = useState<string | undefined>();
  const [visits, setVisits] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [promptIdx, setPromptIdx] = useState(0);
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    setPromptIdx(Math.floor(Math.random() * PROMPTS.length));
    const read = () => {
      const s = visitorState();
      setJournal(s.journal);
      setStarterState(s.starter);
      setCallsignState(s.callsign);
      setVisits(s.visits ?? []);
    };
    read();
    setReady(true);
    return onVisitorChange(read);
  }, []);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addJournalEntry(trimmed, callsign);
    setText("");
    setPromptIdx((p) => (p + 1) % PROMPTS.length);
  };

  const claim = () => {
    const n = nameDraft.trim();
    if (n) {
      setCallsign(n);
      setNameDraft("");
    }
  };

  const stage = stageFor(journal.length);
  const myEntries = useMemo(
    () => journal.filter((e) => e.name && callsign && e.name === callsign).length,
    [journal, callsign]
  );

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
          A station for travelers. Claim a callsign, choose a seed, and tend a
          garden that grows every time you return — your record waits for you,
          no password, no email.
        </p>
      </Reveal>

      {/* ——— callsign: the identity ——— */}
      <Reveal delay={0.06}>
        <section className="mt-14 border border-hairline bg-[rgba(8,10,16,0.5)] p-6">
          {callsign ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="label text-[8px]! tracking-[0.26em]! text-[#aeb8c4]/70">
                  DOCKED AS
                </p>
                <p className="mt-1 font-display text-2xl font-light text-ink">
                  {callsign}
                </p>
              </div>
              <div className="text-right font-mono text-[0.7rem] text-dim">
                <p>
                  <span className="text-leaf">{myEntries}</span> entries logged
                </p>
                <p>
                  <span className="text-comet">{visits.length}</span>{" "}
                  {visits.length === 1 ? "day" : "days"} aboard
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="label mb-3 text-[10px]! tracking-[0.3em]! text-[#aeb8c4]/80">
                CLAIM YOUR CALLSIGN
              </p>
              <p className="mb-4 font-serif text-base italic leading-relaxed text-faint">
                Pick a name and it becomes your way back in. Everything you grow
                here is filed under it — no account, no inbox required.
              </p>
              <div className="flex gap-3">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && claim()}
                  placeholder="e.g. Wayfarer-7, Ibn Sina, a name only you know…"
                  maxLength={40}
                  className="flex-1 border-b border-[rgba(232,230,225,0.14)] bg-transparent px-1 py-2 font-mono text-sm text-ink placeholder:text-dim focus:border-[#aeb8c4]/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={claim}
                  disabled={!nameDraft.trim()}
                  className="label border border-[rgba(174,184,196,0.4)] px-4 py-2 text-[9px]! tracking-[0.28em]! text-[#aeb8c4] transition-colors hover:bg-[#aeb8c4]/10 disabled:opacity-30"
                >
                  DOCK ⏎
                </button>
              </div>
            </div>
          )}
        </section>
      </Reveal>

      {/* ——— starter seed ——— */}
      <Reveal delay={0.08}>
        <section className="mt-12">
          <h2 className="label mb-6 text-[10px]! tracking-[0.3em]! text-starlight/80">
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
                    chosen ? "bg-[#0a0e14]" : dimmed ? "opacity-35" : "hover:bg-[#0a0e14]"
                  }`}
                >
                  <TreeGlyph
                    skill={{ id: `starter-${sp}`, stage: 4 }}
                    species={sp}
                    ghost={!chosen}
                    height={84}
                  />
                  <span
                    className={`label text-[9px]! tracking-[0.26em]! ${
                      chosen ? "text-leaf" : "text-faint group-hover:text-ink"
                    }`}
                  >
                    {sp.toUpperCase()} {chosen && "✓"}
                  </span>
                  <span className="label text-[7px]! tracking-[0.14em]! text-dim">
                    {line.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </Reveal>

      {/* ——— your garden ——— */}
      <Reveal delay={0.1}>
        <section className="mt-12 border border-[rgba(232,230,225,0.1)] p-8 text-center">
          <h2 className="label mb-2 text-[10px]! tracking-[0.3em]! text-leaf/80">
            YOUR GARDEN
          </h2>
          {ready && (
            <>
              <TreeGlyph
                skill={{ id: `visitor-${callsign ?? starter ?? "seed"}`, stage: starter ? stage : 0 }}
                species={starter ?? "oak"}
                height={130 + stage * 14}
                className="mx-auto"
              />
              <p className="label mt-2 text-[8px]! tracking-[0.24em]! text-dim">
                {starter
                  ? `${starter.toUpperCase()} · STAGE ${stage} / 5 · ${journal.length} ${
                      journal.length === 1 ? "ENTRY" : "ENTRIES"
                    } LOGGED`
                  : "A SEED AWAITS ITS GARDENER"}
              </p>
              {starter && stage < 5 && (
                <p className="label mt-1 text-[7px]! tracking-[0.2em]! text-dim">
                  {3 - (journal.length % 3)} MORE {3 - (journal.length % 3) === 1 ? "ENTRY" : "ENTRIES"} TO THE NEXT STAGE
                </p>
              )}
            </>
          )}
        </section>
      </Reveal>

      {/* ——— the log ——— */}
      <Reveal delay={0.12}>
        <section className="mt-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="label text-[10px]! tracking-[0.3em]! text-starlight/80">
              SIGN THE STATION LOG
            </h2>
            <button
              type="button"
              onClick={() => setPromptIdx((p) => (p + 1) % PROMPTS.length)}
              className="label text-[8px]! tracking-[0.24em]! text-dim transition-colors hover:text-starlight"
            >
              ↻ ANOTHER PROMPT
            </button>
          </div>
          <div className="border border-hairline">
            <AnimatePresence mode="wait">
              <motion.p
                key={promptIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="border-b border-[rgba(232,230,225,0.08)] px-5 py-3 font-serif text-base italic text-starlight/80"
              >
                {PROMPTS[promptIdx]}
              </motion.p>
            </AnimatePresence>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={callsign ? `Log your entry, ${callsign}…` : "Write freely — claim a callsign above to keep it yours…"}
              rows={4}
              maxLength={2000}
              className="w-full resize-none bg-transparent px-5 py-4 font-serif text-lg leading-relaxed text-ink placeholder:text-dim focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-[rgba(232,230,225,0.08)] px-5 py-3">
              <span className="label text-[8px]! text-dim">
                {callsign ? `FILED UNDER ${callsign.toUpperCase()}` : "ANONYMOUS"} · STORED IN THIS BROWSER UNTIL THE RELAY
              </span>
              <button
                type="button"
                onClick={submit}
                disabled={!text.trim()}
                className="label border border-[rgba(212,184,134,0.4)] px-4 py-2 text-[9px]! tracking-[0.3em]! text-starlight transition-colors hover:bg-starlight/10 disabled:opacity-30"
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
                    className="absolute -left-0.75 top-1.5 h-1.5 w-1.5 rounded-full bg-[#aeb8c4]"
                  />
                  <p className="label text-[8px]! text-dim">
                    {new Date(e.date)
                      .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      .toUpperCase()}
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

      {/* ——— dispatch list ——— */}
      <Reveal delay={0.14}>
        <section className="mt-16 border border-hairline bg-[rgba(8,10,16,0.5)] p-6 text-center">
          <h2 className="label mb-2 text-[10px]! tracking-[0.3em]! text-starlight/80">
            JOIN THE DISPATCH LIST
          </h2>
          <p className="mx-auto mb-5 max-w-md font-serif text-base italic leading-relaxed text-faint">
            No noise — just a quiet signal when a new essay or field note leaves
            the system.
          </p>
          {joined ? (
            <p className="label text-[9px]! tracking-[0.26em]! text-leaf">
              ✦ YOU'RE ON THE LIST — THE RELAY WILL CARRY IT WHEN IT'S LIVE
            </p>
          ) : (
            <div className="mx-auto flex max-w-md gap-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && email.includes("@") && setJoined(true)}
                type="email"
                placeholder="your@email.com"
                className="flex-1 border-b border-[rgba(232,230,225,0.14)] bg-transparent px-1 py-2 text-center font-mono text-sm text-ink placeholder:text-dim focus:border-starlight/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => email.includes("@") && setJoined(true)}
                disabled={!email.includes("@")}
                className="label border border-[rgba(212,184,134,0.4)] px-4 py-2 text-[9px]! tracking-[0.28em]! text-starlight transition-colors hover:bg-starlight/10 disabled:opacity-30"
              >
                SUBSCRIBE
              </button>
            </div>
          )}
          <p className="label mt-4 text-[7px]! tracking-[0.2em]! text-dim">
            STORED LOCALLY FOR NOW · WIRES TO THE EMAIL RELAY WHEN SUPABASE IS LIVE
          </p>
        </section>
      </Reveal>
    </>
  );
}
