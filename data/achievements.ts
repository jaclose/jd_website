import { essays, fieldNotes } from "@/lib/content";
import { biosphere, skills } from "@/data/garden";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** how it is earned, shown even while locked */
  condition: string;
  unlocked: boolean;
  unlockedOn?: string;
}

const bio = biosphere(skills);

/**
 * Achievements unlock automatically from the state of the site —
 * essays written, trees grown, notes dispatched. Visitors will earn
 * their own (guestbook, correspondence) once Supabase is live.
 */
export const achievements: Achievement[] = [
  {
    id: "first-light",
    title: "First Light",
    description: "The first essay left the atmosphere.",
    condition: "Publish one essay",
    unlocked: essays.length >= 1,
    unlockedOn: "2025-02-11",
  },
  {
    id: "pentaglyph",
    title: "Pentaglyph",
    description: "Five essays in orbit.",
    condition: "Publish five essays",
    unlocked: essays.length >= 5,
    unlockedOn: "2025-11-04",
  },
  {
    id: "dispatcher",
    title: "Dispatcher",
    description: "Field notes arriving on schedule.",
    condition: "Send three field notes",
    unlocked: fieldNotes.length >= 3,
    unlockedOn: "2025-11-23",
  },
  {
    id: "first-canopy",
    title: "First Canopy",
    description: "A tree in the garden reached full growth.",
    condition: "Grow one skill to stage 4",
    unlocked: bio.grown >= 1,
    unlockedOn: "2024-01-01",
  },
  {
    id: "terraformer",
    title: "Terraformer",
    description: "The garden planet shows green from orbit.",
    condition: "Reach 15 growth points",
    unlocked: bio.points >= 15,
    unlockedOn: "2026-06-11",
  },
  {
    id: "hydrosphere",
    title: "Hydrosphere",
    description: "Enough life to condense the first sea.",
    condition: "Reach 50 growth points",
    unlocked: bio.points >= 50,
  },
  {
    id: "decade-ring",
    title: "Decade Ring",
    description: "Ten essays — a full ring around the gas giant.",
    condition: "Publish ten essays",
    unlocked: essays.length >= 10,
  },
  {
    id: "correspondent",
    title: "Correspondent",
    description: "A reader wrote back.",
    condition: "Receive a message through the site",
    unlocked: false,
  },
];

export const unlockedCount = achievements.filter((a) => a.unlocked).length;
