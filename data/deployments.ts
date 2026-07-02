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
    id: "noctyrium",
    name: "Noctyrium",
    art: "/cards/noctyrium.png",
    attribute: "NOCTURNAL",
    cardType: "App / Effect",
    level: 4,
    effect:
      "The ultimate medical-school accountability and resource companion. While on the field: heatmaps, productivity tracking, study resources, and a second brain that keeps the night's work.",
    stats: { version: "v0.03.01.5", platform: "Web", size: "—" },
    repoUrl: "https://github.com/jaclose/Noctyrium",
    webUrl: "https://noctyrium-app.vercel.app",
    downloadUrl: undefined, // Coming soon — desktop app in progress
    rarity: "foil",
    deployedAt: "2026-06-16",
  },
];
