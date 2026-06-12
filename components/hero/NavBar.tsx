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
  garden: "garden",
  about: "about",
  vault: "vault",
  quote: "quote",
  achievements: "gld-7",
};

/**
 * The docked pill — a floating capsule at the top center of the page.
 * The planets themselves are rendered by the canvas above this element
 * (still rotating); the pill provides the glass surface, the labels
 * beneath each body, and real anchor hitboxes. Geometry is shared with
 * the scene through slotCenters/sunSlotX so the two always agree.
 */
export default function NavBar() {
  const bar = useRef<HTMLDivElement>(null);
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
    const tick = () => {
      if (bar.current) {
        const o = smoothstep(hero.pS, 0.74, 0.96);
        bar.current.style.opacity = String(o);
        bar.current.style.transform = `translateY(${(1 - o) * -12}px)`;
        bar.current.style.pointerEvents = o > 0.6 ? "auto" : "none";
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
          className="absolute top-0 h-full rounded-full border border-[rgba(232,230,225,0.14)] bg-[rgba(6,7,12,0.72)] shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(232,230,225,0.06)] backdrop-blur-xl"
          style={{ left: geom.pill.left, width: geom.pill.width }}
        />

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
