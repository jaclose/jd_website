/**
 * Transmission log — a git-style record of changes to this universe,
 * and to its author. Site work and life events share one history.
 */
export interface LogEntry {
  date: string;
  type: "feat" | "fix" | "life" | "garden" | "essay" | "note";
  message: string;
  additions: number;
  deletions: number;
}

export const changelog: LogEntry[] = [
  {
    date: "2026-06-12",
    type: "feat",
    message:
      "the premium pass — pill nav, full-page scenes, forest you can walk, distinct worlds, zero warnings",
    additions: 1199,
    deletions: 885,
  },
  {
    date: "2026-06-12",
    type: "feat",
    message:
      "biomes & bloom — the forest scene, the Dominion life-map, the Vault opens · moons become destinations · hidden achievements seeded",
    additions: 2376,
    deletions: 437,
  },
  {
    date: "2026-06-12",
    type: "fix",
    message:
      "every image returned to its rightful essay — covers and inline art now match the source, unadulterated",
    additions: 64,
    deletions: 58,
  },
  {
    date: "2026-06-12",
    type: "feat",
    message:
      "the masterpiece pass — deep sky, ring systems, magnetic hover · DabbaghMed comes aboard · essays become a gallery",
    additions: 2746,
    deletions: 608,
  },
  {
    date: "2026-06-12",
    type: "garden",
    message: "the garden cleared to honest zero — one seed rests, unsown",
    additions: 1,
    deletions: 18,
  },
  {
    date: "2026-06-12",
    type: "feat",
    message: "GLD-7 charted — achievements constellation · the pulsar speaks Arabic",
    additions: 318,
    deletions: 6,
  },
  {
    date: "2026-06-12",
    type: "feat",
    message: "meteors over the system · mobile framing · reading progress · signal-lost page",
    additions: 412,
    deletions: 28,
  },
  {
    date: "2026-06-12",
    type: "fix",
    message: "vercel framework preset — the system reaches production",
    additions: 4,
    deletions: 0,
  },
  {
    date: "2026-06-11",
    type: "feat",
    message: "spatial navigation — the JD-1184 system goes live",
    additions: 4216,
    deletions: 0,
  },
  {
    date: "2026-06-11",
    type: "garden",
    message: "garden plots surveyed — the greening function awaits its first seed",
    additions: 1,
    deletions: 0,
  },
  {
    date: "2026-06-11",
    type: "feat",
    message: "migrated 6 essays + 3 field notes from WordPress",
    additions: 9,
    deletions: 0,
  },
  {
    date: "2025-11-23",
    type: "note",
    message: "field note: how we behave when it matters least",
    additions: 254,
    deletions: 0,
  },
  {
    date: "2025-11-04",
    type: "essay",
    message: "essay: anatomy of the test",
    additions: 1433,
    deletions: 0,
  },
  {
    date: "2025-10-11",
    type: "essay",
    message: "essay: the anatomy of arrival",
    additions: 766,
    deletions: 0,
  },
  {
    date: "2025-02-11",
    type: "life",
    message: "hello world — the space between what was and what's next",
    additions: 1,
    deletions: 0,
  },
];
