import * as THREE from "three";
import { journeyNodes } from "./journey";
import { mulberry32 } from "./rng";

/**
 * Terrain & trail helpers for the Living Sanctum. The path is the primary
 * interface, so the world is built *around* the trail graph: a ribbon mesh is
 * extruded along the journey edges, and foliage scatter is rejected near the
 * trail so the path always reads as open, walkable, and leads the eye.
 */

/** the playable ground footprint, centred on the trail network. */
export const SANCTUM_BOUNDS = { minX: -34, maxX: 34, minZ: -74, maxZ: 12 };

/** trail edges in the sanctum (+ the threshold→start approach). 2D [x,z] pairs. */
export const TRAIL_EDGES: [THREE.Vector2, THREE.Vector2][] = (() => {
  const inZone = new Set(
    journeyNodes.filter((n) => n.zone === "sanctum" || n.id === "threshold").map((n) => n.id),
  );
  const edges: [THREE.Vector2, THREE.Vector2][] = [];
  for (const n of journeyNodes) {
    if (!inZone.has(n.id)) continue;
    const a = new THREE.Vector2(n.position[0], n.position[2]);
    for (const nx of n.nextNodes) {
      if (!inZone.has(nx)) continue;
      const b = journeyNodes.find((m) => m.id === nx)!;
      edges.push([a, new THREE.Vector2(b.position[0], b.position[2])]);
    }
  }
  return edges;
})();

const _p = new THREE.Vector2();
const _ab = new THREE.Vector2();
const _ap = new THREE.Vector2();

/** shortest 2D distance from (x,z) to any trail segment. */
export function distanceToTrail(x: number, z: number): number {
  _p.set(x, z);
  let min = Infinity;
  for (const [a, b] of TRAIL_EDGES) {
    _ab.subVectors(b, a);
    _ap.subVectors(_p, a);
    const t = THREE.MathUtils.clamp(_ap.dot(_ab) / Math.max(_ab.lengthSq(), 1e-6), 0, 1);
    const d = _ap.distanceToSquared(_ab.multiplyScalar(t));
    if (d < min) min = d;
  }
  return Math.sqrt(min);
}

/** subtle rolling elevation — kept near-flat on the trail so footing reads true. */
export function groundHeight(x: number, z: number): number {
  const roll = Math.sin(x * 0.06) * Math.cos(z * 0.05) * 0.9 + Math.sin(z * 0.13 + 1.0) * 0.4;
  const trail = distanceToTrail(x, z);
  const flatten = THREE.MathUtils.smoothstep(trail, 0.0, 4.0); // 0 on trail → 1 away
  return roll * flatten;
}

export interface ScatterPoint {
  x: number;
  z: number;
  y: number;
  rnd: number;
}

/**
 * Reject-sampled scatter within bounds, biased away from the trail by `clearance`
 * and `density` falloff so the woods thicken off-path. Deterministic per seed.
 */
export function scatter(
  count: number,
  seed: number,
  clearance = 1.4,
  maxRadius = 40,
): ScatterPoint[] {
  const rnd = mulberry32(seed);
  const out: ScatterPoint[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    const x = THREE.MathUtils.lerp(SANCTUM_BOUNDS.minX, SANCTUM_BOUNDS.maxX, rnd());
    const z = THREE.MathUtils.lerp(SANCTUM_BOUNDS.minZ, SANCTUM_BOUNDS.maxZ, rnd());
    const d = distanceToTrail(x, z);
    if (d < clearance) continue;
    if (Math.hypot(x, z + 30) > maxRadius + 30) continue;
    // denser further from the trail, thinner right at the edge
    if (rnd() > THREE.MathUtils.smoothstep(d, clearance, clearance + 5)) continue;
    out.push({ x, z, y: groundHeight(x, z), rnd: rnd() });
  }
  return out;
}

/** ribbon mesh extruded along the trail edges, for the worn dirt path. */
export function buildTrailRibbon(width = 2.6): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  for (const [a, b] of TRAIL_EDGES) {
    const dir = new THREE.Vector2().subVectors(b, a);
    const len = dir.length();
    if (len < 0.01) continue;
    dir.normalize();
    const normal = new THREE.Vector2(-dir.y, dir.x).multiplyScalar(width / 2);
    const seg = 6;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      const cx = THREE.MathUtils.lerp(a.x, b.x, t);
      const cz = THREE.MathUtils.lerp(a.y, b.y, t);
      const lx = cx + normal.x;
      const lz = cz + normal.y;
      const rx = cx - normal.x;
      const rz = cz - normal.y;
      pos.push(lx, groundHeight(lx, lz) + 0.02, lz, rx, groundHeight(rx, rz) + 0.02, rz);
      uv.push(0, t * len * 0.35, 1, t * len * 0.35);
    }
    for (let i = 0; i < seg; i++) {
      const o = i * 2;
      idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    geos.push(g);
  }
  return mergeGeometries(geos);
}

/** minimal geometry merge (positions/uv/normal/index) — avoids a BufferGeometryUtils import. */
function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  const pos: number[] = [];
  const uv: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  let offset = 0;
  for (const g of geos) {
    const p = g.getAttribute("position");
    const u = g.getAttribute("uv");
    const n = g.getAttribute("normal");
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      uv.push(u.getX(i), u.getY(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
    }
    const index = g.getIndex();
    if (index) for (let i = 0; i < index.count; i++) idx.push(index.getX(i) + offset);
    offset += p.count;
  }
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  out.setIndex(idx);
  return out;
}
