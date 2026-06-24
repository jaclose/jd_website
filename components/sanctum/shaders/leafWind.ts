import * as THREE from "three";
import { injectWind } from "./wind";

/**
 * Tree foliage: two layered motions, distinct from grass.
 *  - slow STRUCTURAL sway of the whole canopy along the wind, weighted by height
 *    above the trunk base (branches lag, trunk holds), driven by the gust env.
 *  - fast LEAF FLUTTER: tiny high-frequency noise displacement so individual
 *    leaf cards shiver out of phase with the branch sway.
 * Works on both single clones (hero trees) and instanced foliage.
 *
 * @param trunkBase  world-space y the sway pivots from (0 = ground).
 * @param amount     overall intensity (leaves 1.0, dense canopy ~0.7).
 */
export function applyLeafWind(mat: THREE.Material, amount = 1, trunkBase = 0) {
  const a = amount.toFixed(3);
  const b = trunkBase.toFixed(3);
  return injectWind(
    mat,
    "",
    /* glsl */ `
      {
        #ifdef USE_INSTANCING
          vec3 wp = (modelMatrix * instanceMatrix * vec4(0.0,0.0,0.0,1.0)).xyz;
        #else
          vec3 wp = modelMatrix[3].xyz;
        #endif
        float hAbove = max(transformed.y - ${b}, 0.0);
        float canopy = clamp(hAbove / 6.0, 0.0, 1.0);
        float gust = 0.5 + 0.7 * uGust;
        vec2 dir = normalize(uWindDir + 1e-4);
        // structural sway — slow, height-weighted
        float sway = sin(uTime * 0.8 + wp.x * 0.3 + wp.z * 0.25) * 0.5
                   + sin(uTime * 1.7 + wp.z * 0.5) * 0.18;
        float bend = sway * gust * uWindStrength * canopy * 0.16 * ${a};
        transformed.x += bend * dir.x;
        transformed.z += bend * dir.y;
        // leaf flutter — fast, tiny, per-vertex
        float fl = fbm(vec3(transformed.xyz * 1.6 + wp + uTime * 1.9));
        float flutter = (fl - 0.5) * 0.12 * (0.4 + canopy) * ${a} * (0.6 + 0.8 * uGust);
        transformed.x += flutter;
        transformed.y += flutter * 0.5;
        transformed.z += flutter * 0.8;
      }
    `,
  );
}
