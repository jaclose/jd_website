"use client";
import * as THREE from "three";

/**
 * Shared lighting patches for the hero system (spec 12 · F2). One rule: the
 * sun is the only light that matters. Every patched material reads the same
 * two live values —
 *   sunWorld  — the star's world position, written by <Sun/> each frame
 *   sceneLife — 1 while the system flies free, easing to 0 as it docks
 * — through shared uniform objects, so no per-frame copying is needed.
 */

export const sunWorld = new THREE.Vector3();
export const sceneLife = { value: 1 };

export interface PlanetPatchOpts {
  /** wrap-light strength: soft scattered light carrying past the terminator */
  wrap?: number;
  /** night-side settlement lights, 0..1 (0 = none) */
  nightLights?: number;
  nightColor?: string;
}

/**
 * Day/night behaviour for a textured world: a wrap term that softens the
 * terminator (the hard lambert cut reads as plastic at this scale), and an
 * optional speckle of warm lights that only shows on the night side.
 */
export function patchPlanetMaterial(
  mat: THREE.MeshStandardMaterial,
  opts: PlanetPatchOpts = {}
): THREE.MeshStandardMaterial {
  const wrap = opts.wrap ?? 0.16;
  const nightLights = opts.nightLights ?? 0;
  const uniforms = {
    uSunPos: { value: sunWorld },
    uLife: sceneLife,
    uWrap: { value: wrap },
    uNightGlow: { value: nightLights },
    uNightColor: { value: new THREE.Color(opts.nightColor ?? "#ffd9a0") },
  };
  if (nightLights > 0) mat.defines = { ...mat.defines, JD_NIGHT_LIGHTS: "" };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vJdWorldPos;\nvarying vec3 vJdWorldNormal;\nvarying vec2 vJdUv;"
      )
      .replace(
        "#include <fog_vertex>",
        [
          "#include <fog_vertex>",
          "vJdWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;",
          "vJdWorldNormal = normalize(mat3(modelMatrix) * objectNormal);",
          "vJdUv = uv;",
        ].join("\n")
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        [
          "#include <common>",
          "varying vec3 vJdWorldPos;",
          "varying vec3 vJdWorldNormal;",
          "varying vec2 vJdUv;",
          "uniform vec3 uSunPos;",
          "uniform float uLife;",
          "uniform float uWrap;",
          "uniform float uNightGlow;",
          "uniform vec3 uNightColor;",
        ].join("\n")
      )
      .replace(
        "#include <emissivemap_fragment>",
        [
          "#include <emissivemap_fragment>",
          "{",
          "  vec3 jdN = normalize(vJdWorldNormal);",
          "  float jdDay = dot(jdN, normalize(uSunPos - vJdWorldPos));",
          "  float jdTerm = smoothstep(-0.45, 0.15, jdDay) * (1.0 - smoothstep(0.15, 0.75, jdDay));",
          "  totalEmissiveRadiance += diffuseColor.rgb * (uWrap * jdTerm * uLife);",
          "#ifdef JD_NIGHT_LIGHTS",
          "  float jdNight = smoothstep(0.08, -0.22, jdDay);",
          "  vec2 jdCell = floor(vJdUv * vec2(170.0, 85.0));",
          "  float jdH = fract(sin(dot(jdCell, vec2(127.1, 311.7))) * 43758.5453);",
          "  float jdLit = step(0.972, jdH);",
          "  float jdBelt = smoothstep(0.1, 0.24, vJdUv.y) * (1.0 - smoothstep(0.76, 0.9, vJdUv.y));",
          "  totalEmissiveRadiance += uNightColor * (jdLit * jdBelt * jdNight * uNightGlow * uLife);",
          "#endif",
          "}",
        ].join("\n")
      );
  };
  mat.customProgramCacheKey = () => `jd-planet-${nightLights > 0 ? "night" : "plain"}`;
  return mat;
}

/**
 * Ring light response: the sun-facing arc brightens, the far arc recedes,
 * and the sliver directly behind the planet falls into its shadow. Returns
 * the uniforms so the owner can feed the planet's position each frame.
 */
export function patchRingScatter(mat: THREE.MeshBasicMaterial) {
  const uniforms = {
    uSunPos: { value: sunWorld },
    uPlanetPos: { value: new THREE.Vector3() },
    uLife: sceneLife,
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vJdWorldPos;")
      .replace(
        "#include <fog_vertex>",
        "#include <fog_vertex>\nvJdWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;"
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vJdWorldPos;\nuniform vec3 uSunPos;\nuniform vec3 uPlanetPos;\nuniform float uLife;"
      )
      .replace(
        "#include <map_fragment>",
        [
          "#include <map_fragment>",
          "{",
          "  vec3 jdOut = normalize(vJdWorldPos - uPlanetPos);",
          "  vec3 jdToSun = normalize(uSunPos - uPlanetPos);",
          "  float jdLit = 0.62 + 0.5 * smoothstep(-0.7, 0.9, dot(jdOut, jdToSun));",
          "  float jdShadow = 1.0 - 0.55 * smoothstep(0.8, 0.96, dot(jdOut, -jdToSun));",
          "  diffuseColor.rgb *= mix(1.0, jdLit * jdShadow, uLife);",
          "}",
        ].join("\n")
      );
  };
  mat.customProgramCacheKey = () => "jd-ring-scatter";
  return uniforms;
}
