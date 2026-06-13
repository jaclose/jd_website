import { essays, fieldNotes } from "@/lib/content";
import { biosphere, skills } from "@/data/garden";

export type Tier = "common" | "uncommon" | "rare" | "legendary";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** how it is earned, shown even while locked */
  condition: string;
  unlocked: boolean;
  unlockedOn?: string;
  tier?: Tier;
  /** mono glyph shown on the card */
  icon?: string;
}

/**
 * Achievements visitors earn for themselves by exploring — Steam-style.
 * `hidden` ones show only "???" until found; unlock state lives in the
 * visitor's browser (lib/visitor.ts).
 */
export interface VisitorAchievement {
  id: string;
  title: string;
  description: string;
  condition: string;
  hidden: boolean;
  tier: Tier;
  icon: string;
}

export const visitorAchievements: VisitorAchievement[] = [
  {
    id: "first-contact",
    title: "First Contact",
    description: "You opened the Vault and left a trace of yourself.",
    condition: "Open the Vault",
    hidden: false,
    tier: "common",
    icon: "⌬",
  },
  {
    id: "starter-seed",
    title: "Starter Seed",
    description: "You chose your seed. Every gardener remembers their first.",
    condition: "Choose a starter species in the Vault",
    hidden: false,
    tier: "common",
    icon: "⚘",
  },
  {
    id: "deep-reader",
    title: "Deep Reader",
    description: "You stayed with an essay to its very last line.",
    condition: "Hidden — keep exploring",
    hidden: true,
    tier: "uncommon",
    icon: "✶",
  },
  {
    id: "gardener-eye",
    title: "A Gardener's Eye",
    description: "You watched the seed land and waited for the truth of the frame.",
    condition: "Hidden — keep exploring",
    hidden: true,
    tier: "uncommon",
    icon: "❋",
  },
  {
    id: "cartographer",
    title: "Cartographer",
    description: "You surveyed every province of a life.",
    condition: "Hidden — keep exploring",
    hidden: true,
    tier: "rare",
    icon: "✧",
  },
  {
    id: "beyond-heliopause",
    title: "Beyond the Heliopause",
    description: "You drifted past the edge of the charts and lived.",
    condition: "Hidden — keep exploring",
    hidden: true,
    tier: "legendary",
    icon: "☄",
  },
  {
    id: "first-conquest",
    title: "First Blood",
    description: "You justified your first campaign on the Dominion.",
    condition: "Take one province in the About war-game",
    hidden: false,
    tier: "uncommon",
    icon: "⚔",
  },
  {
    id: "the-unifier",
    title: "The Unifier",
    description: "You secured the entire New World — every lived chapter, declassified.",
    condition: "Conquer every reachable province",
    hidden: false,
    tier: "rare",
    icon: "♛",
  },
  {
    id: "admiral-wanted",
    title: "Admiral Wanted",
    description: "You ordered an invasion across the strait — into an era not yet lived.",
    condition: "Hidden — keep exploring",
    hidden: true,
    tier: "uncommon",
    icon: "⚓",
  },
  {
    id: "wanderer",
    title: "Wanderer",
    description: "You walked the forest trail to its farthest stand.",
    condition: "Hidden — keep exploring",
    hidden: true,
    tier: "uncommon",
    icon: "❧",
  },
  {
    id: "night-owl",
    title: "Night Owl",
    description: "You came to the system in the small hours, when the pulsar keeps time alone.",
    condition: "Hidden — keep exploring",
    hidden: true,
    tier: "rare",
    icon: "☾",
  },
  {
    id: "tuned-in",
    title: "Tuned In",
    description: "You picked up a live signal from the uplink array.",
    condition: "Open the Signals section",
    hidden: false,
    tier: "common",
    icon: "📡",
  },
  {
    id: "callsign",
    title: "Callsign Registered",
    description: "You claimed a name at the Vault — a way back in.",
    condition: "Register a callsign in the Vault",
    hidden: false,
    tier: "common",
    icon: "✷",
  },
  {
    id: "return-traveler",
    title: "Return Traveler",
    description: "You came back on another day. The universe remembered you.",
    condition: "Hidden — keep exploring",
    hidden: true,
    tier: "rare",
    icon: "↻",
  },
  {
    id: "completionist",
    title: "The Completionist",
    description: "Every other record, found. You left no stone in the system unturned.",
    condition: "Hidden — unlock everything else",
    hidden: true,
    tier: "legendary",
    icon: "✺",
  },
];

/** ids that count toward The Completionist (all but itself) */
export const completionistTargets = [
  "first-contact",
  "starter-seed",
  "deep-reader",
  "gardener-eye",
  "cartographer",
  "beyond-heliopause",
  "first-conquest",
  "the-unifier",
  "admiral-wanted",
  "wanderer",
  "night-owl",
  "tuned-in",
  "callsign",
  "return-traveler",
];

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
