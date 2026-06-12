"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { bodies } from "@/data/system";
import {
  hero,
  useHovered,
  setHovered,
  requestUnhover,
  slotCenters,
  BAR_H,
} from "./store";

const CARD_W = 330;
const GAP = 30;

/**
 * The scan card: a thin line draws from the hovered body to a panel of
 * information. Positions are updated imperatively from the scene's
 * published screen coordinates — React only mounts/unmounts the card.
 *
 * The card never appears before it has a valid position (it mounts
 * hidden), chooses its side from the body's half of the screen, and
 * glides after the body each frame instead of jumping.
 */
export default function HoverCard() {
  const hovered = useHovered();
  const body = bodies.find((b) => b.id === hovered);

  const card = useRef<HTMLDivElement>(null);
  const line = useRef<SVGLineElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const drawStart = useRef(0);

  useEffect(() => {
    if (!hovered || !body) return;
    drawStart.current = performance.now();
    const idx = bodies.findIndex((b) => b.id === hovered);
    let raf = 0;
    let last = performance.now();
    let placed = false;
    const cur = { x: 0, y: 0 };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = hero.screen.get(hovered);
      const el = card.current;

      if (s && el && Number.isFinite(s.x) && Number.isFinite(s.y)) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cardH = el.offsetHeight || 200;
        const docked = hero.pS > 0.7;

        let tx: number, ty: number;
        let ax = s.x,
          ay = s.y,
          r = s.r;
        if (docked) {
          // card hangs below the bar, under its slot — slot x is stable
          const slotX = slotCenters(bodies.length, w)[idx] ?? s.x;
          tx = Math.min(Math.max(slotX - CARD_W / 2, 14), w - CARD_W - 14);
          ty = BAR_H + 22;
          ax = slotX;
          ay = BAR_H / 2 + 8;
          r = 10;
        } else {
          // side comes from the body's half of the screen — stable, no flip
          const side = s.x < w * 0.55 ? 1 : -1;
          tx = side > 0 ? s.x + r + GAP : s.x - r - GAP - CARD_W;
          tx = Math.min(Math.max(tx, 14), w - CARD_W - 14);
          ty = s.y - cardH - GAP * 0.8;
          if (ty < BAR_H + 12) ty = Math.min(s.y + r + GAP * 0.8, h - cardH - 20);
          ty = Math.min(Math.max(ty, 14), h - cardH - 14);
        }

        if (!placed) {
          cur.x = tx;
          cur.y = ty;
          el.style.visibility = "visible";
          placed = true;
        } else {
          // glide after the target — frame-rate independent
          const k = 1 - Math.exp(-16 * dt);
          cur.x += (tx - cur.x) * k;
          cur.y += (ty - cur.y) * k;
        }
        el.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;

        // connector: from the body's edge to the nearest card corner
        const cornerX =
          Math.abs(cur.x - ax) > Math.abs(cur.x + CARD_W - ax) ? cur.x + CARD_W : cur.x;
        const cornerY =
          Math.abs(cur.y - ay) > Math.abs(cur.y + cardH - ay) ? cur.y + cardH : cur.y;
        const dx = cornerX - ax;
        const dy = cornerY - ay;
        const dist = Math.hypot(dx, dy) || 1;
        const sx = ax + (dx / dist) * (r + 3);
        const sy = ay + (dy / dist) * (r + 3);

        const drawT = Math.min(1, (now - drawStart.current) / 320);
        const ease = 1 - Math.pow(1 - drawT, 3);
        if (line.current && dot.current) {
          line.current.setAttribute("x1", String(sx));
          line.current.setAttribute("y1", String(sy));
          line.current.setAttribute("x2", String(sx + (cornerX - sx) * ease));
          line.current.setAttribute("y2", String(sy + (cornerY - sy) * ease));
          dot.current.setAttribute("cx", String(sx));
          dot.current.setAttribute("cy", String(sy));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <line ref={line} stroke="rgba(212,184,134,0.55)" strokeWidth="1" />
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
            style={{ width: CARD_W, visibility: "hidden" }}
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
