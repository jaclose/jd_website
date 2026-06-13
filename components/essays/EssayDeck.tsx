"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { essays, fieldNotes, dispatchDate, readingTime } from "@/lib/content";
import { essayMeta, essayHighlights } from "@/data/meta";
import { works } from "@/data/works";
import FallbackCover from "@/components/FallbackCover";

/** thematic card types — like elemental energy */
type CardType = "faith" | "trial" | "body" | "growth";
const TYPE: Record<string, CardType> = {
  "anatomy-of-the-test": "faith",
  "the-anatomy-of-arrival": "growth",
  "threads-of-serendipity-veins-of-trial": "trial",
  "cinders-beneath-a-fading-night": "faith",
  "the-echoes-of-the-body-and-the-whispers-of-the-weaver": "body",
  "hello-world": "growth",
};
const TYPE_META: Record<CardType, { glyph: string; label: string; color: string; ring: string }> = {
  faith: { glyph: "☾", label: "FAITH", color: "#d4b886", ring: "rgba(212,184,134,0.6)" },
  trial: { glyph: "✦", label: "TRIAL", color: "#c98aa0", ring: "rgba(201,138,160,0.6)" },
  body: { glyph: "✚", label: "BODY", color: "#9fd8e8", ring: "rgba(159,216,232,0.6)" },
  growth: { glyph: "❧", label: "GROWTH", color: "#9fce8f", ring: "rgba(159,206,143,0.6)" },
};

