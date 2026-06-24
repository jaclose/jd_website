"use client";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "./lib/rng";
import { makeFireflyGeometry, makeFireflyMaterial } from "./shaders/fireflies";

/**
 * Warm amber fireflies drifting on organic, curling paths (all motion on the
 * GPU — see shaders/fireflies). Scattered through the Living Sanctum region down
 * the trail; count scales with the quality tier. Colour can be overridden so a
 * Noctyrium-style landmark can host a cooler cluster.
 */
export default function SanctumFireflies({
  count,
  color = "#ffcf87",
  region = { x: 18, zNear: 8, zFar: -66, yMin: 0.4, yMax: 4.2 },
  seed = 303,
}: {
  count: number;
  color?: string;
  region?: { x: number; zNear: number; zFar: number; yMin: number; yMax: number };
  seed?: number;
}) {
  const gl = useThree((s) => s.gl);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geom = useMemo(() => {
    const rnd = mulberry32(seed);
    return makeFireflyGeometry(
      count,
      () => [
        (rnd() - 0.5) * 2 * region.x,
        region.yMin + rnd() * (region.yMax - region.yMin),
        region.zNear + rnd() * (region.zFar - region.zNear),
      ],
      0.9,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed]);

  const material = useMemo(() => makeFireflyMaterial(color, 24, 1.5), [color]);

  useEffect(() => {
    material.uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2);
    matRef.current = material;
    return () => geom.dispose();
  }, [gl, material, geom]);

  if (count <= 0) return null;
  return <points geometry={geom} material={material} frustumCulled={false} />;
}
