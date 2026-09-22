"use client";
import { useEffect } from "react";
import { useTexture } from "@react-three/drei";
import { preloadZone, TERRAIN_TEX } from "./lib/assets";

/**
 * Warmer for the Sanctum. Mounted on the homepage so the walk's draco GLBs and
 * PBR texture sets (~10 MB) are already in drei's loader caches by the time
 * the visitor scrolls to (or clicks into) the section — the canvas then mounts
 * against a hot cache instead of streaming a forest on demand.
 *
 * It waits for a sign of intent before spending that data: the first scroll
 * past the hero, a pointer resting on a link into the Sanctum, or ~12 s of
 * dwell. A visitor who reads the landing and leaves no longer pays 10 MB
 * (measured 2026-09-21: a phone downloaded 14.4 MB without scrolling).
 * Skips entirely on data-saver and 2G/3G connections, and warms in idle time.
 */
export default function SanctumPreloader() {
  useEffect(() => {
    type NetInfo = { saveData?: boolean; effectiveType?: string };
    const conn = (navigator as Navigator & { connection?: NetInfo }).connection;
    if (conn?.saveData || (conn?.effectiveType && conn.effectiveType !== "4g")) return;

    let cancelled = false;
    let armed = false;
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

    const arm = () => {
      if (armed || cancelled) return;
      armed = true;
      detach();
      if (w.requestIdleCallback) idleId = w.requestIdleCallback(warm, { timeout: 4000 });
      else timer = setTimeout(warm, 1500);
    };
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.6) arm();
    };
    const onPointerOver = (event: PointerEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href="/garden"], a[href="/#garden"]');
      if (link) arm();
    };
    const detach = () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerover", onPointerOver);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    const dwell = setTimeout(arm, 12_000);
    onScroll(); // landed mid-page (restored scroll / deep link)

    return () => {
      cancelled = true;
      detach();
      clearTimeout(dwell);
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timer) clearTimeout(timer);
    };
  }, []);
  return null;
}
