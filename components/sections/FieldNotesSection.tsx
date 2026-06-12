"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { fieldNotes, dispatchDate } from "@/lib/content";
import { noteMeta } from "@/data/meta";

/**
 * Field notes as a full-bleed triptych — three dispatch panels filling
 * the viewport, each breathing wider under the pointer. Comet weather:
 * cold teal light over everything.
 */
export default function FieldNotesSection() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section
      id="field-notes"
      className="relative flex min-h-svh flex-col overflow-hidden"
      style={{
        background:
          "radial-gradient(100% 60% at 50% 0%, rgba(159,216,232,0.07) 0%, transparent 65%)",
      }}
    >
      {/* heading overlay */}
      <div className="pointer-events-none absolute left-6 top-20 z-20 md:left-12 md:top-24">
        <p className="label mb-3 text-comet/80 [text-shadow:0_1px_10px_rgba(3,6,10,0.9)]">
          03 · C/2025 JD · COMET, PERIODIC
        </p>
        <h2 className="font-display text-[clamp(2rem,4.5vw,3.6rem)] font-light leading-none text-ink [text-shadow:0_2px_22px_rgba(3,6,10,0.95)]">
          Field Notes
        </h2>
      </div>

      <div
        className="flex min-h-svh flex-col md:flex-row"
        onMouseLeave={() => setActive(null)}
      >
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
              style={{ flexGrow: isActive ? 1.7 : 1, flexBasis: 0 }}
            >
              {m && (
                <Image
                  src={m.cover}
                  alt={m.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className={`object-cover transition-[transform,filter] duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive
                      ? "scale-[1.04] filter-[saturate(1)_brightness(1.05)]"
                      : "filter-[saturate(0.65)_brightness(0.8)]"
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
                    isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0 md:max-h-0"
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
    </section>
  );
}
