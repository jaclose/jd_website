"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { bodies } from "@/data/system";
import { hero, useHovered, setHovered, requestUnhover, BAR_H } from "./store";

const CARD_W = 330;
const GAP = 30;

/**
 * The scan card: a thin line draws from the hovered body to a panel of
 * information. Positions are updated imperatively from the scene's
 * published screen coordinates — React only mounts/unmounts the card.
 */
export default function HoverCard() {
  const hovered = useHovered();
  const body = bodies.find((b) => b.id === hovered);

  const card = useRef<HTMLDivElement>(null);
  const line = useRef<SVGLineElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const drawStart = useRef(0);

  useEffect(() => {
    if (!hovered) return;
    drawStart.current = performance.now();
    let raf = 0;
    const tick = () => {
      const s = hero.screen.get(hovered);
      const el = card.current;
      if (s && el) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cardH = el.offsetHeight || 200;
        const docked = hero.pS > 0.85;

        let cx: number, cy: number;
        if (docked) {
          // card hangs below the bar, under its slot
          cx = Math.min(Math.max(s.x - CARD_W / 2, 14), w - CARD_W - 14);
          cy = BAR_H + 22;
        } else {
          const right = s.x + s.r + GAP + CARD_W < w - 14;
          cx = right ? s.x + s.r + GAP : s.x - s.r - GAP - CARD_W;
          cx = Math.min(Math.max(cx, 14), w - CARD_W - 14);
          cy = s.y - cardH - GAP * 0.8;
          if (cy < 70) cy = Math.min(s.y + s.r + GAP * 0.8, h - cardH - 20);
          cy = Math.min(Math.max(cy, 14), h - cardH - 14);
        }
        el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;

        // connector: from the body's edge to the nearest card corner
        const cornerX = Math.abs(cx - s.x) > Math.abs(cx + CARD_W - s.x) ? cx + CARD_W : cx;
        const cornerY = Math.abs(cy - s.y) > Math.abs(cy + cardH - s.y) ? cy + cardH : cy;
        const dx = cornerX - s.x;
        const dy = cornerY - s.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ax = s.x + (dx / dist) * (s.r + 3);
        const ay = s.y + (dy / dist) * (s.r + 3);

        const drawT = Math.min(1, (performance.now() - drawStart.current) / 320);
        const ease = 1 - Math.pow(1 - drawT, 3);
        if (line.current && dot.current) {
          line.current.setAttribute("x1", String(ax));
          line.current.setAttribute("y1", String(ay));
          line.current.setAttribute("x2", String(ax + (cornerX - ax) * ease));
          line.current.setAttribute("y2", String(ay + (cornerY - ay) * ease));
          dot.current.setAttribute("cx", String(ax));
          dot.current.setAttribute("cy", String(ay));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hovered]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {body && (
          <motion.svg
            key={`line-${body.id}`}
            className="absolute inset-0 h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <line
              ref={line}
              stroke="rgba(212,184,134,0.55)"
              strokeWidth="1"
            />
            <circle ref={dot} r="2.5" fill="#d4b886" />
          </motion.svg>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {body && (
          <motion.div
            key={body.id}
            ref={card}
            className="pointer-events-auto absolute left-0 top-0 border border-[rgba(232,230,225,0.14)] bg-[rgba(5,6,10,0.88)] backdrop-blur-md"
            style={{ width: CARD_W }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.18 } }}
            onMouseEnter={() => setHovered(body.id)}
            onMouseLeave={() => requestUnhover(body.id)}
          >
            <div className="flex items-baseline justify-between border-b border-[rgba(232,230,225,0.1)] px-5 py-3">
              <span className="label !text-[10px] text-starlight">
                {body.designation}
              </span>
              <span className="label !text-[9px] !tracking-[0.2em] text-dim">
                {body.kind.replace("-", " ")}
              </span>
            </div>
            <div className="px-5 pb-4 pt-4">
              <Link
                href={body.href}
                className="font-display text-[1.7rem] leading-none text-ink transition-colors hover:text-starlight"
                onClick={() => setHovered(null)}
              >
                {body.name}
              </Link>
              <p className="mt-3 font-serif text-[1.02rem] leading-relaxed text-[rgba(232,230,225,0.75)]">
                {body.blurb}
              </p>
              {body.links.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-[rgba(232,230,225,0.08)] pt-3.5">
                  {body.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        onClick={() => setHovered(null)}
                        className="group flex items-baseline gap-2.5 font-mono text-[0.72rem] tracking-wide text-faint transition-colors hover:text-starlight"
                      >
                        <span className="text-starlight/60 transition-transform duration-300 group-hover:translate-x-0.5">
                          ↳
                        </span>
                        <span className="link-reveal leading-snug">{l.label}</span>
                        {l.meta && (
                          <span className="ml-auto shrink-0 text-[0.62rem] text-dim">
                            {l.meta}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {body.footnote && (
                <p className="label mt-4 !text-[9px] !tracking-[0.22em] text-dim">
                  {body.footnote}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
