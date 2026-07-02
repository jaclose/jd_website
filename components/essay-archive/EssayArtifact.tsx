"use client";

import { formatDate } from "@/lib/content";
import { essayThemes } from "@/data/essayThemes";
import type { EssayArtifact as EssayArtifactRecord } from "@/data/essays";

/**
 * One preserved work on the archive shelf. Three standings share a single
 * visual language and diverge in how much the artwork is allowed to take:
 *  - archive-entry: structured frame, clean artwork window, full metadata
 *  - relic:         art bleeds through most of the artifact, metal edge, a
 *                   near-still foil grain drifting across the surface
 *  - immersive:     almost no frame; the artwork is the artifact
 * Works without artwork render a typographic panel — engraved title on paper.
 */
export default function EssayArtifact({
  artifact,
  onOpen,
}: {
  artifact: EssayArtifactRecord;
  onOpen: (artifact: EssayArtifactRecord, source: HTMLElement) => void;
}) {
  const theme = essayThemes[artifact.theme];
  const standingLabel =
    artifact.rarity === "immersive" ? "Immersive Record" : artifact.rarity === "relic" ? "Relic Essay" : "Archive Entry";

  return (
    <button
      type="button"
      className="ea-artifact"
      data-standing={artifact.rarity}
      style={theme.vars}
      onClick={(e) => onOpen(artifact, e.currentTarget)}
      aria-label={`${artifact.title}. ${standingLabel}, ${theme.collection}. Filed ${formatDate(artifact.date)}. Unseal to read.`}
    >
      <span className="ea-artifact__edge" aria-hidden />
      <span className="ea-artifact__body">
        <span className="ea-artifact__art" aria-hidden>
          {artifact.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={artifact.image} alt="" loading="lazy" draggable={false} />
          ) : (
            <span className="ea-artifact__art-typographic">
              <span>{artifact.title}</span>
            </span>
          )}
          <span className="ea-artifact__art-wash" />
          {artifact.rarity === "relic" ? <span className="ea-artifact__foil" /> : null}
        </span>

        <span className="ea-artifact__plate">
          <span className="ea-artifact__standing">{standingLabel}</span>
          <span className="ea-artifact__title">{artifact.title}</span>
          {artifact.rarity !== "immersive" ? (
            <span className="ea-artifact__subtitle">{artifact.subtitle}</span>
          ) : null}
          <span className="ea-artifact__meta">
            <span>{theme.collection}</span>
            <span>
              Filed {formatDate(artifact.date)} · {artifact.readTime}
            </span>
          </span>
        </span>
      </span>
      <span className="ea-artifact__grain" aria-hidden />
    </button>
  );
}
