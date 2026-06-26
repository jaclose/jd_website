# 02 — Living monitor (the site, live, in the scene)

Status: 🟡 Planned · Pri: P2 · Effort: M · Area: Sanctum (Room zone)
Tracks: "they're trying to generate a computer at first, and I want my website
to be displayed on the screen monitor as a live image just to show what it is to
be in my POV. I kind of want this reward."

## Goal
In the opening **Room** zone there's a desk/computer. Put the *real* website
onto that monitor as a live, glowing image — a POV "reward": you're inside the
scene, looking at the very site you came from. A small recursive wink.

## Why it matters
It's the emotional hook of the Room beat — "this is my world, and here's the
window back into it." Cheap to wow, high payoff.

## Current state (in repo)
- [components/sanctum/zones/EntanglementRoom.tsx](../../../components/sanctum/zones/EntanglementRoom.tsx)
  — the Room zone; the desk/computer lives here.
- Room mood is cold screen-blue with a crimson ember
  ([lib/moods.ts](../../../components/sanctum/lib/moods.ts)) — already implies a
  glowing screen as the key practical light.

## Approach options (pick during build)
1. **Render-to-texture of a mini scene (recommended, safe):** render a small R3F
   scene / styled plane to a `WebGLRenderTarget`, use it as the monitor's
   emissive map. Fully controlled, no cross-origin issues, cheap. Show a stylized
   loop of the homepage hero (solar system) — reads instantly as "the site."
2. **Live DOM → texture:** render an actual `<iframe src="/">` to a `<Html>`
   transform plane (drei `<Html transform occlude>`) positioned on the monitor.
   Truly live but heavier and finicky with occlusion/perf; good for ultra only.
3. **html-to-canvas snapshot:** periodically rasterize the homepage to a
   `CanvasTexture`. Middle ground; refresh slowly.

Default: **option 1** for all tiers; offer **option 2** on ultra as the "really
live" version.

## Wireframe
```
        Room zone (cold blue)
   ┌───────────────────────────────┐
   │     ▓▓▓▓▓▓▓▓▓  ← monitor       │   screen = emissive map
   │     ▓ ☼ solar ▓  glow spills   │   content = live site / hero loop
   │     ▓  system ▓  onto desk     │   subtle scanline + bloom
   │     ▓▓▓▓▓▓▓▓▓               │   key light tinted #7796c4
   │     ___[desk]___  crimson ember│
   └───────────────────────────────┘
```

## To-do (frames)
- [ ] Identify/Make the monitor mesh in `EntanglementRoom` (uv-mapped quad).
- [ ] Build a `RenderTarget` "screen feed" (homepage hero loop) → emissive map.
- [ ] Wire the screen as the Room's key practical so glow matches `moods.room`.
- [ ] Add screen-space polish: faint scanlines, slight curvature, bloom on ultra.
- [ ] (ultra) prototype option 2 live `<iframe>` plane behind a flag.
- [ ] Optional reward beat: as you approach, the screen "wakes"/focuses.

## Tools / libraries
`@react-three/drei` `useFBO`/`<RenderTexture>`, `<Html transform occlude>` for
option 2, `@react-three/postprocessing` Bloom (ultra). TOOLS-CATALOG §1.

## Acceptance criteria
- The Room monitor shows recognizable site content and lights the desk.
- No cross-origin/console errors; no measurable fps hit on medium tier.

## Dependencies / risks
- Option 2 perf + occlusion is fiddly — keep it ultra-only and flagged.
- Avoid infinite-mirror cost if the iframe itself renders the scene (use the
  hero/2D homepage, not `/garden`, as the feed).
