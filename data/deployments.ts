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
  downloadUrl: string;
  rarity: "common" | "foil" | "legendary";
}

export const deployments: Deployment[] = [
  {
    id: "noctyrium",
    name: "Noctyrium",
    art: "/cards/noctyrium.png",
    attribute: "NOCTURNAL",
    cardType: "App / Medicine",
    level: 4,
    effect:
      "A nocturnal medical-study companion. While on the field: heatmaps, productivity tracking, and a second brain that keeps the night's work.",
    stats: { version: "v0.03.01.5", platform: "macOS", size: "—" },
    repoUrl: "https://github.com/jaclose/Noctyrium",
    downloadUrl: "https://github.com/jaclose/Noctyrium/releases/latest",
    rarity: "foil",
  },
];
