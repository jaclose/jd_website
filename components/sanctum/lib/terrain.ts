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

/* ————— deterministic value-noise FBM for the landform ————— */
function hash2(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function vnoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return (a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz) * 2 - 1;
}

function fbm(x: number, z: number, octaves = 3): number {
  let amp = 0.5;
  let f = 1;
  let sum = 0;
  for (let i = 0; i < octaves; i++) {
    sum += vnoise(x * f, z * f) * amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return sum;
}

/** rolling elevation — domain-warped FBM for an open, Skellige-ish landform:
 *  broad warped swells (no visible sine tiling), mid mounds, fine surface
 *  detail, kept flat on the trail so footing reads true. The flatten band is
 *  wide so banks rise *gradually* away from the path — rolling country, not a
 *  trench — with an extra bank lift so the trail sits cradled in the land. */
export function groundHeight(x: number, z: number): number {
  // warp the broad frequency so hills stop looking like a wave grid
  const wx = x + fbm(x * 0.021 + 7.3, z * 0.021) * 16;
  const wz = z + fbm(x * 0.021, z * 0.021 + 3.1) * 16;
  const broad = fbm(wx * 0.013, wz * 0.013, 3) * 3.0;
  const mid = fbm(x * 0.055 + 11.7, z * 0.055, 3) * 0.75;
  const fine = vnoise(x * 0.33, z * 0.33) * 0.12;
  const roll = broad + mid + fine;
  const trail = distanceToTrail(x, z);
  const flatten = THREE.MathUtils.smoothstep(trail, 0.0, 9.0); // gradual rise over 9m → open banks
  // gentle positive bank lift so off-trail ground reads as rising meadow
  const bank = THREE.MathUtils.smoothstep(trail, 2.0, 16.0) * 0.9;
  return roll * flatten + bank;
}

/**
 * Points strung along the trail edges — for border rocks, waymarkers, and
 * stepping stones. `offset` is the signed perpendicular distance from the
 * centreline (0 = on the path), `spacing` the along-trail interval; everything
 * jitters deterministically per seed so the line never reads machine-laid.
 */
export function trailLineScatter(
  spacing: number,
  offset: number,
  seed: number,
  jitter = 0.4,
): ScatterPoint[] {
  const rnd = mulberry32(seed);
  const out: ScatterPoint[] = [];
  for (const [a, b] of TRAIL_EDGES) {
    const len = a.distanceTo(b);
    const steps = Math.max(1, Math.floor(len / spacing));
    const dirX = (b.x - a.x) / len;
    const dirZ = (b.y - a.y) / len;
    // perpendicular (left of travel)
    const nx = -dirZ;
    const nz = dirX;
    for (let i = 0; i <= steps; i++) {
      const t = (i + (rnd() - 0.5) * 0.5) / steps;
      if (t < 0 || t > 1) continue;
      const off = offset + (rnd() - 0.5) * 2 * jitter;
      const x = a.x + (b.x - a.x) * t + nx * off;
      const z = a.y + (b.y - a.y) * t + nz * off;
      out.push({ x, z, y: groundHeight(x, z), rnd: rnd() });
    }
  }
  return out;
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
