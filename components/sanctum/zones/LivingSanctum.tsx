"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { gardenFeatures } from "@/data/gardenFeatures";
import InstancedModel, { type Placement } from "../SanctumFoliage";
import SanctumColliders from "../SanctumColliders";
import SanctumEnvironment from "../SanctumEnvironment";
import SanctumFireflies from "../SanctumFireflies";
import SanctumGuide from "../SanctumGuide";
import SanctumLandmark from "../SanctumLandmark";
import SanctumSecrets from "../SanctumSecrets";
import type { ModelKey } from "../lib/assets";
import { mulberry32 } from "../lib/rng";
import { groundHeight, scatter, trailLineScatter, type ScatterPoint } from "../lib/terrain";
import type { QualityConfig } from "../SanctumQualityManager";

/**
 * Zone 3 — the restored outdoor world. The cultivated forest the trail moves
 * through: layered CC0 vegetation (hero trees, conifer saplings, ferns, plants,
 * fallen branches, deadwood, rocks) scattered off the path over the sculpted
 * ground, the life-chapter landmarks anchored at their feature positions, and
 * drifting fireflies. "Not a victory lap — the decision to keep tending."
 */
export default function LivingSanctum({
  config,
  onInspect,
  lowFx = false,
}: {
  config: QualityConfig;
  onInspect: (id: string) => void;
  lowFx?: boolean;
}) {
  // denser understory — gc is the per-tier ground-cover budget
  const gc = Math.round(config.groundCover * 1.5);

  const trees = useMemo(() => toPlacements(scatter(config.heroTreeCount, 31, 3.2), 0.5, 0.95, 11), [config.heroTreeCount]);
  const saplings = useMemo(() => toPlacements(scatter(Math.round(gc * 0.35), 47, 2.2), 1.1, 2.4, 23), [gc]);
  const ferns = useMemo(() => toPlacements(scatter(Math.round(gc * 1.2), 53, 0.8), 0.8, 1.5, 29), [gc]);
  const plants = useMemo(() => toPlacements(scatter(Math.round(gc * 0.6), 61, 1.0), 0.6, 1.2, 37), [gc]);
  const flowers = useMemo(() => toPlacements(scatter(Math.round(gc * 0.5), 83, 0.7), 0.6, 1.3, 53), [gc]);
  const branches = useMemo(() => toPlacements(scatter(Math.round(gc * 0.3), 67, 0.6), 0.7, 1.3, 41), [gc]);
  const deadwood = useMemo(() => toPlacements(scatter(Math.round(gc * 0.12), 71, 3.0), 0.6, 1.0, 43), [gc]);
  const logs = useMemo(() => toPlacements(scatter(Math.round(gc * 0.1), 89, 2.6), 0.7, 1.1, 59), [gc]);
  const rocks = useMemo(() => toPlacements(scatter(Math.round(gc * 0.45), 79, 0.5), 0.4, 1.1, 47), [gc]);
  // small border stones lining both trail shoulders — the path reads as *kept*
  const borderRocks = useMemo(
    () => [
      ...toPlacements(trailLineScatter(3.1, 2.0, 3301, 0.35), 0.16, 0.4, 71),
      ...toPlacements(trailLineScatter(3.4, -2.0, 3407, 0.35), 0.16, 0.4, 73),
    ],
    [],
  );

  return (
    <group>
      {/* BVH terrain collider + obstacle list for ground-conform & free-walk */}
      <SanctumColliders config={config} />

      {/* terrain/sky/grass stream independently of the heavier GLB foliage, so a
          slow species never blanks the ground the camera is standing on. */}
      <Suspense fallback={null}>
        <SanctumEnvironment config={config} />
      </Suspense>

      <LeafLitter count={Math.round(gc * 1.6)} />

      <FoliageLayer model="tree_broadleaf" placements={trees} foliageWind windAmount={1} tint="#cdb98f" />
      <FoliageLayer model="sapling_conifer" placements={saplings} foliageWind windAmount={1.2} />
      <FoliageLayer model="fern" placements={ferns} foliageWind windAmount={1.4} castShadow={false} />
      <FoliageLayer model="plant" placements={plants} foliageWind windAmount={1.3} castShadow={false} />
      <FoliageLayer model="flower" placements={flowers} foliageWind windAmount={1.5} castShadow={false} />
      <FoliageLayer model="branch" placements={branches} foliageWind={false} castShadow={false} />
      <FoliageLayer model="deadwood" placements={deadwood} foliageWind={false} />
      <FoliageLayer model="log" placements={logs} foliageWind={false} />
      <FoliageLayer model="rock" placements={rocks} foliageWind={false} />
      <FoliageLayer model="rock" placements={borderRocks} foliageWind={false} castShadow={false} />

      <Suspense fallback={null}>
        {gardenFeatures.map((f) => (
          <SanctumLandmark key={f.id} feature={f} onSelect={onInspect} lowFx={lowFx} />
        ))}
      </Suspense>

      {/* the four quiet things, hidden off the trail */}
      <SanctumSecrets />
      {/* the tracked quest's beacon + leading chevron */}
      <SanctumGuide />

      <SanctumFireflies count={config.fireflyCount} />
      {/* a cooler cluster by the Noctyrium greenhouse */}
      <SanctumFireflies
        count={Math.round(config.fireflyCount * 0.3)}
        color="#9fd8e8"
        seed={808}
        region={{ x: 4, zNear: -10, zFar: -15, yMin: 0.6, yMax: 3 }}
      />
    </group>
  );
}

