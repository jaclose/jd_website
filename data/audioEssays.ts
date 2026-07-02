/**
 * Walkable audio essays — the data contract, wireframed ahead of the build.
 *
 * The idea: an essay can be *published as a walk*. The visitor follows a trail
 * through the Sanctum while the essay plays in narrated segments; each segment
 * is anchored to a station (a journey node or a world position), advances when
 * the visitor arrives (or by dwell time), and can dress the world around it
 * (mood, wind, a visual set-piece). Text is always available as captions, so
 * the same essay stays readable — the walk is the *spatial edition*.
 *
 * Nothing renders from this file yet: it exists so essays can be authored
 * against a stable schema while the player is built (see
 * docs/future-updates/active/10-walkable-audio-essays.md). The audio pipeline
 * (narration recording → segment mp3/opus under public/sanctum/essays/) is
 * deliberately the same shape as the ambience loops the AudioSystem already
 * streams.
 */

export type AudioEssayMood = "dawn" | "day" | "dusk" | "rain" | "night";

export interface AudioEssaySegment {
  id: string;
  /** narration file under public/sanctum/essays/<essaySlug>/ (mp3 + opus). */
  audioSrc: string;
  /** duration in seconds — drives the progress ring + dwell-advance fallback. */
  duration: number;
  /** full caption text, shown line-by-line with the narration. */
  caption: string;
  /**
   * where this segment lives: an existing journey node id (preferred — reuses
   * the guided walk graph) or a bare world position for essay-only stations.
   */
  anchor: { nodeId: string } | { position: [number, number, number] };
  /** how the walk advances: arrive at the next anchor, or finish the audio. */
  advance: "arrival" | "audio-end";
  /** optional world dressing while the segment plays. */
  mood?: AudioEssayMood;
  /** optional set-piece to reveal at the station (component key, authored later). */
  setPiece?: string;
}

export interface AudioEssay {
  /** must match the essay's content slug so /essays/<slug> can offer the walk. */
  slug: string;
  title: string;
  /** one-line invitation shown at the trailhead gate. */
  invitation: string;
  narrator: string;
  /** total runtime in minutes, shown before starting. */
  runtime: number;
  segments: AudioEssaySegment[];
  /** drafts are wireframes: visible in dev tooling, never rendered on site. */
  draft: boolean;
}

/**
 * Wireframe entry — "The Cost of Knowing Better" as a walk. Anchors trace the
 * existing medicine fork (the essay's own subject), so the spatial edition
 * needs zero new trail. Audio does not exist yet; durations are estimates from
 * the essay's section word counts at ~150 wpm.
 */
export const audioEssays: AudioEssay[] = [
  {
    slug: "the-cost-of-knowing-better",
    title: "The Cost of Knowing Better",
    invitation: "Walk the scholar's road while the essay walks with you.",
    narrator: "Jafar Dabbagh",
    runtime: 14,
    draft: true,
    segments: [
      {
        id: "threshold",
        audioSrc: "/sanctum/essays/the-cost-of-knowing-better/01-threshold.mp3",
        duration: 95,
        caption: "There is a version of you that didn't read the studies. He sleeps fine.",
        anchor: { nodeId: "start" },
        advance: "arrival",
        mood: "dawn",
      },
      {
        id: "the-fork",
        audioSrc: "/sanctum/essays/the-cost-of-knowing-better/02-fork.mp3",
        duration: 140,
        caption: "Every fork you take in knowledge closes a door you can no longer pretend wasn't there.",
        anchor: { nodeId: "main-fork" },
        advance: "arrival",
        mood: "day",
      },
      {
        id: "the-stations",
        audioSrc: "/sanctum/essays/the-cost-of-knowing-better/03-stations.mp3",
        duration: 260,
        caption: "The stations of the road are not milestones. They are receipts.",
        anchor: { nodeId: "term-2" },
        advance: "arrival",
        mood: "dusk",
      },
      {
        id: "where-it-began",
        audioSrc: "/sanctum/essays/the-cost-of-knowing-better/04-origin.mp3",
        duration: 180,
        caption: "At the far end of the road, where it began, the price and the point turn out to be the same thing.",
        anchor: { nodeId: "mcat" },
        advance: "audio-end",
        mood: "night",
        setPiece: "study-lantern-circle",
      },
    ],
  },
];

export const audioEssayBySlug = new Map(audioEssays.map((e) => [e.slug, e]));
