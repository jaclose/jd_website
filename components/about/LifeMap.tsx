"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { provinces, supplyRoute, type Province } from "@/data/lifemap";
import { essays, fieldNotes } from "@/lib/content";
import { works } from "@/data/works";
import { unlockVisitor } from "@/lib/visitor";

/** the national ledger — Hearts-of-Iron top-bar stats, distilled */
const LEDGER: { icon: string; label: string; value: string; tone: string }[] = [
  { icon: "✒", label: "political power", value: `${essays.length * 25}`, tone: "text-starlight" },
  { icon: "▣", label: "civilian factories", value: String(works.length), tone: "text-faint" },
  { icon: "✦", label: "divisions", value: String(fieldNotes.length), tone: "text-comet" },
  { icon: "☪", label: "stability", value: "100%", tone: "text-leaf" },
  { icon: "⚗", label: "research slots", value: "2", tone: "text-faint" },
];

const KIND_FILL: Record<Province["kind"], string> = {
  homeland: "rgba(212,184,134,0.10)",
  campaign: "rgba(178,108,98,0.10)",
  industry: "rgba(154,164,184,0.10)",
  capital: "rgba(212,184,134,0.18)",
  frontier: "rgba(159,206,143,0.07)",
};
const KIND_LABEL: Record<Province["kind"], string> = {
  homeland: "homeland",
  campaign: "campaign",
  industry: "industry",
  capital: "capital",
  frontier: "frontier",
};

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
          <rect x={x - 4} y={y - 4} width="8" height="8" fill="none" stroke="#9aa4b8" strokeWidth="1" />
          <rect x={x - 1.5} y={y - 1.5} width="3" height="3" fill="#9aa4b8" />
        </g>
      );
    case "port":
      return (
        <g stroke="#9fd8e8" strokeWidth="1" fill="none">
          <circle cx={x} cy={y - 2} r="2.4" />
          <path d={`M${x},${y + 0.5} L${x},${y + 5} M${x - 4},${y + 3} Q${x},${y + 7} ${x + 4},${y + 3}`} />
        </g>
      );
    default: // city
      return (
        <g>
          <circle cx={x} cy={y} r="2.2" fill="#e8e6e1" />
          <circle cx={x} cy={y} r="5" fill="none" stroke="rgba(232,230,225,0.4)" strokeWidth="0.8" />
        </g>
      );
  }
}

/**
 * The Dominion — the about page as a Hearts-of-Iron strategic map.
 * Hover (or tap) a province to read its chapter; survey all of them
 * and the Cartographer achievement is yours.
 */
