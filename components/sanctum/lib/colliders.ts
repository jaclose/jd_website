import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import { gardenFeatures } from "@/data/gardenFeatures";
import { groundHeight, SANCTUM_BOUNDS } from "./terrain";
import { scatter } from "./terrain";

/**
 * Collision world for the Living Sanctum. A `three-mesh-bvh` acceleration tree is
 * built over a displaced terrain grid so the camera can ride the real ground
 * surface via a fast downward raycast (instead of floating at a fixed height),
 * and a lightweight analytic obstacle list (hero-tree trunks + landmark bases)
 * lets free-walk movement clamp out of solid objects. Module-level so the camera
 * rig can read it across the R3F boundary, like the other Sanctum stores.
 */
let bvh: MeshBVH | null = null;
let obstacles: { x: number; z: number; r: number }[] = [];
const ray = new THREE.Ray();
const DOWN = new THREE.Vector3(0, -1, 0);

export function buildColliders(heroTreeCount: number) {
  const w = SANCTUM_BOUNDS.maxX - SANCTUM_BOUNDS.minX + 40;
  const d = SANCTUM_BOUNDS.maxZ - SANCTUM_BOUNDS.minZ + 40;
  const cx = (SANCTUM_BOUNDS.minX + SANCTUM_BOUNDS.maxX) / 2;
  const cz = (SANCTUM_BOUNDS.minZ + SANCTUM_BOUNDS.maxZ) / 2;
  const g = new THREE.PlaneGeometry(w, d, 64, 64);
  g.rotateX(-Math.PI / 2);
  g.translate(cx, 0, cz);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setY(i, groundHeight(pos.getX(i), pos.getZ(i)));
  g.computeVertexNormals();
  bvh?.geometry?.dispose?.();
  bvh = new MeshBVH(g);

  // hero-tree trunks (same deterministic scatter the zone uses) + landmark bases
  obstacles = [];
  for (const p of scatter(heroTreeCount, 31, 3.2)) obstacles.push({ x: p.x, z: p.z, r: 0.9 });
  for (const f of gardenFeatures) obstacles.push({ x: f.position[0], z: f.position[2], r: 1.3 });
}

export function collidersReady() {
  return !!bvh;
}

/** ground height at (x,z) via BVH downward raycast, or null if not ready/missed. */
export function sampleGround(x: number, z: number): number | null {
  if (!bvh) return null;
  ray.origin.set(x, 80, z);
  ray.direction.copy(DOWN);
  const hit = bvh.raycastFirst(ray, THREE.DoubleSide) as THREE.Intersection | null;
  return hit ? hit.point.y : null;
}

/** is (x,z) inside a trunk/landmark footprint (+ the walker's radius)? */
export function blocked(x: number, z: number, radius = 0.5): boolean {
  for (const o of obstacles) {
    const dx = x - o.x;
    const dz = z - o.z;
    const rr = o.r + radius;
    if (dx * dx + dz * dz < rr * rr) return true;
  }
  return false;
}

export function disposeColliders() {
  bvh?.geometry?.dispose?.();
  bvh = null;
  obstacles = [];
}
