"use client";
import { useMemo } from "react";
import * as THREE from "three";
import InstancedModel from "../SanctumFoliage";
import { makeCableMaterial } from "../shaders/cableVine";
import { DOORWAY } from "./EntanglementRoom";

/**
 * Zone 2 — the Threshold. The exact point of decision. A doorway frame stands
 * where the room ends; dead cables give way to living vines crossing the opening,
 * warm light spills in from the forest side, and ferns and plants creep over the
 * sill. Crossing it (threshold → start) is the interactive "step through" the
 * controller drives; this zone supplies the place where it happens.
 */
export default function Threshold() {
  const { z, width, height } = DOORWAY;

  const vines = useMemo(() => {
    const mk = (pts: [number, number, number][]) =>
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 32, 0.06, 6, false);
    return [
      mk([[-width / 2, height, z], [-0.6, height - 0.8, z + 0.1], [0.2, height - 1.8, z - 0.1], [0.5, height - 3.0, z]]),
      mk([[width / 2, height, z], [0.7, height - 1.0, z - 0.1], [-0.3, height - 2.2, z + 0.1], [-0.6, height - 3.1, z]]),
      mk([[-width / 2 + 0.2, height - 0.2, z], [0.0, height - 0.5, z], [width / 2 - 0.2, height - 0.3, z]]),
    ];
  }, [z, width, height]);

  // living vine: green, straining toward the light (high reach)
  const vineMat = useMemo(() => makeCableMaterial("#3c5a2c", 0.95), []);

  return (
    <group>
      {/* doorway frame */}
      <group>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (width / 2 + 0.12), height / 2, z]} castShadow>
            <boxGeometry args={[0.24, height, 0.4]} />
            <meshStandardMaterial color="#3b2c1d" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, height + 0.12, z]} castShadow>
          <boxGeometry args={[width + 0.5, 0.24, 0.4]} />
          <meshStandardMaterial color="#3b2c1d" roughness={0.9} />
        </mesh>
        {/* a worn sill */}
        <mesh position={[0, 0.05, z]}>
          <boxGeometry args={[width + 0.5, 0.1, 0.6]} />
          <meshStandardMaterial color="#2e2415" roughness={1} />
        </mesh>
      </group>

      {/* vines crossing the opening */}
      {vines.map((g, i) => (
        <mesh key={i} geometry={g} material={vineMat} castShadow />
      ))}

      {/* ferns + plants creeping over the sill from the forest side */}
      <InstancedModel
        model="fern"
        placements={[
          { position: [-width / 2 + 0.2, 0.05, z - 0.3], scale: 0.9, rotationY: 0.4 },
          { position: [width / 2 - 0.3, 0.05, z - 0.4], scale: 1.1, rotationY: 2.1 },
          { position: [0.4, 0.05, z - 0.8], scale: 0.8, rotationY: 4.0 },
        ]}
        foliageWind
        windAmount={1.4}
        castShadow={false}
      />
      <InstancedModel
        model="plant"
        placements={[
          { position: [-0.6, 0.05, z - 0.6], scale: 0.7, rotationY: 1.2 },
          { position: [width / 2 - 0.5, 0.05, z + 0.2], scale: 0.6, rotationY: 3.3 },
        ]}
        foliageWind
        windAmount={1.2}
        castShadow={false}
      />

      {/* warm light leaking in from the world beyond, pulling the eye forward */}
      <pointLight position={[0, height * 0.6, z - 4]} color="#f0cf94" intensity={3} distance={16} decay={2} />
    </group>
  );
}
