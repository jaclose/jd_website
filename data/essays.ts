import { essays as sourceEssays, readingTime, type Writing } from "@/lib/content";
import { essayMeta, essayHighlights } from "@/data/meta";
import type { EssayThemeId } from "@/data/essayThemes";

/**
 * The Essay Archive's artifact registry. Every published essay (migrated
 * content in content/essays.json — never hand-edited) is joined with curated
 * archive metadata here: which collection it is filed under, its standing in
 * the archive, its one-line thesis, and the artwork panel. Nothing in the UI
 * is hardcoded — the archive renders whatever this file yields.
 *
 * Standing (an original vocabulary, not a borrowed card system):
 *  - "archive-entry"    a preserved work in a structured frame
 *  - "relic"            a major work; the art bleeds further through the frame
 *  - "immersive"        a flagship record; the artwork carries the artifact
 */

export type EssayStanding = "archive-entry" | "relic" | "immersive";

export interface EssayArtifactMeta {
  subtitle: string;
  category: string;
  theme: EssayThemeId;
  rarity: EssayStanding;
  thesis: string;
  flavorText: string;
  image?: string;
  imageAlt?: string;
  featured?: boolean;
  immersive?: boolean;
}

export interface EssayArtifact extends EssayArtifactMeta {
  id: string;
  title: string;
  date: string;
  readTime: string;
  words: number;
  excerpt: string;
  html: string;
  collection: string;
}

const archiveMeta: Record<string, EssayArtifactMeta> = {
  "the-cost-of-knowing-better": {
    subtitle: "Pain paid early, and the currency of moments.",
    category: "Philosophical Essay",
    theme: "return",
    rarity: "immersive",
    thesis: "Knowing what is right and doing it are different taxes — and only one of them compounds.",
    flavorText: "Discipline is not punishment. It is pain paid early.",
    image: "/images/essays/the-cost-of-knowing-better/cover.png",
    imageAlt: "A medical student working beside an orbiting Sanctum world",
    featured: true,
    immersive: true,
  },
  "anatomy-of-the-test": {
    subtitle: "Gratitude, patience, trust — the three examinations.",
    category: "Reflective Essay",
    theme: "return",
    rarity: "relic",
    thesis: "Every trial arrives as one of three questions, and each has a posture rather than an answer.",
    flavorText: "The point of a test is to become someone who carries the next one with grace.",
    image: "/images/essays/anatomy-of-the-test.jpg",
    imageAlt: "The three ways God tests you, set over Islamic geometry",
  },
  "the-anatomy-of-arrival": {
    subtitle: "A white coat with my name on it.",
    category: "Personal Narrative",
    theme: "legacy",
    rarity: "relic",
    thesis: "Arrival is not relief; it is the storm you begged to escape, renamed after you.",
    flavorText: "This time the storm bore my name.",
    image: "/images/essays/the-anatomy-of-arrival.jpg",
    imageAlt: "A maroon tie and white coat reading DR. DABBAGH",
  },
  "threads-of-serendipity-veins-of-trial": {
    subtitle: "The MCAT as crucible, paper and pixels as fire.",
    category: "Field Work",
    theme: "field-study",
    rarity: "archive-entry",
    thesis: "Standardised trials still cut like ancient ones; the instrument changed, the tempering did not.",
    flavorText: "A crucible not of fire or steel but of paper and pixels.",
    image: "/images/essays/threads-of-serendipity-veins-of-trial.jpg",
    imageAlt: "A misted corridor of glass and steel, calligraphy suspended in the light",
  },
  "cinders-beneath-a-fading-night": {
    subtitle: "Seven nights, and the tide of time.",
    category: "Personal Narrative",
    theme: "blackout",
    rarity: "immersive",
    thesis: "Some nights burn down to cinders before they explain themselves.",
    flavorText: "Time feels relentless, a tide I can't hold back.",
    image: "/images/essays/archive/cinders-threshold.png",
    imageAlt: "A doorway of ember light at the edge of a fading night",
    immersive: true,
  },
  "the-echoes-of-the-body-and-the-whispers-of-the-weaver": {
    subtitle: "Anatomy as scripture, tissue as testimony.",
    category: "Scientific Writing",
    theme: "sanctum",
    rarity: "relic",
    thesis: "The body keeps its own commentary; dissection is a way of listening.",
    flavorText: "A thread sings beneath the flesh, soft as a sigh, sharp as a blade.",
    image: "/images/essays/archive/echoes-body-observatory.png",
    imageAlt: "An observatory of the body — vaulted bone light over an anatomist's table",
  },
  "hello-world": {
    subtitle: "The first entry, unsealed.",
    category: "Reflection",
    theme: "legacy",
    rarity: "archive-entry",
    thesis: "Every archive begins with one small act of going on the record.",
    flavorText: "Filed before there was anything to file it under.",
  },
};

const collectionNames: Record<EssayThemeId, string> = {
  return: "The Return Collection",
  sanctum: "The Sanctum Collection",
  blackout: "The Blackout Collection",
  legacy: "The Legacy Collection",
  "field-study": "The Field Study Collection",
};

const fallbackMeta = (essay: Writing): EssayArtifactMeta => ({
  subtitle: essayHighlights[essay.slug] ?? essay.excerpt.slice(0, 80),
  category: "Reflective Essay",
  theme: "return",
  rarity: "archive-entry",
  thesis: essay.excerpt.split(".")[0] + ".",
  flavorText: essayHighlights[essay.slug] ?? "",
  image: essayMeta[essay.slug]?.cover,
  imageAlt: essayMeta[essay.slug]?.alt,
});

/** every preserved work, featured piece first, then newest first. */
export const essayArtifacts: EssayArtifact[] = sourceEssays
  .map((essay): EssayArtifact => {
    const meta = archiveMeta[essay.slug] ?? fallbackMeta(essay);
    return {
      ...meta,
      id: essay.slug,
      title: essay.title,
      date: essay.date,
      readTime: readingTime(essay.words),
      words: essay.words,
      excerpt: essay.excerpt,
      html: essay.html,
      collection: collectionNames[meta.theme],
    };
  })
  .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.date.localeCompare(a.date));

export const featuredArtifact = essayArtifacts.find((e) => e.featured) ?? essayArtifacts[0];
export const shelfArtifacts = essayArtifacts.filter((e) => e.id !== featuredArtifact.id);
