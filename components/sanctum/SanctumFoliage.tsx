"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useModelPrimitives, type ModelKey } from "./lib/assets";
import { applyLeafWind } from "./shaders/leafWind";

/**
 * Generic GPU-instanced placement of a CC0 GLB. A multi-material model is split
 * into its primitives (trunk, bark, leaf cards…) and each primitive becomes its
 * own InstancedMesh; every placement writes the *same* matrix to all primitives
 * so a whole tree moves as one. Foliage primitives get the leaf-wind shader, so
 * canopies flutter while trunks stay put. One `<InstancedModel>` = one species
 * scattered hundreds of times in a handful of draw calls.
 */
export interface Placement {
  position: [number, number, number];
  /** uniform scale, or [x,y,z] */
  scale?: number | [number, number, number];
  /** y-rotation in radians */
  rotationY?: number;
}

export default function InstancedModel({
  model,
  placements,
  foliageWind = true,
  windAmount = 1,
  castShadow = true,
  receiveShadow = false,
  tint,
}: {
  model: ModelKey;
  placements: Placement[];
  foliageWind?: boolean;
  windAmount?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** optional per-species color multiply */
  tint?: THREE.ColorRepresentation;
}) {
  const prims = useModelPrimitives(model);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const count = placements.length;

  // apply wind + tint to the (already-cloned) primitive materials once
  const materials = useMemo(() => {
    return prims.map((p) => {
      const mat = p.material as THREE.MeshStandardMaterial;
      if (tint && "color" in mat) mat.color.multiply(new THREE.Color(tint));
      if (foliageWind && p.foliage) applyLeafWind(mat, windAmount, 0.5);
      if (p.foliage) mat.side = THREE.DoubleSide; // leaf cards read from both sides
      return mat;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prims, foliageWind, windAmount, tint]);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    placements.forEach((p, i) => {
      pos.set(p.position[0], p.position[1], p.position[2]);
      const s = p.scale ?? 1;
      if (Array.isArray(s)) scl.set(s[0], s[1], s[2]);
      else scl.set(s, s, s);
      q.setFromAxisAngle(up, p.rotationY ?? 0);
      m.compose(pos, q, scl);
      for (const inst of refs.current) inst?.setMatrixAt(i, m);
    });
    for (const inst of refs.current) {
      if (inst) inst.instanceMatrix.needsUpdate = true;
    }
  }, [placements]);

  if (!count || !prims.length) return null;
  return (
    <>
      {prims.map((p, idx) => (
        <instancedMesh
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          args={[p.geometry, materials[idx], count]}
          castShadow={castShadow && !p.foliage ? true : castShadow}
          receiveShadow={receiveShadow}
          frustumCulled={false}
        />
      ))}
    </>
  );
}
