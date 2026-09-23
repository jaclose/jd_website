"use client";
import { Suspense, useEffect } from "react";
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import SanctumAudioSystem from "./SanctumAudioSystem";
import SanctumCameraRig from "./SanctumCameraRig";
import SanctumFog from "./SanctumFog";
import SanctumQuestSensor from "./SanctumQuestSensor";
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
/**
 * Dev handle: `window.__sanctum` exposes scene/camera/renderer so a headless
 * driver (or the console) can inspect materials, toggle fog, and reposition the
 * camera while tuning the look. Mirrors the hero's `window.__hero`.
 */
function SanctumDebugHandle() {
  const { scene, camera, gl } = useThree();
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __sanctum?: unknown }).__sanctum = { scene, camera, gl, THREE_REVISION: undefined };
    return () => {
      delete (window as unknown as { __sanctum?: unknown }).__sanctum;
    };
  }, [scene, camera, gl]);
  return null;
}

export default function SanctumScene({
  config,
  zone,
  targetNodeId,
  moving,
  started,
  onArrive,
  onInspect,
  onPerfDecline,
}: {
  config: QualityConfig;
  zone: Zone;
  targetNodeId: string;
  moving: boolean;
  /** the heavy outdoor world mounts once the user commits to leaving the room. */
  started: boolean;
  onArrive: (id: string) => void;
  onInspect: (id: string) => void;
  /** sustained low fps → the experience steps the quality tier down one notch. */
  onPerfDecline?: () => void;
}) {
  useResetWind();
  const lowFx = config.tier === "low";
  return (
    <>
      {/* keep the frame smooth: PerformanceMonitor watches fps and drives the
          r3f performance flag (and steps the whole quality tier down on
          sustained decline — down only, so it can never oscillate); AdaptiveDpr
          drops resolution under load, AdaptiveEvents sheds raycasts. */}
      <SanctumDebugHandle />
      <PerformanceMonitor onDecline={onPerfDecline} />
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />

      <SanctumWindSystem strength={config.windStrength} />
      <SanctumAudioSystem zone={zone} />
      <SanctumLighting zone={zone} config={config} />
      <SanctumFog zone={zone} config={config} />
      <SanctumCameraRig targetNodeId={targetNodeId} onArrive={onArrive} />
      {/* quest tripwires ride the feet position the rig publishes */}
      <SanctumQuestSensor />

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
