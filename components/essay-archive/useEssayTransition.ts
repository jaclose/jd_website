"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EssayArtifact } from "@/data/essays";

/**
 * Owns the archive → reader passage. Unsealing an artifact captures its
 * on-screen rectangle (so the reader can expand out of the exact spot the
 * work rests in), freezes page scroll, and hands the modal a staged lifecycle:
 * "opening" plays the cinematic expansion, "closing" settles the artifact
 * back into the archive before unmounting. Focus returns to the artifact that
 * was opened. Reduced-motion visitors skip the theatre entirely — the CSS
 * side collapses every stage to a plain fade.
 */

export interface EssayTransitionState {
  artifact: EssayArtifact;
  sourceRect: DOMRect;
  closing: boolean;
}

const CLOSE_MS = 560;

export function useEssayTransition() {
  const [state, setState] = useState<EssayTransitionState | null>(null);
  const sourceEl = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback((artifact: EssayArtifact, source: HTMLElement) => {
    sourceEl.current = source;
    setState({ artifact, sourceRect: source.getBoundingClientRect(), closing: false });
  }, []);

  const close = useCallback(() => {
    setState((s) => (s && !s.closing ? { ...s, closing: true } : s));
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setState(null);
      sourceEl.current?.focus({ preventScroll: true });
      sourceEl.current = null;
    }, CLOSE_MS);
  }, []);

  // scroll freeze + Escape while the reader is up
  useEffect(() => {
    if (!state) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [state, close]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return { state, open, close };
}
