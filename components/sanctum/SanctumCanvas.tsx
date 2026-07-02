"use client";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import SanctumScene from "./SanctumScene";
import type { QualityConfig } from "./SanctumQualityManager";
import type { Zone } from "./lib/journey";
import { EYE_HEIGHT, journeyNodeById } from "./lib/journey";

/**
 * The R3F surface. Configures a filmic renderer (ACES tone mapping + soft
 * shadows), starts the camera inside the room, and hands the scene the active
 * target/zone/quality. dpr, shadows and the whole post stack are tier-driven by
 * the resolved QualityConfig.
 */
export default function SanctumCanvas({
  config,
  zone,
  targetNodeId,
  moving,
  started,
  active,
  onArrive,
  onInspect,
  onPerfDecline,
}: {
  config: QualityConfig;
  zone: Zone;
  targetNodeId: string;
  moving: boolean;
  started: boolean;
  active: boolean;
  onArrive: (id: string) => void;
  onInspect: (id: string) => void;
  /** sustained low fps → the experience steps the quality tier down one notch. */
  onPerfDecline?: () => void;
}) {
  // initial camera sits at whatever node we start on (room by default, or a
  // ?sanctumStart deep-link node); the rig takes over movement after mount.
  const start = journeyNodeById(targetNodeId);
  return (
    <Canvas
      dpr={config.dpr}
      shadows={config.shadows ? "soft" : false}
      frameloop={active ? "always" : "never"}
      camera={{
        fov: 58,
        near: 0.1,
        far: 320,
        position: [start.position[0], start.position[1] + EYE_HEIGHT, start.position[2]],
      }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.85,
      }}
      style={{ background: "transparent" }}
    >
      <SanctumScene
        config={config}
        zone={zone}
        targetNodeId={targetNodeId}
        moving={moving}
        started={started}
        onArrive={onArrive}
        onInspect={onInspect}
        onPerfDecline={onPerfDecline}
      />
    </Canvas>
  );
}
