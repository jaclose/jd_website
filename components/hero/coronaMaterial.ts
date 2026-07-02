"use client";
import * as THREE from "three";

/**
 * The sun's living corona — a billboarded ring of radial "flame teeth" drawn
 * in-shader (fbm streaks flowing outward), replacing the flat glow sprite as
 * the thing that makes the star feel like burning plasma rather than a lamp.
 * Additive, depth-free, and driven by one uTime uniform; uFade lets the dock
 * choreography stand it down as the system collapses into the pill.
 */
export function makeCoronaMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uFade: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uFade;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
                   mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float s = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) {
          s += noise(p) * a;
          p = p * 2.03 + 17.1;
          a *= 0.5;
        }
        return s;
      }

      void main() {
        vec2 c = vUv * 2.0 - 1.0;
        float r = length(c);
        float ang = atan(c.y, c.x);

        // flame teeth: angular streaks that crawl outward over time, with
        // real gaps between licks so the limb reads as fire, not fog
        float teeth = fbm(vec2(ang * 3.2, r * 6.0 - uTime * 0.45));
        float lick  = fbm(vec2(ang * 6.4 + 31.0, r * 10.0 - uTime * 0.85));
        float flame = smoothstep(0.32, 0.9, teeth + lick * 0.45);

        // the photosphere sits at r≈0.5 of this plane — the band rises right
        // at the limb and the flames push its feathered outer edge
        float inner = smoothstep(0.465, 0.53, r);
        float outer = 1.0 - smoothstep(0.54 + flame * 0.26, 0.9, r);
        float body  = inner * outer;

        // hot at the limb → ember at the tips, saturated so it reads as fire
        vec3 hot   = vec3(1.0, 0.76, 0.38);
        vec3 ember = vec3(0.92, 0.3, 0.05);
        vec3 col   = mix(hot, ember, smoothstep(0.5, 0.82, r));

        float alpha = body * (0.05 + 0.58 * flame) * uFade;
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `,
  });
}
