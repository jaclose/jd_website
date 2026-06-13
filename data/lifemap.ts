/**
 * The Dominion — the About page as a Hearts-of-Iron campaign. The world
 * map is a life: you begin in the homeland and spend political power to
 * justify each campaign in the order it was lived. Industrial provinces
 * raise the PP tick; taking a province declassifies its chapter. The Old
 * World waits across the sea — those eras have not been lived yet, and
 * cannot be invaded without a navy.
 *
 * ── HOW TO REVISE ─────────────────────────────────────────────────────
 * Edit the entries below; the map redraws itself. `classified: true`
 * renders the panel as "intel pending" until you flip it. Conquest order
 * is set by `cost` + `requires`. Coordinates live in a 1000×520 viewBox.
 * ─────────────────────────────────────────────────────────────────────
 */
export interface ProvinceMark {
  x: number;
  y: number;
  type: "city" | "factory" | "vp" | "port";
  label?: string;
}

export interface Province {
  id: string;
  name: string;
  era: string;
  role: string;
  detail: string;
  /** what taking the province reveals — the unlocked chapter line */
  reveal: string;
  kind: "homeland" | "campaign" | "industry" | "capital" | "frontier" | "future";
  d: string; // SVG path of the province
  label: [number, number];
  marks?: ProvinceMark[];
  classified?: boolean;
  /** political power to justify the campaign (homeland starts owned) */
  cost: number;
  /** provinces that must already be held to declare */
  requires: string[];
  /** held industrial provinces add to the PP tick */
  industry?: boolean;
  /** sea-locked — needs a navy (an era not yet lived) */
  navy?: boolean;
  /** political-map fill while unconquered */
  hue: string;
}

