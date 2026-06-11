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
    date: "2026-06-11",
    type: "feat",
    message: "spatial navigation — the JD-1184 system goes live",
    additions: 4216,
    deletions: 0,
  },
  {
    date: "2026-06-11",
    type: "garden",
    message: "planted the garden — 8 trees, biosphere at 18 points",
    additions: 8,
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
