"use client";
import { Environment } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { HDRI_FOREST } from "./lib/assets";
import type { Zone } from "./lib/journey";
import { cloneMood, lerpMood, MOODS } from "./lib/moods";
import type { QualityConfig } from "./SanctumQualityManager";

/**
 * The light rig. One key (sun / cold practical), one fill/accent, a hemisphere
 * bounce, ambient, and forest IBL — all eased every frame toward the active
 * zone's mood so the walk from the blue room out into the gold Sanctum is a
 * continuous change of light, not a cut. IBL intensity is dialled right down
 * inside the room so the warm forest probe doesn't leak through the walls.
 */
export default function SanctumLighting({ zone, config }: { zone: Zone; config: QualityConfig }) {
  const { scene } = useThree();
  const key = useRef<THREE.DirectionalLight>(null!);
  const fill = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const amb = useRef<THREE.AmbientLight>(null!);
  const live = useMemo(() => cloneMood(MOODS.room), []);
  // HDRI image-based lighting is an ultra-only enhancement. The analytic rig
  // (key/fill/hemisphere/ambient) is the verified baseline that reads well on
  // every tier; on software-GL the HDR PMREM probe can wash PBR surfaces white,
  // so it's reserved for top-end devices where a real GPU is near-certain.
  const useIBL = config.tier === "ultra";

  useFrame((_, dt) => {
    const target = MOODS[zone];
    const a = 1 - Math.exp(-1.6 * Math.min(dt, 0.05));
    lerpMood(live, live, target, a);

    if (key.current) {
      key.current.color.copy(live.keyColor);
      key.current.intensity = live.keyIntensity;
      key.current.position.copy(live.keyPos);
    }
    if (fill.current) {
      fill.current.color.copy(live.fillColor);
      fill.current.intensity = live.fillIntensity;
    }
    if (hemi.current) {
      hemi.current.color.copy(live.hemiSky);
      hemi.current.groundColor.copy(live.hemiGround);
      hemi.current.intensity = live.hemiIntensity;
    }
    if (amb.current) {
      amb.current.color.copy(live.ambient);
      amb.current.intensity = live.ambientIntensity;
    }
    scene.environmentIntensity = useIBL ? live.envIntensity : 0;
    if (!scene.background || (scene.background as THREE.Color).isColor) {
      scene.background = (scene.background as THREE.Color) ?? new THREE.Color();
      (scene.background as THREE.Color).copy(live.background);
    }
  });

  return (
    <>
      {useIBL ? <Environment files={HDRI_FOREST} environmentIntensity={0.4} /> : null}
      <directionalLight
        ref={key}
        castShadow={config.shadows}
        shadow-mapSize={[config.shadowSize || 1024, config.shadowSize || 1024]}
        shadow-bias={-0.0005}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <directionalLight ref={fill} position={[10, 6, 12]} />
      <hemisphereLight ref={hemi} />
      <ambientLight ref={amb} />
    </>
  );
}
