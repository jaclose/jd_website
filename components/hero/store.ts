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

/**
 * The system docks into a floating pill, centered at the top of the
 * viewport. The sun parks at the pill's left edge (it is the home
 * button); the bodies line up to its right, still rotating.
 */
export const BAR_TOP = 14;
export const BAR_H = 58;

/** px spacing between docked slots */
export function slotSpacing(n: number, w: number): number {
  return w < 560 ? Math.max(36, Math.min(46, (w - 104) / n)) : 56;
}

/** x centers (px) of the docked slots — a centered cluster */
export function slotCenters(n: number, w: number): number[] {
  const spacing = slotSpacing(n, w);
  // shift right by half a slot so the sun (one slot left) balances the pill
  const first = w / 2 - (spacing * (n - 1)) / 2 + spacing * 0.5;
  return Array.from({ length: n }, (_, i) => first + i * spacing);
}

/** where the sun docks — one slot left of the cluster */
export function sunSlotX(n: number, w: number): number {
  return slotCenters(n, w)[0] - slotSpacing(n, w);
}

/** the pill's horizontal bounds, for the DOM bar */
export function pillBounds(n: number, w: number): { left: number; width: number } {
  const centers = slotCenters(n, w);
  const spacing = slotSpacing(n, w);
  const left = sunSlotX(n, w) - spacing * 0.62;
  const right = centers[centers.length - 1] + spacing * 0.62;
  return { left, width: right - left };
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

/** docked radius (px) by body kind — sized so labels never clip */
export function dockRadius(kind: string): number {
  switch (kind) {
    case "gas-giant":
      return 10;
    case "terrestrial":
      return 8;
    case "rocky":
      return 7;
    case "comet":
      return 5;
    default:
      return 4; // stars
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
