import type { CSSProperties } from "react";

export type FieldNoteCollection =
  | "sanctum"
  | "medical"
  | "blackout"
  | "legacy"
  | "return";

export type LetterStyle =
  | "cream-wax"
  | "navy-silver"
  | "ribbon-page"
  | "medical-photo"
  | "typed-archive"
  | "red-thread"
  | "botanical-letter"
  | "blackout-torn";

export type SealType =
  | "wax"
  | "silver-stamp"
  | "ribbon"
  | "paperclip"
  | "typed-label"
  | "thread"
  | "pressed-leaf"
  | "torn-seal";

export type PaperTheme =
  | "warm-paper"
  | "clinical"
  | "blackout"
  | "legacy-photo"
  | "return-cream";

export type AttachedObject =
  | "pressed-leaf"
  | "photograph"
  | "red-thread"
  | "paperclip"
  | "ribbon"
  | "wax-seal"
  | "silver-stamp"
  | "none";

export interface FieldNoteCollectionTheme {
  label: string;
  className: string;
  style: CSSProperties;
}

export interface LetterStyleTheme {
  label: string;
  className: string;
  width: number;
  height: number;
}

export const fieldNoteCollectionThemes: Record<FieldNoteCollection, FieldNoteCollectionTheme> = {
  sanctum: {
    label: "Sanctum Notes",
    className: "collection-sanctum",
    style: {
      "--note-accent": "#8fae7b",
      "--note-accent-soft": "rgba(143, 174, 123, 0.24)",
      "--note-paper": "#d7c49b",
      "--note-thread": "#657d55",
      "--note-ink": "#172018",
    } as CSSProperties,
  },
  medical: {
    label: "Medical / Research Notes",
    className: "collection-medical",
    style: {
      "--note-accent": "#86b7ce",
      "--note-accent-soft": "rgba(134, 183, 206, 0.22)",
      "--note-paper": "#e6e8e1",
      "--note-thread": "#526876",
      "--note-ink": "#16222b",
    } as CSSProperties,
  },
  blackout: {
    label: "Blackout Notes",
    className: "collection-blackout",
    style: {
      "--note-accent": "#75b4dd",
      "--note-accent-soft": "rgba(117, 180, 221, 0.2)",
      "--note-paper": "#0f1720",
      "--note-thread": "#375a78",
      "--note-ink": "#d9eef7",
    } as CSSProperties,
  },
  legacy: {
    label: "Legacy Notes",
    className: "collection-legacy",
    style: {
      "--note-accent": "#bd8c56",
      "--note-accent-soft": "rgba(189, 140, 86, 0.24)",
      "--note-paper": "#d8c097",
      "--note-thread": "#9d7043",
      "--note-ink": "#2b1c12",
    } as CSSProperties,
  },
  return: {
    label: "Return Notes",
    className: "collection-return",
    style: {
      "--note-accent": "#d8b56d",
      "--note-accent-soft": "rgba(216, 181, 109, 0.24)",
      "--note-paper": "#e0cfaa",
      "--note-thread": "#b6985d",
      "--note-ink": "#231a10",
    } as CSSProperties,
  },
};

export const letterStyleThemes: Record<LetterStyle, LetterStyleTheme> = {
  "cream-wax": {
    label: "Cream envelope with wax seal",
    className: "letter-style-cream-wax",
    width: 270,
    height: 168,
  },
  "navy-silver": {
    label: "Dark navy envelope with silver stamp",
    className: "letter-style-navy-silver",
    width: 258,
    height: 160,
  },
  "ribbon-page": {
    label: "Folded handwritten field page tied with ribbon",
    className: "letter-style-ribbon-page",
    width: 236,
    height: 190,
  },
  "medical-photo": {
    label: "Medical note paper with clipped photograph",
    className: "letter-style-medical-photo",
    width: 238,
    height: 210,
  },
  "typed-archive": {
    label: "Weathered archival envelope with typed label",
    className: "letter-style-typed-archive",
    width: 286,
    height: 176,
  },
  "red-thread": {
    label: "Small folded note with red thread wrap",
    className: "letter-style-red-thread",
    width: 206,
    height: 148,
  },
  "botanical-letter": {
    label: "Old paper letter with botanical pressed leaf",
    className: "letter-style-botanical-letter",
    width: 226,
    height: 206,
  },
  "blackout-torn": {
    label: "Blackout note with torn edge and blue ink",
    className: "letter-style-blackout-torn",
    width: 244,
    height: 178,
  },
};
