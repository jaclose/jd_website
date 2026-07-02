"use client";

import { useEffect, useRef } from "react";
import { dispatchDate, readingTime } from "@/lib/content";
import { fieldNoteCollectionThemes } from "@/data/fieldNotesThemes";
import type { FieldNoteRecord } from "@/data/fieldNotes";
import "./fieldNoteReader.css";

interface FieldNoteReaderProps {
  note: FieldNoteRecord;
  onClose: () => void;
}

export default function FieldNoteReader({ note, onClose }: FieldNoteReaderProps) {
  const articleRef = useRef<HTMLElement>(null);
  const collectionTheme = fieldNoteCollectionThemes[note.collection];

  useEffect(() => {
    articleRef.current?.focus();
  }, [note.id]);

  return (
    <article
      ref={articleRef}
      tabIndex={-1}
      className={`field-note-reader ${collectionTheme.className}`}
      style={collectionTheme.style}
      aria-labelledby={`field-note-reader-title-${note.id}`}
      data-lenis-prevent
    >
      <button type="button" className="field-note-reader__return" onClick={onClose}>
        Return to Table
      </button>

      <div className="field-note-reader__paper">
        <aside className="field-note-reader__margin" aria-label="Field note metadata">
          <span>{dispatchDate(note.date)}</span>
          <span>{note.coordinates}</span>
          <span>{note.timestamp}</span>
          <span>{collectionTheme.label}</span>
        </aside>

        <header className="field-note-reader__header">
          <p className="field-note-reader__stamp">{note.category}</p>
          <h1 id={`field-note-reader-title-${note.id}`}>{note.title}</h1>
          <div className="field-note-reader__meta">
            <span>Filed {dispatchDate(note.date)}</span>
            <span>{readingTime(note.words)} read</span>
            <span>{note.paperType}</span>
          </div>
        </header>

        {note.thumbnailImage ? (
          <figure className="field-note-reader__photo">
            <img src={note.thumbnailImage} alt={note.thumbnailAlt ?? ""} />
            <figcaption>{note.visualCondition}</figcaption>
          </figure>
        ) : null}

        <div className="field-note-reader__body" dangerouslySetInnerHTML={{ __html: note.body }} />

        <footer className="field-note-reader__footer">
          <span>{note.collection.toUpperCase()} RECORD</span>
          <span>{note.importance.toUpperCase()}</span>
        </footer>
      </div>
    </article>
  );
}
