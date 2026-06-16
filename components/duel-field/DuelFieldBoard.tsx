"use client";

import React from "react";

interface DuelFieldBoardProps {
  active?: boolean;
  mouseX?: number;
  mouseY?: number;
  summoning?: boolean;
}

export function DuelFieldBoard({ active = false, mouseX = 0, mouseY = 0, summoning = false }: DuelFieldBoardProps) {
  const boardRef = React.useRef<HTMLDivElement>(null);

  // Calculate zone highlight based on cursor
  const getZoneGlow = (zoneIndex: number) => {
    if (!active || !boardRef.current || !mouseX || !mouseY) return 0;

    const board = boardRef.current;
    const rect = board.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Center zone is index 12 (row 2, col 2 in 5x4 grid)
    if (zoneIndex !== 12) return 0;

    const dx = mouseX - rect.left - centerX;
    const dy = mouseY - rect.top - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 150;

    if (dist < maxDist) {
      return (1 - dist / maxDist) * 0.6;
    }
    return 0;
  };

  return (
    <div
      ref={boardRef}
      className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2"
      style={{ perspective: 1500 }}
    >
      <style>{`
        @keyframes duel-zone-pulse {
          0%, 100% { box-shadow: inset 0 0 20px rgba(212, 184, 134, 0.1); }
          50% { box-shadow: inset 0 0 40px rgba(212, 184, 134, 0.25); }
        }
        @keyframes duel-summon-ring {
          0% { 
            opacity: 1;
            transform: scale(0.8);
          }
          100% { 
            opacity: 0;
            transform: scale(2.2);
          }
        }
        .duel-zone-pulse {
          animation: duel-zone-pulse 2s ease-in-out infinite;
        }
        .duel-summon-ring {
          animation: duel-summon-ring 0.8s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }
      `}</style>

      <div
        className="relative grid grid-cols-5 grid-rows-4 gap-[1.4%] rounded-[30px] border border-[rgba(160,180,220,0.22)] bg-[linear-gradient(180deg,rgba(24,34,56,0.6),rgba(8,12,22,0.85))] p-[2.2%] shadow-[0_60px_120px_rgba(0,0,0,0.7)]"
        style={{
          width: "min(78vw,1040px)",
          height: "min(52vw,680px)",
          transform: "rotateX(58deg)",
        }}
      >
        {Array.from({ length: 20 }, (_, i) => {
          const isMonsterCenter = i === 12;
          const glowIntensity = getZoneGlow(i);

          return (
            <div
              key={i}
              className="rounded-[6px] border transition-all duration-200"
              style={{
                borderColor: isMonsterCenter
                  ? `rgba(212,184,134,${0.55 + glowIntensity})`
                  : `rgba(120,150,200,${0.14 + glowIntensity * 0.3})`,
                background: isMonsterCenter
                  ? `radial-gradient(circle,rgba(212,184,134,${0.18 + glowIntensity * 0.4}),transparent 70%)`
                  : `linear-gradient(180deg,rgba(40,56,86,${0.18 + glowIntensity * 0.2}),rgba(10,16,28,${0.25 + glowIntensity * 0.15}))`,
                boxShadow: isMonsterCenter
                  ? `inset 0 0 ${30 + glowIntensity * 20}px rgba(212,184,134,${0.25 + glowIntensity * 0.5})`
                  : "none",
              }}
            />
          );
        })}

        {/* Center medallion */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(160,180,220,0.18)] bg-[radial-gradient(circle,rgba(60,80,120,0.16),transparent_70%)]"
          style={{
            boxShadow: summoning
              ? "0 0 40px rgba(212, 184, 134, 0.4), inset 0 0 30px rgba(160, 220, 240, 0.2)"
              : undefined,
          }}
        />

        {/* Summoning ring effect */}
        {summoning && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[rgba(212,184,134,0.6)] duel-summon-ring"
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
