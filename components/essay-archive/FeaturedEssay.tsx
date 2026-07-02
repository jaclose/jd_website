"use client";

import { formatDate } from "@/lib/content";
import { essayThemes } from "@/data/essayThemes";
import type { EssayArtifact } from "@/data/essays";

/**
 * The centerpiece of the archive — one flagship work given most of the
 * viewport. The whole panel is the control: hovering breathes a little depth
 * into it (soft lift, border light, a slow drift in the artwork — never a
 * game-card tilt), and unsealing it hands the captured rectangle to the
 * reader so the artwork expands into the essay header.
 */
export default function FeaturedEssay({
  artifact,
  onOpen,
}: {
  artifact: EssayArtifact;
  onOpen: (artifact: EssayArtifact, source: HTMLElement) => void;
}) {
  const theme = essayThemes[artifact.theme];

  return (
    <section aria-labelledby="ea-featured-title" className="ea-featured-section">
      <p className="ea-section-label">Centerpiece · Currently Unsealed for Reading</p>
      <button
        type="button"
        className="ea-featured"
        style={theme.vars}
        onClick={(e) => onOpen(artifact, e.currentTarget)}
        aria-label={`${artifact.title}. Featured immersive record. Open essay.`}
      >
        <span className="ea-featured__edge" aria-hidden />
        <span className="ea-featured__art" aria-hidden>
          {artifact.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={artifact.image} alt="" draggable={false} />
          ) : null}
          <span className="ea-featured__art-wash" />
        </span>

        <span className="ea-featured__plate">
          <span className="ea-artifact__standing">Immersive Record · {theme.collection}</span>
          <span id="ea-featured-title" className="ea-featured__title">
            {artifact.title}
          </span>
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
        <span className="ea-artifact__grain" aria-hidden />
      </button>
    </section>
  );
}
