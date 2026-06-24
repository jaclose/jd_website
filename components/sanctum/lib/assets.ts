import * as THREE from "three";
import { useGLTF, useTexture } from "@react-three/drei";
import { useMemo } from "react";

/**
 * Sanctum asset layer. Every model/texture here is CC0 (Poly Haven + ambientCG;
 * see public/sanctum/CREDITS.md), fetched and optimised by
 * scripts-style scratch pipeline into draco-compressed GLBs + webp PBR sets.
 *
 * Decoders are self-hosted under /sanctum/decoders so loading never depends on
 * a CDN. The loader is wired for Draco today and is KTX2-ready (basis decoder
 * is shipped) so textures can be upgraded to GPU-compressed without code change.
 */

export const DRACO_PATH = "/sanctum/decoders/draco/";
const base = "/sanctum/";

export type ModelKey =
  | "tree_broadleaf"
  | "sapling_conifer"
  | "fern"
  | "branch"
  | "deadwood"
  | "rock"
  | "plant"
  | "apple"
  | "flower"
  | "log";

export const MODEL_URL: Record<ModelKey, string> = {
  tree_broadleaf: base + "models/tree_broadleaf.glb",
  sapling_conifer: base + "models/sapling_conifer.glb",
  fern: base + "models/fern.glb",
  branch: base + "models/branch.glb",
  deadwood: base + "models/deadwood.glb",
  rock: base + "models/rock.glb",
  plant: base + "models/plant.glb",
  apple: base + "models/apple.glb",
  flower: base + "models/flower.glb",
  log: base + "models/log.glb",
};

export type TerrainKey = "path" | "floor" | "moss" | "bark" | "stone";

export const TERRAIN_TEX: Record<TerrainKey, { color: string; normal: string; rough: string }> = {
  path: { color: base + "textures/path_color.webp", normal: base + "textures/path_normal.webp", rough: base + "textures/path_rough.webp" },
  floor: { color: base + "textures/floor_color.webp", normal: base + "textures/floor_normal.webp", rough: base + "textures/floor_rough.webp" },
  moss: { color: base + "textures/moss_color.webp", normal: base + "textures/moss_normal.webp", rough: base + "textures/moss_rough.webp" },
  bark: { color: base + "textures/bark_color.webp", normal: base + "textures/bark_normal.webp", rough: base + "textures/bark_rough.webp" },
  stone: { color: base + "textures/stone_color.webp", normal: base + "textures/stone_normal.webp", rough: base + "textures/stone_rough.webp" },
};

export const HDRI_FOREST = base + "hdri/env_forest.hdr";

/** which assets each zone needs — drives lazy preloading per zone. */
export const ZONE_ASSETS: Record<"room" | "threshold" | "sanctum", ModelKey[]> = {
  room: ["deadwood", "plant"],
  threshold: ["plant", "fern", "branch"],
  sanctum: ["tree_broadleaf", "sapling_conifer", "fern", "branch", "deadwood", "rock", "plant", "apple", "flower", "log"],
};

/* ————— loading ————— */

export function useSanctumModel(key: ModelKey) {
  return useGLTF(MODEL_URL[key], DRACO_PATH);
}

export function preloadModels(keys: ModelKey[]) {
  for (const k of keys) useGLTF.preload(MODEL_URL[k], DRACO_PATH);
}

export function preloadZone(zone: "room" | "threshold" | "sanctum") {
  preloadModels(ZONE_ASSETS[zone]);
}

/** A single instanceable primitive pulled out of a GLB (geometry + material). */
export interface Primitive {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  /** material/mesh name — used to decide which primitives flutter as leaves. */
  name: string;
  /** true when the primitive reads as foliage (leaf cards / canopy). */
  foliage: boolean;
}

const FOLIAGE_HINT = /(leaf|leaves|branch|canop|frond|needle|foliage|grass)/i;

/**
 * Flatten a loaded GLB into world-baked primitives ready for instancing. World
 * transforms are pre-applied so a single instanceMatrix per placement positions
 * every primitive of a multi-material model in lockstep. Materials are cloned so
 * per-zone tweaks (wind, tint) never leak back into the cached gltf.
 */
export function useModelPrimitives(key: ModelKey): Primitive[] {
  const { scene } = useSanctumModel(key);
  return useMemo(() => {
    const out: Primitive[] = [];
    scene.updateWorldMatrix(true, true);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const geo = m.geometry.clone();
      geo.applyMatrix4(m.matrixWorld);
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      // multi-material meshes keep groups; instance the merged geometry per group
      mats.forEach((mat, gi) => {
        const g = mats.length > 1 ? sliceGroup(geo, gi) : geo;
        const name = (mat.name || m.name || key) as string;
        out.push({
          geometry: g,
          material: (mat as THREE.Material).clone(),
          name,
          foliage: FOLIAGE_HINT.test(name) || FOLIAGE_HINT.test(m.name),
        });
      });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, key]);
}

/** extract a single material-group of a geometry into its own buffer geometry. */
function sliceGroup(geo: THREE.BufferGeometry, groupIndex: number): THREE.BufferGeometry {
  const group = geo.groups[groupIndex];
  if (!group) return geo;
  const g = geo.clone();
  g.clearGroups();
  if (geo.index) {
    const arr = geo.index.array.slice(group.start, group.start + group.count);
    g.setIndex(new THREE.BufferAttribute(arr as unknown as Uint32Array, 1));
  }
  return g;
}

/** drei useTexture wrapper that sets sRGB on color, tiling + repeat on all. */
export function useTerrain(key: TerrainKey, repeat = 1) {
  const t = TERRAIN_TEX[key];
  const maps = useTexture({ map: t.color, normalMap: t.normal, roughnessMap: t.rough });
  return useMemo(() => {
    const { map, normalMap, roughnessMap } = maps as unknown as {
      map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture;
    };
    map.colorSpace = THREE.SRGBColorSpace;
    for (const tex of [map, normalMap, roughnessMap]) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      tex.anisotropy = 8;
    }
    return { map, normalMap, roughnessMap };
  }, [maps, repeat]);
}
