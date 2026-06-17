/**
 * The Sanctum — a living map of what Jafar is building, studying, practicing,
 * and becoming. Every pursuit is a planted feature in an explorable world;
 * as the work deepens, its tree grows and the planet JD-1184 c terraforms
 * from orbit (green shows at 15 growth points, the first seas at 50).
 *
 * ── HOW TO PLANT ──────────────────────────────────────────────────────
 * Add an entry to `garden` below and everything updates by itself: the
 * groves you walk on the homepage, the rows and report on /garden, the
 * biosphere score, and the sanctum planet in the hero.
 *
 *   {
 *     id: "medicine",
 *     title: "Medicine",
 *     domain: "mind",            // mind | craft | body | spirit (walkable trails)
 *     type: "field-station",     // what it becomes in the world (see FeatureType)
 *     stage: 3,                  // 0–5 — raise it as the work deepens
 *     status: "active",          // unsown | planted | active | paused | mature | archived
 *     note: "The long climb.",   // one poetic-but-useful line, shown on its stop
 *     planted: "2021-09-01",
 *     repoUrl: "…", projectUrl: "…",   // optional links back
 *   }
 *
 * `stage` is the single growth knob; everything else (the named growth
 * stage, the tree size, the biosphere points) follows from it. Stages here
 * are honest starter estimates — tune them as the real work moves.
 * ─────────────────────────────────────────────────────────────────────
 */

/* ————— trails: the domains of life, each rendered as a biome ————— */

/** the four trails you can walk today */
export type DomainId = "mind" | "craft" | "body" | "spirit";
/** every trail, including ground the Sanctum will expand into */
export type TrailId =
  | DomainId
  | "research-marsh"
  | "archive-caves"
  | "commerce-orchard"
  | "story-grove"
  | "toolshed";

export type Species = "spruce" | "oak" | "palm" | "acacia";

/** what a planted pursuit becomes in the world — environmental storytelling,
 *  never a flat card. (3D currently renders the species tree + a tended
 *  marker for every type; bespoke structures land as the Sanctum grows.) */
export type FeatureType =
  | "tree"
  | "memory-grove" // spaced-repetition / Anki
  | "observatory" // long-term vision, research
  | "field-station" // study, medicine, investigation
  | "signal-tower" // this site, anything that broadcasts
  | "greenhouse" // an app under glass, still growing
  | "workshop" // design systems, builds
  | "toolshed" // utilities, automation, scripts
  | "training-post" // body, discipline
  | "tide-pool" // recovery, nutrition
  | "shrine" // faith, reflection
  | "library" // writings, kept pages
  | "cairn"; // a marker for ground grown past

/** the named life of a tree, derived from `stage` (0–5) */
export type GrowthStage =
  | "seed"
  | "sprout"
  | "sapling"
  | "rooted"
  | "canopy"
  | "flourishing";

export type Status =
  | "unsown"
  | "planted"
  | "active"
  | "paused"
  | "mature"
  | "archived";

export interface GardenItem {
  id: string;
  title: string;
  domain: DomainId; // which walkable trail it grows on
  trail?: TrailId; // defaults to domain; lets a thing belong to a future biome
  type: FeatureType;
  species?: Species; // tree silhouette; defaults from the domain
  stage: 0 | 1 | 2 | 3 | 4 | 5; // the growth knob
  status: Status;
  note: string; // one line, shown on the stop
  description?: string; // a longer survey note
  planted: string; // ISO date the pursuit began
  lastUpdated?: string;
  repoUrl?: string;
  projectUrl?: string;
  symbol?: string; // a glyph for labels
  tags?: string[];
  position?: number; // 0..1 along its trail — where the stop sits (auto if unset)
}

/** kept for backward-compatibility with earlier callers */
export type Skill = GardenItem;

/** each domain grows its own kind of tree */
export const DOMAIN_SPECIES: Record<DomainId, Species> = {
  mind: "spruce", // patient, conical, evergreen
  craft: "oak", // broad, branching, load-bearing
  body: "palm", // flexible, storm-bent, coastal
  spirit: "acacia", // deep roots, wide shade
};

