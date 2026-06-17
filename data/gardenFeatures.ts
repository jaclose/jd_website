export type GardenFeatureKind =
  | "tree"
  | "sapling"
  | "seed"
  | "stump"
  | "fallen-tree"
  | "signpost"
  | "plaque"
  | "grove"
  | "meadow"
  | "stream"
  | "bridge"
  | "unsown-plot"
  | "landmark";

export type GardenBranch = "main" | "medicine" | "projects";

export type GardenStage =
  | "seed"
  | "sapling"
  | "young"
  | "rooted"
  | "scarred"
  | "mature"
  | "fallen"
  | "unsown";

export interface GardenFeature {
  id: string;
  title: string;
  branch: GardenBranch;
  kind: GardenFeatureKind;
  stage: GardenStage;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  year?: string;
  description: string;
  plaqueText: string;
  visualNotes: string;
  links?: {
    label: string;
    href: string;
    type: "web" | "repo" | "note" | "external";
  }[];
  tags: string[];
}

export const gardenFeatures: GardenFeature[] = [
  {
    id: "website-tree",
    title: "This Website",
    branch: "main",
    kind: "tree",
    stage: "mature",
    position: [-6.55, 0, -8.7],
    scale: 1.05,
    description: "The central tree of the site.",
    plaqueText:
      "The central tree: essays, notes, projects, archives, deployments, and the living map of what is still growing.",
    visualNotes:
      "Huge ancient tree, real bark texture, branches labeled Essays, Field Notes, Garden, Deployments, About, Vault, Achievements.",
    links: [
      { label: "Essays", href: "/essays", type: "note" },
      { label: "Field Notes", href: "/field-notes", type: "note" },
      { label: "About", href: "/about", type: "note" },
    ],
    tags: ["website", "identity", "portfolio"],
  },
  {
    id: "noctyrium",
    title: "Noctyrium",
    branch: "main",
    kind: "sapling",
    stage: "sapling",
    position: [3.15, 0, -15.5],
    scale: 1.08,
    description: "Active medical-school accountability and study-resource system.",
    plaqueText:
      "A nocturnal medical-school accountability and resource companion: heatmaps, study resources, productivity tracking, and a second brain for the night's work.",
    visualNotes:
      "Young sapling supported by stakes, blue-violet crystal glow, subtle Noctyrium icon motif.",
    links: [
      {
        label: "Open Web Deployment",
        href: "https://vercel.com/jacloses-projects/noctyrium",
        type: "web",
      },
      {
        label: "View Repo",
        href: "https://github.com/jaclose/Noctyrium",
        type: "repo",
      },
      {
        label: "Field Note",
        href: "/field-notes",
        type: "note",
      },
    ],
    tags: ["noctyrium", "medicine", "study", "project"],
  },
  {
    id: "term-3",
    title: "Term 3 · SGU",
    branch: "medicine",
    kind: "seed",
    stage: "seed",
    position: [-4, 0, -28],
    description: "Current stage.",
    plaqueText:
      "Current stage. Still a seed in the ground, braced by structure, routine, and the work that has to happen before growth is visible.",
    visualNotes:
      "Seed or tiny sapling with protective stakes, stone ring, fresh soil.",
    tags: ["sgu", "term-3", "medicine"],
  },
  {
    id: "term-2",
    title: "Term 2 · SGU",
    branch: "medicine",
    kind: "tree",
    stage: "scarred",
    position: [-6.7, 0, -37],
    scale: 0.92,
    description: "Difficult but survived.",
    plaqueText:
      "A hard season: pressure, fatigue, recovery, and endurance. The tree is scarred, but it kept growing.",
    visualNotes:
      "Partly charred tree, bent branches, new green leaves returning.",
    tags: ["sgu", "term-2", "medicine"],
  },
  {
    id: "term-1",
    title: "Term 1 · SGU",
    branch: "medicine",
    kind: "tree",
    stage: "rooted",
    position: [-8.4, 0, -47],
    scale: 1.02,
    description: "Foundation stage.",
    plaqueText:
      "The first medical-school root system: adaptation, pace, discipline, and learning how to survive the load.",
    visualNotes: "Strong healthy foundational tree with visible roots.",
    tags: ["sgu", "term-1", "medicine"],
  },
  {
    id: "utk",
    title: "UT Knoxville",
    branch: "medicine",
    kind: "grove",
    stage: "mature",
    position: [-9.6, 0, -58],
    scale: 1,
    description: "Undergraduate psychology and accelerated path.",
    plaqueText:
      "Psychology degree, accelerated path, compressed timeline, and the first proof that impossible schedules could be bent into structure.",
    visualNotes: "Academic grove with subtle orange accent and UT Knoxville plaque.",
    tags: ["utk", "psychology", "premed"],
  },
  {
    id: "mcat",
    title: "MCAT",
    branch: "medicine",
    kind: "grove",
    stage: "scarred",
    position: [-10.6, 0, -69],
    scale: 1,
    description: "Testing ground.",
    plaqueText:
      "A testing ground. Fallen trunks, stumps, and one tree still standing: the pressure of proving readiness before the next gate opened.",
    visualNotes: "One fallen tree, one stump, one surviving tree.",
    tags: ["mcat", "premed", "testing"],
  },
  {
    id: "training-journey",
    title: "Training Journey",
    branch: "projects",
    kind: "tree",
    stage: "young",
    position: [5.4, 0, -30],
    scale: 0.94,
    description: "Physical discipline and rebuilding.",
    plaqueText:
      "An apple tree of discipline: repeated effort, physical rebuilding, and the slow fruit of showing up.",
    visualNotes:
      "Apple tree with fruit at different stages, nearby bench/training marker.",
    tags: ["fitness", "training", "body"],
  },
  {
    id: "soccer",
    title: "Soccer",
    branch: "projects",
    kind: "meadow",
    stage: "rooted",
    position: [8.6, 0, -41],
    scale: 1,
    description: "Movement, competition, and field memory.",
    plaqueText:
      "Open field, footwork, competition, and the old rhythm of movement before everything became schedules and screens.",
    visualNotes:
      "Small meadow, worn ball, footprints, subtle goalpost or field marker.",
    tags: ["soccer", "sports", "movement"],
  },
  {
    id: "wave-depth",
    title: "Wave Depth",
    branch: "projects",
    kind: "stream",
    stage: "rooted",
    position: [10.2, 0, -52.5],
    scale: 1,
    description: "Mentorship and professional exposure.",
    plaqueText:
      "Mentorship, early professional exposure, and learning how ideas move from people into systems.",
    visualNotes:
      "Stream or reflective pool, wave-light rings, small bridge/platform.",
    tags: ["mentor", "professional", "wave-depth"],
  },
  {
    id: "future-plot",
    title: "Unsown Plot",
    branch: "projects",
    kind: "unsown-plot",
    stage: "unsown",
    position: [9.1, 0, -63],
    scale: 1,
    description: "Prepared ground for what comes next.",
    plaqueText: "A prepared space for a future project, skill, or story.",
    visualNotes: "Empty prepared soil, marker stones, quiet firefly glow.",
    tags: ["future", "project", "unsown"],
  },
];

export function gardenFeatureById(id?: string) {
  return gardenFeatures.find((feature) => feature.id === id);
}
