# 07 — Performance & smoothness (kill the choppiness)

Status: 🔵 Partial (2026-07-02) · Pri: P1 · Effort: L · Area: Sanctum (perf) — DONE: drei PerformanceMonitor + AdaptiveDpr + AdaptiveEvents; fps→tier auto-stepping (sustained decline steps the quality tier down one notch at a time, down-only so it never oscillates). TODO: instancing/LOD audit, r3f-perf baseline, KTX2 textures.
Tracks: "right now it is very choppy. I want it to be a very smooth experience …
this needs to feel like a game scene … a triple-A game studio."

## Goal
Make the Sanctum run smoothly (target 60fps desktop / 30fps+ mobile) so movement
and camera feel buttery. Establish a frame budget and an adaptive quality loop so
the scene degrades gracefully instead of stuttering.

## Why it matters
No amount of terrain/grass/audio matters if it stutters. Smoothness is the
baseline "AAA feel." This underpins specs 01, 03, 04, 05.

## Current state (in repo)
- [components/sanctum/SanctumQualityManager.tsx](../../../components/sanctum/SanctumQualityManager.tsx)
  — 4 tiers (`low|medium|high|ultra`); the place to wire adaptive scaling.
- [components/sanctum/SanctumCameraRig.tsx](../../../components/sanctum/SanctumCameraRig.tsx)
  — already clamps dt (`MAX_CAMERA_DT`, `MAX_WALK_DT`) to avoid jumps on hitches.
- [components/sanctum/SanctumPostFX.tsx](../../../components/sanctum/SanctumPostFX.tsx)
  — postprocessing stack (a prime cost to tier-gate).
- HDRI IBL is ultra-only by design (washes PBR on software-GL — CLAUDE.md).

## Diagnose first (don't optimize blind)
```
  1. add r3f-perf HUD → read fps, draw calls, triangles, geometries, textures
  2. Chrome Performance trace while walking → find long frames / GC spikes
  3. classify the cost: CPU (too many objects/raycasts) vs GPU (overdraw/fillrate)
  4. THEN fix the top offender; re-measure. Repeat.
```

## To-do (frames)
**Instrument**
- [ ] Add `r3f-perf` (dev-only) + a one-shot perf capture in `screenshot.mjs`.
- [ ] Record a baseline (fps, draw calls, frame time) per tier before changes.

**Adaptive quality (biggest smoothness win)**
- [ ] Wrap the scene in drei `<PerformanceMonitor>` → escalate/de-escalate the
      `SanctumQualityManager` tier on sustained fps drops.
- [ ] Add `<AdaptiveDpr pixelated={false}>` + `<AdaptiveEvents>` to shed
      resolution/raycasts under load.

**Reduce cost**
- [ ] Instancing audit: trees/grass/flora via `<Instances>`; merge static geo.
- [ ] LOD via `<Detailed>` + far impostor billboards for trees (roadmap backlog).
- [ ] Tier-gate postFX (bloom/DOF/god-rays → high/ultra only).
- [ ] Texture budget: KTX2/basis compression; cap sizes (1024 mid, 2048 ultra).
- [ ] Cull aggressively (frustum + distance); freeze offscreen subsystems.
- [ ] Move heavy procedural gen (terrain/scatter) off the first frame / to a
      worker; show `SanctumFallback` until ready.
- [ ] Throttle per-frame raycasts (ground/step) — cache between frames.
- [ ] Ensure no setState in frame loops (CLAUDE.md) — audit all `useFrame`.

**Inline (homepage) budget**
- [ ] On the homepage (spec 01), run the Sanctum at a capped tier/dpr; full
      fidelity only on `/garden`.

## Tools / libraries
`r3f-perf`, drei `<PerformanceMonitor>`/`<AdaptiveDpr>`/`<AdaptiveEvents>`,
`@gltf-transform/cli`, KTX2/basis, `stats.js`, Chrome DevTools. TOOLS-CATALOG §7.

## Acceptance criteria
- Sustained ~60fps desktop / 30fps+ mid mobile while walking, no visible hitches.
- Quality auto-drops under load instead of stuttering, then recovers.
- Draw calls / triangle count documented per tier; inline homepage stays light.

## Dependencies / risks
- Cross-cuts every other Sanctum spec — treat it as a continuous gate, not a
  one-off. Re-baseline after 03/04 land.
