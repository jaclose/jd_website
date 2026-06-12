/**
 * Visual metadata for migrated writing — covers come from the artwork
 * Jafar made for each piece on DabbaghMed; highlights are pulled verbatim
 * from the text. Content JSON stays machine-generated; this layer is his.
 */
export interface CoverMeta {
  cover: string;
  alt: string;
  /** a line lifted from the writing, shown in the gallery */
  highlight: string;
  aspect: "landscape" | "portrait" | "square";
}

export const essayMeta: Record<string, CoverMeta> = {
  "anatomy-of-the-test": {
    cover: "/images/essays/anatomy-of-the-test.jpg",
    alt: "A white coat embroidered JAFAR DABBAGH against a wall of anatomical sketches",
    highlight:
      "The point of a test is to become someone who carries the next one with grace.",
    aspect: "landscape",
  },
  "the-anatomy-of-arrival": {
    cover: "/images/essays/the-anatomy-of-arrival.jpg",
    alt: "A maroon tie and white coat reading DR. DABBAGH",
    highlight:
      "It felt like stepping back into the storm I once begged to escape — only this time the storm bore my name.",
    aspect: "square",
  },
  "threads-of-serendipity-veins-of-trial": {
    cover: "/images/essays/threads-of-serendipity-veins-of-trial.jpg",
    alt: "The three ways God tests you — gratitude, patience, trust — over Islamic geometry",
    highlight:
      "A crucible not of fire or steel but of paper and pixels, a tempest of questions poised to carve my worth into stone.",
    aspect: "portrait",
  },
  "cinders-beneath-a-fading-night": {
    cover: "/images/essays/cinders-beneath-a-fading-night.jpg",
    alt: "Three vigils — a door held open, a candle in a silent corridor, a gift changing shape",
    highlight:
      "Seven nights have slipped by, and time feels relentless, a tide I can’t hold back.",
    aspect: "landscape",
  },
  "the-echoes-of-the-body-and-the-whispers-of-the-weaver": {
    cover:
      "/images/essays/the-echoes-of-the-body-and-the-whispers-of-the-weaver.jpg",
    alt: "Muscle fibers in cross-section — tear, repair, remodel",
    highlight:
      "A thread sings beneath the flesh, soft as a sigh, sharp as a blade.",
    aspect: "landscape",
  },
  "hello-world": {
    cover: "/images/essays/hello-world.jpg",
    alt: "Graduation day — cap, gown, and the river behind",
    highlight:
      "I came home and sat still for the first time in what felt like years.",
    aspect: "portrait",
  },
};

export const noteMeta: Record<string, Omit<CoverMeta, "highlight">> = {
  "how-we-behave-when-it-matters-least": {
    cover: "/images/notes/how-we-behave-when-it-matters-least.jpg",
    alt: "Two chairs facing away from each other in a dark room",
    aspect: "portrait",
  },
  "faith-without-forecasts": {
    cover: "/images/notes/faith-without-forecasts.jpg",
    alt: "A hand tearing through a printed life-readiness forecast",
    aspect: "portrait",
  },
  "anatomy-of-value": {
    cover: "/images/notes/anatomy-of-value.jpg",
    alt: "A single water bottle under cold studio light",
    aspect: "landscape",
  },
};
