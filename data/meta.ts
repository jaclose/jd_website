/**
 * Visual metadata for migrated writing — covers are the ACTUAL featured
 * images from jafardabbagh.com (fetched from the WordPress API and stored
 * in /public/images), and highlights are pulled verbatim from the text.
 * Essays whose posts have no featured image get none here — the site
 * renders a typographic card instead. Never assign one essay's artwork
 * to another piece.
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
    alt: "The three ways God tests you — gratitude, patience, trust — over Islamic geometry",
    highlight:
      "The point of a test is to become someone who carries the next one with grace.",
    aspect: "portrait",
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
    alt: "A misted corridor of glass and steel, calligraphy suspended in the light",
    highlight:
      "A crucible not of fire or steel but of paper and pixels, a tempest of questions poised to carve my worth into stone.",
    aspect: "landscape",
  },
  // cinders-beneath-a-fading-night, the-echoes-of-the-body…, and
  // hello-world carry no featured image on the source site — on purpose.
};

/** verbatim pull-quotes for essays without cover art */
export const essayHighlights: Record<string, string> = {
  "cinders-beneath-a-fading-night":
    "Seven nights have slipped by, and time feels relentless, a tide I can’t hold back.",
  "the-echoes-of-the-body-and-the-whispers-of-the-weaver":
    "A thread sings beneath the flesh, soft as a sigh, sharp as a blade.",
  "hello-world":
    "I came home and sat still for the first time in what felt like years.",
};

export const noteMeta: Record<string, Omit<CoverMeta, "highlight">> = {
  "how-we-behave-when-it-matters-least": {
    cover: "/images/notes/how-we-behave-when-it-matters-least.jpg",
    alt: "Two hands meeting in the dark — one offered, one receiving",
    aspect: "landscape",
  },
  "faith-without-forecasts": {
    cover: "/images/notes/faith-without-forecasts.jpg",
    alt: "A hand tearing through a printed life-readiness forecast",
    aspect: "square",
  },
  "anatomy-of-value": {
    cover: "/images/notes/anatomy-of-value.jpg",
    alt: "Two chairs in a dark room, a price tag dropped on the floor",
    aspect: "portrait",
  },
};
