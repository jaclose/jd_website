"use client";

import { formatDate } from "@/lib/content";
import { essayThemes } from "@/data/essayThemes";
import type { EssayArtifact } from "@/data/essays";
import { useCardTilt } from "./useCardTilt";
import { standingStars } from "./EssayArtifact";

/**
 * The centerpiece — the archive's chase card. Full-art bleed inside the holo
 * foil frame, the same header/plaque/banner anatomy as the shelf cards but
 * given most of the viewport, with thesis and the Open Essay action seated on
 * the artwork. Tilt and glare track the pointer; unsealing hands the captured
 * rectangle to the reader so the artwork expands into the essay header.
 */
export default function FeaturedEssay({
  artifact,
  onOpen,
}: {
  artifact: EssayArtifact;
  onOpen: (artifact: EssayArtifact, source: HTMLElement) => void;
}) {
  const theme = essayThemes[artifact.theme];
  const tilt = useCardTilt<HTMLButtonElement>();

  return (
    <section aria-labelledby="ea-featured-title" className="ea-featured-section">
      <p className="ea-section-label">Centerpiece · Currently Unsealed for Reading</p>
      <button
        type="button"
        className="ea-card ea-card--featured"
        data-standing="immersive"
        style={theme.vars}
        onClick={(e) => onOpen(artifact, e.currentTarget)}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        aria-label={`${artifact.title}. Featured immersive record. Open essay.`}
      >
        <span className="ea-card__foil" aria-hidden />
        <span className="ea-card__inner">
          <span className="ea-card__head">
            <span className="ea-card__chip">Immersive</span>
            <span className="ea-card__name" id="ea-featured-title">
              {artifact.title}
            </span>
            <span className="ea-card__metric">
              <span className="ea-card__metric-label">read</span>
              <b>{artifact.readTime.replace(" min", "")}</b>
              <i className="ea-card__sigil" aria-hidden>
                ✦
              </i>
            </span>
          </span>

          <span className="ea-card__art ea-card__art--hero" aria-hidden>
            {artifact.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={artifact.image} alt="" draggable={false} />
            ) : null}
            <span className="ea-card__sparkles" />
            <span className="ea-card__sparkles ea-card__sparkles--late" />
            <span className="ea-card__art-wash" />

            {/* seated on the artwork: thesis + meta + action */}
            <span className="ea-featured__seat">
              <span className="ea-featured__thesis">{artifact.thesis}</span>
              <span className="ea-featured__meta">
                <span>Filed {formatDate(artifact.date)}</span>
                <span>{artifact.readTime} reading</span>
                <span>{artifact.category}</span>
              </span>
              <span className="ea-featured__action">
                Open Essay <span aria-hidden>⟶</span>
              </span>
            </span>
          </span>

          <span className="ea-card__foot">
            <span className="ea-card__stars" data-standing="immersive" aria-hidden>
              {standingStars("immersive")}
            </span>
            <span className="ea-card__banner">
              <b>{theme.collection}</b> · {artifact.flavorText}
            </span>
          </span>
        </span>
        <span className="ea-card__glare" aria-hidden />
        <span className="ea-artifact__grain" aria-hidden />
      </button>
    </section>
  );
}