export const provinces: Province[] = [
  /* ——— THE NEW WORLD — the life lived so far ——— */
  {
    id: "heritage",
    name: "The Old Hearth",
    era: "the beginning —",
    role: "Homeland · faith, Arabic, family",
    detail:
      "The capital you start holding — the province every supply line runs back to. Faith without forecasts was learned here first; the Arabic of the texts he keeps returning to is its mother tongue.",
    reveal:
      "Before ambition there was a hearth: a family, a faith, and a first language that still carries the heaviest words.",
    kind: "homeland",
    d: "M70,150 C80,96 150,70 226,78 C300,86 338,128 330,188 C322,244 274,278 196,278 C112,278 60,214 70,150 Z",
    label: [196, 178],
    marks: [
      { x: 150, y: 138, type: "vp", label: "the hearth" },
      { x: 250, y: 214, type: "city", label: "home" },
    ],
    cost: 0,
    requires: [],
    hue: "#9c7a44",
  },
  {
    id: "high-school",
    name: "The Early Forge",
    era: "records sealed",
    role: "Campaign · where the discipline was drafted",
    detail:
      "The first campaign north of the hearth — where the discipline everything else marches on was first drafted. Records await declassification by the author.",
    reveal:
      "Intel pending. The author has not yet declassified the early forge — edit data/lifemap.ts to write it in.",
    kind: "campaign",
    d: "M120,42 C200,16 320,22 360,58 C392,88 378,128 320,140 C246,154 150,140 120,108 C104,88 104,58 120,42 Z",
    label: [248, 86],
    classified: true,
    cost: 25,
    requires: ["heritage"],
    hue: "#9c5a62",
    marks: [{ x: 240, y: 78, type: "city" }],
  },
  {
    id: "undergrad",
    name: "The Compressed Years",
    era: "— 2024",
    role: "Campaign · five years of road walked in two",
    detail:
      "The largest landmass of the early life — a forced march through chemistry benches, geology halls, and psychology labs. Its four war factories shipped the Archive: the aldol synthesis, the bias study from Dr. Gaertner's lab, Tectonic Trials, and Synthetic Salvation.",
    reveal:
      "He took the long road at a sprint — compressing five years into two — and turned the wreckage of all-nighters into four published works.",
    kind: "campaign",
    d: "M90,300 C150,282 270,284 330,312 C384,338 396,402 360,448 C320,498 210,510 132,484 C70,462 52,398 64,346 C70,322 74,306 90,300 Z",
    label: [218, 392],
    industry: true,
    cost: 40,
    requires: ["high-school"],
    hue: "#5a7a5d",
    marks: [
      { x: 130, y: 350, type: "factory", label: "o-chem 359" },
      { x: 180, y: 440, type: "factory", label: "geology 331" },
      { x: 300, y: 360, type: "factory", label: "gaertner lab" },
      { x: 320, y: 430, type: "factory", label: "bioethics" },
      { x: 240, y: 330, type: "city", label: "the library" },
    ],
  },
  {
    id: "nervewave",
    name: "NerveWave Works",
    era: "intel pending",
    role: "Industry · the venture he helped build",
    detail:
      "An industrial annex glimpsed on reconnaissance — NerveWave, the company he worked on. Production figures and the founding story await declassification by the author.",
    reveal:
      "Intel pending. NerveWave's full story is still sealed — edit data/lifemap.ts to bring its factories online.",
    kind: "industry",
    d: "M360,360 C410,346 470,350 500,376 C526,398 522,436 484,452 C440,470 372,464 348,438 C328,416 332,378 360,360 Z",
    label: [424, 408],
    classified: true,
    industry: true,
    cost: 35,
    requires: ["undergrad"],
    hue: "#5a6e8c",
    marks: [
      { x: 396, y: 392, type: "factory" },
      { x: 456, y: 418, type: "factory" },
    ],
  },
  {
    id: "mcat-front",
    name: "The MCAT Front",
    era: "spring 2025",
    role: "Campaign · a crucible of paper and pixels",
    detail:
      "The bloodiest front of the early war — a testing-center corridor that felt like an interrogation chamber, fought through a Ramadan of fasting and whispered prayers. Threads of Serendipity and Cinders Beneath a Fading Night were dispatched from these trenches.",
    reveal:
      "He walked into a single number that could decide everything, fasting and afraid, and came out the other side still standing.",
    kind: "campaign",
    d: "M440,150 C510,126 600,132 636,170 C668,206 660,266 620,300 C578,338 494,336 456,298 C422,264 420,186 440,150 Z",
    label: [540, 222],
    cost: 55,
    requires: ["undergrad"],
    hue: "#a0526a",
    marks: [
      { x: 500, y: 188, type: "vp", label: "the reckoning" },
      { x: 588, y: 268, type: "city", label: "night seven" },
    ],
  },
  {
    id: "dabbaghmed",
    name: "DabbaghMed Capital",
    era: "feb 2025 —",
    role: "Capital · seat of the writing",
    detail:
      "The new capital, founded with a single transmission — the space between what was and what's next — and now seat of government for every essay, field note, and this universe. The JD-1184 observatory was raised on its highest hill.",
    reveal:
      "He started writing in the dark and built a whole country out of it: DabbaghMed, where the reflections are seated and this observatory was raised.",
    kind: "capital",
    d: "M450,330 C510,314 580,318 614,346 C644,372 640,420 600,442 C556,466 484,460 452,428 C426,402 424,354 450,330 Z",
    label: [532, 388],
    industry: true,
    cost: 45,
    requires: ["mcat-front"],
    hue: "#9c8a5a",
    marks: [
      { x: 492, y: 364, type: "vp", label: "capital" },
      { x: 572, y: 414, type: "city", label: "observatory" },
    ],
  },
  {
    id: "grenada",
    name: "Grenada Landing",
    era: "fall 2025 —",
    role: "Forward port · medical school, the arrival",
    detail:
      "The forward landing of the longest campaign: medical school across the water. The first week felt like walking back into the storm — only this time the storm bore his name. He gave a khatirah at the mosque here; anatomy readings hold the line daily.",
    reveal:
      "He crossed an ocean to wear the coat — and learned that arrival is not relief, it is responsibility.",
    kind: "campaign",
    d: "M634,392 C672,378 718,382 740,406 C760,428 754,460 724,474 C690,490 644,484 624,460 C608,440 612,408 634,392 Z",
    label: [682, 432],
    cost: 70,
    requires: ["dabbaghmed"],
    hue: "#5d8a8c",
    marks: [
      { x: 660, y: 414, type: "port", label: "the landing" },
      { x: 712, y: 452, type: "city", label: "the mosque" },
    ],
  },

  /* ——— THE OLD WORLD — eras not yet lived (sea-locked) ——— */
  {
    id: "garden-frontier",
    name: "The Garden Frontier",
    era: "unwritten",
    role: "Frontier · surveyed, not settled",
    detail:
      "Across the strait — surveyed plot by plot, prepared for planting, but nothing grows here yet. A navy must be built before these shores can be taken: this part of the life has not been lived.",
    reveal:
      "The ground is cleared and the seed has landed. What grows here is still to be earned.",
    kind: "future",
    d: "M772,150 C840,120 930,134 962,188 C992,240 978,322 938,368 C896,418 812,420 776,378 C742,340 740,232 752,188 C758,168 760,158 772,150 Z",
    label: [862, 262],
    navy: true,
    cost: 999,
    requires: ["grenada"],
    hue: "#4a6652",
    marks: [{ x: 820, y: 210, type: "city", label: "plot 01" }],
  },
  {
    id: "residency",
    name: "The Residency Reach",
    era: "not yet written",
    role: "Future · the practice of medicine",
    detail:
      "A vast continent beyond the charts — the years of actually practicing, of patients instead of exams. No navy can reach it yet. The campaign has not begun.",
    reveal: "Sea-locked. This era has not been lived — there is nothing to declassify yet.",
    kind: "future",
    d: "M788,398 C840,386 904,392 932,418 C958,442 952,486 916,500 C872,516 802,510 774,482 C752,458 760,414 788,398 Z",
    label: [858, 448],
    navy: true,
    cost: 999,
    requires: ["grenada"],
    hue: "#41506a",
    marks: [{ x: 850, y: 430, type: "vp" }],
  },
];

/** chronological supply route through the held-able provinces */
export const supplyRoute: [number, number][] = [
  [196, 178], // heritage
  [248, 86], // high school
  [218, 392], // undergrad
  [424, 408], // nervewave
  [540, 222], // mcat front
  [532, 388], // dabbaghmed
  [682, 432], // grenada
];
