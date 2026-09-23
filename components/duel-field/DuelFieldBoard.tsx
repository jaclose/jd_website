"use client";

import React from "react";

/**
 * The duel field, laid out as an actual Master-Duel-era board rather than a
 * plain grid: 7 columns per side — Field Spell, five Monster Zones and the
 * Graveyard in the front row; Extra Deck, five Spell & Trap Zones and the Main
 * Deck in the back row — with the opponent's side rotated 180° above, and an
 * Extra Monster Zone band between them where the summon lands.
 *
 * Styling stays in the site's register: hairline rules, starlight gold on
 * space navy, mono micro-labels. A duel field read as an instrument panel.
 */

type ZoneKind = "monster" | "spell" | "field" | "grave" | "deck" | "extra" | "emz" | "emz-side" | "empty";

interface Zone {
  kind: ZoneKind;
  label?: string;
  /** the cell the summon resolves into */
  summonTarget?: boolean;
}

const M = (label: string): Zone => ({ kind: "monster", label });
const S = (label: string): Zone => ({ kind: "spell", label });
const z = (kind: ZoneKind, label?: string, summonTarget = false): Zone => ({ kind, label, summonTarget });
const EMPTY: Zone = { kind: "empty" };

/** Opponent's side is rotated 180°, so its rows read right-to-left. */
const ROWS: Zone[][] = [
  // opponent back row
  [z("deck", "DECK"), S("T5"), S("T4"), S("T3"), S("T2"), S("T1"), z("extra", "EXTRA")],
  // opponent front row
  [z("grave", "GY"), M("V"), M("IV"), M("III"), M("II"), M("I"), z("field", "FIELD")],
  // the contested band
  [EMPTY, EMPTY, z("emz-side"), z("emz", "EXTRA MONSTER", true), z("emz-side"), EMPTY, EMPTY],
  // player front row
  [z("field", "FIELD"), M("I"), M("II"), M("III"), M("IV"), M("V"), z("grave", "GY")],
  // player back row
  [z("extra", "EXTRA"), S("T1"), S("T2"), S("T3"), S("T4"), S("T5"), z("deck", "DECK")],
];

const GOLD = "212,184,134";
const STEEL = "120,150,200";

function zoneStyle(kind: ZoneKind, glow: number): React.CSSProperties {
  switch (kind) {
    case "emz":
      return {
        borderColor: `rgba(${GOLD},${0.6 + glow * 0.4})`,
        background: `radial-gradient(circle,rgba(${GOLD},${0.16 + glow * 0.34}),transparent 72%)`,
        boxShadow: `inset 0 0 ${26 + glow * 26}px rgba(${GOLD},${0.22 + glow * 0.45})`,
      };
    case "emz-side":
      return {
        borderColor: `rgba(${GOLD},0.3)`,
        background: `linear-gradient(180deg,rgba(${GOLD},0.07),rgba(10,16,28,0.3))`,
      };
    case "monster":
      return {
        borderColor: `rgba(${GOLD},0.34)`,
        background: `linear-gradient(180deg,rgba(60,52,34,0.28),rgba(10,16,28,0.34))`,
      };
    case "spell":
      return {
        borderColor: `rgba(${STEEL},0.28)`,
        background: `linear-gradient(180deg,rgba(40,56,86,0.24),rgba(10,16,28,0.3))`,
      };
    case "field":
      return {
        borderColor: `rgba(159,206,143,0.3)`,
        background: `linear-gradient(180deg,rgba(40,70,50,0.22),rgba(10,16,28,0.3))`,
      };
    case "grave":
      return {
        borderColor: `rgba(${STEEL},0.2)`,
        background: `repeating-linear-gradient(135deg,rgba(90,110,150,0.12) 0 3px,transparent 3px 7px)`,
      };
    case "deck":
    case "extra":
      return {
        borderColor: `rgba(${STEEL},0.24)`,
        background: `linear-gradient(180deg,rgba(28,40,64,0.4),rgba(8,12,22,0.5))`,
      };
    default:
      return { borderColor: "transparent", background: "transparent" };
  }
}