export default function LifeMap() {
  const [active, setActive] = useState<string>(provinces[0].id);
  const [visited, setVisited] = useState<Set<string>>(() => new Set([provinces[0].id]));
  const current = useMemo(
    () => provinces.find((p) => p.id === active) ?? provinces[0],
    [active]
  );

  useEffect(() => {
    if (visited.size === provinces.length) unlockVisitor("cartographer");
  }, [visited]);

  const visit = (id: string) => {
    setActive(id);
    setVisited((v) => (v.has(id) ? v : new Set(v).add(id)));
  };

  return (
    <figure className="border border-[rgba(232,230,225,0.1)]">
      {/* chart header */}
      <div className="flex items-baseline justify-between border-b border-[rgba(232,230,225,0.1)] bg-[rgba(232,230,225,0.025)] px-5 py-3">
        <span className="label text-[9px]! tracking-[0.3em]! text-starlight/80">
          THE DOMINION · STRATEGIC SURVEY OF A LIFE
        </span>
        <span className="label hidden text-[8px]! text-dim sm:block">
          SURVEYED {visited.size} / {provinces.length}
        </span>
      </div>

      {/* the national ledger */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[rgba(232,230,225,0.08)] px-5 py-2.5">
        {LEDGER.map((s) => (
          <span key={s.label} className="flex items-baseline gap-2 font-mono">
            <span aria-hidden className={`text-[0.8rem] ${s.tone}`}>
              {s.icon}
            </span>
            <span className={`text-[0.78rem] ${s.tone}`}>{s.value}</span>
            <span className="label text-[7px]! tracking-[0.18em]! text-dim">
              {s.label.toUpperCase()}
            </span>
          </span>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.7fr_1fr]">
        {/* ——— the map ——— */}
        <svg
          viewBox="0 0 1000 560"
          className="w-full"
          role="img"
          aria-label="A strategic map of life chapters drawn as provinces"
        >
          {/* ocean grid */}
          {Array.from({ length: 13 }, (_, i) => (
            <line
              key={`gx-${i}`}
              x1={(i + 1) * 72}
              y1="0"
              x2={(i + 1) * 72}
              y2="560"
              stroke="rgba(232,230,225,0.03)"
            />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <line
              key={`gy-${i}`}
              x1="0"
              y1={(i + 1) * 72}
              x2="1000"
              y2={(i + 1) * 72}
              stroke="rgba(232,230,225,0.03)"
            />
          ))}

          {/* frontier hatching */}
          <defs>
            <pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(159,206,143,0.16)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* supply route, run before provinces so it sits beneath labels */}
          <path
            d={`M${supplyRoute.map(([x, y]) => `${x},${y}`).join(" L")}`}
            fill="none"
            stroke="rgba(212,184,134,0.3)"
            strokeWidth="1"
            strokeDasharray="3 6"
          />

          {provinces.map((p) => {
            const isActive = p.id === active;
            return (
              <g
                key={p.id}
                onMouseEnter={() => visit(p.id)}
                onClick={() => visit(p.id)}
                className="cursor-pointer"
                role="button"
                aria-label={p.name}
              >
                <motion.path
                  d={p.d}
                  fill={p.kind === "frontier" ? "url(#hatch)" : KIND_FILL[p.kind]}
                  stroke={isActive ? "#d4b886" : "rgba(232,230,225,0.28)"}
                  strokeWidth={isActive ? 1.6 : 1}
                  animate={{
                    opacity: isActive ? 1 : 0.82,
                    scale: isActive ? 1.012 : 1,
                  }}
                  style={{ transformOrigin: `${p.label[0]}px ${p.label[1]}px` }}
                  transition={{ duration: 0.3 }}
                />
                {p.kind === "frontier" && (
                  <path d={p.d} fill={KIND_FILL.frontier} stroke="none" />
                )}
                {(p.marks ?? []).map((m, i) => (
                  <Mark key={i} x={m.x} y={m.y} type={m.type} />
                ))}
                <text
                  x={p.label[0]}
                  y={p.label[1] + (p.id === "undergrad" ? 34 : 22)}
                  textAnchor="middle"
                  fontSize="10.5"
                  letterSpacing="2.2"
                  fill={isActive ? "#d4b886" : "rgba(232,230,225,0.6)"}
                  style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" }}
                >
                  {p.name.toUpperCase()}
                </text>
                {visited.has(p.id) && (
                  <circle
                    cx={p.label[0]}
                    cy={p.label[1] + (p.id === "undergrad" ? 44 : 32)}
                    r="1.6"
                    fill="#9fce8f"
                  />
                )}
              </g>
            );
          })}

          {/* compass */}
          <g transform="translate(64,492)" stroke="rgba(232,230,225,0.4)" fill="none">
            <circle r="16" />
            <path d="M0,-16 L4,0 L0,16 L-4,0 Z" fill="rgba(212,184,134,0.5)" stroke="none" />
            <text y="-22" textAnchor="middle" fontSize="9" fill="rgba(232,230,225,0.5)" style={{ fontFamily: "var(--font-mono)" }}>
              N
            </text>
          </g>
          {/* scale bar */}
          <g transform="translate(120,540)">
            <line x1="0" y1="0" x2="120" y2="0" stroke="rgba(232,230,225,0.35)" />
            {[0, 40, 80, 120].map((x) => (
              <line key={x} x1={x} y1="-3" x2={x} y2="3" stroke="rgba(232,230,225,0.35)" />
            ))}
            <text x="60" y="-7" textAnchor="middle" fontSize="8" fill="rgba(232,230,225,0.4)" style={{ fontFamily: "var(--font-mono)", letterSpacing: 2 }}>
              ONE SEASON
            </text>
          </g>
        </svg>

        {/* ——— intel panel ——— */}
        <div className="border-t border-[rgba(232,230,225,0.1)] p-6 lg:border-l lg:border-t-0">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="label text-[8px]! tracking-[0.26em]! text-dim">
              {KIND_LABEL[current.kind].toUpperCase()} · {current.era.toUpperCase()}
            </p>
            <h3 className="mt-2 font-display text-2xl font-light text-ink">
              {current.name}
            </h3>
            <p className="label mt-2 text-[9px]! tracking-[0.2em]! text-starlight/80">
              {current.role.toUpperCase()}
            </p>
            <p className="mt-4 font-serif text-[1.05rem] leading-relaxed text-[rgba(232,230,225,0.78)]">
              {current.detail}
            </p>
            {current.classified && (
              <p className="label mt-4 border border-[rgba(212,184,134,0.3)] px-3 py-2 text-[8px]! tracking-[0.24em]! text-starlight/70">
                ⚠ INTEL PENDING — AWAITING DECLASSIFICATION BY THE AUTHOR
              </p>
            )}
          </motion.div>

          {/* legend */}
          <div className="mt-8 grid grid-cols-2 gap-2 border-t border-[rgba(232,230,225,0.08)] pt-5">
            {[
              ["✦", "victory point"],
              ["●", "city"],
              ["▣", "factory"],
              ["⚓", "port"],
            ].map(([glyph, name]) => (
              <span key={name} className="label text-[8px]! tracking-[0.2em]! text-dim">
                <span className="mr-2 text-faint">{glyph}</span>
                {name.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="border-t border-[rgba(232,230,225,0.08)] px-5 py-3">
        <span className="label text-[8px]! tracking-[0.24em]! text-dim">
          HOVER THE PROVINCES TO SURVEY · DASHED LINE IS THE SUPPLY ROUTE OF A LIFE · SOME RECORDS REMAIN SEALED
        </span>
      </figcaption>
    </figure>
  );
}
