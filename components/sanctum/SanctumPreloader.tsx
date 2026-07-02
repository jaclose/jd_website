"use client";
import { useEffect } from "react";
import { useTexture } from "@react-three/drei";
import { preloadZone, TERRAIN_TEX } from "./lib/assets";

/**
 * Site-load warmer for the Sanctum. Mounted on the homepage so the walk's
 * draco GLBs and PBR texture sets are already in drei's loader caches by the
 * time the visitor scrolls to (or clicks into) the section — the canvas then
 * mounts against a hot cache instead of streaming a forest on demand.
 *
 * Waits for idle time after load (never competes with the landing paint) and
 * skips entirely on data-saver connections.
 */
export default function SanctumPreloader() {
  useEffect(() => {
    type NetInfo = { saveData?: boolean; effectiveType?: string };
    const conn = (navigator as Navigator & { connection?: NetInfo }).connection;
    if (conn?.saveData || conn?.effectiveType === "2g") return;

    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      preloadZone("room");
      preloadZone("threshold");
      preloadZone("sanctum");
      for (const t of Object.values(TERRAIN_TEX)) {
        useTexture.preload(t.color);
        useTexture.preload(t.normal);
        useTexture.preload(t.rough);
      }
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (w.requestIdleCallback) {
      idleId = w.requestIdleCallback(warm, { timeout: 6000 });
    } else {
      timer = setTimeout(warm, 2500);
    }
    return () => {
      cancelled = true;
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timer) clearTimeout(timer);
    };
  }, []);
  return null;
}
