# 05 — Movement + walk feel (free-roam, staircase, natural walk)

Status: 🟡 Planned · Pri: P1 · Effort: L · Area: Sanctum (camera/controls)
Tracks: "I want at some point that you can move using the arrow keys … they can
move with the staircase … the walking animation … you feel like you are walking
through it, not just a flyby … a natural walk … on mobile or desktop you can move
the camera and pan … this needs to feel like a game scene."

## Goal
Turn the guided dolly into a real first-person walk: move freely with
arrows/WASD across the whole scene (including **up the staircase**), look/pan with
mouse on desktop and **drag on mobile**, with a believable footstep walk cycle so
it feels like *walking*, not gliding on rails.

## Why it matters
This is the single biggest "AAA game scene" lever. Right now movement is a bounded
7m pocket around each stop; the user wants to roam and to *feel* the walk.

## Current state (in repo)
- [components/sanctum/SanctumCameraRig.tsx](../../../components/sanctum/SanctumCameraRig.tsx)
  — already: arrow/WASD mapped (L56-79), free-walk **clamped to `MAX_WALK = 7`m**
  around a node (L92-109), BVH ground-conform (L118-122), bounded pointer look
  (L129-138), subtle sin head-bob (L114, L122). Desktop only (`pointerLook.enabled`).
- [components/sanctum/lib/colliders.ts](../../../components/sanctum/lib/colliders.ts)
  — `blocked()` / `sampleGround()` collision world.
- [components/sanctum/lib/journey.ts](../../../components/sanctum/lib/journey.ts)
  — node graph + `EYE_HEIGHT`; guided stops.

## Design: two modes (toggle), not a rewrite
```
  GUIDED  (default, today's behavior)        FREE-ROAM (new)
  ┌──────────────────────────┐               ┌──────────────────────────┐
  │ dolly stop → stop         │   press      │ walk anywhere on terrain   │
  │ ±7m wander pocket         │ ───[Walk]──► │ stairs step-up via raycast │
  │ snap-composed look        │ ◄──[Esc]──── │ full look/pan, head-bob    │
  └──────────────────────────┘               │ POIs glow as you near      │
                                              └──────────────────────────┘
```

## To-do (frames)
**Free-roam**
- [ ] Add a `freeRoam` flag (in `lib/store.ts`) + UI toggle ("Walk" / Esc to
      return to the guided tour). Keep guided as default.
- [ ] When free-roam: lift the `MAX_WALK` clamp; integrate velocity each frame;
      keep `blocked()` collision so you can't clip trees/landmarks.
- [ ] **Staircase:** step-up logic — forward raycast to detect a step within
      knee height and ease the eye height up (or author stair colliders the BVH
      ground sampler already follows). Walkable banks/steps from spec 03.
- [ ] Soft world bounds (invisible walls) so you can't walk off the map.

**Walk feel (applies in both modes when moving)**
- [ ] Footstep walk-cycle: vertical bob + slight lateral sway + roll, amplitude
      scaled by speed; ease to rest when idle (replace the always-on sin bob).
- [ ] Footstep cadence event → triggers footstep SFX (handoff to spec 06).
- [ ] Acceleration/deceleration (no instant start/stop); head-lead on turns.
- [ ] FOV "kick" slightly on sprint (optional, stretch).

**Mobile / touch**
- [ ] Drag-to-look (one finger) mapped into `pointerLook`; enable look on touch
      (today gated to `pointerLook.enabled`).
- [ ] On-screen walk control (left thumb joystick or tap-to-move) for free-roam.
- [ ] Respect spec 01: disable page snap while in-scene control is active.

**Polish**
- [ ] "Things to look around for": diegetic points of interest that glow/parallax
      as you approach (reuse `SanctumInteractionMarker` / `SanctumLandmark`).

## Tools / libraries
Existing `three-mesh-bvh` (step/ground), `maath` (damping/easing for bob &
accel), drei `<Html>` for the Walk toggle, optional `@react-three/rapier` only if
you want true physics steps. TOOLS-CATALOG §1.

## Acceptance criteria
- Can walk the full clearing + up the staircase with arrows/WASD; collisions hold.
- Movement reads as a footstep walk (bob + cadence), not a glide/flyby.
- Mobile: drag-look + a walk control; desktop: mouse-look + keys.
- Guided tour still works and is the default.

## Dependencies / risks
- Couples with spec 06 (footstep + ambience), spec 07 (smoothness), spec 01
  (snap must yield to in-scene control), spec 03 (walkable terrain/steps).
- Don't break the "never free-fly; composition holds" intent for the *guided*
  mode — free-roam is an explicit opt-in.
