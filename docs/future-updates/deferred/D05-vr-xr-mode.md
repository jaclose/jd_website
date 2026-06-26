# D05 — VR / XR (WebXR) mode (DEFERRED)

Status: ⏸️ Deferred · Area: Sanctum (XR)
Deferred 2026-06-25 — REASON: the experience must be excellent in flat
first-person first; XR roughly doubles QA + perf budget. REVISIT WHEN the desktop
walk hits a stable 60fps and there's real demand/devices to test on.

## Idea
Let a headset user step into the Sanctum in room-scale VR — the ultimate version
of "feel like you're walking through it."

## What it needs
- `@react-three/xr` session + controllers/hands; teleport or smooth locomotion
  (comfort options) layered on spec 05's movement.
- Aggressive perf work (XR demands ~90fps stereo) — depends hard on spec 07.
- UI re-think: diegetic panels instead of DOM overlays.

## Revisit trigger
Desktop perf (07) is solid, movement (05) is mature, and there's a device + user
demand to justify the XR QA cost.
