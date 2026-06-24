"use client";
import { Suspense } from "react";
import SanctumCameraRig from "./SanctumCameraRig";
import SanctumFog from "./SanctumFog";
import SanctumLighting from "./SanctumLighting";
import SanctumPostFX from "./SanctumPostFX";
import { SanctumWindSystem, useResetWind } from "./SanctumWindSystem";
import type { QualityConfig } from "./SanctumQualityManager";
import type { Zone } from "./lib/journey";
import EntanglementRoom from "./zones/EntanglementRoom";
import Threshold from "./zones/Threshold";
import LivingSanctum from "./zones/LivingSanctum";

/**
 * In-canvas orchestration. All three zones are mounted at once in their own
 * regions of space (room behind the trailhead, forest ahead) — so from inside
 * the room you genuinely see through the doorway into the world beyond, and fog +
 * frustum culling hide what's behind you. Lighting, fog and postFX ease by the
 * active `zone`, giving a continuous mood change as the camera walks the spine.
 */
export default function SanctumScene({
  config,
  zone,
  targetNodeId,
  moving,
  started,
  onArrive,
  onInspect,
}: {
  config: QualityConfig;
  zone: Zone;
  targetNodeId: string;
  moving: boolean;
  /** the heavy outdoor world mounts once the user commits to leaving the room. */
  started: boolean;
  onArrive: (id: string) => void;
  onInspect: (id: string) => void;
}) {
  useResetWind();
  const lowFx = config.tier === "low";
  return (
    <>
      <SanctumWindSystem strength={config.windStrength} />
      <SanctumLighting zone={zone} config={config} />
      <SanctumFog zone={zone} config={config} />
      <SanctumCameraRig targetNodeId={targetNodeId} onArrive={onArrive} />

      {/* one Suspense per zone — streaming the heavy forest must never blank
          the room/threshold the camera is currently standing in. */}
      <Suspense fallback={null}>
        <EntanglementRoom config={config} />
      </Suspense>
      <Suspense fallback={null}>
        <Threshold />
      </Suspense>
      {started ? (
        <Suspense fallback={null}>
          <LivingSanctum config={config} onInspect={onInspect} lowFx={lowFx} />
        </Suspense>
      ) : null}

      <SanctumPostFX config={config} dofActive={moving} />
    </>
  );
}
