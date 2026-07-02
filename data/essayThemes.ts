import type { CSSProperties } from "react";

/**
 * Theme collections for the Essay Archive. Each theme is a small set of CSS
 * custom properties consumed by essayArchive.css — accent metal, paper tone,
 * an atmospheric wash behind the artwork, and an edge treatment for the
 * artifact frame. Restraint is the rule: these tint, they never glow.
 */

export type EssayThemeId = "return" | "sanctum" | "blackout" | "legacy" | "field-study";

export interface EssayTheme {
  id: EssayThemeId;
  /** display name of the collection the theme belongs to. */
  collection: string;
  vars: CSSProperties;
}

export const essayThemes: Record<EssayThemeId, EssayTheme> = {
  return: {
    id: "return",
    collection: "The Return Collection",
    vars: {
      "--ea-accent": "#d4b886",
      "--ea-accent-soft": "rgba(212, 184, 134, 0.22)",
      "--ea-paper": "#e6dcc3",
      "--ea-wash": "rgba(24, 32, 54, 0.55)",
      "--ea-edge": "linear-gradient(160deg, rgba(212,184,134,0.55), rgba(212,184,134,0.08) 45%, rgba(212,184,134,0.3))",
    } as CSSProperties,
  },
  sanctum: {
    id: "sanctum",
    collection: "The Sanctum Collection",
    vars: {
      "--ea-accent": "#9fce8f",
      "--ea-accent-soft": "rgba(159, 206, 143, 0.18)",
      "--ea-paper": "#d9d6c4",
      "--ea-wash": "rgba(16, 30, 22, 0.6)",
      "--ea-edge": "linear-gradient(160deg, rgba(159,206,143,0.45), rgba(110,124,98,0.1) 45%, rgba(159,206,143,0.26))",
    } as CSSProperties,
  },
  blackout: {
    id: "blackout",
    collection: "The Blackout Collection",
    vars: {
      "--ea-accent": "#7ea8c4",
      "--ea-accent-soft": "rgba(126, 168, 196, 0.16)",
      "--ea-paper": "#c6ccd2",
      "--ea-wash": "rgba(5, 8, 14, 0.72)",
      "--ea-edge": "linear-gradient(160deg, rgba(126,168,196,0.4), rgba(122,38,38,0.18) 55%, rgba(126,168,196,0.22))",
    } as CSSProperties,
  },
  legacy: {
    id: "legacy",
    collection: "The Legacy Collection",
    vars: {
      "--ea-accent": "#c99a62",
      "--ea-accent-soft": "rgba(201, 154, 98, 0.2)",
      "--ea-paper": "#e2cfa8",
      "--ea-wash": "rgba(46, 30, 16, 0.58)",
      "--ea-edge": "linear-gradient(160deg, rgba(201,154,98,0.5), rgba(90,58,32,0.14) 45%, rgba(201,154,98,0.28))",
    } as CSSProperties,
  },
  "field-study": {
    id: "field-study",
    collection: "The Field Study Collection",
    vars: {
      "--ea-accent": "#9fc4d8",
      "--ea-accent-soft": "rgba(159, 196, 216, 0.16)",
      "--ea-paper": "#e9e9e2",
      "--ea-wash": "rgba(20, 30, 40, 0.6)",
      "--ea-edge": "linear-gradient(160deg, rgba(159,196,216,0.42), rgba(90,96,106,0.12) 45%, rgba(159,196,216,0.24))",
    } as CSSProperties,
  },
};
