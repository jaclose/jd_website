"use client";
import { useEffect, useRef } from "react";
import { bodies } from "@/data/system";
import { hero } from "@/components/hero/store";

const ROMAN = ["I", "II", "III"];

function nameFor(id: string): string | null {
  const moon = id.match(/^(.+)-moon-(\d)$/);
  if (moon) {
    const parent = bodies.find((b) => b.id === moon[1]);
    return parent ? `moon ${ROMAN[Number(moon[2])] ?? ""}` : null;
  }
  return bodies.find((b) => b.id === id)?.name ?? null;
}

/**
 * The survey reticle. Invisible everywhere — it only appears when a
 * celestial body is under scan, locking onto the body itself with its
 * name beneath. No trailing circle anywhere else on the site.
 */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cur = { x: 0, y: 0, r: 20, o: 0 };
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const id = hero.hovered;
      const lock = id && hero.pS < 0.7 ? hero.screen.get(id) : null;
      const show = !!(lock && Number.isFinite(lock.x));

      if (show && lock) {
        const tr = Math.max(16, lock.r + 10);
        if (cur.o < 0.05) {
          // appear at the body, not lerped in from elsewhere
          cur.x = lock.x;
          cur.y = lock.y;
          cur.r = tr;
        }
        const k = reduced ? 1 : 1 - Math.exp(-16 * dt);
        cur.x += (lock.x - cur.x) * k;
        cur.y += (lock.y - cur.y) * k;
        cur.r += (tr - cur.r) * k;
        cur.o += (0.95 - cur.o) * (reduced ? 1 : 1 - Math.exp(-12 * dt));
      } else {
        cur.o += (0 - cur.o) * (reduced ? 1 : 1 - Math.exp(-14 * dt));
      }

      if (ring.current) {
        ring.current.style.transform = `translate3d(${cur.x - cur.r}px, ${cur.y - cur.r}px, 0)`;
        ring.current.style.width = `${cur.r * 2}px`;
        ring.current.style.height = `${cur.r * 2}px`;
        ring.current.style.opacity = String(cur.o);
      }
      if (label.current) {
        label.current.style.opacity = String(cur.o);
        if (show && id) {
          const name = nameFor(id);
          if (name) label.current.textContent = name;
          label.current.style.transform = `translate3d(${cur.x - 70}px, ${cur.y + cur.r + 9}px, 0)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-90 hidden md:block">
      <div
        ref={ring}
        className="absolute left-0 top-0 rounded-full border border-starlight/80 opacity-0"
      >
        {/* reticle ticks at the four cardinal points */}
        <span className="absolute -top-0.75 left-1/2 h-1.75 w-px -translate-x-1/2 bg-starlight/90" />
        <span className="absolute -bottom-0.75 left-1/2 h-1.75 w-px -translate-x-1/2 bg-starlight/90" />
        <span className="absolute -left-0.75 top-1/2 h-px w-1.75 -translate-y-1/2 bg-starlight/90" />
        <span className="absolute -right-0.75 top-1/2 h-px w-1.75 -translate-y-1/2 bg-starlight/90" />
      </div>
      <div
        ref={label}
        className="label absolute left-0 top-0 w-35 text-center text-[8px]! tracking-[0.26em]! text-starlight opacity-0"
      />
    </div>
  );
}
