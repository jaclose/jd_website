"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { bodies } from "@/data/system";
import { hero, setHovered, requestUnhover, slotCenters, smoothstep, BAR_H } from "./store";

/**
 * The docked bar. The planets themselves are rendered by the canvas above
 * this element — the bar provides the surface, the wordmark, and real
 * anchor hitboxes (with names) under each docked body.
 */
export default function NavBar() {
  const bar = useRef<HTMLElement>(null);
  const [centers, setCenters] = useState<number[]>([]);

  useEffect(() => {
    const measure = () => setCenters(slotCenters(bodies.length, window.innerWidth));
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
        bar.current.style.pointerEvents = o > 0.6 ? "auto" : "none";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <header
      ref={bar}
      style={{ height: BAR_H, opacity: 0 }}
      className="fixed inset-x-0 top-0 z-30 border-b border-[rgba(232,230,225,0.1)] bg-[rgba(5,6,10,0.78)] backdrop-blur-md"
    >
      <nav aria-label="Primary" className="relative h-full">
        {/* the sun docks at x≈26 — the wordmark sits just after it */}
        <Link
          href="/"
          className="absolute left-12 top-1/2 -translate-y-1/2 font-display text-[0.95rem] tracking-[0.08em] text-ink transition-colors hover:text-starlight"
        >
          Jafar Dabbagh
        </Link>
        <span className="label absolute left-12 top-1/2 mt-2.5 hidden translate-y-1.5 !text-[8px] !tracking-[0.3em] text-dim lg:block">
          SYS JD-1184 · ONLINE
        </span>

        {centers.map((x, i) => {
          const b = bodies[i];
          return (
            <Link
              key={b.id}
              href={b.href}
              aria-label={b.name}
              onMouseEnter={() => setHovered(b.id)}
              onMouseLeave={() => requestUnhover(b.id)}
              onClick={() => setHovered(null)}
              className="group absolute top-0 flex h-full w-16 flex-col items-center justify-end pb-[7px]"
              style={{ left: x - 32 }}
            >
              <span className="label hidden !text-[8px] !tracking-[0.18em] text-dim transition-colors group-hover:text-starlight sm:block">
                {b.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
