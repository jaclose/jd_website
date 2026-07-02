import { gardenFeatures } from "@/data/gardenFeatures";

/**
 * The Sanctum's game layer, authored as data. Quests are trackable walks with
 * world-space objectives (the tracker draws a guide beacon to the nearest
 * incomplete one); secrets are hidden discoverables off the trail; achievements
 * are the persistent record of both. Everything keys off world positions so the
 * sensor can resolve progress purely from where the visitor has walked —
 * no reading required.
 */

export interface QuestObjective {
  id: string;
  label: string;
  /** world ground point the visitor must reach. */
  target: [number, number, number];
  /** arrival radius in metres. */
  radius: number;
}

export interface SanctumQuest {
  id: string;
  title: string;
  kicker: string;
  /** one-line description shown when the quest is expanded. */
  brief: string;
  objectives: QuestObjective[];
  /** achievement unlocked when every objective is met. */
  achievementId: string;
  /** hidden from the list until `revealedBy` fires (first secret found). */
  secret?: boolean;
}

export interface SanctumSecret {
  id: string;
  title: string;
  /** world ground point of the hidden thing. */
  position: [number, number, number];
  /** discovery radius in metres. */
  radius: number;
  /** the one line shown when it is found. */
  whisper: string;
}

export interface SanctumAchievement {
  id: string;
  title: string;
  detail: string;
  /** secret achievements render as ??? until unlocked. */
  secret?: boolean;
}

const featurePos = (id: string): [number, number, number] => {
  const f = gardenFeatures.find((g) => g.id === id);
  return f ? f.position : [0, 0, 0];
};

const obj = (id: string, label: string, radius = 5.5): QuestObjective => ({
  id,
  label,
  target: featurePos(id),
  radius,
});

/* ————— secrets: four quiet things hidden off the trail ————— */

export const sanctumSecrets: SanctumSecret[] = [
  {
    id: "listening-stone",
    title: "The Listening Stone",
    position: [-24, 0, -21],
    radius: 3.5,
    whisper: "A mossy monolith, humming at a frequency only patience can hear.",
  },
  {
    id: "fox-of-the-sanctum",
    title: "The Fox of the Sanctum",
    position: [18.5, 0, -31],
    radius: 3.5,
    whisper: "A small stone fox, waiting in the treeline. It was here first.",
  },
  {
    id: "mushroom-ring",
    title: "The Mushroom Ring",
    position: [-17, 0, -66],
    radius: 3.5,
    whisper: "A fairy ring at the forest's far edge. Step in; nothing happens. Probably.",
  },
  {
    id: "first-seed",
    title: "The First Seed",
    position: [5.6, 0, -17.8],
    radius: 2.8,
    whisper: "Behind the greenhouse: a glass jar and one seed, glowing. The backup plan.",
  },
];

export const secretById = new Map(sanctumSecrets.map((s) => [s.id, s]));

/* ————— quests: walks the tracker can point you along ————— */

export const sanctumQuests: SanctumQuest[] = [
  {
    id: "first-signal",
    title: "The First Signal",
    kicker: "Main Trail",
    brief: "Follow the trail from the threshold to the signal tower that broadcasts this website.",
    objectives: [
      { id: "trailhead", label: "Reach the trailhead", target: [0, 0, 8.5], radius: 4 },
      obj("website-tree", "Stand before the signal tower"),
    ],
    achievementId: "signal-keeper",
  },
  {
    id: "night-garden",
    title: "The Night Garden",
    kicker: "Main Trail",
    brief: "Find the glass greenhouse where Noctyrium grows — study by starlight.",
    objectives: [obj("noctyrium", "Visit the Noctyrium greenhouse")],
    achievementId: "night-gardener",
  },
  {
    id: "scholars-road",
    title: "The Scholar's Road",
    kicker: "Medicine & Study",
    brief: "Walk the left fork the whole way down: five stations of the medical road, newest to oldest.",
    objectives: [
      obj("term-3", "Term 3 · the field station"),
      obj("term-2", "Term 2 · the study cairn"),
      obj("term-1", "Term 1 · the study cairn"),
      obj("utk", "UT Knoxville · the old campus"),
      obj("mcat", "MCAT · where the road began"),
    ],
    achievementId: "scholars-road",
  },
  {
    id: "works-of-hands",
    title: "Works of the Hands",
    kicker: "Projects & Life",
    brief: "Walk the right fork: training ground, pitch, tide pool, and the plot not yet sown.",
    objectives: [
      obj("training-journey", "The training ground"),
      obj("soccer", "The pitch bench"),
      obj("wave-depth", "The tide pool"),
      obj("future-plot", "The unsown plot"),
    ],
    achievementId: "works-of-hands",
  },
  {
    id: "quiet-ones",
    title: "The Quiet Ones",
    kicker: "Secrets",
    brief: "Four quiet things are hidden off the trail. The beacon will not help you here.",
    objectives: sanctumSecrets.map((s) => ({
      id: s.id,
      label: "???",
      target: s.position,
      radius: s.radius,
    })),
    achievementId: "keeper-of-quiet-things",
    secret: true,
  },
];

export const questById = new Map(sanctumQuests.map((q) => [q.id, q]));

/* ————— achievements: the persistent record ————— */

export const sanctumAchievements: SanctumAchievement[] = [
  { id: "first-light", title: "First Light", detail: "Stepped through the threshold into the Living Sanctum." },
  { id: "signal-keeper", title: "Signal Keeper", detail: "Stood before the tower that broadcasts this website." },
  { id: "night-gardener", title: "Night Gardener", detail: "Visited the Noctyrium greenhouse." },
  { id: "scholars-road", title: "The Scholar's Road", detail: "Walked every station of the medical road." },
  { id: "works-of-hands", title: "Works of the Hands", detail: "Walked the projects fork end to end." },
  { id: "every-chapter", title: "Every Chapter", detail: "Visited every landmark in the Sanctum." },
  { id: "wanderer", title: "Wanderer", detail: "Walked four hundred metres on Sanctum ground." },
  { id: "listening-stone", title: "The Listening Stone", detail: "Found the humming monolith in the west meadow.", secret: true },
  { id: "fox-of-the-sanctum", title: "Fox of the Sanctum", detail: "Found the stone fox in the eastern treeline.", secret: true },
  { id: "mushroom-ring", title: "The Mushroom Ring", detail: "Stepped into the fairy ring and lived.", secret: true },
  { id: "first-seed", title: "The First Seed", detail: "Found the backup plan behind the greenhouse.", secret: true },
  { id: "keeper-of-quiet-things", title: "Keeper of Quiet Things", detail: "Found all four of the Sanctum's secrets.", secret: true },
];

export const achievementById = new Map(sanctumAchievements.map((a) => [a.id, a]));

/** every visitable landmark id (for the Every Chapter achievement). */
export const ALL_FEATURE_IDS = gardenFeatures.map((f) => f.id);

/** the tracked quest's nearest unmet objective from (x,z) — the guide's target. */
export function nextObjective(
  quest: SanctumQuest,
  visited: Record<string, true>,
  secrets: Record<string, true>,
  x: number,
  z: number,
): QuestObjective | null {
  let best: QuestObjective | null = null;
  let bd = Infinity;
  for (const o of quest.objectives) {
    if (visited[o.id] || secrets[o.id]) continue;
    const d = Math.hypot(o.target[0] - x, o.target[2] - z);
    if (d < bd) {
      bd = d;
      best = o;
    }
  }
  return best;
}

/** metres of ground covered for the Wanderer achievement. */
export const WANDERER_METRES = 400;
