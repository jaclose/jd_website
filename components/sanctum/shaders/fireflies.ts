import * as THREE from "three";
import { GLSL_NOISE, windUniforms } from "./wind";

/**
 * Fireflies — warm amber glints that wander on organic, curling paths and pulse
 * out of phase. All motion lives in the vertex shader (no per-frame JS loop, per
 * the store/frame-loop architecture invariant): each point drifts via fbm around
 * its seeded home, with a slow per-point brightness pulse. Soft round sprite in
 * the fragment stage. Build the Points with `makeFireflyGeometry`.
 */
export function makeFireflyGeometry(
  count: number,
  place: (i: number) => [number, number, number],
  spread = 0.9,
): THREE.BufferGeometry {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const amp = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const [x, y, z] = place(i);
    pos.set([x, y, z], i * 3);
    seed[i] = Math.random() * 100;
    amp[i] = spread * (0.6 + Math.random() * 0.9);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  g.setAttribute("aAmp", new THREE.BufferAttribute(amp, 1));
  return g;
}

export function makeFireflyMaterial(
  color: THREE.ColorRepresentation = "#ffcf87",
  size = 22,
  pixelRatio = 1.5,
) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: windUniforms.uTime,
      uColor: { value: new THREE.Color(color) },
      uSize: { value: size },
      uPixelRatio: { value: pixelRatio },
    },
    vertexShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform float uTime;
      uniform float uSize;
      uniform float uPixelRatio;
      attribute float aSeed;
      attribute float aAmp;
      varying float vPulse;
      void main() {
        vec3 p = position;
        float t = uTime * 0.35 + aSeed;
        // organic curling drift, not straight lines
        p.x += (fbm(vec3(t, aSeed, 0.0)) - 0.5) * 2.0 * aAmp;
        p.y += (fbm(vec3(0.0, t * 1.3, aSeed)) - 0.5) * 1.4 * aAmp;
        p.z += (fbm(vec3(aSeed, 0.0, t)) - 0.5) * 2.0 * aAmp;
        vPulse = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(uTime * 1.6 + aSeed * 6.28), 2.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * uPixelRatio * (1.0 / -mv.z) * (0.6 + 0.6 * vPulse);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vPulse;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.0, d);
        float glow = pow(core, 2.5);
        gl_FragColor = vec4(uColor, glow * vPulse);
      }
    `,
  });
}
