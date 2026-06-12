"use client";
import { useEffect, useRef } from "react";
import { bodies } from "@/data/system";
import { hero } from "@/components/hero/store";

/**
 * The survey cursor — a small reticle that trails the pointer. Over links
 * it widens; over a celestial body it locks onto the planet itself and
 * names it. Desktop (fine pointer) only; the native cursor stays.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const mouse = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100, r: 14, o: 0 };
    let interactive = false;
    let visible = false;
    let raf = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      visible = true;
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      interactive = !!t?.closest?.(
        "a, button, [role=button], summary, input, textarea, select, label"
      );
    };
    const onLeave = () => {
      visible = false;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const hovered = hero.hovered ? bodies.find((b) => b.id === hero.hovered) : null;
      const lock = hovered ? hero.screen.get(hovered.id) : null;
      const docked = hero.pS > 0.7;

      // target: locked on a planet in free flight, else trailing the mouse
      let tx = mouse.x,
        ty = mouse.y,
        tr = interactive ? 22 : 14,
        to = visible ? (interactive ? 0.9 : 0.55) : 0;
      if (lock && !docked && Number.isFinite(lock.x)) {
        tx = lock.x;
        ty = lock.y;
        tr = Math.max(20, lock.r + 12);
        to = 0.95;
      }

      const k = reduced ? 1 : 1 - Math.exp(-14 * dt);
      ringPos.x += (tx - ringPos.x) * k;
      ringPos.y += (ty - ringPos.y) * k;
      ringPos.r += (tr - ringPos.r) * (reduced ? 1 : 1 - Math.exp(-10 * dt));
      ringPos.o += (to - ringPos.o) * (reduced ? 1 : 1 - Math.exp(-10 * dt));

      if (dot.current) {
        dot.current.style.transform = `translate3d(${mouse.x - 2}px, ${mouse.y - 2}px, 0)`;
        dot.current.style.opacity = visible ? "0.85" : "0";
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${ringPos.x - ringPos.r}px, ${ringPos.y - ringPos.r}px, 0)`;
        ring.current.style.width = `${ringPos.r * 2}px`;
        ring.current.style.height = `${ringPos.r * 2}px`;
        ring.current.style.opacity = String(ringPos.o);
        ring.current.style.borderColor =
          lock && !docked ? "rgba(212,184,134,0.85)" : "rgba(212,184,134,0.45)";
      }
      if (label.current) {
        const show = lock && !docked;
        label.current.style.opacity = show ? "1" : "0";
        if (show) {
          label.current.textContent = `${hovered!.name} · visit ↗`;
          label.current.style.transform = `translate3d(${ringPos.x - 60}px, ${
            ringPos.y + ringPos.r + 10
          }px, 0)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] hidden md:block">
      <div
        ref={dot}
        className="absolute left-0 top-0 h-1 w-1 rounded-full bg-starlight opacity-0"
      />
      <div
        ref={ring}
        className="absolute left-0 top-0 rounded-full border opacity-0"
        style={{ borderColor: "rgba(212,184,134,0.45)" }}
      />
      <div
        ref={label}
        className="label absolute left-0 top-0 w-[120px] text-center !text-[8px] !tracking-[0.26em] text-starlight opacity-0 transition-opacity duration-300"
      />
    </div>
  );
}
