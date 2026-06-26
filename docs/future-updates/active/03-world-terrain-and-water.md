# 03 — World terrain + stream/water (Witcher 3 · Skellige)

Status: 🟡 Planned · Pri: P2 · Effort: XL · Area: Sanctum (Living Sanctum)
Tracks: "I really like the trees … build out the terrain … use shaders,
procedurally generated tools for nature … fluid mechanics since I want some type
of stream … a very beautiful background … like a Witcher 3 scene in Skellige."

## Goal
Grow the Living Sanctum from "a clearing with trees" into a believable Skellige
vista: rolling terrain with depth, a **running stream** that reads as moving
water, and a layered background (distant ridgelines, sea/fjord, big sky) so the
scene feels like a place, not a stage.

## Why it matters
This is the "AAA studio" ambition made concrete. The trees already land; the
terrain + water + backdrop are what turn it from a demo into a world.

## Current state (in repo)
- [components/sanctum/lib/terrain.ts](../../../components/sanctum/lib/terrain.ts)
  — procedural `groundHeight()`; the heightfield to extend.
- [components/sanctum/shaders/water.ts](../../../components/sanctum/shaders/water.ts)
  — existing procedural water shader (the seed for the stream).
- [components/sanctum/SanctumEnvironment.tsx](../../../components/sanctum/SanctumEnvironment.tsx)
  / `SanctumFog` / `SanctumLighting` — sky, fog, light rig (mood-driven).
- [components/sanctum/SanctumColliders.tsx](../../../components/sanctum/SanctumColliders.tsx)
  + `lib/colliders.ts` — BVH ground sampling the camera already rides.

## Wireframe (Skellige vista, layered)
```
   sky / volumetric clouds ............................  (SanctumEnvironment)
   distant fjord ridgelines (parallax billboards/impostors)
   mid hills — rolling heightfield w/ slope+moisture splat
   ┌─ foreground clearing ───────────────────────────┐
   │   trees (keep)      ~~~ stream ~~~ (flow-map)     │
   │      ░grass░        \____ bank foam (meshline) __/│
   │   path/steps ↑  rocks (CC0 scan)   tide-pool (exists)│
   └──────────────────────────────────────────────────┘
   god-rays through canopy (ultra) · ground AO · DOF on focus
```

## To-do (frames)
**Terrain**
- [ ] Extend `terrain.ts` to FBM + domain warp for rolling hills; expose
      moisture & slope as fields (drive scatter masks in spec 04).
- [ ] Splat-blend terrain materials by slope/height/moisture (grass→rock→sand)
      via `three-custom-shader-material`.
- [ ] Distant ridgelines as parallax impostor billboards (cheap depth).
- [ ] Confirm BVH colliders regenerate from the new heightfield.

**Stream / water (shader "flow", NOT a sim — see deferred D02)**
- [ ] Carve a stream channel into the heightfield; place a flowing water mesh.
- [ ] Flow-map driven scrolling normals + Gerstner ripples in the water shader.
- [ ] Bank foam where water meets terrain (depth-based foam line / meshline).
- [ ] Reflection: SSR-lite or planar reflection on ultra; cubemap fake on low.
- [ ] Positional water audio handoff to spec 06 (stream bed follows the channel).

**Backdrop / sky**
- [ ] Volumetric-ish cloud layer + distant sea/fjord plane for the Skellige read.
- [ ] DOF on focus + subtle bloom (ultra) via postprocessing.

## Tools / libraries
`three-custom-shader-material`, `lygia` GLSL noise, flow-map + Gerstner (see
TOOLS-CATALOG §2), `@react-three/postprocessing` (GodRays/DOF/Bloom, ultra),
drei `<Detailed>` for far LOD. CC0 rock/ground scans from Poly Haven/Megascans.

## Acceptance criteria
- Terrain reads as rolling hills with visible depth to a horizon.
- The stream visibly *flows* (direction + ripple + foam), no static look.
- Holds frame budget on medium tier (see spec 07); ultra adds god-rays/DOF.

## Dependencies / risks
- XL scope — split into terrain → stream → backdrop sub-PRs.
- Heightfield changes ripple into colliders, scatter (04), audio (06), movement
  (05: walkable banks/steps). Land terrain first, then layer.
- Keep true fluid sim deferred (D02) — flow-map gets the look affordably.
