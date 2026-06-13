"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { provinces, supplyRoute, type Province } from "@/data/lifemap";
import { unlockVisitor } from "@/lib/visitor";

const HELD_KEY = "jd1184-dominion";

function Mark({ x, y, type }: { x: number; y: number; type: string }) {
  switch (type) {
    case "vp":
      return (
        <text x={x} y={y + 4} textAnchor="middle" fontSize="13" fill="#d4b886">
          ✦
        </text>
      );
    case "factory":
      return (
        <g>
          <rect x={x - 4} y={y - 4} width="8" height="8" fill="none" stroke="#cdd6e4" strokeWidth="1" />
          <rect x={x - 1.5} y={y - 1.5} width="3" height="3" fill="#cdd6e4" />
        </g>
      );
    case "port":
      return (
        <g stroke="#9fd8e8" strokeWidth="1" fill="none">
          <circle cx={x} cy={y - 2} r="2.4" />
          <path d={`M${x},${y + 0.5} L${x},${y + 5} M${x - 4},${y + 3} Q${x},${y + 7} ${x + 4},${y + 3}`} />
        </g>
      );
    default:
      return (
        <g>
          <circle cx={x} cy={y} r="2.2" fill="#e8e6e1" />
          <circle cx={x} cy={y} r="5" fill="none" stroke="rgba(232,230,225,0.4)" strokeWidth="0.8" />
        </g>
      );
  }
}

type Status = "held" | "available" | "locked" | "navy";

