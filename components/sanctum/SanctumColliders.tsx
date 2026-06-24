"use client";
import { useEffect } from "react";
import { buildColliders, disposeColliders } from "./lib/colliders";
import type { QualityConfig } from "./SanctumQualityManager";

/**
 * Builds the BVH terrain collider + obstacle list once the Living Sanctum is
 * present, so the camera rig can ground-conform and clamp out of trunks. Pure
 * side-effect; renders nothing.
 */
export default function SanctumColliders({ config }: { config: QualityConfig }) {
  useEffect(() => {
    buildColliders(config.heroTreeCount);
    return () => disposeColliders();
  }, [config.heroTreeCount]);
  return null;
}