export function speciesOf(s: Pick<GardenItem, "domain" | "species">): Species {
  return s.species ?? DOMAIN_SPECIES[s.domain];
}

/** the trail registry — biome, palette, and the line that names each path.
 *  `status: "active"` trails are walkable; `"planned"` are charted ground. */
export interface TrailDef {
  id: TrailId;
  label: string;
  status: "active" | "planned";
  biome: string;
  weather: string;
  accent: string;
  note: string;
}

export const TRAILS: TrailDef[] = [
  {
    id: "mind",
    label: "Mind",
    status: "active",
    biome: "spruce grove · alpine study forest",
    weather: "snow-dusted · evergreen",
    accent: "#bcd4e6",
    note: "The northern stand. Spruce holds its needles through every winter of study — medicine, research, and the memory systems that keep it all returning.",
  },
  {
    id: "craft",
    label: "Craft",
    status: "active",
    biome: "oak grove · workshop woodland",
    weather: "autumn · broad canopy",
    accent: "#e0b48a",
    note: "The maker's wood. Load-bearing and slow — the apps, sites, and design systems built layer by layer, to one day shade whoever comes after.",
  },
  {
    id: "body",
    label: "Body",
    status: "active",
    biome: "palm line · coastal training path",
    weather: "coastal · storm-bent",
    accent: "#9fd0c0",
    note: "The palm line. Flexible where others snap — the body rebuilt as an instrument: training under heat, running, recovery, the long discipline.",
  },
  {
    id: "spirit",
    label: "Spirit",
    status: "active",
    biome: "acacia stand · desert sacred grove",
    weather: "golden · deep-rooted",
    accent: "#e6cf9a",
    note: "The acacia stand. Roots that reach water far below — faith, gratitude, the Ramadan pages, and the legacy set down for those who come after.",
  },
  // ── charted ground the Sanctum will expand into ──
  {
    id: "research-marsh",
    label: "Research Marsh",
    status: "planned",
    biome: "wetland · field stations on the water",
    weather: "low fog · still water",
    accent: "#86b5a0",
    note: "Wetland for the slow sciences — papers, experiments, WINREF work. Complexity and patient observation, mapped from a boardwalk.",
  },
  {
    id: "archive-caves",
    label: "Archive Caves",
    status: "planned",
    biome: "cave system · glowing mineral veins",
    weather: "underground · cool",
    accent: "#b6a6d8",
    note: "Descend into stored memory — old notes, references, quotes. Veins of light where ideas were set down and kept.",
  },
  {
    id: "commerce-orchard",
    label: "Commerce Orchard",
    status: "planned",
    biome: "orchard · fruiting rows along a market road",
    weather: "warm · midday",
    accent: "#e0c07a",
    note: "Ventures and plans as trees that bear fruit by execution. A market road runs through the rows.",
  },
  {
    id: "story-grove",
    label: "Story Grove",
    status: "planned",
    biome: "narrative woodland · amphitheater clearings",
    weather: "dusk · warm light",
    accent: "#d8a0a8",
    note: "Plays, essays, family stories. Scrolls and a stage among the trees, where the written work is read aloud.",
  },
  {
    id: "toolshed",
    label: "Toolshed",
    status: "planned",
    biome: "forge & shed · irrigation that feeds the rest",
    weather: "workshop light",
    accent: "#c0c0c0",
    note: "Utilities, automation, scripts — the systems that make other systems easier. Functional rather than poetic, and still part of the world.",
  },
];

export const ACTIVE_TRAILS = TRAILS.filter((t) => t.status === "active");
export function trailDef(id: TrailId): TrailDef | undefined {
  return TRAILS.find((t) => t.id === id);
}

/* ————— the planted world ————— */

/**
 * A real starter sanctum, seeded from Jafar's actual repositories and the
 * disciplines he keeps. Stages are conservative honest estimates — edit
 * them as the work moves. Add, water (raise stage), or retire (archive)
 * freely; the world re-renders itself.
 */
