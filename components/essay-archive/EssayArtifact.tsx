"use client";

import { formatDate } from "@/lib/content";
import { essayThemes } from "@/data/essayThemes";
import type { EssayArtifact as EssayArtifactRecord } from "@/data/essays";
import { useCardTilt } from "./useCardTilt";

/**
 * One preserved work as a collector's artifact — the anatomy of a premium
 * trading card translated into the archive's own language. Header row: a
 * standing chip, the title, and the reading-time metric with the collection
 * sigil. Then the artwork (framed window for entries; full-bleed for relics
 * and immersive records), the thesis rail, twin foot plaques (filed date /
 * length), the flavour banner, and rarity marks. Holo lives in CSS: foil
 * border, sparkle field, and a glare that follows the pointer via
 * useCardTilt. Unique vocabulary throughout — standing, sigil, filed.
 */

const SIGIL: Record<string, string> = {
  return: "✦",
  sanctum: "❧",
  blackout: "☾",
  legacy: "๛",
  "field-study": "✚",
};

const STANDING_LABEL: Record<string, string> = {
  "archive-entry": "Entry",
  relic: "Relic",
  immersive: "Immersive",
};

export function standingStars(rarity: string) {
  return rarity === "immersive" ? "✦✦✦" : rarity === "relic" ? "✦✦" : "✦";
}

export default function EssayArtifact({
  artifact,
  onOpen,
}: {
  artifact: EssayArtifactRecord;
  onOpen: (artifact: EssayArtifactRecord, source: HTMLElement) => void;
}) {
  const theme = essayThemes[artifact.theme];
  const tilt = useCardTilt<HTMLButtonElement>();
  const standingLabel =
    artifact.rarity === "immersive" ? "Immersive Record" : artifact.rarity === "relic" ? "Relic Essay" : "Archive Entry";

  return (
    <button
      type="button"
      className="ea-card"
      data-standing={artifact.rarity}
      style={theme.vars}
      onClick={(e) => onOpen(artifact, e.currentTarget)}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      aria-label={`${artifact.title}. ${standingLabel}, ${theme.collection}. Filed ${formatDate(artifact.date)}. Unseal to read.`}
    >
      <span className="ea-card__foil" aria-hidden />
      <span className="ea-card__inner">
        {/* header: standing chip · title · reading metric + sigil */}
        <span className="ea-card__head">
          <span className="ea-card__chip">{STANDING_LABEL[artifact.rarity]}</span>
          <span className="ea-card__name">{artifact.title}</span>
          <span className="ea-card__metric">
            <span className="ea-card__metric-label">read</span>
            <b>{artifact.readTime.replace(" min", "")}</b>
            <i className="ea-card__sigil" aria-hidden>
              {SIGIL[artifact.theme]}
            </i>
          </span>
        </span>

        {/* artwork */}
        <span className="ea-card__art" aria-hidden>
          {artifact.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={artifact.image} alt="" loading="lazy" draggable={false} />
          ) : (
            <span className="ea-card__art-typographic">
              <span>{artifact.title}</span>
            </span>
          )}
          <span className="ea-card__holo-dots" />
          <span className="ea-card__sparkles" />
          <span className="ea-card__sparkles ea-card__sparkles--late" />
          <span className="ea-card__art-wash" />
        </span>

        {/* thesis rail */}
        <span className="ea-card__thesis">
          <i className="ea-card__thesis-pill">Thesis</i>
          <span>{artifact.thesis}</span>
        </span>

        {/* foot plaques + rarity + banner */}
        <span className="ea-card__plaques">
          <span className="ea-card__plaque">
            <span>filed</span> <b>{formatDate(artifact.date)}</b>
          </span>
          <span className="ea-card__plaque">
            <span>length</span> <b>{artifact.words.toLocaleString()} words</b>
          </span>
        </span>
        <span className="ea-card__foot">
          <span className="ea-card__stars" data-standing={artifact.rarity} aria-hidden>
            {standingStars(artifact.rarity)}
          </span>
          <span className="ea-card__banner">
            <b>{theme.collection}</b> · {artifact.flavorText}
          </span>
        </span>
      </span>
      <span className="ea-card__glare" aria-hidden />
      <span className="ea-artifact__grain" aria-hidden />
    </button>
  );
}
