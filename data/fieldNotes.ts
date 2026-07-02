import { fieldNotes as sourceNotes } from "@/lib/content";
import { noteMeta } from "@/data/meta";
import type {
  AttachedObject,
  FieldNoteCollection,
  LetterStyle,
  PaperTheme,
  SealType,
} from "@/data/fieldNotesThemes";

export interface FieldNoteTablePosition {
  x: number;
  y: number;
}

export interface FieldNoteRecord {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  body: string;
  words: number;
  paperTheme: PaperTheme;
  envelopeTheme: FieldNoteCollection;
  sealType: SealType;
  artifactType: LetterStyle;
  letterStyle: LetterStyle;
  paperType: string;
  visualCondition: string;
  thumbnailImage?: string;
  thumbnailAlt?: string;
  attachedObject: AttachedObject;
  tablePosition: FieldNoteTablePosition;
  rotation: number;
  stackLayer: number;
  importance: "quiet" | "notable" | "urgent";
  collection: FieldNoteCollection;
  coordinates: string;
  timestamp: string;
}

const baseRecords: Array<
  Omit<FieldNoteRecord, "id" | "title" | "date" | "excerpt" | "body" | "words" | "thumbnailImage" | "thumbnailAlt">
> = [
  {
    category: "Private Conduct",
    paperTheme: "return-cream",
    envelopeTheme: "return",
    sealType: "wax",
    artifactType: "cream-wax",
    letterStyle: "cream-wax",
    paperType: "warm laid envelope",
    visualCondition: "creased corners, lamp-warmed seal",
    attachedObject: "wax-seal",
    tablePosition: { x: 34, y: 47 },
    rotation: -7,
    stackLayer: 3,
    importance: "urgent",
    collection: "return",
    coordinates: "12.056 N / 61.748 W",
    timestamp: "after the room went quiet",
  },
  {
    category: "Faith / Provision",
    paperTheme: "warm-paper",
    envelopeTheme: "sanctum",
    sealType: "ribbon",
    artifactType: "ribbon-page",
    letterStyle: "ribbon-page",
    paperType: "folded field page",
    visualCondition: "softened fold, moss thread, thumb-worn edge",
    attachedObject: "ribbon",
    tablePosition: { x: 58, y: 38 },
    rotation: 9,
    stackLayer: 2,
    importance: "notable",
    collection: "sanctum",
    coordinates: "inner garden / western desk",
    timestamp: "before the forecast could answer",
  },
  {
    category: "Value / Belonging",
    paperTheme: "legacy-photo",
    envelopeTheme: "legacy",
    sealType: "paperclip",
    artifactType: "medical-photo",
    letterStyle: "medical-photo",
    paperType: "annotation paper",
    visualCondition: "faded photo corners, graphite mark, clipped edge",
    attachedObject: "photograph",
    tablePosition: { x: 47, y: 62 },
    rotation: -2,
    stackLayer: 4,
    importance: "quiet",
    collection: "legacy",
    coordinates: "airport margin / room 1184",
    timestamp: "priced under different light",
  },
];

const fallbackRecords: typeof baseRecords = [
  {
    category: "Research Fragment",
    paperTheme: "clinical",
    envelopeTheme: "medical",
    sealType: "typed-label",
    artifactType: "typed-archive",
    letterStyle: "typed-archive",
    paperType: "typed label envelope",
    visualCondition: "catalogued, graphite-smudged, lightly foxed",
    attachedObject: "paperclip",
    tablePosition: { x: 28, y: 62 },
    rotation: -13,
    stackLayer: 1,
    importance: "notable",
    collection: "medical",
    coordinates: "lab margin / tray B",
    timestamp: "logged between lectures",
  },
  {
    category: "Blackout Fragment",
    paperTheme: "blackout",
    envelopeTheme: "blackout",
    sealType: "torn-seal",
    artifactType: "blackout-torn",
    letterStyle: "blackout-torn",
    paperType: "torn black paper",
    visualCondition: "creased, cold ink, one torn side",
    attachedObject: "silver-stamp",
    tablePosition: { x: 68, y: 58 },
    rotation: 14,
    stackLayer: 5,
    importance: "urgent",
    collection: "blackout",
    coordinates: "screenlight / unlit room",
    timestamp: "after midnight",
  },
  {
    category: "Return Fragment",
    paperTheme: "return-cream",
    envelopeTheme: "return",
    sealType: "thread",
    artifactType: "red-thread",
    letterStyle: "red-thread",
    paperType: "small folded note",
    visualCondition: "folded twice, red thread wrap",
    attachedObject: "red-thread",
    tablePosition: { x: 42, y: 28 },
    rotation: 18,
    stackLayer: 6,
    importance: "quiet",
    collection: "return",
    coordinates: "coat pocket / south corner",
    timestamp: "found later",
  },
  {
    category: "Sanctum Fragment",
    paperTheme: "warm-paper",
    envelopeTheme: "sanctum",
    sealType: "pressed-leaf",
    artifactType: "botanical-letter",
    letterStyle: "botanical-letter",
    paperType: "old paper letter",
    visualCondition: "leaf stain, soft green thread, uneven edge",
    attachedObject: "pressed-leaf",
    tablePosition: { x: 72, y: 34 },
    rotation: -19,
    stackLayer: 7,
    importance: "notable",
    collection: "sanctum",
    coordinates: "under the lamp / moss tray",
    timestamp: "when the soil dried",
  },
];

function noteConfig(index: number) {
  return baseRecords[index] ?? fallbackRecords[index % fallbackRecords.length];
}

function spreadPosition(index: number, total: number, original: FieldNoteTablePosition): FieldNoteTablePosition {
  if (index < baseRecords.length) return original;
  const ring = Math.floor(index / 8);
  const angle = ((index * 137.5) % 360) * (Math.PI / 180);
  const radiusX = Math.min(34, 18 + ring * 4);
  const radiusY = Math.min(24, 14 + ring * 3);
  const centerX = 50 + Math.cos(angle) * radiusX;
  const centerY = 50 + Math.sin(angle) * radiusY;
  const crowding = Math.min(1, Math.max(0, (total - 18) / 32));

  return {
    x: Math.max(12, Math.min(88, centerX + Math.sin(index) * 5 * crowding)),
    y: Math.max(16, Math.min(84, centerY + Math.cos(index * 0.7) * 4 * crowding)),
  };
}

export const fieldNotes: FieldNoteRecord[] = sourceNotes.map((note, index) => {
  const config = noteConfig(index);
  const meta = noteMeta[note.slug];

  return {
    id: note.slug,
    title: note.title,
    date: note.date,
    excerpt: note.excerpt,
    body: note.html,
    words: note.words,
    ...config,
    thumbnailImage: meta?.cover,
    thumbnailAlt: meta?.alt,
    tablePosition: spreadPosition(index, sourceNotes.length, config.tablePosition),
    rotation: config.rotation + (index >= baseRecords.length ? ((index % 7) - 3) * 4 : 0),
    stackLayer: config.stackLayer + index,
  };
});
