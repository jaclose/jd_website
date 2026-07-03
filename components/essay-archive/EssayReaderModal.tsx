"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatDate } from "@/lib/content";
import { essayThemes } from "@/data/essayThemes";
import type { EssayArtifact } from "@/data/essays";
import type { EssayTransitionState } from "./useEssayTransition";

/**
 * The reading chamber. Opening plays in stages — the ambient shade falls, a
 * "traveler" panel expands from the artifact's exact resting rectangle into
 * the full-width essay header, then the title, the metadata and finally the
 * body settle into place (each stage is a delayed CSS animation; reduced
 * motion collapses all of it to a fade). The body is the essay's real
 * migrated HTML in the site's editorial reading layout, with a link out to
 * the permanent page. Escape or "Seal & Return" settles the work back into
 * the archive.
 */
function paperMode(artifact: EssayArtifact) {
  return artifact.id === "the-cost-of-knowing-better";
}

export default function EssayReaderModal({
  state,
  onClose,
}: {
  state: EssayTransitionState;
  onClose: () => void;
}) {
  const { artifact, sourceRect, closing } = state;
  const theme = essayThemes[artifact.theme];
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, [artifact.id]);

  // reading progress — a hairline across the top of the chamber that fills
  // as the reader descends (scaleX only, so it stays on the compositor)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = el.scrollHeight - el.clientHeight;
      const k = max > 0 ? Math.min(1, el.scrollTop / max) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${k})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [artifact.id]);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`${artifact.title} — essay reader`}
      className="ea-reader"
      data-closing={closing || undefined}
      style={{
        ...theme.vars,
        "--ea-source-x": `${sourceRect.left}px`,
        "--ea-source-y": `${sourceRect.top}px`,
        "--ea-source-w": `${sourceRect.width}px`,
        "--ea-source-h": `${sourceRect.height}px`,
      } as React.CSSProperties}
    >
      <div className="ea-reader__shade" aria-hidden />

      {/* the artifact expanding out of its resting place into the header */}
      <div className="ea-reader__traveler" aria-hidden>
        {artifact.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={artifact.image} alt="" draggable={false} />
        ) : null}
      </div>

      <div className="ea-reader__progress" aria-hidden>
        <div ref={progressRef} className="ea-reader__progress-fill" />
      </div>

      <div ref={scrollRef} className="ea-reader__scroll" data-lenis-prevent>
        <header className="ea-reader__header">
          {artifact.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={artifact.image} alt={artifact.imageAlt ?? ""} draggable={false} />
          ) : null}
          <div className="ea-reader__header-wash" aria-hidden />
          <div className="ea-reader__header-plate">
            <p className="ea-reader__standing">
              {theme.collection} · {artifact.category}
            </p>
            <h1 className="ea-reader__title">{artifact.title}</h1>
            <p className="ea-reader__subtitle">{artifact.subtitle}</p>
          </div>
        </header>

        <div className="ea-reader__meta" role="list">
          <span role="listitem">Filed {formatDate(artifact.date)}</span>
          <span role="listitem">{artifact.readTime} reading</span>
          <span role="listitem">{artifact.words.toLocaleString()} words</span>
          <span role="listitem">Preserved · JD-1184 Archive</span>
        </div>

        <div className="ea-reader__body-frame">
          <article
            className={`prose-space ${paperMode(artifact) ? "scientific-paper" : "dropcap"}`}
            dangerouslySetInnerHTML={{ __html: artifact.html }}
          />
          <p className="ea-reader__colophon">
            <span aria-hidden>❦</span> {artifact.flavorText}
          </p>
          <Link href={`/essays/${artifact.id}`} className="ea-reader__permalink">
            Open the permanent record ⟶
          </Link>
        </div>
      </div>

      <button type="button" className="ea-reader__close" onClick={onClose}>
        Seal &amp; Return
      </button>
    </div>
  );
}
