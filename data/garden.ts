/**
 * The Garden — every skill, practice, or pursuit is a tree.
 * Stage advances as the work deepens:
 *   0 seed · 1 sprout · 2 sapling · 3 young tree · 4 grown · 5 flourishing
 */
export interface Skill {
  id: string;
  name: string;
  domain: "mind" | "craft" | "body" | "spirit";
  planted: string; // ISO date the pursuit began
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  note: string;
}

export const skills: Skill[] = [
  {
    id: "medicine",
    name: "Medicine",
    domain: "mind",
    planted: "2021-09-01",
    stage: 3,
    note: "The long road. Years compressed into months, anatomy of the test after test.",
  },
  {
    id: "writing",
    name: "Writing",
    domain: "craft",
    planted: "2025-02-11",
    stage: 3,
    note: "Essays and field notes — learning to say the thing beneath the thing.",
  },
  {
    id: "faith",
    name: "Faith",
    domain: "spirit",
    planted: "2003-01-01",
    stage: 4,
    note: "Faith without forecasts. The oldest tree in the garden.",
  },
  {
    id: "anthropology",
    name: "Anthropology",
    domain: "mind",
    planted: "2022-01-15",
    stage: 2,
    note: "Reading the human record — threads of serendipity, veins of trial.",
  },
  {
    id: "fiction",
    name: "Fiction",
    domain: "craft",
    planted: "2025-03-07",
    stage: 1,
    note: "Cinders beneath a fading night. First experiments in story.",
  },
  {
    id: "discipline",
    name: "Discipline",
    domain: "body",
    planted: "2024-06-01",
    stage: 2,
    note: "How we behave when it matters least — practiced daily, in private.",
  },
  {
    id: "web-craft",
    name: "Web Craft",
    domain: "craft",
    planted: "2026-06-11",
    stage: 1,
    note: "This site. Building a small universe by hand.",
  },
  {
    id: "arabic",
    name: "Arabic",
    domain: "spirit",
    planted: "2020-01-01",
    stage: 2,
    note: "The language of the texts I keep returning to.",
  },
];

export const STAGE_NAMES = [
  "seed",
  "sprout",
  "sapling",
  "young tree",
  "grown",
  "flourishing",
] as const;

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