export const garden: GardenItem[] = [
  // ── MIND · spruce, the study forest ──
  {
    id: "medicine",
    title: "Medicine",
    domain: "mind",
    type: "field-station",
    stage: 3,
    status: "active",
    note: "The long climb — clinical study, one system at a time.",
    description:
      "The field station on the ridge. Medicine read slowly and for keeps: physiology, pathology, the systems that take years to hold.",
    planted: "2021-09-01",
    symbol: "✚",
    tags: ["medicine", "clinical", "study"],
  },
  {
    id: "jd-med-app",
    title: "Med App",
    domain: "mind",
    type: "greenhouse",
    stage: 2,
    status: "active",
    note: "A study tool taking shape — exam logic, made walkable.",
    description:
      "A greenhouse on the study trail: an app to make medical learning quicker to traverse. Early, but rooted.",
    planted: "2026-03-01",
    lastUpdated: "2026-04-06",
    repoUrl: "https://github.com/jaclose/jd-med-app",
    symbol: "⌘",
    tags: ["medicine", "app", "education"],
  },
  {
    id: "spaced-repetition",
    title: "Spaced Repetition",
    domain: "mind",
    type: "memory-grove",
    stage: 3,
    status: "active",
    note: "A memory grove — every card a tree that returns on schedule.",
    description:
      "Anki and step-study systems: a grove planted so that nothing learned is lost. Each review is a watering; the schedule is the season.",
    planted: "2022-01-01",
    symbol: "↻",
    tags: ["anki", "memory", "systems"],
  },
  {
    id: "second-brain",
    title: "Notes & Second Brain",
    domain: "mind",
    type: "observatory",
    stage: 2,
    status: "active",
    note: "The observatory — notes that connect into long-term sight.",
    description:
      "Writing things down until they connect: a personal knowledge system, pointed at the long view rather than the next exam.",
    planted: "2023-06-01",
    symbol: "◔",
    tags: ["notes", "pkm", "writing"],
  },

  // ── CRAFT · oak, the workshop wood ──
  {
    id: "jd-website",
    title: "This Universe",
    domain: "craft",
    type: "signal-tower",
    stage: 4,
    status: "active",
    note: "The signal tower — this very world, built layer by layer.",
    description:
      "JD-1184: the solar-system site you are standing in. A signal tower on the craft trail, broadcasting everything else in the Sanctum.",
    planted: "2026-06-11",
    lastUpdated: "2026-06-14",
    repoUrl: "https://github.com/jaclose/jd_website",
    projectUrl: "https://jd-website-wheat.vercel.app",
    symbol: "✦",
    tags: ["nextjs", "three.js", "design"],
  },
  {
    id: "noctyrium",
    title: "Noctyrium",
    domain: "craft",
    type: "workshop",
    stage: 2,
    status: "active",
    note: "A night-built thing in Swift — still under construction.",
    description:
      "A Swift app taking shape in the workshop. Built in the quiet hours; not yet open to the trail.",
    planted: "2026-05-01",
    lastUpdated: "2026-06-14",
    repoUrl: "https://github.com/jaclose/Noctyrium",
    symbol: "☾",
    tags: ["swift", "app"],
  },
  {
    id: "design-systems",
    title: "Design Systems",
    domain: "craft",
    type: "workshop",
    stage: 2,
    status: "active",
    note: "Workbenches — type, palette, the grammar that builds the rest.",
    description:
      "The discipline under the work: hairlines, tracking, a coherent palette. The bench every other craft project is squared against.",
    planted: "2025-01-01",
    symbol: "▦",
    tags: ["design", "ui", "systems"],
  },
  {
    id: "feature-unlock",
    title: "FeatureUnlock",
    domain: "craft",
    type: "toolshed",
    stage: 2,
    status: "archived",
    note: "A toolshed fork — Sidecar for machines that weren't invited.",
    description:
      "A utility kept in the shed: patching Sidecar support onto unsupported models. Functional, finished, set aside.",
    planted: "2022-09-17",
    repoUrl: "https://github.com/jaclose/FeatureUnlock",
    symbol: "⚙",
    tags: ["tool", "fork", "macos"],
  },
  {
    id: "home-portfolio",
    title: "The Old Portfolio",
    domain: "craft",
    type: "cairn",
    stage: 5,
    status: "archived",
    note: "A cairn on the trail — the first portfolio, since grown past.",
    description:
      "The earlier personal site. A marker left standing to show how far the path has come.",
    planted: "2025-01-30",
    repoUrl: "https://github.com/jaclose/home",
    symbol: "⌂",
    tags: ["portfolio", "archive"],
  },

  // ── BODY · palm, the coastal training path ──
  {
    id: "training",
    title: "Training",
    domain: "body",
    type: "training-post",
    stage: 2,
    status: "active",
    note: "Palms bend, don't break — the body rebuilt as an instrument.",
    description:
      "Gym, running, the daily discipline. Training posts along the coast; resilience built under heat, not vanity.",
    planted: "2024-01-01",
    symbol: "△",
    tags: ["fitness", "running", "discipline"],
  },
  {
    id: "recovery",
    title: "Recovery & Health",
    domain: "body",
    type: "tide-pool",
    stage: 1,
    status: "active",
    note: "Tide pools — sleep, nutrition, the rebuilding between efforts.",
    description:
      "The quieter half of training: recovery, fuel, and rest. The pools where the work of the day is actually absorbed.",
    planted: "2024-06-01",
    symbol: "≈",
    tags: ["recovery", "nutrition", "health"],
  },

  // ── SPIRIT · acacia, the sacred grove ──
  {
    id: "faith",
    title: "Faith",
    domain: "spirit",
    type: "shrine",
    stage: 3,
    status: "active",
    note: "The acacia stand — dua, gratitude, the quiet discipline.",
    description:
      "The oldest roots in the Sanctum. Daily prayer, gratitude, the moral discipline that holds the rest of the ground together.",
    planted: "2010-01-01",
    symbol: "✺",
    tags: ["faith", "reflection", "discipline"],
  },
  {
    id: "ramadan-writings",
    title: "Ramadan Writings",
    domain: "spirit",
    type: "library",
    stage: 2,
    status: "active",
    note: "Nightly pages kept through Ramadan — returning each year.",
    description:
      "A small library by the water basin: reflections written through the nights of Ramadan, added to season after season.",
    planted: "2023-03-22",
    symbol: "☽",
    tags: ["writing", "ramadan", "reflection"],
  },
  {
    id: "family-legacy",
    title: "Family & Legacy",
    domain: "spirit",
    type: "tree",
    stage: 1,
    status: "planted",
    note: "Roots set down for those who come after.",
    description:
      "The thing the whole Sanctum is ultimately for: family, and a legacy worth inheriting. Newly planted, deliberately tended.",
    planted: "2025-02-11",
    symbol: "❧",
    tags: ["family", "legacy"],
  },
];

