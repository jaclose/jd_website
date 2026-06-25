import * as THREE from "three";
import type { Zone } from "./journey";

/**
 * Per-zone lighting & atmosphere moods — the story told in light. The room is
 * cold screen-blue with a crimson warning ember and crushed shadows; the
 * threshold mixes that cool interior against warm light pulling from outside; the
 * Living Sanctum is muted gold sun over deep-navy shadow and earthy green. Both
 * SanctumLighting and SanctumFog ease their live values toward the active zone's
 * mood so moving between zones crossfades rather than cuts.
 */
export interface Mood {
  keyColor: THREE.Color;
  keyIntensity: number;
  keyPos: THREE.Vector3;
  fillColor: THREE.Color;
  fillIntensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  ambient: THREE.Color;
  ambientIntensity: number;
  fogColor: THREE.Color;
  fogNear: number;
  fogFar: number;
  envIntensity: number;
  background: THREE.Color;
}

const c = (hex: string) => new THREE.Color(hex);
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const MOODS: Record<Zone, Mood> = {
  room: {
    keyColor: c("#7796c4"), // cold screen-blue practical, leaking from the doorway
    keyIntensity: 1.0,
    keyPos: v(-3, 5, 20), // inside the room now, raking the interior
    fillColor: c("#3f5c86"), // cool bounce so walls/desk read as a real space
    fillIntensity: 0.6,
    hemiSky: c("#3d4e66"),
    hemiGround: c("#101319"),
    hemiIntensity: 0.95,
    ambient: c("#232c3c"),
    ambientIntensity: 1.35,
    fogColor: c("#0c1019"),
    fogNear: 3,
    fogFar: 30,
    envIntensity: 0.14,
    background: c("#070a11"),
  },
  threshold: {
    keyColor: c("#e8b878"), // warm light winning from outside
    keyIntensity: 1.1,
    keyPos: v(-6, 10, -12),
    fillColor: c("#5d7fb0"), // cool interior receding
    fillIntensity: 0.35,
    hemiSky: c("#5a6f7e"),
    hemiGround: c("#1a160f"),
    hemiIntensity: 0.4,
    ambient: c("#1d2230"),
    ambientIntensity: 0.3,
    fogColor: c("#2a2a2e"),
    fogNear: 4,
    fogFar: 40,
    envIntensity: 0.35,
    background: c("#1a1c20"),
  },
  sanctum: {
    keyColor: c("#f0d29a"), // muted gold dawn sun
    keyIntensity: 1.35,
    keyPos: v(-16, 22, -18),
    fillColor: c("#7fa0c4"), // cool sky bounce
    fillIntensity: 0.3,
    hemiSky: c("#8aa2b2"),
    hemiGround: c("#1c2818"), // earthy green/soil
    hemiIntensity: 0.5,
    ambient: c("#222a34"),
    ambientIntensity: 0.22,
    fogColor: c("#8a9c92"),
    fogNear: 9,
    fogFar: 74,
    envIntensity: 0.5,
    background: c("#8fa093"),
  },
};

/** mutate `out` to mood A lerped toward mood B by t (0..1). */
export function lerpMood(out: Mood, a: Mood, b: Mood, t: number): Mood {
  out.keyColor.copy(a.keyColor).lerp(b.keyColor, t);
  out.keyIntensity = THREE.MathUtils.lerp(a.keyIntensity, b.keyIntensity, t);
  out.keyPos.copy(a.keyPos).lerp(b.keyPos, t);
  out.fillColor.copy(a.fillColor).lerp(b.fillColor, t);
  out.fillIntensity = THREE.MathUtils.lerp(a.fillIntensity, b.fillIntensity, t);
  out.hemiSky.copy(a.hemiSky).lerp(b.hemiSky, t);
  out.hemiGround.copy(a.hemiGround).lerp(b.hemiGround, t);
  out.hemiIntensity = THREE.MathUtils.lerp(a.hemiIntensity, b.hemiIntensity, t);
  out.ambient.copy(a.ambient).lerp(b.ambient, t);
  out.ambientIntensity = THREE.MathUtils.lerp(a.ambientIntensity, b.ambientIntensity, t);
  out.fogColor.copy(a.fogColor).lerp(b.fogColor, t);
  out.fogNear = THREE.MathUtils.lerp(a.fogNear, b.fogNear, t);
  out.fogFar = THREE.MathUtils.lerp(a.fogFar, b.fogFar, t);
  out.envIntensity = THREE.MathUtils.lerp(a.envIntensity, b.envIntensity, t);
  out.background.copy(a.background).lerp(b.background, t);
  return out;
}

export function cloneMood(m: Mood): Mood {
  return {
    keyColor: m.keyColor.clone(),
    keyIntensity: m.keyIntensity,
    keyPos: m.keyPos.clone(),
    fillColor: m.fillColor.clone(),
    fillIntensity: m.fillIntensity,
    hemiSky: m.hemiSky.clone(),
    hemiGround: m.hemiGround.clone(),
    hemiIntensity: m.hemiIntensity,
    ambient: m.ambient.clone(),
    ambientIntensity: m.ambientIntensity,
    fogColor: m.fogColor.clone(),
    fogNear: m.fogNear,
    fogFar: m.fogFar,
    envIntensity: m.envIntensity,
    background: m.background.clone(),
  };
}