export default function LifeMap() {
  const reachable = useMemo(() => provinces.filter((p) => !p.navy), []);
  const [held, setHeld] = useState<Set<string>>(() => new Set(["heritage"]));
  const [pp, setPp] = useState(20);
  const [selected, setSelected] = useState<string>("heritage");
  const [flash, setFlash] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(["— campaign begins at the Old Hearth —"]);
  const [ready, setReady] = useState(false);

  // restore the playthrough
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HELD_KEY);
      if (raw) {
        const ids = JSON.parse(raw) as string[];
        setHeld(new Set(["heritage", ...ids]));
      }
    } catch {
      /* fresh campaign */
    }
    setReady(true);
  }, []);

  const persist = useCallback((s: Set<string>) => {
    try {
      localStorage.setItem(HELD_KEY, JSON.stringify([...s]));
    } catch {
      /* private mode */
    }
  }, []);

  // political-power tick: base + held industry
  const industryHeld = useMemo(
    () => provinces.filter((p) => p.industry && held.has(p.id)).length,
    [held]
  );
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      setPp((v) => Math.min(999, v + 1 + industryHeld));
    }, 900);
    return () => clearInterval(id);
  }, [ready, industryHeld]);

  const statusOf = useCallback(
    (p: Province): Status => {
      if (held.has(p.id)) return "held";
      const reqMet = p.requires.every((r) => held.has(r));
      if (p.navy) return "navy";
      if (!reqMet) return "locked";
      return "available";
    },
    [held]
  );

  const conquer = (p: Province) => {
    const status = statusOf(p);
    if (status === "navy") {
      setFlash(p.id);
      unlockVisitor("admiral-wanted");
      setLog((l) => [`✕ ${p.name} — no navy. that era is unlived.`, ...l].slice(0, 6));
      setTimeout(() => setFlash(null), 600);
      return;
    }
    if (status !== "available") return;
    if (pp < p.cost) {
      setFlash(p.id);
      setLog((l) => [`✕ ${p.name} — need ${p.cost} PP.`, ...l].slice(0, 6));
      setTimeout(() => setFlash(null), 600);
      return;
    }
    setPp((v) => v - p.cost);
    const next = new Set(held).add(p.id);
    setHeld(next);
    persist(next);
    setLog((l) => [`✦ ${p.name} secured. chapter declassified.`, ...l].slice(0, 6));
    unlockVisitor("first-conquest");
    const newWorldHeld = reachable.every((r) => next.has(r.id));
    if (newWorldHeld) unlockVisitor("the-unifier");
  };

  const reset = () => {
    const fresh = new Set(["heritage"]);
    setHeld(fresh);
    persist(fresh);
    setPp(20);
    setSelected("heritage");
    setLog(["— campaign reset to the Old Hearth —"]);
  };

  const current = provinces.find((p) => p.id === selected) ?? provinces[0];
  const currentStatus = statusOf(current);
  const factories = industryHeld;
  const divisions = held.size;
  const stability = Math.round((held.size / reachable.length) * 100);
  const newWorldHeld = reachable.every((r) => held.has(r.id));

  const STAT = [
    { icon: "✒", label: "political power", value: ready ? String(pp) : "—", tone: "text-starlight" },
    { icon: "▣", label: "factories", value: String(factories), tone: "text-faint" },
    { icon: "⚔", label: "divisions", value: String(divisions), tone: "text-comet" },
    { icon: "☖", label: "stability", value: `${stability}%`, tone: "text-leaf" },
  ];

  return (
    <figure className="overflow-hidden border border-hairline bg-[rgba(5,7,12,0.6)]">
      {/* war-room top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(232,230,225,0.1)] bg-[rgba(232,230,225,0.03)] px-5 py-2.5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
          {STAT.map((s) => (
            <span key={s.label} className="flex items-baseline gap-2 font-mono">
              <span aria-hidden className={`text-[0.85rem] ${s.tone}`}>
                {s.icon}
              </span>
              <span className={`text-[0.82rem] tabular-nums ${s.tone}`}>{s.value}</span>
              <span className="label text-[7px]! tracking-[0.18em]! text-dim">
                {s.label.toUpperCase()}
              </span>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={reset}
          className="label text-[7px]! tracking-[0.24em]! text-dim transition-colors hover:text-comet"
        >
          ↺ RESTART CAMPAIGN
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.85fr_1fr]">
        {/* ——— the map ——— */}
        <div className="relative">
          <svg viewBox="0 0 1000 520" className="w-full" role="img" aria-label="A war-game map of life chapters">
            {/* sea grid */}
            {Array.from({ length: 13 }, (_, i) => (
              <line key={`gx-${i}`} x1={(i + 1) * 72} y1="0" x2={(i + 1) * 72} y2="520" stroke="rgba(120,150,190,0.05)" />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`gy-${i}`} x1="0" y1={(i + 1) * 72} x2="1000" y2={(i + 1) * 72} stroke="rgba(120,150,190,0.05)" />
            ))}

            <defs>
              <pattern id="navy-hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(120,150,190,0.22)" strokeWidth="1.4" />
              </pattern>
            </defs>

            {/* the strait dividing new world from old */}
            <line x1="758" y1="0" x2="758" y2="520" stroke="rgba(120,150,190,0.12)" strokeWidth="1" strokeDasharray="2 6" />
            <text x="762" y="500" fontSize="8.5" fill="rgba(120,150,190,0.4)" style={{ fontFamily: "var(--font-mono)", letterSpacing: 2 }}>
              ⟂ THE STRAIT · NEEDS A NAVY
            </text>

            {/* supply route — only between held provinces */}
            <path
              d={`M${supplyRoute
                .filter((_, i) => held.has(reachable[i]?.id))
                .map(([x, y]) => `${x},${y}`)
                .join(" L")}`}
              fill="none"
              stroke="rgba(212,184,134,0.35)"
              strokeWidth="1.2"
              strokeDasharray="3 5"
            />

            {provinces.map((p) => {
              const status = statusOf(p);
              const isSel = p.id === selected;
              const isFlash = flash === p.id;
              const fill =
                status === "held"
                  ? p.hue
                  : status === "navy"
                    ? "url(#navy-hatch)"
                    : "rgba(20,26,36,0.55)";
              return (
                <g
                  key={p.id}
                  onMouseEnter={() => setSelected(p.id)}
                  onClick={() => {
                    setSelected(p.id);
                    conquer(p);
                  }}
                  className="cursor-pointer"
                  role="button"
                  aria-label={p.name}
                >
                  <motion.path
                    d={p.d}
                    fill={fill}
                    stroke={
                      isSel
                        ? "#d4b886"
                        : status === "held"
                          ? "rgba(232,230,225,0.5)"
                          : status === "available"
                            ? "rgba(212,184,134,0.55)"
                            : "rgba(120,150,190,0.3)"
                    }
                    strokeWidth={isSel ? 2 : status === "available" ? 1.4 : 1}
                    strokeDasharray={status === "available" ? "5 4" : undefined}
                    animate={{
                      opacity: isFlash ? [1, 0.3, 1] : status === "locked" ? 0.5 : 0.95,
                      scale: isSel ? 1.012 : 1,
                    }}
                    style={{ transformOrigin: `${p.label[0]}px ${p.label[1]}px` }}
                    transition={{ duration: isFlash ? 0.5 : 0.3 }}
                  />
                  {/* held provinces show their installations */}
                  {status === "held" && (p.marks ?? []).map((m, i) => <Mark key={i} x={m.x} y={m.y} type={m.type} />)}
                  {/* available campaigns pulse a target */}
                  {status === "available" && (
                    <motion.circle
                      cx={p.label[0]}
                      cy={p.label[1]}
                      fill="none"
                      stroke="#d4b886"
                      strokeWidth="1.2"
                      initial={{ r: 4, opacity: 0.8 }}
                      animate={{ r: [4, 11], opacity: [0.8, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  <text
                    x={p.label[0]}
                    y={p.label[1] + 26}
                    textAnchor="middle"
                    fontSize="10"
                    letterSpacing="1.8"
                    fill={
                      status === "held"
                        ? "#e8e6e1"
                        : status === "available"
                          ? "#d4b886"
                          : "rgba(160,176,200,0.55)"
                    }
                    style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase", pointerEvents: "none" }}
                  >
                    {status === "navy" ? "⚓ " : ""}
                    {p.name.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* compass */}
            <g transform="translate(56,468)" stroke="rgba(232,230,225,0.4)" fill="none">
              <circle r="15" />
              <path d="M0,-15 L4,0 L0,15 L-4,0 Z" fill="rgba(212,184,134,0.5)" stroke="none" />
            </g>
          </svg>

          {/* victory banner */}
          <AnimatePresence>
            {newWorldHeld && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-0 bottom-3 text-center"
              >
                <span className="label bg-[rgba(5,7,12,0.7)] px-3 py-1.5 text-[8px]! tracking-[0.3em]! text-starlight">
                  ✦ THE NEW WORLD IS UNIFIED · THE OLD WORLD AWAITS A NAVY
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ——— intel / command panel ——— */}
        <div className="flex flex-col border-t border-hairline lg:border-l lg:border-t-0">
          <div className="flex-1 p-6">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="label text-[8px]! tracking-[0.26em]! text-dim">
                {current.kind.toUpperCase()} · {current.era.toUpperCase()}
              </p>
              <h3 className="mt-2 font-display text-2xl font-light text-ink">{current.name}</h3>
              <p className="label mt-2 text-[9px]! tracking-[0.2em]! text-starlight/80">
                {current.role.toUpperCase()}
              </p>

              {currentStatus === "held" ? (
                <>
                  <p className="mt-4 font-serif text-[1.05rem] leading-relaxed text-[rgba(232,230,225,0.82)]">
                    {current.detail}
                  </p>
                  <div className="mt-4 border-l border-leaf/50 pl-4">
                    <p className="label mb-1 text-[7px]! tracking-[0.24em]! text-leaf/80">
                      CHAPTER DECLASSIFIED
                    </p>
                    <p className="font-serif text-[1.02rem] italic leading-snug text-leaf/90">
                      {current.reveal}
                    </p>
                  </div>
                </>
              ) : (
                <p className="mt-4 font-serif text-[1.02rem] leading-relaxed text-faint">
                  {current.navy
                    ? "This shore lies across the strait. A navy must be built before it can be taken — this era of the life has not been lived yet."
                    : currentStatus === "locked"
                      ? `Locked. First secure: ${current.requires
                          .map((r) => provinces.find((p) => p.id === r)?.name)
                          .join(", ")}.`
                      : `An open front. Justify the campaign to declassify what happened here.`}
                </p>
              )}
            </motion.div>

            {/* the action */}
            <div className="mt-6">
              {currentStatus === "available" && (
                <button
                  type="button"
                  onClick={() => conquer(current)}
                  className={`label w-full border px-4 py-3 text-[9px]! tracking-[0.28em]! transition-colors ${
                    pp >= current.cost
                      ? "border-[rgba(212,184,134,0.5)] text-starlight hover:bg-starlight/10"
                      : "border-[rgba(232,230,225,0.12)] text-dim"
                  }`}
                >
                  {pp >= current.cost
                    ? `⚔ JUSTIFY CAMPAIGN · ${current.cost} PP`
                    : `NEED ${current.cost} PP (${Math.max(0, current.cost - pp)} MORE)`}
                </button>
              )}
              {currentStatus === "navy" && (
                <button
                  type="button"
                  onClick={() => conquer(current)}
                  className="label w-full cursor-not-allowed border border-[rgba(120,150,190,0.3)] px-4 py-3 text-[9px]! tracking-[0.28em]! text-[rgba(160,176,200,0.7)]"
                >
                  ⚓ NAVY REQUIRED · ERA UNLIVED
                </button>
              )}
              {currentStatus === "held" && current.id !== "heritage" && (
                <p className="label text-center text-[8px]! tracking-[0.26em]! text-leaf/70">
                  ✦ PROVINCE HELD
                </p>
              )}
            </div>
          </div>

          {/* campaign log */}
          <div className="border-t border-[rgba(232,230,225,0.08)] px-6 py-3">
            <p className="label mb-1.5 text-[7px]! tracking-[0.24em]! text-dim">CAMPAIGN LOG</p>
            <div className="space-y-0.5">
              {log.map((line, i) => (
                <p
                  key={i}
                  className="truncate font-mono text-[0.66rem] text-faint"
                  style={{ opacity: 1 - i * 0.14 }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <figcaption className="border-t border-[rgba(232,230,225,0.08)] px-5 py-3">
        <span className="label text-[8px]! tracking-[0.24em]! text-dim">
          SPEND POLITICAL POWER TO JUSTIFY EACH CAMPAIGN IN ORDER · FACTORIES RAISE THE TICK · THE OLD WORLD NEEDS A NAVY NOT YET BUILT
        </span>
      </figcaption>
    </figure>
  );
}
