/**
 * Deployments — shipped builds, dealt as cards onto a midnight duel field.
 * Add an entry and a new card joins the hand automatically; no layout work.
 */
export interface Deployment {
  id: string;
  name: string;
  /** optional real art (e.g. /cards/noctyrium.jpg); a constellation is drawn if absent */
  art?: string;
  typeLine: string;
  description: string;
  stats: { version: string; platform: string; size: string };
  repoUrl: string;
  downloadUrl: string;
  rarity: "common" | "foil" | "legendary";
}

export const deployments: Deployment[] = [
  {
    id: "noctyrium",
    name: "Noctyrium",
    typeLine: "Native App · macOS",
    description:
      "A nocturnal medical-study companion — heatmaps, productivity tracking, and a second brain that keeps the night's work.",
    stats: { version: "v0.03.01.5", platform: "macOS", size: "—" },
    repoUrl: "https://github.com/jaclose/Noctyrium",
    downloadUrl: "https://github.com/jaclose/Noctyrium/releases/latest",
    rarity: "foil",
  },
];
