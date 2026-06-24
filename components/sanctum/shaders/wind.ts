import * as THREE from "three";

/**
 * Shared wind state for every swaying thing in Sanctum. One clock, one wind
 * vector — driven once per frame by `SanctumWindSystem`. Each foliage material
 * wires its shader uniforms to *these same references* (via `onBeforeCompile`)
 * so grass, leaves, branches and vines all read the same gust but respond on
 * their own frequency. Keeping the refs module-level keeps setState out of the
 * frame loop (the architecture invariant the hero scene also follows).
 */
export const windUniforms = {
  uTime: { value: 0 },
  /** ground-plane wind direction (x,z), unit-ish */
  uWindDir: { value: new THREE.Vector2(0.82, 0.34) },
  /** base wind strength, scaled per quality tier */
  uWindStrength: { value: 1 },
  /** 0..1 slow gust envelope, also driven by SanctumWindSystem */
  uGust: { value: 0 },
};

export type WindUniforms = typeof windUniforms;

/** cheap value-noise + fbm, good enough for organic wind/drift, very fast. */
export const GLSL_NOISE = /* glsl */ `
  float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }
  float hash31(vec3 p){ p = fract(p*0.1031); p += dot(p, p.yzx+33.33); return fract((p.x+p.y)*p.z); }
  float vnoise(vec3 x){
    vec3 i = floor(x); vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n000 = hash31(i+vec3(0,0,0)); float n100 = hash31(i+vec3(1,0,0));
    float n010 = hash31(i+vec3(0,1,0)); float n110 = hash31(i+vec3(1,1,0));
    float n001 = hash31(i+vec3(0,0,1)); float n101 = hash31(i+vec3(1,0,1));
    float n011 = hash31(i+vec3(0,1,1)); float n111 = hash31(i+vec3(1,1,1));
    float nx00 = mix(n000,n100,f.x); float nx10 = mix(n010,n110,f.x);
    float nx01 = mix(n001,n101,f.x); float nx11 = mix(n011,n111,f.x);
    return mix(mix(nx00,nx10,f.y), mix(nx01,nx11,f.y), f.z);
  }
  float fbm(vec3 x){
    float v = 0.0, a = 0.5;
    for(int i=0;i<3;i++){ v += a*vnoise(x); x *= 2.02; a *= 0.5; }
    return v;
  }
`;

/**
 * Patch a built-in three material's vertex shader. Returns a cleanup-free
 * material; safe to call once per material. `glslHeader` is injected after
 * `#include <common>` and `glslDisplace` after `#include <begin_vertex>` (it
 * may mutate `transformed` and read `uTime/uWindDir/uWindStrength/uGust`).
 */
export function injectWind(
  mat: THREE.Material,
  glslHeader: string,
  glslDisplace: string,
) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uWindDir = windUniforms.uWindDir;
    shader.uniforms.uWindStrength = windUniforms.uWindStrength;
    shader.uniforms.uGust = windUniforms.uGust;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uTime;
         uniform vec2 uWindDir;
         uniform float uWindStrength;
         uniform float uGust;
         ${GLSL_NOISE}
         ${glslHeader}`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         ${glslDisplace}`,
      );
  };
  mat.needsUpdate = true;
  return mat;
}
