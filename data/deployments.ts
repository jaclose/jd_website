/**
 * Deployments — shipped builds, summoned onto a night-sky duel field.
 * Add an entry and a new card joins the deck automatically; no layout work.
 */
export interface Deployment {
  id: string;
  name: string;
  /** card art (the app's own logo); a constellation is drawn if absent */
  art?: string;
  /** Yu-Gi-Oh-tinged framing */
  attribute: string; // e.g. NOCTURNAL — the top-right "attribute" badge
  cardType: string; // the [bracketed] type line, e.g. "App / Medicine"
  level: number; // stars under the name
  effect: string; // short "effect text" in the description box
  stats: { version: string; platform: string; size: string };
  repoUrl: string;
  webUrl?: string; // primary deployment/web link
  downloadUrl?: string; // app download, if available
  rarity: "common" | "foil" | "legendary";
  /** ISO date the build shipped — drives the email broadcast queue. */
  deployedAt?: string;
}

export const deployments: Deployment[] = [
  {
    id: "axom",
    name: "AXOM",
    art: "/cards/axom-orb.svg",
    attribute: "STUDY",
    cardType: "Medical study system",
    level: 4,
    effect:
      "A local-first study system built through medical school: question banks, course tracking, focused practice, and a record of the work. In active pre-beta development.",
    stats: { version: "Pre-beta", platform: "Web", size: "—" },
    repoUrl: "https://github.com/jaclose/AXOM",
    webUrl: "https://axom.info",
    downloadUrl: undefined, // Link to the current product site for release availability.
    rarity: "foil",
    deployedAt: "2026-06-16",
  },
];
