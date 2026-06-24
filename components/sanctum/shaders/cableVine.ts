import * as THREE from "three";
import { injectWind } from "./wind";

/**
 * The dead cables of the Entanglement Room — and the vines that overtake them at
 * the Threshold. A slow, DELAYED writhe travels down the length of a tube: the
 * anchored base barely moves while a wave propagates toward the free tip, so the
 * cables read as something half-alive, reaching. Far slower and laggier than
 * leaf/grass wind by design.
 *
 * Expects TubeGeometry-style UVs where uv.x runs 0→1 along the cable's length.
 *
 * @param reach  0 = limp/dead (room), →1 = straining toward the light (threshold)
 */
export function applyCableVine(mat: THREE.Material, reach = 0.4) {
  const r = reach.toFixed(3);
  return injectWind(
    mat,
    "",
    /* glsl */ `
      {
        float t = uv.x;                       // 0 at anchor → 1 at free tip
        #ifdef USE_INSTANCING
          vec3 wp = (modelMatrix * instanceMatrix * vec4(0.0,0.0,0.0,1.0)).xyz;
        #else
          vec3 wp = modelMatrix[3].xyz;
        #endif
        float phase = wp.x * 0.7 + wp.z * 0.6;
        // a wave that lags down the length (delayed tip movement)
        float wave = sin(uTime * 0.55 - t * 4.5 + phase);
        float writhe = wave * pow(t, 1.6) * (0.12 + ${r} * 0.18);
        transformed.x += writhe;
        transformed.z += writhe * 0.7;
        // the reaching pull toward the light, biased upward near the tip
        transformed.y += pow(t, 2.0) * ${r} * (0.5 + 0.5 * sin(uTime * 0.4 + phase)) * 0.35;
      }
    `,
  );
}

/** convenience: a procedural cable/vine material (dark rubber → living green). */
export function makeCableMaterial(color: THREE.ColorRepresentation, reach = 0.4) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 });
  applyCableVine(mat, reach);
  return mat;
}
