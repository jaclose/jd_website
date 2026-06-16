"use client";

import { useMemo, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Deployment } from "@/data/deployments";

interface DuelCardProps {
  deployment: Deployment;
  tilt?: boolean;
  mouseX?: number;
  mouseY?: number;
}

export function DuelCard({ deployment: d, tilt = false, mouseX = 0, mouseY = 0 }: DuelCardProps) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });
  const glareX = useTransform(sry, [-12, 12], ["0%", "100%"]);
  const glareY = useTransform(srx, [12, -12], ["0%", "100%"]);
  const cardRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tilt) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 18);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 18);
  };

  const hasArt = d.art || d.id === "noctyrium";

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={onMove}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={tilt ? { rotateX: srx, rotateY: sry, transformPerspective: 1000 } : undefined}
      className="group relative h-full w-full rounded-[12px] border-2 border-[rgba(212,184,134,0.5)] bg-[linear-gradient(160deg,#12182a,#0a0e18)] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.7)]"
    >
      {/* Prismatic glow aura (rare cards) */}
      {d.rarity !== "common" && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-[16px] bg-[radial-gradient(circle_at_50%_30%,rgba(120,110,200,0.4),transparent_70%)] opacity-60 blur-md"
          />
          {/* Crystal bloom effect */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-3 rounded-[20px] bg-[radial-gradient(circle_at_50%_40%,rgba(195,166,255,0.2),transparent_60%)] opacity-40 blur-xl group-hover:opacity-70 transition-opacity duration-300"
          />
        </>
      )}

      <div className="relative flex h-full flex-col [transform-style:preserve-3d]">
        {/* Name + attribute */}
        <div className="flex items-center justify-between gap-2 px-0.5" style={{ transform: "translateZ(12px)" }}>
          <h3 className="truncate font-display text-[clamp(0.9rem,1.4vw,1.2rem)] font-light leading-none text-ink">
            {d.name}
          </h3>
          <span
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[rgba(212,184,134,0.6)] bg-[rgba(212,184,134,0.12)] text-[7px] text-starlight"
            title={d.attribute}
          >
            ✦
          </span>
        </div>

        {/* Level stars */}
        <div className="mt-1 flex justify-end gap-0.5 px-0.5" style={{ transform: "translateZ(10px)" }}>
          {Array.from({ length: d.level }, (_, i) => (
            <span key={i} className="text-[0.6rem] leading-none text-starlight">
              ◈
            </span>
          ))}
        </div>

        {/* Art window with crystal glow */}
        <div
          className="relative mt-1.5 aspect-square w-full overflow-hidden rounded-[4px] border border-[rgba(212,184,134,0.3)] bg-[#05080f]"
          style={{ transform: "translateZ(16px)" }}
        >
          {hasArt && (
            <>
              {/* Artwork */}
              <img
                src={d.art || "/cards/noctyrium.png"}
                alt={d.name}
                className="h-full w-full object-contain"
              />
              {/* Bloom/glow overlay on artwork */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(195,166,255,0.15),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            </>
          )}
          <span className="label absolute left-1.5 top-1.5 text-[5px]! tracking-[0.2em]! text-starlight/80">
            {d.rarity.toUpperCase()}
          </span>
        </div>

        {/* Type line */}
        <p
          className="label mt-1.5 border-y border-[rgba(212,184,134,0.25)] py-1 text-[6.5px]! tracking-[0.12em]! text-starlight/90"
          style={{ transform: "translateZ(8px)" }}
        >
          [ {d.cardType.toUpperCase()} ]
        </p>

        {/* Effect text */}
        <p className="mt-1.5 font-serif text-[0.62rem] italic leading-tight text-faint">{d.effect}</p>

        {/* Footer stats */}
        <div
          className="mt-auto flex items-end justify-end gap-3 border-t border-[rgba(212,184,134,0.2)] pt-1"
          style={{ transform: "translateZ(8px)" }}
        >
          <span className="label text-[6px]! text-dim">
            BUILD <span className="text-starlight">{d.stats.version}</span>
          </span>
          <span className="label text-[6px]! text-dim">
            <span className="text-ink">{d.stats.platform}</span>
          </span>
        </div>
      </div>

      {/* Holographic foil effect */}
      {d.rarity !== "common" && (
        <>
          <motion.span
            aria-hidden
            style={{ left: glareX, top: glareY }}
            className="pointer-events-none absolute h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(180,170,240,0.3),transparent_55%)] opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-100"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[12px] bg-[linear-gradient(115deg,transparent_28%,rgba(127,212,232,0.18)_44%,rgba(180,150,236,0.22)_50%,rgba(212,184,134,0.18)_56%,transparent_70%)] bg-[length:300%_100%] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:[animation:duel-foil_2.4s_linear_infinite]"
          />
        </>
      )}

      <style>{`
        @keyframes duel-foil {
          0% { background-position: 0% 0; }
          100% { background-position: 300% 0; }
        }
      `}</style>
    </motion.div>
  );
}
