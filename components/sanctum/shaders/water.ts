import * as THREE from "three";
import { GLSL_NOISE, windUniforms } from "./wind";

/**
 * A small cinematic water surface for the tide pool / recovery pool. Two scrolling
 * fbm layers perturb a normal that drives a Fresnel mix from deep teal at the
 * centre to a bright sky tint at grazing angles, plus a tight sun specular —
 * the look of still forest water catching dawn light. All procedural (no normal
 * maps), animated off the shared wind clock.
 */
export function makeWaterMaterial(
  deep: THREE.ColorRepresentation = "#15333b",
  sky: THREE.ColorRepresentation = "#cfe2dd",
  sunColor: THREE.ColorRepresentation = "#ffe9c0",
) {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: windUniforms.uTime,
      uDeep: { value: new THREE.Color(deep) },
      uSky: { value: new THREE.Color(sky) },
      uSun: { value: new THREE.Color(sunColor) },
      uSunDir: { value: new THREE.Vector3(-0.4, 0.5, -0.7).normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vView;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vView = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform float uTime;
      uniform vec3 uDeep, uSky, uSun, uSunDir;
      varying vec3 vWorld;
      varying vec3 vView;
      void main() {
        vec2 p = vWorld.xz;
        // two scrolling ripple layers → a perturbed surface normal
        float h1 = fbm(vec3(p * 0.6 + vec2(uTime * 0.08, 0.0), uTime * 0.05));
        float h2 = fbm(vec3(p * 1.7 - vec2(0.0, uTime * 0.12), uTime * 0.08));
        float e = 0.04;
        float hx = fbm(vec3((p + vec2(e, 0.0)) * 0.6 + vec2(uTime * 0.08, 0.0), uTime * 0.05));
        float hz = fbm(vec3((p + vec2(0.0, e)) * 0.6 + vec2(uTime * 0.08, 0.0), uTime * 0.05));
        vec3 n = normalize(vec3((h1 - hx) * 2.0, 1.0, (h1 - hz) * 2.0));
        float fres = pow(clamp(1.0 - max(dot(n, vView), 0.0), 0.0, 1.0), 3.0);
        vec3 col = mix(uDeep, uSky, fres * 0.9 + h2 * 0.06);
        // sun specular glint
        vec3 h = normalize(uSunDir + vView);
        float spec = pow(max(dot(n, h), 0.0), 90.0);
        col += uSun * spec * 1.4;
        gl_FragColor = vec4(col, 0.86);
      }
    `,
  });
}
