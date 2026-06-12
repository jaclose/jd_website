"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { essays, dispatchDate, readingTime } from "@/lib/content";
import { essayMeta, essayHighlights } from "@/data/meta";
import SectionHeading from "@/components/SectionHeading";
import FallbackCover from "@/components/FallbackCover";
import Reveal from "@/components/Reveal";

const ASPECT: Record<string, string> = {
  landscape: "aspect-[3/2]",
  portrait: "aspect-[3/4]",
  square: "aspect-square",
};

/**
 * The essays as a gallery — the latest as a full editorial spread, the
 * rest as an index whose cover art floats after the cursor (and sits
 * inline on touch screens). Covers are the artwork made for each piece.
 */
export default function EssaysGallery() {
  const featured = essays[0];
  const fMeta = essayMeta[featured.slug];
  const rest = essays.slice(1);

  const zone = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = active;

  // floating preview follows the cursor through the index
  useEffect(() => {
    const el = zone.current;
    const pv = preview.current;
    if (!el || !pv) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const mouse = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let raf = 0;
    let last = performance.now();
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    el.addEventListener("mousemove", onMove, { passive: true });
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const k = 1 - Math.exp(-12 * dt);
      pos.x += (mouse.x - pos.x) * k;
      pos.y += (mouse.y - pos.y) * k;
      const on = activeRef.current !== null;
      pv.style.opacity = on ? "1" : "0";
      pv.style.transform = `translate3d(${pos.x + 28}px, ${pos.y - 110}px, 0) rotate(${(pos.x - mouse.x) * 0.04}deg) scale(${on ? 1 : 0.92})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="essays"
      className="relative px-6 py-28 md:px-10"
      style={{
        background:
          "radial-gradient(90% 50% at 50% 0%, rgba(184,141,92,0.07) 0%, transparent 70%)",
      }}
    >
      <div className="mx-auto max-w-6xl">
      <Reveal>
        <SectionHeading index="01" designation="JD-1184 b · GAS GIANT" title="Essays" />
      </Reveal>

      {/* featured — the innermost moon */}
      <Reveal>
        <Link
          href={`/essays/${featured.slug}`}
          className="group mb-24 grid gap-10 md:grid-cols-[1.05fr_1fr] md:items-center"
        >
          <div className={`relative overflow-hidden ${ASPECT[fMeta?.aspect ?? "landscape"]}`}>
            {fMeta && (
              <Image
                src={fMeta.cover}
                alt={fMeta.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-[transform,filter] duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-space/70 via-transparent to-transparent" />
            <span className="label absolute bottom-4 left-4 !text-[8px] !tracking-[0.3em] text-ink/80">
              MOON I · MOST RECENT TRANSMISSION
            </span>
          </div>
          <div>
            <p className="label !text-[10px] text-starlight/70">
              {dispatchDate(featured.date)} · {readingTime(featured.words).toUpperCase()} READ
            </p>
            <h3 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.4rem)] font-light leading-[1.05] text-ink transition-colors duration-300 group-hover:text-starlight">
              {featured.title}
            </h3>
            {fMeta && (
              <p className="mt-7 border-l border-starlight/50 pl-5 font-serif text-[1.35rem] italic leading-relaxed text-[rgba(232,230,225,0.78)]">
                “{fMeta.highlight}”
              </p>
            )}
            <span className="label mt-9 inline-flex items-center gap-3 !text-[10px] !tracking-[0.3em] text-starlight transition-colors group-hover:text-ink">
              READ THE TRANSMISSION <span aria-hidden>⟶</span>
            </span>
          </div>
        </Link>
      </Reveal>

      {/* the index — covers float after the cursor */}
      <div ref={zone} onMouseLeave={() => setActive(null)}>
        {rest.map((e, i) => {
          const m = essayMeta[e.slug];
          const highlight = m?.highlight ?? essayHighlights[e.slug];
          return (
            <Reveal key={e.slug} delay={i * 0.04}>
              <Link
                href={`/essays/${e.slug}`}
                onMouseEnter={() => setActive(e.slug)}
                onFocus={() => setActive(e.slug)}
                onBlur={() => setActive(null)}
                className="group relative grid grid-cols-[64px_1fr] items-center gap-5 border-b border-[rgba(232,230,225,0.08)] py-6 transition-colors duration-300 md:grid-cols-[2.6rem_1fr_auto] md:gap-8 md:py-8"
              >
                {/* inline thumb (touch) / index number (desktop) */}
                <span className="relative block aspect-square overflow-hidden md:hidden">
                  {m ? (
                    <Image src={m.cover} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <FallbackCover title={e.title} />
                  )}
                </span>
                <span className="label hidden !text-[10px] text-dim transition-colors group-hover:text-starlight md:block">
                  {String(i + 2).padStart(2, "0")}
                </span>
                <span>
                  <span className="block font-display text-[clamp(1.3rem,2.8vw,2.1rem)] font-light leading-tight text-ink transition-all duration-300 group-hover:translate-x-2 group-hover:text-starlight">
                    {e.title}
                  </span>
                  {highlight && (
                    <span className="mt-1.5 hidden font-serif text-[1.02rem] italic leading-snug text-dim transition-colors duration-300 group-hover:text-faint md:block">
                      “{highlight}”
                    </span>
                  )}
                </span>
                <span className="label col-start-2 !text-[9px] text-dim md:col-start-3">
                  {dispatchDate(e.date)} · {readingTime(e.words)}
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>

      {/* the floating cover */}
      <div
        ref={preview}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] hidden w-[240px] opacity-0 transition-opacity duration-300 md:block"
        style={{ willChange: "transform" }}
      >
        {rest.map((e) => {
          const m = essayMeta[e.slug];
          return (
            <motion.div
              key={e.slug}
              className={`absolute left-0 top-0 w-full overflow-hidden ${ASPECT[m?.aspect ?? "portrait"]}`}
              animate={{ opacity: active === e.slug ? 1 : 0 }}
              transition={{ duration: 0.25 }}
            >
              {m ? (
                <Image src={m.cover} alt="" fill sizes="240px" className="object-cover" />
              ) : (
                <FallbackCover title={e.title} />
              )}
              <div className="absolute inset-0 border border-[rgba(232,230,225,0.18)]" />
            </motion.div>
          );
        })}
      </div>

      <Reveal>
        <p className="label mt-10 flex items-center justify-between !text-[10px] text-dim">
          <span>{essays.length} TRANSMISSIONS · THREE MOST RECENT VISIBLE AS MOONS</span>
          <Link
            href="/essays"
            className="link-reveal text-starlight/80 transition-colors hover:text-starlight"
          >
            FULL INDEX ⟶
          </Link>
        </p>
      </Reveal>
      </div>
    </section>
  );
}
