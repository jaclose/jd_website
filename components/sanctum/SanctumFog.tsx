"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Zone } from "./lib/journey";
import { MOODS } from "./lib/moods";
import { mulberry32 } from "./lib/rng";
import { makeMistMaterial } from "./shaders/mist";

/**
 * Atmospheric depth: scene fog (colour + near/far eased per zone) plus drifting
 * ground-mist bands down the trail. Fog is used for *depth*, not to hide unbuilt
 * scenery — far ranks of trunks dissolve into it the way the references do. Mist
 * bands drift very slowly and horizontally (the slowest wind channel).
 */
export default function SanctumFog({ zone, config }: { zone: Zone; config: QualityConfigLite }) {
  const { scene } = useThree();
  const fog = useMemo(() => new THREE.Fog(MOODS.room.fogColor.clone(), MOODS.room.fogNear, MOODS.room.fogFar), []);

  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  useFrame((_, dt) => {
    const target = MOODS[zone];
    const a = 1 - Math.exp(-1.6 * Math.min(dt, 0.05));
    fog.color.lerp(target.fogColor, a);
    fog.near = THREE.MathUtils.lerp(fog.near, target.fogNear, a);
    fog.far = THREE.MathUtils.lerp(fog.far, target.fogFar, a);
  });

  const bands = useMemo(() => {
    if (!config.fog) return [];
    const rnd = mulberry32(88);
    const n = config.tier === "low" ? 5 : config.tier === "ultra" ? 14 : 9;
    return Array.from({ length: n }, () => ({
      x: (rnd() - 0.5) * 46,
      y: 0.4 + rnd() * 2.4,
      z: 8 - rnd() * 70, // down the trail into the sanctum
      s: 14 + rnd() * 20,
      rot: rnd() * Math.PI,
      warm: rnd() > 0.4,
    }));
  }, [config.fog, config.tier]);

  const mats = useMemo(() => {
    const warm = makeMistMaterial("#cdbb95", 0.13);
    const cool = makeMistMaterial("#8ea2b4", 0.11);
    return { warm, cool };
  }, []);

  if (!bands.length) return null;
  return (
    <group>
      {bands.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.y, b.z]}
          rotation={[-Math.PI / 2 + 0.18, 0, b.rot]}
          material={b.warm ? mats.warm : mats.cool}
        >
          <planeGeometry args={[b.s, b.s * 0.7]} />
        </mesh>
      ))}
    </group>
  );
}

interface QualityConfigLite {
  tier: "low" | "medium" | "high" | "ultra";
  fog: boolean;
}
