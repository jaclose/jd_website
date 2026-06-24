"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Device-capability detection → one of four quality tiers, plus the derived
 * per-tier budgets every Sanctum system reads (foliage counts, dpr, shadows,
 * postFX, fog). Generalises the matchMedia/innerWidth/dpr seed that the old
 * ForestScene used into four tiers with hardwareConcurrency + deviceMemory.
 *
 * `reducedMotion` is surfaced but NOT used to pick a tier here — Sanctum
 * Experience uses it to gate the static fallback instead.
 */
export type SanctumQuality = "low" | "medium" | "high" | "ultra";

export interface QualityConfig {
  tier: SanctumQuality;
  dpr: [number, number];
  shadows: boolean;
  shadowSize: number;
  postfx: boolean;
  dof: boolean;
  grassCount: number;
  fireflyCount: number;
  /** background impostor trees ringing the playable area */
  forestCount: number;
  /** hero / mid GLB trees placed as clones with LOD */
  heroTreeCount: number;
  groundCover: number;
  fog: boolean;
  windStrength: number;
  reducedMotion: boolean;
}

const PRESETS: Record<SanctumQuality, Omit<QualityConfig, "tier" | "reducedMotion">> = {
  low: {
    dpr: [1, 1.2], shadows: false, shadowSize: 0, postfx: false, dof: false,
    grassCount: 1600, fireflyCount: 18, forestCount: 60, heroTreeCount: 6,
    groundCover: 40, fog: true, windStrength: 0.7,
  },
  medium: {
    dpr: [1, 1.5], shadows: true, shadowSize: 1024, postfx: true, dof: false,
    grassCount: 4200, fireflyCount: 40, forestCount: 120, heroTreeCount: 10,
    groundCover: 90, fog: true, windStrength: 0.9,
  },
  high: {
    dpr: [1, 1.75], shadows: true, shadowSize: 2048, postfx: true, dof: true,
    grassCount: 8000, fireflyCount: 70, forestCount: 180, heroTreeCount: 14,
    groundCover: 150, fog: true, windStrength: 1.0,
  },
  ultra: {
    dpr: [1, 2], shadows: true, shadowSize: 2048, postfx: true, dof: true,
    grassCount: 13000, fireflyCount: 110, forestCount: 260, heroTreeCount: 18,
    groundCover: 230, fog: true, windStrength: 1.1,
  },
};

export function detectQuality(): { tier: SanctumQuality; reducedMotion: boolean } {
  if (typeof window === "undefined") return { tier: "high", reducedMotion: false };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const w = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let tier: SanctumQuality;
  if (coarse || w < 760 || cores <= 4 || mem <= 4) tier = "low";
  else if (w < 1280 || cores <= 6 || mem <= 6) tier = "medium";
  else if (dpr > 1.5 && w >= 1600 && cores >= 8 && mem >= 8) tier = "ultra";
  else tier = "high";
  return { tier, reducedMotion };
}

export function resolveConfig(tier: SanctumQuality, reducedMotion: boolean): QualityConfig {
  return { tier, reducedMotion, ...PRESETS[tier] };
}

const QualityContext = createContext<QualityConfig>(resolveConfig("high", false));

export function useQuality() {
  return useContext(QualityContext);
}

export function SanctumQualityProvider({
  override,
  children,
}: {
  override?: SanctumQuality;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<{ tier: SanctumQuality; reducedMotion: boolean }>(() =>
    typeof window === "undefined" ? { tier: "high", reducedMotion: false } : detectQuality(),
  );

  useEffect(() => {
    const update = () => setState(detectQuality());
    update();
    window.addEventListener("resize", update);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
    };
  }, []);

  const config = useMemo(
    () => resolveConfig(override ?? state.tier, state.reducedMotion),
    [override, state.tier, state.reducedMotion],
  );

  return <QualityContext.Provider value={config}>{children}</QualityContext.Provider>;
}
