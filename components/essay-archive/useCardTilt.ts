"use client";

import { useCallback, useRef } from "react";

/**
 * Collector-card tilt: the artifact leans gently toward the pointer (max ~5°)
 * while a glare highlight tracks it — the physical "turning a foil card in
 * lamplight" move. Everything writes straight to style/custom properties (no
 * React state per move). Fine pointers only; reduced-motion disables the lean
 * entirely and leaves the glare parked.
 */
const MAX_TILT = 5; // degrees

export function useCardTilt<T extends HTMLElement>() {
  const el = useRef<T | null>(null);
  const enabled = useRef<boolean | null>(null);

  const isEnabled = () => {
    if (enabled.current === null) {
      enabled.current =
        typeof window !== "undefined" &&
        window.matchMedia("(pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return enabled.current;
  };

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    if (!isEnabled()) return;
    const node = el.current ?? (e.currentTarget as T);
    el.current = node;
    const r = node.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * MAX_TILT * 2;
    const ry = (px - 0.5) * MAX_TILT * 2;
    node.style.setProperty("--tilt-x", `${rx.toFixed(2)}deg`);
    node.style.setProperty("--tilt-y", `${ry.toFixed(2)}deg`);
    node.style.setProperty("--glare-x", `${(px * 100).toFixed(1)}%`);
    node.style.setProperty("--glare-y", `${(py * 100).toFixed(1)}%`);
    node.style.setProperty("--glare-o", "1");
  }, []);

  const onPointerLeave = useCallback((e: React.PointerEvent<T>) => {
    const node = el.current ?? (e.currentTarget as T);
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
    node.style.setProperty("--glare-o", "0");
  }, []);

  return { onPointerMove, onPointerLeave };
}
