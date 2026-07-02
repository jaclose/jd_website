"use client";

import { useMemo, useState } from "react";
import { fieldNotes } from "@/data/fieldNotes";
import type { FieldNoteRecord } from "@/data/fieldNotes";
import FieldNoteEnvelope from "@/components/field-notes/FieldNoteEnvelope";
import FieldNoteOpenSequence from "@/components/field-notes/FieldNoteOpenSequence";
import { useLetterPhysics } from "@/components/field-notes/useLetterPhysics";
import "./fieldNotesTable.css";

interface OpenRequest {
  note: FieldNoteRecord;
  sourceRect: DOMRect;
}

function isNearby(note: FieldNoteRecord, hovered: FieldNoteRecord | undefined) {
  if (!hovered || hovered.id === note.id) return false;

  const distance = Math.hypot(
    hovered.tablePosition.x - note.tablePosition.x,
    hovered.tablePosition.y - note.tablePosition.y,
  );

  return distance < 28;
}

export default function FieldNotesTable() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [openRequest, setOpenRequest] = useState<OpenRequest | null>(null);
  // the "you can touch this" hint — shown until the visitor first grabs a letter
  const [hintDismissed, setHintDismissed] = useState(false);
  const { tableRef, states, controls } = useLetterPhysics(fieldNotes);
  const hoveredNote = useMemo(
    () => fieldNotes.find((note) => note.id === hoveredId),
    [hoveredId],
  );

  return (
    <div className="field-notes-table-page" data-reader-open={openRequest ? true : undefined}>
      <section className="field-notes-room" aria-labelledby="field-notes-table-title">
        <div className="field-notes-room__darkness" aria-hidden />
        <div className="field-notes-room__lamp" aria-hidden />
        <div className="field-notes-room__dust" aria-hidden>
          {Array.from({ length: 20 }, (_, index) => (
            <span key={index} style={{ "--dust-index": index } as React.CSSProperties} />
          ))}
        </div>

        <div className="field-notes-table-shell">
          <div className="field-notes-table-plaque">
            <p id="field-notes-table-title">Field Notes</p>
            <span>{String(fieldNotes.length).padStart(2, "0")} letters on the table</span>
          </div>

          <div
            ref={tableRef}
            className="field-notes-table-surface"
            aria-label="Field notes table"
            onPointerDownCapture={() => setHintDismissed(true)}
          >
            <div className="field-notes-table-surface__grain" aria-hidden />
            <div className="field-notes-table-surface__edge field-notes-table-surface__edge--top" aria-hidden />
            <div className="field-notes-table-surface__edge field-notes-table-surface__edge--bottom" aria-hidden />

            {fieldNotes.map((note) => {
              const state = states[note.id];
              if (!state) return null;

              return (
                <FieldNoteEnvelope
                  key={note.id}
                  note={note}
                  state={state}
                  controls={controls}
                  disabled={Boolean(openRequest)}
                  isDimmed={Boolean(openRequest)}
                  isNearby={isNearby(note, hoveredNote)}
                  onHover={setHoveredId}
                  onOpen={(selected, sourceRect) => {
                    setHoveredId(null);
                    setOpenRequest({ note: selected, sourceRect });
                  }}
                />
              );
            })}
          </div>

          {/* CSS visibility on data-dismissed also drops it from the a11y tree */}
          <p className="field-notes-hint" data-dismissed={hintDismissed || undefined}>
            <span aria-hidden>✋</span> pick the letters up — drag to move · flick to toss · click to open
          </p>
        </div>
      </section>

      {openRequest ? (
        <FieldNoteOpenSequence
          note={openRequest.note}
          sourceRect={openRequest.sourceRect}
          onClosed={() => setOpenRequest(null)}
        />
      ) : null}
    </div>
  );
}
