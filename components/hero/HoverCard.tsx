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

const CARD_W = 300;
const GAP = 20;
const ROMAN = ["I", "II", "III"];

interface Panel {
  designation: string;
  kindLabel: string;
  name: string;
  line?: string;
  links: { label: string; href: string; meta?: string }[];
  footnote?: string;
  href: string;
}

/** panel content for a body id or a moon id like "essays-moon-1" */
function panelFor(id: string): Panel | null {
  const moon = id.match(/^(.+)-moon-(\d)$/);
  if (moon) {
    const parent = bodies.find((b) => b.id === moon[1]);
    const link = parent?.links[Number(moon[2])];
    if (!parent || !link) return null;
    return {
      designation: `${parent.designation} ${ROMAN[Number(moon[2])] ?? ""}`,
      kindLabel: "moon",
      name: link.label,
      line: link.meta ? `Transmitted ${link.meta}.` : undefined,
      links: [],
      footnote: "click to read the essay",
      href: link.href,
    };
  }
  const b = bodies.find((x) => x.id === id);
  if (!b) return null;
  return {
    designation: b.designation,
    kindLabel: b.kind.replace("-", " "),
    name: b.name,
    line: b.blurb,
    links: b.links,
    footnote: b.footnote,
    href: b.href,
  };
}

/**
 * The target panel — planet-select style. It hangs directly over the
 * hovered body (or under it when there's no headroom), tethered by a
 * short vertical line, and rides along as the body drifts. Docked mode
 * hangs it below the nav bar instead.
 */
export default function HoverCard() {
  const hovered = useHovered();
  const panel = hovered ? panelFor(hovered) : null;

  const card = useRef<HTMLDivElement>(null);
  const line = useRef<SVGLineElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const drawStart = useRef(0);

  useEffect(() => {
    if (!hovered) return;
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
        const cardH = el.offsetHeight || 160;
        const docked = hero.pS > 0.7 && idx >= 0;

        let tx: number, ty: number;
        let ax = s.x,
          ay = s.y;
        let above = true;
        if (docked) {
          const slotX = slotCenters(bodies.length, w)[idx] ?? s.x;
          tx = Math.min(Math.max(slotX - CARD_W / 2, 14), w - CARD_W - 14);
          ty = BAR_H + 22;
          ax = slotX;
          ay = BAR_H / 2 + 8;
          above = false;
        } else {
          // directly over the body; below it if the sky is too low
          tx = Math.min(Math.max(s.x - CARD_W / 2, 12), w - CARD_W - 12);
          ty = s.y - s.r - GAP - cardH;
          if (ty < 14) {
            ty = Math.min(s.y + s.r + GAP, h - cardH - 14);
            above = false;
          }
        }

        if (!placed) {
          cur.x = tx;
          cur.y = ty;
          el.style.visibility = "visible";
          placed = true;
        } else {
          const k = 1 - Math.exp(-18 * dt);
          cur.x += (tx - cur.x) * k;
          cur.y += (ty - cur.y) * k;
        }
        el.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;

        // tether: from the body's rim straight to the panel's near edge
        const exitY = above ? cur.y + cardH : cur.y;
        const startY = above ? ay - s.r - 2 : ay + s.r + 2;
        const anchorX = Math.min(Math.max(ax, cur.x + 18), cur.x + CARD_W - 18);
        const drawT = Math.min(1, (now - drawStart.current) / 280);
        const ease = 1 - Math.pow(1 - drawT, 3);
        if (line.current && dot.current) {
          line.current.setAttribute("x1", String(ax));
          line.current.setAttribute("y1", String(startY));
          line.current.setAttribute("x2", String(ax + (anchorX - ax) * ease));
          line.current.setAttribute("y2", String(startY + (exitY - startY) * ease));
          dot.current.setAttribute("cx", String(ax));
          dot.current.setAttribute("cy", String(startY));
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
        {panel && (
          <motion.svg
            key={`line-${hovered}`}
            className="absolute inset-0 h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <line ref={line} stroke="rgba(212,184,134,0.6)" strokeWidth="1" />
            <circle ref={dot} r="2.5" fill="#d4b886" />
          </motion.svg>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel && (
          <motion.div
            key={hovered}
            ref={card}
            className="pointer-events-auto absolute left-0 top-0 border border-[rgba(212,184,134,0.35)] bg-[rgba(5,6,10,0.92)] shadow-[0_0_40px_rgba(212,184,134,0.08)] backdrop-blur-md"
            style={{ width: CARD_W, visibility: "hidden" }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
            }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
            onMouseEnter={() => hovered && setHovered(hovered)}
            onMouseLeave={() => hovered && requestUnhover(hovered)}
          >
            {/* corner ticks — targeting brackets */}
            {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "left-0 bottom-0 border-l border-b", "right-0 bottom-0 border-r border-b"].map(
              (pos) => (
                <span
                  key={pos}
                  aria-hidden
                  className={`absolute h-2.5 w-2.5 border-starlight ${pos}`}
                />
              )
            )}
            <div className="flex items-baseline justify-between border-b border-[rgba(232,230,225,0.1)] px-4 py-2.5">
              <span className="label !text-[9px] text-starlight">
                {panel.designation}
              </span>
              <span className="label !text-[8px] !tracking-[0.2em] text-dim">
                {panel.kindLabel}
              </span>
            </div>
            <div className="px-4 pb-3.5 pt-3">
              <Link
                href={panel.href}
                className="font-display text-[1.35rem] leading-tight text-ink transition-colors hover:text-starlight"
                onClick={() => setHovered(null)}
              >
                {panel.name}
              </Link>
              {panel.line && (
                <p className="mt-2 font-serif text-[0.98rem] leading-snug text-[rgba(232,230,225,0.72)]">
                  {panel.line}
                </p>
              )}
              {panel.links.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-[rgba(232,230,225,0.08)] pt-2.5">
                  {panel.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        onClick={() => setHovered(null)}
                        className="group flex items-baseline gap-2 font-mono text-[0.68rem] tracking-wide text-faint transition-colors hover:text-starlight"
                      >
                        <span className="text-starlight/60">↳</span>
                        <span className="link-reveal leading-snug">{l.label}</span>
                        {l.meta && (
                          <span className="ml-auto shrink-0 text-[0.6rem] text-dim">
                            {l.meta}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <p className="label mt-3 flex items-center justify-between !text-[8px] !tracking-[0.22em] text-dim">
                <span>{panel.footnote ?? ""}</span>
                <span className="text-starlight/80">VISIT ⏎</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
