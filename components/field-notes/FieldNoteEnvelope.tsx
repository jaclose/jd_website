"use client";

import { dispatchDate } from "@/lib/content";
import { fieldNoteCollectionThemes, letterStyleThemes } from "@/data/fieldNotesThemes";
import type { FieldNoteRecord } from "@/data/fieldNotes";
import type { LetterPhysicsControls, LetterPhysicsState } from "@/components/field-notes/useLetterPhysics";
import { useLetterDrag } from "@/components/field-notes/useLetterDrag";

interface FieldNoteEnvelopeProps {
  note: FieldNoteRecord;
  state: LetterPhysicsState;
  controls: LetterPhysicsControls;
  isDimmed: boolean;
  isNearby: boolean;
  disabled?: boolean;
  onOpen: (note: FieldNoteRecord, sourceRect: DOMRect) => void;
  onHover: (id: string | null) => void;
}

function AttachedObject({ note }: { note: FieldNoteRecord }) {
  if (note.attachedObject === "none") return null;

  if (note.attachedObject === "photograph") {
    return (
      <span className="field-note-attachment field-note-attachment--photo" aria-hidden>
        {note.thumbnailImage ? <img src={note.thumbnailImage} alt="" draggable={false} /> : null}
      </span>
    );
  }

  return <span className={`field-note-attachment field-note-attachment--${note.attachedObject}`} aria-hidden />;
}

export default function FieldNoteEnvelope({
  note,
  state,
  controls,
  isDimmed,
  isNearby,
  disabled = false,
  onOpen,
  onHover,
}: FieldNoteEnvelopeProps) {
  const collectionTheme = fieldNoteCollectionThemes[note.collection];
  const letterTheme = letterStyleThemes[note.letterStyle];
  const dragHandlers = useLetterDrag({
    id: note.id,
    controls,
    disabled,
    onOpen: (_, source) => onOpen(note, source.getBoundingClientRect()),
  });

  return (
    <button
      {...dragHandlers}
      type="button"
      aria-label={`${note.title}. ${collectionTheme.label}. Filed ${dispatchDate(note.date)}. Press Enter to open.`}
      data-note-id={note.id}
      data-letter-style={note.letterStyle}
      data-seal={note.sealType}
      data-dimmed={isDimmed || undefined}
      data-nearby={isNearby || undefined}
      data-dragging={state.isDragging || undefined}
      className={`field-note-envelope ${collectionTheme.className} ${letterTheme.className}`}
      onMouseEnter={() => onHover(note.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(note.id)}
      onBlur={() => onHover(null)}
      style={{
        ...collectionTheme.style,
        width: state.width,
        height: state.height,
        zIndex: state.zIndex,
        transform: `translate3d(${state.x - state.width / 2}px, ${state.y - state.height / 2}px, 0) rotate(${state.angle}rad)`,
      }}
    >
      <span className="field-note-letter-object">
        <span className="field-note-paper-grain" aria-hidden />
        <span className="field-note-fold field-note-fold--top" aria-hidden />
        <span className="field-note-fold field-note-fold--bottom" aria-hidden />

        <span className="field-note-object-meta">
          <span>{note.collection.replace("-", " ")}</span>
          <span>{dispatchDate(note.date)}</span>
        </span>

        <span className="field-note-title-line">{note.title}</span>
        <span className="field-note-date-line">filed {dispatchDate(note.date)}</span>
        <span className="field-note-category-line">{note.category}</span>

        <span className={`field-note-seal field-note-seal--${note.sealType}`} aria-hidden />
        <AttachedObject note={note} />

        <span className="field-note-condition-line">{note.visualCondition}</span>
      </span>
    </button>
  );
}
