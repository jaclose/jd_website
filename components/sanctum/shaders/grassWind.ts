import * as THREE from "three";
import { injectWind } from "./wind";

/**
 * Grass / low ground-cover: a broad, gentle rolling sway. The whole blade bends
 * along the shared wind vector, weighted by height (tip moves, root holds), with
 * a slow fbm rolling across the field so the meadow breathes in waves rather than
 * every blade ticking in sync. The tip flags harder during gusts.
 *
 * Expects an InstancedMesh whose blade geometry stands on y∈[0,height].
 */
export function applyGrassWind(mat: THREE.Material, height: number) {
  const h = height.toFixed(4);
  return injectWind(
    mat,
    "",
    /* glsl */ `
      {
        float bladeH = clamp(transformed.y / ${h}, 0.0, 1.0);
        #ifdef USE_INSTANCING
          vec3 wp = (modelMatrix * instanceMatrix * vec4(0.0,0.0,0.0,1.0)).xyz;
        #else
          vec3 wp = modelMatrix[3].xyz + transformed;
        #endif
        float roll = fbm(vec3(wp.xz * 0.06, uTime * 0.18));
        float gust = 0.55 + 0.45 * uGust;
        float sway = sin(uTime * 1.1 + wp.x * 0.5 + wp.z * 0.4 + roll * 6.28) * 0.16
                   + sin(uTime * 2.3 + wp.z * 0.8) * 0.05;
        float bend = sway * (0.6 + roll) * gust * uWindStrength * pow(bladeH, 1.7);
        vec2 dir = normalize(uWindDir + 1e-4);
        transformed.x += bend * dir.x;
        transformed.z += bend * dir.y;
        transformed.y -= abs(bend) * 0.18 * bladeH;
      }
    `,
  );
}
