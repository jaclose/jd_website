"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { fieldNotes, dispatchDate } from "@/lib/content";
import { noteMeta } from "@/data/meta";

/**
 * Field notes as a full-bleed comet flyby. Three dispatch panels share
 * the frame; one is in focus at a time, and you cycle with comets — a
 * streaking nucleus that points the way it travels. Cold teal weather.
 */
function CometArrow({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  const flip = dir === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous dispatch" : "Next dispatch"}
      className="group pointer-events-auto relative grid h-16 w-16 place-items-center"
    >
      <svg
        width="58"
        height="34"
        viewBox="0 0 58 34"
        className={`transition-transform duration-300 group-hover:scale-110 ${flip ? "scale-x-[-1]" : ""}`}
        aria-hidden
      >
        <defs>
          <linearGradient id={`ctail-${dir}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#9fd8e8" stopOpacity="0" />
            <stop offset="1" stopColor="#9fd8e8" stopOpacity="0.85" />
          </linearGradient>
          <radialGradient id={`chead-${dir}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#eafaff" />
            <stop offset="0.5" stopColor="#9fd8e8" />
            <stop offset="1" stopColor="#9fd8e8" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* tail */}
        <path
          d="M2 17 Q26 13 44 16 L44 18 Q26 21 2 17 Z"
          fill={`url(#ctail-${dir})`}
          className="origin-right transition-all duration-300 group-hover:[d:path('M0_17_Q26_11_46_16_L46_18_Q26_23_0_17_Z')]"
        />
        {/* nucleus */}
        <circle cx="46" cy="17" r="11" fill={`url(#chead-${dir})`} opacity="0.5" />
        <circle cx="46" cy="17" r="4.5" fill="#eafaff" />
        {/* heading chevron */}
        <path d="M43 13 L49 17 L43 21" fill="none" stroke="#06121a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default function FieldNotesSection() {
  const [active, setActive] = useState(0);
  const cycle = (d: number) =>
    setActive((a) => (a + d + fieldNotes.length) % fieldNotes.length);

  return (
    <section
      id="field-notes"
      className="biome-comet relative flex min-h-svh flex-col overflow-hidden"
    >
      {/* heading overlay */}
      <div className="pointer-events-none absolute left-6 top-20 z-30 md:left-12 md:top-24">
        <p className="label mb-3 text-comet/80 [text-shadow:0_1px_10px_rgba(3,6,10,0.9)]">
          03 · C/2025 JD · COMET, PERIODIC
        </p>
        <h2 className="font-display text-[clamp(2rem,4.5vw,3.6rem)] font-light leading-none text-ink [text-shadow:0_2px_22px_rgba(3,6,10,0.95)]">
          Field Notes
        </h2>
      </div>

      {/* panels */}
      <div className="flex min-h-svh flex-col md:flex-row">
        {fieldNotes.map((n, i) => {
          const m = noteMeta[n.slug];
          const isActive = active === i;
          return (
            <Link
              key={n.slug}
              href={`/field-notes#${n.slug}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="group relative min-h-[33svh] overflow-hidden border-b border-[rgba(232,230,225,0.08)] transition-[flex-grow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:min-h-svh md:border-b-0 md:border-r"
              style={{ flexGrow: isActive ? 2.1 : 1, flexBasis: 0 }}
            >
              {m && (
                <Image
                  src={m.cover}
                  alt={m.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={`object-cover transition-[transform,filter] duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive
                      ? "scale-[1.04] filter-[saturate(1)_brightness(1.05)]"
                      : "filter-[saturate(0.6)_brightness(0.7)]"
                  }`}
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-space/95 via-space/25 to-space/40" />

              <div className="absolute inset-x-0 bottom-0 p-6 md:p-9">
                <p className="label text-[8px]! text-comet/90">
                  DISPATCH {String(i + 1).padStart(2, "0")} · {dispatchDate(n.date)}
                </p>
                <h3
                  className={`mt-3 max-w-md font-display text-[clamp(1.3rem,2.2vw,1.9rem)] font-light leading-snug transition-colors duration-500 ${
                    isActive ? "text-comet" : "text-ink"
                  }`}
                >
                  {n.title}
                </h3>
                <p
                  className={`mt-3 max-w-md overflow-hidden font-serif text-[1.02rem] leading-relaxed text-faint transition-all duration-700 ${
                    isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {n.excerpt.slice(0, 180)}…
                </p>
                <span className="label mt-4 inline-block text-[8px]! text-dim transition-colors group-hover:text-comet/80">
                  READ THE NOTE ↳
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* comet navigation — streaks pointing the way they travel */}
      <div className="pointer-events-none absolute inset-y-0 left-2 z-30 flex items-center md:left-5">
        <CometArrow dir="prev" onClick={() => cycle(-1)} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-2 z-30 flex items-center md:right-5">
        <CometArrow dir="next" onClick={() => cycle(1)} />
      </div>

      {/* perihelion ticks */}
      <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {fieldNotes.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Dispatch ${i + 1}`}
            className={`h-1.5 w-6 transition-colors ${
              active === i ? "bg-comet" : "bg-[rgba(232,230,225,0.18)] hover:bg-comet/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