interface DuelFieldBoardProps {
  active?: boolean;
  mouseX?: number;
  mouseY?: number;
  summoning?: boolean;
}

export function DuelFieldBoard({ active = false, mouseX = 0, mouseY = 0, summoning = false }: DuelFieldBoardProps) {
  const boardRef = React.useRef<HTMLDivElement>(null);

  /** Proximity glow, applied only to the summon zone. */
  const summonGlow = React.useMemo(() => {
    if (!active || !boardRef.current || !mouseX || !mouseY) return 0;
    const rect = boardRef.current.getBoundingClientRect();
    const dx = mouseX - (rect.left + rect.width / 2);
    const dy = mouseY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    const maxDist = 180;
    return dist < maxDist ? (1 - dist / maxDist) * 0.6 : 0;
  }, [active, mouseX, mouseY]);

  return (
    <div
      ref={boardRef}
      className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2"
      style={{ perspective: 1500 }}
    >
      <style>{`
        @keyframes duel-summon-ring {
          0%   { opacity: 0.55; transform: translate(-50%,-50%) scale(0.8); }
          100% { opacity: 0;    transform: translate(-50%,-50%) scale(2.2); }
        }
        .duel-summon-ring { animation: duel-summon-ring 1.1s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes duel-emz-breathe {
          0%,100% { opacity: 0.55; }
          50%     { opacity: 1; }
        }
        .duel-emz-breathe { animation: duel-emz-breathe 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .duel-summon-ring, .duel-emz-breathe { animation: none !important; }
        }
      `}</style>

      <div
        className="relative grid grid-cols-7 gap-[0.9%] rounded-[30px] border border-[rgba(160,180,220,0.22)] bg-[linear-gradient(180deg,rgba(24,34,56,0.6),rgba(8,12,22,0.85))] p-[2%] shadow-[0_60px_120px_rgba(0,0,0,0.7)]"
        style={{
          width: "min(78vw,1040px)",
          height: "min(52vw,680px)",
          transform: "rotateX(58deg)",
          gridTemplateRows: "1fr 1fr 0.62fr 1fr 1fr",
        }}
      >
        {ROWS.flatMap((row, r) =>
          row.map((zone, c) => {
            if (zone.kind === "empty") return <div key={`${r}-${c}`} aria-hidden />;
            const glow = zone.summonTarget ? summonGlow : 0;
            const opponent = r < 2;
            return (
              <div
                key={`${r}-${c}`}
                className={`relative rounded-[5px] border transition-all duration-200 ${
                  zone.summonTarget ? "duel-emz-breathe" : ""
                }`}
                style={{ ...zoneStyle(zone.kind, glow), opacity: opponent ? 0.62 : 1 }}
              >
                {zone.label && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 grid place-items-center text-center font-mono uppercase leading-none"
                    style={{
                      fontSize: zone.kind === "emz" ? "clamp(4px,0.62vw,9px)" : "clamp(3px,0.46vw,7px)",
                      letterSpacing: "0.22em",
                      color:
                        zone.kind === "emz"
                          ? `rgba(${GOLD},0.92)`
                          : zone.kind === "monster"
                            ? `rgba(${GOLD},0.42)`
                            : "rgba(150,170,205,0.34)",
                      transform: opponent ? "rotate(180deg)" : undefined,
                    }}
                  >
                    {zone.label}
                  </span>
                )}
              </div>
            );
          }),
        )}

        {/* Summoning ring, centred on the Extra Monster Zone */}
        {summoning && (
          <span
            aria-hidden
            className="duel-summon-ring pointer-events-none absolute left-1/2 top-1/2 h-[26%] w-[16%] rounded-full border border-[rgba(212,184,134,0.34)]"
          />
        )}
      </div>

      {/* Atmospheric board glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-[30px] bg-[radial-gradient(ellipse_at_50%_50%,rgba(100,80,180,0.15),transparent_70%)]"
        style={{
          filter: "blur(40px)",
          opacity: active ? 0.6 : 0.2,
          transition: "opacity 0.3s ease",
        }}
      />
    </div>
  );
}
