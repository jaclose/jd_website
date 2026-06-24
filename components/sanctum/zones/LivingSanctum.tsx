"use client";
import { Suspense, useMemo } from "react";
import { gardenFeatures } from "@/data/gardenFeatures";
import InstancedModel, { type Placement } from "../SanctumFoliage";
import SanctumEnvironment from "../SanctumEnvironment";
import SanctumFireflies from "../SanctumFireflies";
import SanctumLandmark from "../SanctumLandmark";
import type { ModelKey } from "../lib/assets";
import { mulberry32 } from "../lib/rng";
import { scatter, type ScatterPoint } from "../lib/terrain";
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
  const gc = config.groundCover;

  const trees = useMemo(() => toPlacements(scatter(config.heroTreeCount, 31, 3.2), 0.5, 0.95, 11), [config.heroTreeCount]);
  const saplings = useMemo(() => toPlacements(scatter(Math.round(gc * 0.35), 47, 2.2), 1.1, 2.4, 23), [gc]);
  const ferns = useMemo(() => toPlacements(scatter(gc, 53, 0.8), 0.8, 1.5, 29), [gc]);
  const plants = useMemo(() => toPlacements(scatter(Math.round(gc * 0.6), 61, 1.0), 0.6, 1.2, 37), [gc]);
  const branches = useMemo(() => toPlacements(scatter(Math.round(gc * 0.3), 67, 0.6), 0.7, 1.3, 41), [gc]);
  const deadwood = useMemo(() => toPlacements(scatter(Math.round(gc * 0.12), 71, 3.0), 0.6, 1.0, 43), [gc]);
  const rocks = useMemo(() => toPlacements(scatter(Math.round(gc * 0.45), 79, 0.5), 0.4, 1.1, 47), [gc]);

  return (
    <group>
      {/* terrain/sky/grass stream independently of the heavier GLB foliage, so a
          slow species never blanks the ground the camera is standing on. */}
      <Suspense fallback={null}>
        <SanctumEnvironment config={config} />
      </Suspense>

      <FoliageLayer model="tree_broadleaf" placements={trees} foliageWind windAmount={1} tint="#cdb98f" />
      <FoliageLayer model="sapling_conifer" placements={saplings} foliageWind windAmount={1.2} />
      <FoliageLayer model="fern" placements={ferns} foliageWind windAmount={1.4} castShadow={false} />
      <FoliageLayer model="plant" placements={plants} foliageWind windAmount={1.3} castShadow={false} />
      <FoliageLayer model="branch" placements={branches} foliageWind={false} castShadow={false} />
      <FoliageLayer model="deadwood" placements={deadwood} foliageWind={false} />
      <FoliageLayer model="rock" placements={rocks} foliageWind={false} />

      <Suspense fallback={null}>
        {gardenFeatures.map((f) => (
          <SanctumLandmark key={f.id} feature={f} onSelect={onInspect} lowFx={lowFx} />
        ))}
      </Suspense>

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
  "branch",
  "deadwood",
  "rock",
  "apple",
];