/** earlier callers imported `skills`; keep the name pointing at the Sanctum data */
export const skills: GardenItem[] = garden;

/** items that count toward terraforming — what's actually growing now */
function living(list: GardenItem[]) {
  return list.filter((s) => s.status !== "unsown" && s.status !== "archived");
}

export const STAGE_NAMES: readonly GrowthStage[] = [
  "seed",
  "sprout",
  "sapling",
  "rooted",
  "canopy",
  "flourishing",
] as const;

export const DOMAIN_NAMES = ["mind", "craft", "body", "spirit"] as const;

export const STATUS_LABELS: Record<Status, string> = {
  unsown: "unsown",
  planted: "planted",
  active: "active",
  paused: "paused",
  mature: "mature",
  archived: "archived",
};

/**
 * The greening function. The Sanctum terraforms its planet: vegetation rises
 * with cumulative growth (15 stage-points reads as visibly green) and water
 * appears once the biosphere passes 50 points. The hero planet, the /garden
 * report, and the forest HUD all read these numbers directly.
 *
 * Return shape is unchanged (points · grown · vegetation · water · count) so
 * the planet texture keeps working; `living` items only.
 */
export function biosphere(list: GardenItem[] = garden) {
  const live = living(list);
  const points = live.reduce((sum, s) => sum + s.stage, 0);
  const grown = live.filter((s) => s.stage >= 4).length;
  const vegetation = Math.min(1, points / 15);
  const water = Math.max(0, Math.min(1, (points - 15) / 35)); // full sea at 50
  return { points, grown, vegetation, water, count: live.length };
}
