# 01 — Homepage Sanctum preview & snap

Status: 🟡 Planned · Pri: P0 · Effort: M · Area: Homepage
Tracks: "on the dashboard we added it there however it won't snap to it so I
can't preview it and do it on the dashboard … allow it to be viewed in the
dashboard and move through there."

## Goal
The Sanctum already exists as a homepage ("dashboard") section, but scroll-snap
won't land on it and you can't preview/play it inline. Make the `garden` section
a first-class snap stop that mounts the live, **interactive** experience inline —
not just a thumbnail — so you can move through it without leaving the homepage.

## Why it matters
This is the showcase. If it can't be reached and played from the homepage, none
of the other Sanctum work is visible to a visitor. P0 because it gates demoing
every other spec.

## Current state (in repo)
- [app/page.tsx:27-34](../../../app/page.tsx#L27-L34) — `SectionSnap` lists
  `"garden"` and renders `<SanctumExperience id="garden" />`.
- [components/SectionSnap.tsx](../../../components/SectionSnap.tsx) — lenis
  mandatory snap, desktop pointers only.
- [components/sanctum/SanctumExperience.tsx:34](../../../components/sanctum/SanctumExperience.tsx#L34)
  — accepts `id`; lazy-mounts via IntersectionObserver.
- Standalone full version at [app/garden/page.tsx](../../../app/garden/page.tsx).

## Likely root causes (to confirm during build, not now)
1. The element that carries `id="garden"` may not be the scroll target
   `SectionSnap` measures, or it isn't `min-h-svh` full-viewport, so snap math
   skips/overshoots it (CLAUDE.md: each scene must fit one viewport height).
2. The lazy IntersectionObserver gate may delay mount past the snap so the slot
   has no height when snap computes offsets.
3. Canvas `pointer-events:none` + `eventSource` on `#page-root` may swallow the
   in-section interaction while snapping is armed (CLAUDE.md hero invariant).

## Wireframe
```
 homepage scroll  ┌─────────────────────────────┐  snap stop "garden"
 ───────────────► │  [ SANCTUM — live, playable ]│  • full svh
                  │  ┌───────────────────────┐  │  • "Enter / Walk" affordance
                  │  │  3D canvas (inline)    │  │  • arrow keys + drag pan work
                  │  │  ▷ press to take control│ │  • "Open full" → /garden
                  │  └───────────────────────┘  │  • snap releases when focused
                  │  zone dots ● ● ●  ↳ Open full│
                  └─────────────────────────────┘
```

## To-do (frames)
- [ ] Add `r3f-perf` HUD + log to confirm where snap lands vs section top.
- [ ] Ensure the `#garden` wrapper is `min-h-svh`, full-bleed, and is the exact
      node `SectionSnap` measures (audit `ids` ↔ DOM ids).
- [ ] Decide mount strategy: pre-warm the section just-before snap (rootMargin)
      so height is stable when snap computes.
- [ ] Add an explicit "take control" state: while focused, **disable snap** so
      arrow keys/drag don't fight the pager; restore on scroll-away.
- [ ] Provide an inline "Open full experience" link → `/garden` for the deep dive.
- [ ] Mobile: tap-to-enter, then drag-pan (snap disabled while in scene).
- [ ] Verify: snap reliably stops on `garden`; can move inside; can leave.

## Tools / libraries
`r3f-perf` (diagnose), existing `lenis`/`SectionSnap`, drei `<Html>` for the
"take control" affordance. See TOOLS-CATALOG §7, §1.

## Acceptance criteria
- Scrolling reliably docks on the Sanctum section on desktop & mobile.
- Inside the docked section you can look/move; leaving re-arms the pager.
- `npm run build` clean; `scripts/screenshot.mjs` captures the docked Sanctum.

## Dependencies / risks
- Interacts with the hero pointer-event invariant (CLAUDE.md). Don't give the
  canvas wrapper pointer events; gate via the section, not the canvas.
- Pairs with spec 07 (smoothness) — an inline heavy scene must stay light.
