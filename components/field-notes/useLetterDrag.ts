"use client";

import { useCallback, useRef } from "react";
import type { LetterPhysicsControls } from "@/components/field-notes/useLetterPhysics";

interface PointerStart {
  x: number;
  y: number;
  time: number;
  pointerId: number;
}

interface UseLetterDragOptions {
  id: string;
  controls: LetterPhysicsControls;
  disabled?: boolean;
  onOpen: (id: string, source: HTMLElement) => void;
}

export function useLetterDrag({ id, controls, disabled = false, onOpen }: UseLetterDragOptions) {
  const startRef = useRef<PointerStart | null>(null);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (disabled || (event.pointerType === "mouse" && event.button !== 0)) return;

      startRef.current = {
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
        pointerId: event.pointerId,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
      controls.startDrag(id, event.clientX, event.clientY, event.pointerType);
    },
    [controls, disabled, id],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (disabled || !startRef.current) return;
      controls.drag(id, event.clientX, event.clientY);
    },
    [controls, disabled, id],
  );

  const finishPointer = useCallback(
    (event: React.PointerEvent<HTMLElement>, canceled = false) => {
      const start = startRef.current;
      if (!start) return;

      if (event.currentTarget.hasPointerCapture(start.pointerId)) {
        event.currentTarget.releasePointerCapture(start.pointerId);
      }

      const elapsed = performance.now() - start.time;
      const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      const result = controls.endDrag(id);

      startRef.current = null;

      if (!canceled && distance < 7 && elapsed < 520 && !result.moved) {
        onOpen(id, event.currentTarget);
      }
    },
    [controls, id, onOpen],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => finishPointer(event),
    [finishPointer],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLElement>) => finishPointer(event, true),
    [finishPointer],
  );

  const onDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      onOpen(id, event.currentTarget);
    },
    [disabled, id, onOpen],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (disabled) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpen(id, event.currentTarget);
      }
    },
    [disabled, id, onOpen],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onDoubleClick,
    onKeyDown,
  };
}