/* ————— one holographic card with pointer-tracked tilt + foil ————— */
function Card({ slug, index }: { slug: string; index: number }) {
  const e = essays.find((x) => x.slug === slug)!;
  const m = essayMeta[slug];
  const t = TYPE_META[TYPE[slug] ?? "growth"];
  const card = useRef<HTMLAnchorElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50, active: false });

  const onMove = (ev: React.MouseEvent) => {
    const el = card.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width;
    const py = (ev.clientY - r.top) / r.height;
    setTilt({ rx: (py - 0.5) * -16, ry: (px - 0.5) * 16, mx: px * 100, my: py * 100, active: true });
  };
  const onLeave = () => setTilt((s) => ({ ...s, rx: 0, ry: 0, active: false }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: index % 2 ? 1.5 : -1.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
    >
      <Link
        ref={card}
        href={`/essays/${slug}`}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="tcg-card group relative block aspect-63/88 overflow-hidden rounded-xl border-2 p-2.5"
        style={{
          borderColor: t.ring,
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.active ? 1.04 : 1})`,
          transition: tilt.active ? "transform 0.08s" : "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: `0 18px 50px rgba(0,0,0,0.55), 0 0 0 1px ${t.ring} inset`,
          background:
            "linear-gradient(160deg, #11131c 0%, #0a0c14 60%, #060710 100%)",
        }}
      >
        {/* foil holographic sheen */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, ${t.ring} 0%, transparent 45%)`,
            mixBlendMode: "color-dodge",
          }}
        />
        <span aria-hidden className="tcg-foil pointer-events-none absolute inset-0 z-10 opacity-40" />

        {/* header bar */}
        <div className="relative z-30 flex items-center justify-between px-1 pb-1.5">
          <span className="font-display text-[0.92rem] font-light leading-none text-ink">
            {e.title.length > 22 ? e.title.slice(0, 20) + "…" : e.title}
          </span>
          <span className="flex shrink-0 items-center gap-1" style={{ color: t.color }}>
            <span className="font-mono text-[0.6rem]">{readingTime(e.words)}</span>
            <span className="text-[0.9rem]" aria-hidden>{t.glyph}</span>
          </span>
        </div>

        {/* art window */}
        <div
          className="relative z-30 mx-auto aspect-4/3 w-full overflow-hidden rounded-md border"
          style={{ borderColor: t.ring }}
        >
          {m ? (
            <Image
              src={m.cover}
              alt={m.alt}
              fill
              sizes="(max-width: 768px) 45vw, 240px"
              className="object-cover"
            />
          ) : (
            <FallbackCover title={e.title} />
          )}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, transparent 60%, rgba(6,7,12,0.55))" }}
          />
        </div>

        {/* type strip */}
        <div className="relative z-30 mt-1.5 flex items-center justify-between px-1">
          <span
            className="label rounded-full px-2 py-0.5 text-[6.5px]! tracking-[0.2em]!"
            style={{ color: t.color, border: `1px solid ${t.ring}` }}
          >
            {t.label}
          </span>
          <span className="label text-[6.5px]! text-dim">
            {String(index + 1).padStart(3, "0")}/{String(essays.length).padStart(3, "0")}
          </span>
        </div>

        {/* flavor text box */}
        <div
          className="relative z-30 mx-0.5 mt-1.5 rounded-md border px-2 py-1.5"
          style={{ borderColor: "rgba(232,230,225,0.1)", background: "rgba(0,0,0,0.3)" }}
        >
          <p className="font-serif text-[0.62rem] italic leading-snug text-faint line-clamp-3">
            {m?.highlight ?? essayHighlights[slug] ?? e.excerpt.slice(0, 90)}
          </p>
          <p className="label mt-1 text-[6px]! text-dim">{dispatchDate(e.date)}</p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function EssayDeck() {
  // every essay is a card in the active deck; the PC holds everything else
  const deck = essays.map((e) => e.slug);
  const pcItems = [
    ...fieldNotes.map((n) => ({ kind: "note" as const, title: n.title, meta: dispatchDate(n.date), href: `/field-notes#${n.slug}` })),
    ...works.map((w) => ({ kind: "work" as const, title: w.title, meta: w.year, href: w.pdf })),
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
      {/* ——— the deck ——— */}
      <div>
        <div className="mb-7 flex items-end justify-between border-b border-hairline pb-4">
          <div>
            <p className="label mb-2 text-starlight/70">JD-1184 b · ACTIVE DECK</p>
            <h2 className="font-display text-2xl font-light text-ink">Your Six</h2>
          </div>
          <span className="label text-[9px]! text-dim">
            {deck.length} CARDS · HOVER TO FOIL · TAP TO READ
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {deck.map((slug, i) => (
            <Card key={slug} slug={slug} index={i} />
          ))}
        </div>
      </div>

      {/* ——— the PC storage box ——— */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-hairline bg-[rgba(8,10,16,0.6)] p-4">
          <div className="mb-3 flex items-center justify-between border-b border-[rgba(232,230,225,0.08)] pb-2.5">
            <span className="label text-[9px]! tracking-[0.26em]! text-comet/80">
              ▣ STORAGE · BILL'S PC
            </span>
            <span className="label text-[8px]! text-dim">BOX 1</span>
          </div>
          <p className="label mb-3 text-[7px]! tracking-[0.2em]! text-dim">
            DISPATCHES & DEEP SURVEYS — STORED, NOT IN THE DECK
          </p>
          <ul className="space-y-1.5">
            {pcItems.map((it, i) => (
              <li key={i}>
                <Link
                  href={it.href}
                  {...(it.kind === "work" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-center gap-2.5 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-[rgba(232,230,225,0.1)] hover:bg-[rgba(232,230,225,0.03)]"
                >
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border text-[0.7rem]"
                    style={{
                      borderColor: it.kind === "note" ? "rgba(159,216,232,0.4)" : "rgba(212,184,134,0.4)",
                      color: it.kind === "note" ? "#9fd8e8" : "#d4b886",
                    }}
                  >
                    {it.kind === "note" ? "✦" : "▤"}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[0.66rem] text-faint transition-colors group-hover:text-ink">
                      {it.title}
                    </span>
                    <span className="label text-[6px]! text-dim">
                      {it.kind === "note" ? "FIELD NOTE" : "ARCHIVE"} · {it.meta}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="label mt-3 border-t border-[rgba(232,230,225,0.08)] pt-2.5 text-[6.5px]! tracking-[0.18em]! text-dim">
            {pcItems.length} STORED · WITHDRAW ANYTIME
          </p>
        </div>
      </aside>
    </div>
  );
}
