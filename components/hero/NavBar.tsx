"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { bodies } from "@/data/system";
import {
  hero,
  setHovered,
  requestUnhover,
  slotCenters,
  slotSpacing,
  sunSlotX,
  pillBounds,
  smoothstep,
  BAR_TOP,
  BAR_H,
} from "./store";

/** short labels that fit a pill slot without clipping the planet */
const SHORT: Record<string, string> = {
  essays: "essays",
  "field-notes": "notes",
  garden: "sanctum",
  about: "about",
  vault: "vault",
  quote: "quote",
  achievements: "gld-7",
};

const reduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// must mirror useGenie's stagger so pulses fire exactly on arrival
const STAG = 0.04;
function slotProgress(pS: number, index: number, count: number) {
  const pi = (pS - index * STAG) / (1 - STAG * (count - 1));
  return Math.min(1, Math.max(0, pi));
}

/**
 * The docked pill — a floating capsule at the top center of the page.
 * The planets themselves are rendered by the canvas above this element
 * (still rotating); the pill provides the glass surface, the labels
 * beneath each body, and real anchor hitboxes. Geometry is shared with
 * the scene through slotCenters/sunSlotX so the two always agree.
 */
export default function NavBar() {
  const bar = useRef<HTMLDivElement>(null);
  const drawRect = useRef<SVGRectElement>(null);
  const pulses = useRef<(HTMLSpanElement | null)[]>([]);
  const prevPi = useRef<number[]>([]);
  const [geom, setGeom] = useState<{
    centers: number[];
    sun: number;
    pill: { left: number; width: number };
    spacing: number;
  } | null>(null);

  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      setGeom({
        centers: slotCenters(bodies.length, w),
        sun: sunSlotX(bodies.length, w),
        pill: pillBounds(bodies.length, w),
        spacing: slotSpacing(bodies.length, w),
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    let raf = 0;
    const count = bodies.length + 1; // sun + bodies, matching the scene
    const tick = () => {
      if (bar.current) {
        const o = smoothstep(hero.pS, 0.74, 0.96);
        bar.current.style.opacity = String(o);
        bar.current.style.transform = `translateY(${(1 - o) * -12}px)`;
        bar.current.style.pointerEvents = o > 0.6 ? "auto" : "none";

        // the pill hairline draws itself once the bodies start settling
        if (drawRect.current) {
          const draw = smoothstep(hero.pS, 0.8, 0.995);
          drawRect.current.style.strokeDashoffset = String((1 - draw) * 100);
          // bright while drawing, settling to a faint gold seam
          drawRect.current.style.opacity = String(0.2 * draw + draw * (1 - draw) * 1.5);
        }

        // arrival pulses, in slot order — a 60ms breath as each body docks
        for (let i = 0; i < count; i++) {
          const pi = slotProgress(hero.pS, i, count);
          const prev = prevPi.current[i] ?? 0;
          if (!reduced && o > 0.4 && prev < 0.985 && pi >= 0.985) {
            pulses.current[i]?.animate(
              [
                { opacity: 0.85, transform: "scale(0.55)" },
                { opacity: 0, transform: "scale(1.55)" },
              ],
              { duration: 460, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }
            );
          }
          prevPi.current[i] = pi;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!geom) return null;

  return (
    <div
      ref={bar}
      style={{ opacity: 0, top: BAR_TOP, height: BAR_H }}
      className="fixed inset-x-0 z-30"
    >
      <nav aria-label="Primary" className="relative h-full">
        {/* the pill */}
        <div
          aria-hidden
          className="absolute top-0 h-full rounded-full border border-hairline bg-[rgba(7,8,13,0.84)] shadow-[0_10px_44px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(232,230,225,0.08),inset_0_-8px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
          style={{ left: geom.pill.left, width: geom.pill.width }}
        />

        {/* the hairline that draws itself as the system finishes docking */}
        <svg
          aria-hidden
          className="absolute top-0 h-full overflow-visible"
          style={{ left: geom.pill.left, width: geom.pill.width }}
        >
          <rect
            ref={drawRect}
            x="0.5"
            y="0.5"
            width={geom.pill.width - 1}
            height={BAR_H - 1}
            rx={(BAR_H - 1) / 2}
            pathLength={100}
            fill="none"
            stroke="#d4b886"
            strokeWidth="1"
            strokeDasharray="100"
            strokeDashoffset="100"
            opacity="0"
          />
        </svg>

        {/* arrival pulse rings, one per slot (sun first) */}
        {[geom.sun, ...geom.centers].map((x, i) => (
          <span
            key={i}
            ref={(el) => {
              pulses.current[i] = el;
            }}
            aria-hidden
            className="pointer-events-none absolute rounded-full border border-[rgba(212,184,134,0.85)] opacity-0 shadow-[0_0_16px_rgba(212,184,134,0.55)]"
            style={{ left: x - 14, top: 10, width: 28, height: 28 }}
          />
        ))}

        {/* the sun — home */}
        <Link
          href="/"
          aria-label="Home"
          className="group absolute top-0 flex h-full flex-col items-center justify-end pb-1.5"
          style={{ left: geom.sun - geom.spacing / 2, width: geom.spacing }}
        >
          <span className="label text-[6.5px]! tracking-[0.22em]! text-dim transition-colors group-hover:text-starlight">
            HOME
          </span>
        </Link>
        <span
          aria-hidden
          className="absolute top-2.5 h-9.5 w-px bg-[rgba(232,230,225,0.1)]"
          style={{ left: geom.sun + geom.spacing / 2 }}
        />

        {geom.centers.map((x, i) => {
          const b = bodies[i];
          return (
            <Link
              key={b.id}
              href={b.href}
              aria-label={b.name}
              onMouseEnter={() => setHovered(b.id)}
              onMouseLeave={() => requestUnhover(b.id)}
              onClick={() => setHovered(null)}
              className="group absolute top-0 flex h-full flex-col items-center justify-end pb-1.5"
              style={{ left: x - geom.spacing / 2, width: geom.spacing }}
            >
              <span className="label whitespace-nowrap text-[6.5px]! tracking-[0.2em]! text-dim transition-colors group-hover:text-starlight">
                {SHORT[b.id] ?? b.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