/** each species gets its own Suspense so one slow/missing asset never blanks the
 *  others (or the terrain) — it just pops in when ready. */
function FoliageLayer(props: Parameters<typeof InstancedModel>[0]) {
  if (!props.placements.length) return null;
  return (
    <Suspense fallback={null}>
      <InstancedModel {...props} />
    </Suspense>
  );
}

/** flat instanced leaf-litter patches scattered over the floor for ground detail. */
function LeafLitter({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const geom = useMemo(() => {
    const g = new THREE.CircleGeometry(0.5, 5);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, transparent: true, opacity: 0.9 }),
    [],
  );
  useEffect(() => {
    const pts = scatter(count, 137, 0.3);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const rnd = mulberry32(321);
    const tones = [new THREE.Color("#4a3a24"), new THREE.Color("#3a3320"), new THREE.Color("#2e3a22"), new THREE.Color("#5a4326")];
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const p = pts[i] ?? { x: 0, z: 0, y: 0 };
      const s = 0.5 + rnd() * 1.3;
      q.setFromAxisAngle(up, rnd() * Math.PI * 2);
      m.compose(new THREE.Vector3(p.x, groundHeight(p.x, p.z) + 0.015, p.z), q, new THREE.Vector3(s, 1, s * (0.7 + rnd() * 0.5)));
      ref.current.setMatrixAt(i, m);
      c.copy(tones[Math.floor(rnd() * tones.length)]).offsetHSL(0, 0, (rnd() - 0.5) * 0.06);
      ref.current.setColorAt(i, c);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [count, geom]);
  if (count <= 0) return null;
  return <instancedMesh ref={ref} args={[geom, mat, count]} receiveShadow frustumCulled={false} />;
}

function toPlacements(points: ScatterPoint[], min: number, max: number, seed: number): Placement[] {
  const rnd = mulberry32(seed);
  return points.map((p) => ({
    position: [p.x, p.y, p.z] as [number, number, number],
    scale: min + rnd() * (max - min),
    rotationY: rnd() * Math.PI * 2,
  }));
}

// help the loader prefetch the species this zone needs
export const SANCTUM_MODELS: ModelKey[] = [
  "tree_broadleaf",
  "sapling_conifer",
  "fern",
  "plant",
  "flower",
  "branch",
  "deadwood",
  "log",
  "rock",
  "apple",
];
