"use client";

import { useCallback, useEffect, useState } from "react";
import type { FieldNoteRecord } from "@/data/fieldNotes";
import { fieldNoteCollectionThemes, letterStyleThemes } from "@/data/fieldNotesThemes";
import FieldNoteReader from "@/components/field-notes/FieldNoteReader";

interface FieldNoteOpenSequenceProps {
  note: FieldNoteRecord;
  sourceRect: DOMRect;
  onClosed: () => void;
}

export default function FieldNoteOpenSequence({ note, sourceRect, onClosed }: FieldNoteOpenSequenceProps) {
  const [closing, setClosing] = useState(false);
  const collectionTheme = fieldNoteCollectionThemes[note.collection];
  const letterTheme = letterStyleThemes[note.letterStyle];

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClosed, 720);
  }, [onClosed]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Lenis drives page scroll from window-level wheel events, so it keeps
    // scrolling the page behind the letter unless stopped — the letter's own
    // overflow column then scrolls natively.
    window.__lenis?.stop();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.__lenis?.start();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close]);

  return (
    <div
      className={`field-note-open-sequence ${collectionTheme.className}`}
      data-closing={closing || undefined}
      role="dialog"
      aria-modal="true"
      aria-label={`${note.title} field note`}
      style={{
        ...collectionTheme.style,
        "--source-x": `${sourceRect.left + sourceRect.width / 2}px`,
        "--source-y": `${sourceRect.top + sourceRect.height / 2}px`,
        "--source-width": `${sourceRect.width}px`,
        "--source-height": `${sourceRect.height}px`,
        "--source-rotate": `${note.rotation}deg`,
      } as React.CSSProperties}
    >
      <div className="field-note-open-sequence__shade" aria-hidden />
      <div className="field-note-open-sequence__envelope-wrap" aria-hidden>
        <div className={`field-note-open-sequence__envelope ${letterTheme.className}`} data-seal={note.sealType}>
          <span className="field-note-open-sequence__flap" />
          <span className={`field-note-open-sequence__seal field-note-open-sequence__seal--${note.sealType}`} />
          <span className="field-note-open-sequence__sheet" />
        </div>
      </div>
      <FieldNoteReader note={note} onClose={close} />
    </div>
  );
}
