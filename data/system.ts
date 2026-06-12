import { essays, fieldNotes, dispatchDate } from "@/lib/content";
import { quoteOfTheWeek } from "@/data/quotes";
import { biosphere, STAGE_NAMES, skills } from "@/data/garden";
import { unlockedCount, achievements } from "@/data/achievements";

/**
 * The JD-1184 system. Following exoplanet convention, planets carry the
 * star's designation plus a lowercase letter in order of discovery;
 * comets follow IAU naming (C/year + half-month letter).
 */
export interface BodyLink {
  label: string;
  href: string;
  meta?: string;
}

export interface CelestialBody {
  id: string;
  designation: string; // e.g. "JD-1184 b"
  name: string; // human name shown on the nav bar
  kind: "gas-giant" | "terrestrial" | "rocky" | "comet" | "star";
  href: string;
  /** orbital radius in scene units (0 = the sun) */
  orbit: number;
  /** planet radius in scene units */
  size: number;
  /** orbital period — seconds for a full revolution */
  period: number;
  /** initial angle along the orbit, radians */
  phase: number;
  /** inclination wobble of the orbit plane, radians */
  tilt: number;
  color: string;
  accent: string;
  blurb: string;
  links: BodyLink[];
  footnote?: string;
}

const bio = biosphere(skills);

// vegetation/water drive the garden planet's color ramp in the shader;
// exported so the hero and the garden page agree on the numbers.
export const gardenState = bio;

export const bodies: CelestialBody[] = [
  {
    id: "essays",
    designation: "JD-1184 b",
    name: "Essays",
    kind: "gas-giant",
    href: "/essays",
    orbit: 11.5,
    size: 1.45,
    period: 95,
    phase: 0.6,
    tilt: 0.06,
    color: "#b88d5c",
    accent: "#e8c79a",
    blurb:
      "A gas giant of long-form thought. Its three visible moons are the most recent essays.",
    links: essays.slice(0, 3).map((e) => ({
      label: e.title,
      href: `/essays/${e.slug}`,
      meta: dispatchDate(e.date),
    })),
    footnote: `${essays.length} essays in orbit`,
  },
  {
    id: "field-notes",
    designation: "C/2025 JD",
    name: "Field Notes",
    kind: "comet",
    href: "/field-notes",
    orbit: 15.5,
    size: 0.34,
    period: 70,
    phase: 3.4,
    tilt: 0.32,
    color: "#9fd8e8",
    accent: "#d7f2fa",
    blurb: fieldNotes[0]
      ? `Latest dispatch · ${dispatchDate(fieldNotes[0].date)} — “${fieldNotes[0].excerpt.slice(0, 110)}…”`
      : "Dispatches from study, faith, and the battle to stay present.",
    links: [{ label: "Read the dispatches", href: "/field-notes" }],
    footnote: `${fieldNotes.length} notes logged`,
  },
  {
    id: "garden",
    designation: "JD-1184 c",
    name: "The Garden",
    kind: "terrestrial",
    href: "/garden",
    orbit: 8.2,
    size: 0.95,
    period: 70,
    phase: 2.2,
    tilt: 0.04,
    color: "#9a5f43",
    accent: "#9fce8f",
    blurb:
      bio.count === 0
        ? "A barren world, prepared for terraforming. Nothing has been planted yet — each skill that takes root will turn it greener, and at 50 growth points the first seas condense."
        : `A terraforming world. ${bio.count} trees planted, ${bio.grown} fully grown — biosphere at ${bio.points} growth points. Each skill that matures turns it greener; at 50 points, the first seas condense.`,
    links: [{ label: "Enter the garden", href: "/garden" }],
    footnote:
      bio.count === 0
        ? "surface survey · regolith, waiting"
        : `latest sapling · ${skills[skills.length - 1].name.toLowerCase()} (${STAGE_NAMES[skills[skills.length - 1].stage]})`,
  },
  {
    id: "about",
    designation: "JD-1184 d",
    name: "About",
    kind: "rocky",
    href: "/about",
    orbit: 5.4,
    size: 0.62,
    period: 48,
    phase: 5.1,
    tilt: 0.09,
    color: "#8fa0b6",
    accent: "#d8e4f0",
    blurb:
      "The inner world. Never satisfied with surfaces — the thought before the action, the mercy inside the motion.",
    links: [{ label: "Who is writing this", href: "/about" }],
  },
  {
    id: "vault",
    designation: "STN V-1184",
    name: "The Vault",
    kind: "rocky",
    href: "/vault",
    orbit: 6.8,
    size: 0.42,
    period: 58,
    phase: 0.4,
    tilt: 0.14,
    color: "#6e7681",
    accent: "#aeb8c4",
    blurb:
      "A hollowed asteroid station for travelers. Leave a journal entry, choose a starter seed, and grow a garden of your own — your record stays with you.",
    links: [{ label: "Dock and sign the log", href: "/vault" }],
    footnote: "visitor journal · open to all callsigns",
  },
  {
    id: "quote",
    designation: "PSR J1184+22",
    name: "Quote of the Week",
    kind: "star",
    href: "/#quote",
    orbit: 18.5,
    size: 0.22,
    period: 160,
    phase: 1.1,
    tilt: 0.5,
    color: "#e9ddb8",
    accent: "#fff3cf",
    blurb: `“${quoteOfTheWeek.text}” — ${quoteOfTheWeek.source}`,
    links: [{ label: "Past weeks", href: "/#quote" }],
    footnote: "a pulsar — it keeps the time",
  },
  {
    id: "achievements",
    designation: "GLD-7 cluster",
    name: "Achievements",
    kind: "star",
    href: "/garden#achievements",
    orbit: 20.5,
    size: 0.18,
    period: 200,
    phase: 4.3,
    tilt: 0.62,
    color: "#d4b886",
    accent: "#f4e0b8",
    blurb: `${unlockedCount} of ${achievements.length} unlocked. The cluster brightens as the work accumulates.`,
    links: [{ label: "View the record", href: "/garden#achievements" }],
  },
];

/** order of slots on the docked nav bar, left to right */
export const navOrder = [
  "essays",
  "field-notes",
  "garden",
  "about",
  "vault",
  "quote",
  "achievements",
];
