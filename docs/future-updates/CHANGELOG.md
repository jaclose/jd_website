# Changelog — shipped

Normal change log: things that **actually landed**. Newest first. One line per
change, dated `YYYY-MM-DD`. When you ship an item from `active/`, add it here and
flip that spec's `Status:` to 🟢 Shipped.

Format: `YYYY-MM-DD — [area] short description (spec ref, commit/PR)`

## Unreleased

### 2026-06-26 — Sanctum core pass (specs 06, 02 complete; 05, 07, 01 partial)

- 2026-06-26 — [sanctum] **Adaptive soundscape (spec 06 ✅)**: new
  `lib/audioMoods.ts` (per-zone twin of `moods.ts`) + rewrote `SanctumAudioSystem`
  into layered procedural beds — wind, leaf-rustle, cold room hum, insect shimmer,
  scheduled birdsong, positional stream, and footstep one-shots — that crossfade
  per zone via Web Audio `setTargetAtTime`. Footfalls fire from the camera rig.
- 2026-06-26 — [sanctum] **Living monitor (spec 02 ✅)**: new
  `LivingMonitor.tsx` paints the site (browser chrome, name, orbiting
  solar-system motif, scanline) to a `CanvasTexture` on the Room's main screen
  (unlit emissive); warmed its practical light. No iframe/cross-origin/font risk.
- 2026-06-26 — [sanctum] **Free-roam + walk feel (spec 05, partial)**: camera rig
  gains a free-roam mode (`sanctumControl.freeRoam`) bounded by `SANCTUM_BOUNDS` +
  collisions, wider look cone, a speed-driven footstep head-bob + lateral sway,
  and footstep-cadence audio. _Remaining: authored staircase step-up, full 360°
  turning, on-screen mobile move control._
- 2026-06-26 — [sanctum] **Adaptive performance (spec 07, partial)**: added drei
  `PerformanceMonitor` + `AdaptiveDpr` + `AdaptiveEvents` to the scene.
  _Remaining: fps→tier auto-stepping, instancing/LOD audit, r3f-perf baseline._
- 2026-06-26 — [homepage] **Inline control handoff (spec 01, partial)**:
  "Walk here" pauses lenis scroll/snap so arrow keys + drag drive the scene
  inline (Esc/Exit returns); look-around now works on touch (drag) + mouse
  (hover). _Remaining: verify/repair the snap-root measurement itself._
- 2026-06-26 — Verified: `npm run build` clean (types + lint).

## 2026-06-25

- 2026-06-25 — [docs] Created the `future-updates/` control room: master index,
  tools catalog, normal + deferred changelogs, and 9 active / 5 deferred specs.
  No feature code changed. (planning only)

<!--
Reference of prior Sanctum work already in git (for context, not re-logged here):
  71a5022 cinematic pass — lit room, procedural sky/water, homepage wire-up
  4cbb809 heavier systems — spatial audio, BVH walking, denser flora
  95b5917 initial Sanctum: 3D forest sanctuary
-->
