"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { essays, dispatchDate, readingTime } from "@/lib/content";
import { essayMeta, essayHighlights } from "@/data/meta";
import FallbackCover from "@/components/FallbackCover";

/**
 * The essays as a full-viewport scene: the left half of the screen is a
 * living cover panel that crossfades to whichever essay the index is
 * touching; the right half is the reading-room index. Warm observatory
 * light — this biome is the library.
 */
export default function EssaysGallery() {
  const [active, setActive] = useState(essays[0].slug);
  const current = essays.find((e) => e.slug === active) ?? essays[0];
  const currentMeta = essayMeta[current.slug];
  const highlight = currentMeta?.highlight ?? essayHighlights[current.slug];

  return (
    <section
      id="essays"
      className="relative flex min-h-svh flex-col overflow-hidden md:flex-row"
      style={{
        background:
          "radial-gradient(120% 90% at 0% 50%, rgba(184,141,92,0.1) 0%, rgba(184,141,92,0.03) 40%, transparent 70%)",
      }}
    >
      {/* ——— the cover panel ——— */}
      <div className="relative h-[36svh] w-full overflow-hidden md:h-auto md:min-h-svh md:w-[48%]">
        {essays.map((e) => {
          const m = essayMeta[e.slug];
          return (
            <motion.div
              key={e.slug}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: active === e.slug ? 1 : 0, scale: active === e.slug ? 1 : 1.04 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {m ? (
                <Image
                  src={m.cover}
                  alt={m.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 48vw"
                  className="object-cover"
                  priority={e.slug === essays[0].slug}
                />
              ) : (
                <FallbackCover title={e.title} />
              )}
            </motion.div>
          );
        })}
        {/* feathered edge into space */}
        <div className="absolute inset-0 bg-linear-to-t from-space/85 via-transparent to-space/35 md:bg-linear-to-r md:from-transparent md:via-transparent md:to-space" />
        <div className="absolute inset-0 hidden bg-linear-to-t from-space/70 via-transparent to-transparent md:block" />

        {/* the pull-quote, living on the artwork */}
        {highlight && (
          <motion.blockquote
            key={`q-${current.slug}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="absolute bottom-6 left-6 right-6 hidden border-l border-starlight/60 pl-4 font-serif text-[1.15rem] italic leading-relaxed text-[rgba(232,230,225,0.92)] [text-shadow:0_1px_18px_rgba(3,4,8,0.95)] md:bottom-12 md:left-10 md:right-16 md:block md:text-[1.3rem]"
          >
            “{highlight}”
          </motion.blockquote>
        )}
      </div>

      {/* ——— the index ——— */}
      <div className="relative flex w-full flex-col justify-center px-6 py-12 md:min-h-svh md:w-[52%] md:px-14 md:py-24">
        <div className="mb-8 flex items-end justify-between border-b border-hairline pb-5">
          <div>
            <p className="label mb-3 text-starlight/70">JD-1184 b · GAS GIANT · THE READING ROOM</p>
            <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light leading-none text-ink">
              Essays
            </h2>
          </div>
          <span className="label hidden text-[10px]! text-dim sm:block">01</span>
        </div>

        <ol onMouseLeave={() => setActive(essays[0].slug)}>
          {essays.map((e, i) => {
            const isActive = active === e.slug;
            return (
              <li key={e.slug}>
                <Link
                  href={`/essays/${e.slug}`}
                  onMouseEnter={() => setActive(e.slug)}
                  onFocus={() => setActive(e.slug)}
                  className={`group flex items-baseline gap-5 border-b border-[rgba(232,230,225,0.07)] py-4 transition-all duration-300 md:py-[1.15rem] ${
                    isActive ? "md:translate-x-2" : ""
                  }`}
                >
                  <span
                    className={`label w-7 shrink-0 text-[10px]! transition-colors ${
                      isActive ? "text-starlight" : "text-dim"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`font-display text-[clamp(1.15rem,2vw,1.7rem)] font-light leading-tight transition-colors duration-300 ${
                      isActive ? "text-starlight" : "text-ink"
                    }`}
                  >
                    {e.title}
                  </span>
                  <span className="label ml-auto hidden shrink-0 text-[9px]! text-dim sm:block">
                    {dispatchDate(e.date)} · {readingTime(e.words)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <p className="label mt-8 flex items-center justify-between text-[10px]! text-dim">
          <span>{essays.length} TRANSMISSIONS · THREE NEWEST ORBIT AS MOONS</span>
          <Link
            href="/essays"
            className="link-reveal text-starlight/80 transition-colors hover:text-starlight"
          >
            FULL INDEX ⟶
          </Link>
        </p>
      </div>
    </section>
  );
}
