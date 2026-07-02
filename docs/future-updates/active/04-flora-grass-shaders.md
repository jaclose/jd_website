# 04 — Flora & grass shaders (denser, prettier nature)

Status: 🔵 Partial (2026-07-02) · Pri: P2 · Effort: L · Area: Sanctum (Living Sanctum) — DONE: bowed 3-blade grass tufts w/ per-instance colour, denser border planting via trailLineScatter. REMAINING: texture-carded grass, slope/moisture scatter masks, canopy shader pass.
Tracks: "I really like the trees so far, so corporate [incorporate] more of that
… use shaders, procedurally generated tools and apps used for nature, such as
grass, textures."

## Goal
Carpet the Sanctum in living grass and undergrowth that sways, catches light, and
thickens toward the camera — the meadow layer that sells the Witcher-3 look,
without tanking the framerate.

## Why it matters
Trees alone read as sparse. Ground-cover density + soft wind is the single
biggest "this is a real place" upgrade after terrain.

## Current state (in repo)
- [components/sanctum/shaders/grassWind.ts](../../../components/sanctum/shaders/grassWind.ts),
  `leafWind.ts`, `cableVine.ts`, `wind.ts` — wind shaders keyed off one
  `windUniforms` clock (CLAUDE.md bridge).
- [components/sanctum/SanctumFoliage.tsx](../../../components/sanctum/SanctumFoliage.tsx)
  — current foliage scatter.
- [components/sanctum/SanctumWindSystem.tsx](../../../components/sanctum/SanctumWindSystem.tsx)
  — drives `windUniforms`.

## Wireframe
```
  density falls off with distance ───►   (LOD rings)
  near:  ▓grass cards▓ + clover + ferns + flowers   (full detail)
  mid:   ░thinner cards░  + scatter rocks            (instanced)
  far:   .terrain splat texture only.                (no geometry)
  all swept by ONE wind clock (windUniforms) — gusts roll across the field
```

## To-do (frames)
- [ ] GPU-instanced grass cards (cross-quad billboards) scattered by blue-noise,
      masked by terrain moisture/slope from spec 03.
- [ ] Vertex wind in the grass shader (bend by height, gust noise) reusing
      `windUniforms`; add subtle per-blade hue variation + AO at the base.
- [ ] Distance-based density LOD rings (full → instanced → texture-only) so total
      blade count stays bounded.
- [ ] Add undergrowth variety: ferns, clover, a few wildflowers (instanced GLB
      or cards); scatter masks per zone (CLAUDE.md "per-zone scatter masks").
- [ ] Translucency / rim light on grass + leaves via
      `three-custom-shader-material` (light through blades = the magic).
- [ ] Tie to quality tiers in `SanctumQualityManager` (blade count per tier).
- [ ] Player-interaction (stretch): grass bends away from the camera/footsteps.

## Tools / libraries
`three-custom-shader-material` (translucency), `maath` (blue-noise scatter),
drei `<Instances>`/`<Detailed>`, CC0 grass/fern alphas from Poly Haven /
ambientCG. TOOLS-CATALOG §1, §2.

## Acceptance criteria
- Foreground reads as dense, swaying meadow; horizon stays clean (no popping).
- Grass responds to the global wind in sync with trees.
- Bounded blade count per tier; no fps regression vs current on medium.

## Dependencies / risks
- Depends on spec 03 terrain masks for natural placement.
- Instancing + alpha overdraw is the perf trap — coordinate with spec 07.
