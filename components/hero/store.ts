"use client";
import { useSyncExternalStore } from "react";

/**
 * Shared state between the R3F scene (which writes positions every frame)
 * and the DOM overlays (which read them imperatively in their own rAF).
 * Only `hovered` changes trigger React renders.
 */
export interface ScreenPos {
  x: number;
  y: number;
  r: number; // projected radius in px
}

export const hero = {
  /** raw scroll progress 0 → 1 (system → docked bar) */
  p: 0,
  /** smoothed progress, written by the scene each frame */
  pS: 0,
  /** intro reveal 0 → 1 */
  intro: 0,
  hovered: null as string | null,
  /** card pinned open by a touch tap */
  pinned: false,
  screen: new Map<string, ScreenPos>(),
  /** current orbital angle per body — read by trails and the comet tail */
  theta: new Map<string, number>(),
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

let unhoverTimer: ReturnType<typeof setTimeout> | null = null;

export function setHovered(id: string | null, pinned = false) {
  if (unhoverTimer) {
    clearTimeout(unhoverTimer);
    unhoverTimer = null;
  }
  if (hero.hovered === id && hero.pinned === pinned) return;
  hero.hovered = id;
  hero.pinned = pinned;
  emit();
}

/** delayed unhover so the pointer can travel from planet to card */
export function requestUnhover(id: string) {
  if (hero.pinned) return;
  if (unhoverTimer) clearTimeout(unhoverTimer);
  unhoverTimer = setTimeout(() => {
    if (hero.hovered === id && !hero.pinned) {
      hero.hovered = null;
      emit();
    }
  }, 260);
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useHovered() {
  return useSyncExternalStore(
    subscribe,
    () => hero.hovered,
    () => null
  );
}

/* ————— shared geometry between scene and nav bar ————— */

export const BAR_H = 76;

/** x centers (px) of the docked slots, right-aligned cluster */
export function slotCenters(n: number, w: number): number[] {
  if (w < 768) {
    // compact: the cluster fills the bar after the sun (x≈26)
    const left = 70;
    const right = w - 16;
    const spacing = Math.min(54, (right - left) / (n - 1));
    const start = left + (right - left - spacing * (n - 1)) / 2;
    return Array.from({ length: n }, (_, i) => start + i * spacing);
  }
  const spacing = Math.min(104, (w * 0.58) / n);
  const center = w - spacing * ((n - 1) / 2) - Math.max(40, w * 0.06) - 36;
  return Array.from({ length: n }, (_, i) => center + (i - (n - 1) / 2) * spacing);
}

/**
 * On narrow viewports the system compresses: orbits shrink and the camera
 * pulls back so the whole dance stays in frame.
 */
export function orbitScale(aspect: number): number {
  return Math.min(1, Math.max(0.52, aspect / 1.45));
}
export function cameraDistance(aspect: number): number {
  return 26 / Math.min(1, Math.max(0.62, aspect / 1.45));
}

/** docked radius (px) by body kind */
export function dockRadius(kind: string): number {
  switch (kind) {
    case "gas-giant":
      return 13;
    case "terrestrial":
      return 10;
    case "rocky":
      return 8;
    case "comet":
      return 6;
    default:
      return 5; // stars
  }
}

/* ————— easing ————— */
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const smoothstep = (v: number, a: number, b: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** exponential smoothing toward a target, frame-rate independent */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));
