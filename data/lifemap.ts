/**
 * The Dominion — a Hearts-of-Iron-style strategic map of a life.
 * Every province is a chapter; cities, factories, and victory points
 * mark what was built there.
 *
 * ── HOW TO REVISE THE MAP ─────────────────────────────────────────────
 * Edit the entries below; the About page redraws itself. Provinces with
 * `classified: true` render as "intel pending" — fill in `era`/`detail`
 * (e.g. the real school names, NerveWave's story) and flip the flag.
 * Coordinates live in a 1000×560 viewBox.
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
  role: string; // one-line, shown under the name in the panel
  detail: string;
  kind: "homeland" | "campaign" | "industry" | "capital" | "frontier";
  d: string; // SVG path of the province
  label: [number, number];
  marks?: ProvinceMark[];
  classified?: boolean;
}

export const provinces: Province[] = [
  {
    id: "heritage",
    name: "The Old Hearth",
    era: "the beginning —",
    role: "Homeland · faith, Arabic, family",
    detail:
      "The oldest province, and the one every supply line runs back to. Faith without forecasts was learned here first; the Arabic of the texts he keeps returning to is its mother tongue. Borders unchanged since founding.",
    kind: "homeland",
    d: "M60,150 C70,95 130,62 200,68 C262,74 300,108 296,165 C292,216 252,248 190,252 C120,256 52,210 60,150 Z",
    label: [178, 162],
    marks: [
      { x: 140, y: 130, type: "city", label: "the hearth" },
      { x: 228, y: 200, type: "vp" },
    ],
  },
  {
    id: "high-school",
    name: "The Early Forge",
    era: "records sealed",
    role: "Campaign · where the discipline was drafted",
    detail:
      "Intel pending — the early campaigns that drafted the discipline everything else marches on. Records await declassification by the author.",
    kind: "campaign",
    d: "M322,70 C380,46 462,52 492,92 C518,128 500,168 452,182 C396,198 330,184 314,140 C304,112 304,84 322,70 Z",
    label: [408, 122],
    classified: true,
    marks: [{ x: 360, y: 100, type: "city" }],
  },
  {
    id: "undergrad",
    name: "The Compressed Years",
    era: "— 2024",
    role: "Campaign · the five-year road walked in two",
    detail:
      "A forced march through chemistry benches, geology halls, and psychology labs — five years of road covered in two. Its four factories shipped the Archive: the aldol synthesis, the bias study from Dr. Gaertner's lab, Tectonic Trials for Dr. Kerr, and Synthetic Salvation.",
    kind: "campaign",
    d: "M270,210 C330,196 420,198 470,226 C516,252 528,310 498,356 C462,410 372,424 308,398 C250,374 230,318 240,272 C246,242 254,218 270,210 Z",
    label: [378, 308],
    marks: [
      { x: 300, y: 260, type: "factory", label: "o-chem 359" },
      { x: 340, y: 360, type: "factory", label: "geology 331" },
      { x: 444, y: 268, type: "factory", label: "gaertner lab" },
      { x: 460, y: 330, type: "factory", label: "bioethics" },
      { x: 390, y: 240, type: "city", label: "the library" },
    ],
  },
  {
    id: "nervewave",
    name: "NerveWave Works",
    era: "intel pending",
    role: "Industry · the company he helped build",
    detail:
      "An industrial zone glimpsed on reconnaissance — NerveWave, the venture he worked on. Production figures, founding dates, and the full story await declassification by the author.",
    kind: "industry",
    d: "M310,430 C360,414 440,416 482,442 C516,464 514,506 472,524 C420,544 340,540 304,510 C278,488 282,448 310,430 Z",
    label: [396, 478],
    classified: true,
    marks: [
      { x: 350, y: 460, type: "factory" },
      { x: 430, y: 500, type: "factory" },
    ],
  },
  {
    id: "mcat-front",
    name: "The MCAT Front",
    era: "spring 2025",
    role: "Campaign · a crucible of paper and pixels",
    detail:
      "The front where the testing-center corridor felt like an interrogation chamber, fought through a Ramadan of fasting and whispered prayers. Threads of Serendipity and Cinders Beneath a Fading Night were dispatched from these trenches. The line held.",
    kind: "campaign",
    d: "M540,160 C600,136 678,142 712,180 C744,218 736,280 698,316 C654,358 576,356 540,318 C508,284 506,196 540,160 Z",
    label: [626, 244],
    marks: [
      { x: 590, y: 200, type: "vp", label: "the reckoning" },
      { x: 672, y: 290, type: "city", label: "night seven" },
    ],
  },
  {
    id: "dabbaghmed",
    name: "DabbaghMed Capital",
    era: "feb 2025 —",
    role: "Capital · where the writing is seated",
    detail:
      "Founded with a single transmission — the space between what was and what's next — and now seat of government for every essay, field note, and this very universe. The JD-1184 observatory was raised on its highest hill in June 2026.",
    kind: "capital",
    d: "M508,378 C552,360 614,362 648,388 C680,414 678,462 640,486 C596,512 532,506 502,474 C478,448 478,402 508,378 Z",
    label: [578, 434],
    marks: [
      { x: 548, y: 410, type: "vp", label: "capital" },
      { x: 616, y: 460, type: "city", label: "observatory jd-1184" },
    ],
  },
  {
    id: "grenada",
    name: "Grenada Landing",
    era: "fall 2025 —",
    role: "Forward port · medical school, the arrival",
    detail:
      "The beachhead of the longest campaign: medical school. The first week felt like walking back into the storm — only this time the storm bore his name. He gave a khatirah at the mosque here; anatomy readings and histology slides hold the line daily.",
    kind: "campaign",
    d: "M790,442 C824,424 880,428 904,454 C926,478 918,516 884,532 C846,548 796,540 778,510 C764,486 768,458 790,442 Z",
    label: [846, 486],
    marks: [
      { x: 818, y: 466, type: "port", label: "the landing" },
      { x: 872, y: 506, type: "city", label: "the mosque" },
    ],
  },
  {
    id: "garden-frontier",
    name: "The Garden Frontier",
    era: "unwritten",
    role: "Frontier · surveyed, not yet settled",
    detail:
      "The far territory every other province supplies. Surveyed plot by plot, prepared for planting — nothing grows here yet. The first seed rests at its border, and the planet above keeps the score.",
    kind: "frontier",
    d: "M760,96 C830,68 920,84 952,140 C982,192 968,280 928,330 C886,382 800,388 760,344 C724,304 720,232 732,180 C740,146 744,112 760,96 Z",
    label: [852, 224],
    marks: [{ x: 800, y: 160, type: "city", label: "plot 01" }],
  },
];

/** chronological supply route through the provinces */
export const supplyRoute: [number, number][] = [
  [178, 162], // heritage
  [408, 122], // high school
  [378, 308], // undergrad
  [396, 478], // nervewave
  [626, 244], // mcat front
  [578, 434], // dabbaghmed
  [846, 486], // grenada
  [852, 224], // garden frontier
];
