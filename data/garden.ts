/**
 * The Garden — every skill, practice, or pursuit is a tree.
 * Stage advances as the work deepens:
 *   0 seed · 1 sprout · 2 sapling · 3 young tree · 4 grown · 5 flourishing
 *
 * ── HOW TO PLANT ──────────────────────────────────────────────────────
 * Add an entry to `skills` below and everything updates by itself:
 * the rows on /garden, the teaser on the homepage, the biosphere score,
 * and the garden planet in the hero (green shows from orbit at 15
 * points; the first seas condense at 50).
 *
 *   {
 *     id: "medicine",              // unique slug — shapes the tree
 *     name: "Medicine",
 *     domain: "mind",              // mind | craft | body | spirit
 *     planted: "2021-09-01",       // when the pursuit began
 *     stage: 0,                    // 0–5, raise it as the work deepens
 *     note: "The long road.",      // one line shown on its plot
 *   },
 * ─────────────────────────────────────────────────────────────────────
 */
export interface Skill {
  id: string;
  name: string;
  domain: "mind" | "craft" | "body" | "spirit";
  planted: string; // ISO date the pursuit began
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  note: string;
}

/** Nothing planted yet — the ground is prepared. */
export const skills: Skill[] = [];

export const STAGE_NAMES = [
  "seed",
  "sprout",
  "sapling",
  "young tree",
  "grown",
  "flourishing",
] as const;

export const DOMAIN_NAMES = ["mind", "craft", "body", "spirit"] as const;

/**
 * The greening function. The garden terraforms its planet:
 * vegetation rises with cumulative growth (15 stage-points reads as
 * visibly green) and water appears once the biosphere passes 50 points.
 * The hero planet reads these numbers directly.
 */
export function biosphere(list: Skill[] = skills) {
  const points = list.reduce((sum, s) => sum + s.stage, 0);
  const grown = list.filter((s) => s.stage >= 4).length;
  const vegetation = Math.min(1, points / 15);
  const water = Math.max(0, Math.min(1, (points - 15) / 35)); // full sea at 50
  return { points, grown, vegetation, water, count: list.length };
}
