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

export type GardenFeatureEventStatus = "past" | "current" | "future";

export interface GardenFeatureStoryEvent {
  label: string;
  detail: string;
  status?: GardenFeatureEventStatus;
}

export interface GardenFeatureGrowthEntry {
  label: string;
  value: number;
  detail: string;
}

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
  story?: {
    summary: string;
    essaySlug?: string;
    events: GardenFeatureStoryEvent[];
  };
  growth?: GardenFeatureGrowthEntry[];
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
      "Huge ancient tree, real bark texture, branches labeled Essays, Field Notes, Sanctum, Deployments, About, Vault, Achievements.",
    story: {
      summary:
        "The site tree is the map for the whole place: writing, projects, deployments, notes, and whatever is still pushing new branches.",
      events: [
        {
          label: "Root system",
          detail: "Core pages and identity gathered into one living trailhead.",
          status: "past",
        },
        {
          label: "Branch labels",
          detail: "Essays, field notes, Sanctum, deployments, archive spaces, and public record begin to separate into visible limbs.",
          status: "current",
        },
        {
          label: "Canopy essays",
          detail: "Longer story essays can attach here later as carved rings inside the main trunk.",
          status: "future",
        },
      ],
    },
    growth: [
      { label: "Structure", value: 86, detail: "Navigation and site identity are rooted." },
      { label: "Archive", value: 58, detail: "The vault and older records are present but still expanding." },
      { label: "Canopy", value: 72, detail: "The living map is visible, with room for deeper essays." },
    ],
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
    story: {
      summary:
        "A young active project tree: still being trained upward, but already glowing with the study system it is meant to become.",
      events: [
        {
          label: "Prototype roots",
          detail: "Heatmaps, accountability, and resource tracking form the first living system.",
          status: "past",
        },
        {
          label: "Night work",
          detail: "The app becomes a second brain for late medical-school study sessions.",
          status: "current",
        },
        {
          label: "Field note",
          detail: "A longer build essay can attach here when the project history is ready.",
          status: "future",
        },
      ],
    },
    growth: [
      { label: "Product", value: 64, detail: "Core direction is clear and actively growing." },
      { label: "Study loop", value: 70, detail: "Accountability and resource habits are becoming the trunk." },
      { label: "Polish", value: 42, detail: "The sapling still needs pruning, UI hardening, and deployment story." },
    ],
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
    story: {
      summary:
        "The current academic plot stays deliberately small: protected soil, repeated routine, and growth that is not fully visible yet.",
      events: [
        {
          label: "Prepared ground",
          detail: "The work is organized before it is impressive.",
          status: "current",
        },
        {
          label: "Routine stakes",
          detail: "Structure, review blocks, and recovery habits brace the seed.",
          status: "current",
        },
        {
          label: "First leaves",
          detail: "Future exams and reflections can become the first visible growth rings.",
          status: "future",
        },
      ],
    },
    growth: [
      { label: "Preparation", value: 54, detail: "The soil is prepared and braced." },
      { label: "Visibility", value: 24, detail: "Most growth is still underground." },
      { label: "Momentum", value: 48, detail: "Daily structure is the main metric for now." },
    ],
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
    story: {
      summary:
        "A scarred but living academic tree: visible damage, returning leaves, and the proof that endurance still counts as growth.",
      events: [
        {
          label: "Heavy load",
          detail: "Pressure and fatigue burned into the bark.",
          status: "past",
        },
        {
          label: "Recovery edge",
          detail: "The tree stayed alive instead of becoming a stump.",
          status: "past",
        },
        {
          label: "New leaves",
          detail: "Future reflections can mark what changed after the hard season.",
          status: "future",
        },
      ],
    },
    growth: [
      { label: "Endurance", value: 78, detail: "The scarred tree is still standing." },
      { label: "Recovery", value: 52, detail: "New leaves are returning, not pretending the burns vanished." },
      { label: "Clarity", value: 61, detail: "The lesson is becoming legible in hindsight." },
    ],
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
    story: {
      summary:
        "The first medical-school root system: a sturdier trunk built from adaptation, pace, and learning the scale of the load.",
      events: [
        {
          label: "First pace",
          detail: "The rhythm of medical school became real instead of theoretical.",
          status: "past",
        },
        {
          label: "Rooting",
          detail: "Discipline and study systems started to become infrastructure.",
          status: "past",
        },
        {
          label: "Annotated rings",
          detail: "A later essay can connect this first foundation to the later trail.",
          status: "future",
        },
      ],
    },
    growth: [
      { label: "Foundation", value: 82, detail: "The main root system is established." },
      { label: "Adaptation", value: 74, detail: "The pace became survivable." },
      { label: "Reflection", value: 38, detail: "The deeper written story is still open." },
    ],
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
    story: {
      summary:
        "The Knoxville grove holds the compressed undergraduate path: fast growth, pressure, ambition, and the first proof that structure could bend a hard schedule.",
      events: [
        {
          label: "Compressed path",
          detail: "Psychology and premed work moved on a tightened timeline.",
          status: "past",
        },
        {
          label: "Orange marker",
          detail: "A small UT Knoxville sign marks the grove without turning it into a billboard.",
          status: "current",
        },
        {
          label: "Degree rings",
          detail: "Future details can become dated rings for semesters, milestones, and lessons.",
          status: "future",
        },
      ],
    },
    growth: [
      { label: "Ambition", value: 88, detail: "The grove grew quickly." },
      { label: "Compression", value: 76, detail: "A difficult schedule was shaped into structure." },
      { label: "Context", value: 45, detail: "Specific semester memories can be attached later." },
    ],
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
    story: {
      summary:
        "The testing grove is deliberately uneven: a fallen trunk, a stump, and one surviving tree for the pressure of proving readiness.",
      events: [
        {
          label: "Readiness gate",
          detail: "The MCAT stood between preparation and the next stretch of trail.",
          status: "past",
        },
        {
          label: "Fallen wood",
          detail: "The space shows weight and repetition without making the whole landmark about failure.",
          status: "past",
        },
        {
          label: "Score story",
          detail: "A future note can add the exact timeline and what the process taught.",
          status: "future",
        },
      ],
    },
    growth: [
      { label: "Pressure", value: 84, detail: "The grove is one of the heavier gates." },
      { label: "Persistence", value: 70, detail: "One tree remains upright." },
      { label: "Closure", value: 46, detail: "The full written account can still be planted." },
    ],
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
    story: {
      summary:
        "The training tree is an apple tree because the work is repetitive, bodily, and slow to show fruit until it suddenly does.",
      events: [
        {
          label: "Rebuild",
          detail: "The body becomes part of the Sanctum instead of a side quest.",
          status: "past",
        },
        {
          label: "Daily fruit",
          detail: "Some apples are ripe, some are still growing, and some are just proof of showing up.",
          status: "current",
        },
        {
          label: "Progress chart",
          detail: "Future bodyweight, strength, or training-cycle notes can attach as dated rings.",
          status: "future",
        },
      ],
    },
    growth: [
      { label: "Discipline", value: 73, detail: "Repeated effort is the trunk." },
      { label: "Rebuilding", value: 62, detail: "The fruit is visible but uneven, as it should be." },
      { label: "Tracking", value: 35, detail: "A richer chart can be filled in later." },
    ],
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
    story: {
      summary:
        "A clearing off the right fork: movement, competition, grass, and an older rhythm before the work became mostly screens and schedules.",
      events: [
        {
          label: "Open field",
          detail: "The landmark keeps space around it instead of becoming another tree.",
          status: "past",
        },
        {
          label: "Footwork memory",
          detail: "Tracks in the grass carry the memory of movement.",
          status: "current",
        },
        {
          label: "Match notes",
          detail: "Specific stories can later become field-note pins around the meadow.",
          status: "future",
        },
      ],
    },
    growth: [
      { label: "Movement", value: 80, detail: "The meadow still has kinetic memory." },
      { label: "Competition", value: 66, detail: "The goal marker and ball carry the old pressure." },
      { label: "Detail", value: 30, detail: "Named stories are still waiting to be attached." },
    ],
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
    story: {
      summary:
        "The Wave Depth landmark uses water instead of wood: mentorship, systems, and the way ideas ripple from one person into another structure.",
      events: [
        {
          label: "Mentor current",
          detail: "Early professional exposure started as a stream, not a finished river.",
          status: "past",
        },
        {
          label: "Wave rings",
          detail: "The water surface makes the learning visible as ripples.",
          status: "current",
        },
        {
          label: "Bridge notes",
          detail: "A future essay can describe what crossed from mentorship into practice.",
          status: "future",
        },
      ],
    },
    growth: [
      { label: "Exposure", value: 67, detail: "The first professional current is present." },
      { label: "Mentorship", value: 72, detail: "People and systems both shaped the landmark." },
      { label: "Documentation", value: 34, detail: "The long-form story can still be written." },
    ],
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
    story: {
      summary:
        "Unsown ground is intentional: a visible promise that the Sanctum has room for future projects, skills, and stories.",
      events: [
        {
          label: "Prepared soil",
          detail: "The plot exists before the project does.",
          status: "current",
        },
        {
          label: "First seed",
          detail: "A new build, essay, or life event can become the first planted marker here.",
          status: "future",
        },
        {
          label: "New branch",
          detail: "When this grows large enough, it can split into its own trail node.",
          status: "future",
        },
      ],
    },
    growth: [
      { label: "Readiness", value: 46, detail: "The ground is prepared." },
      { label: "Unknown", value: 12, detail: "The future story is still unnamed." },
      { label: "Potential", value: 91, detail: "The plot is empty because it is available." },
    ],
    tags: ["future", "project", "unsown"],
  },
];

export function gardenFeatureById(id?: string) {
  return gardenFeatures.find((feature) => feature.id === id);
}
