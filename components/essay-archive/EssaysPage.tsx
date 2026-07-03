"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { essayArtifacts, featuredArtifact, shelfArtifacts } from "@/data/essays";
import { essayThemes, type EssayThemeId } from "@/data/essayThemes";
import EssayArtifact from "./EssayArtifact";
import FeaturedEssay from "./FeaturedEssay";
import EssayReaderModal from "./EssayReaderModal";
import { useEssayTransition } from "./useEssayTransition";
import "./essayArchive.css";

/**
 * The Essay Archive — a private reading room, not a blog index. One
 * atmospheric hero (grain, drifting dust, constellation points, vignette,
 * and a parallax so slow it registers as depth rather than motion), the
 * featured work as a centerpiece, and the remaining works shelved beneath it
 * in their three standings, filterable by collection. Every artifact opens
 * through the cinematic reader; the archive is rendered entirely from
 * data/essays.ts.
 */
export default function EssaysPage() {
  const { state, open, close } = useEssayTransition();
  const skyRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<EssayThemeId | "all">("all");

  // the filter rail is data-driven: only collections with shelved works
  const collections = useMemo(() => {
    const counts = new Map<EssayThemeId, number>();
    for (const a of shelfArtifacts) counts.set(a.theme, (counts.get(a.theme) ?? 0) + 1);
    return Array.from(counts, ([id, count]) => ({
      id,
      count,
      label: essayThemes[id].collection.replace(/^The /, "").replace(/ Collection$/, ""),
    }));
  }, []);
  const visibleShelf =
    filter === "all" ? shelfArtifacts : shelfArtifacts.filter((a) => a.theme === filter);

  // near-imperceptible parallax: the hero atmosphere falls behind the scroll
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      if (skyRef.current) {
        skyRef.current.style.transform = `translate3d(0, ${window.scrollY * 0.12}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="ea-page">
      {/* ————— hero ————— */}
      <header className="ea-hero">
        <div ref={skyRef} className="ea-hero__sky" aria-hidden>
          <div className="ea-hero__constellation" />
          <div className="ea-hero__dust">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ "--ea-dust": i } as React.CSSProperties} />
            ))}
          </div>
        </div>
        <div className="ea-hero__vignette" aria-hidden />

        <div className="ea-hero__plate">
          <p className="ea-hero__status">
            Archive Status: {String(essayArtifacts.length).padStart(2, "0")} works preserved
          </p>
          <h1 className="ea-hero__title">Essays</h1>
          <p className="ea-hero__subtitle">
            Long-form works from the JD-1184 record — reflections, research, and
            personal observations, filed as they were finished and kept as they
            were meant to be read.
          </p>
        </div>
      </header>

      <FeaturedEssay artifact={featuredArtifact} onOpen={open} />

      {/* ————— the shelves ————— */}
      <section aria-label="The preserved works" className="ea-shelf-section">
        <p className="ea-section-label">The Collection · Filed &amp; Preserved</p>

        <div className="ea-filter" role="group" aria-label="Filter by collection">
          <button
            type="button"
            className="ea-filter__chip"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All works <span>{shelfArtifacts.length}</span>
          </button>
          {collections.map((c) => (
            <button
              key={c.id}
              type="button"
              className="ea-filter__chip"
              style={essayThemes[c.id].vars}
              aria-pressed={filter === c.id}
              onClick={() => setFilter(filter === c.id ? "all" : c.id)}
            >
              {c.label} <span>{c.count}</span>
            </button>
          ))}
        </div>

        <div className="ea-shelf">
          {visibleShelf.map((artifact) => (
            <EssayArtifact key={artifact.id} artifact={artifact} onOpen={open} />
          ))}
        </div>
      </section>

      {state ? <EssayReaderModal state={state} onClose={close} /> : null}
    </div>
  );
}
