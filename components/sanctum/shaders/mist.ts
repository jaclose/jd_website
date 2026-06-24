import * as THREE from "three";
import { GLSL_NOISE, windUniforms } from "./wind";

/**
 * Ground mist / drifting fog bands. A camera-facing-ish quad whose alpha is a
 * soft radial falloff modulated by slowly drifting fbm — the spec's "very slow
 * horizontal movement". Additive, depth-write off, so it layers for atmospheric
 * depth without z-fighting the foliage. Tint per zone (cool steel-blue inside,
 * warm dawn outside).
 */
export function makeMistMaterial(color: THREE.ColorRepresentation, opacity = 0.18) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    // normal (alpha) blending — additive mist blows out a daytime scene to white
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: windUniforms.uTime,
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float radial = smoothstep(0.5, 0.04, length(p));
        float drift = fbm(vec3(vUv * 3.0 + vec2(uTime * 0.025, uTime * 0.008), uTime * 0.04));
        float a = radial * (0.45 + 0.55 * drift) * uOpacity;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
}
