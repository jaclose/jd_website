"use client";

import { useEffect, useRef } from "react";
import { essayArtifacts, featuredArtifact, shelfArtifacts } from "@/data/essays";
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
 * in their three standings. Every artifact opens through the cinematic
 * reader; the archive is rendered entirely from data/essays.ts.
 */
export default function EssaysPage() {
  const { state, open, close } = useEssayTransition();
  const skyRef = useRef<HTMLDivElement>(null);

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
        <div className="ea-shelf">
          {shelfArtifacts.map((artifact) => (
            <EssayArtifact key={artifact.id} artifact={artifact} onOpen={open} />
          ))}
        </div>
      </section>

      {state ? <EssayReaderModal state={state} onClose={close} /> : null}
    </div>
  );
}
