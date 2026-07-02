# Future Updates — control room

This folder is the single place where deferred and in-progress ideas live so
nothing gets lost between Claude sessions. It is a **planning surface only** —
specs, wireframes, and checklists. No feature code lives here.

> Created 2026-06-25 from a dictated brief. The brief asked to *wireframe and
> log* a set of ideas for the Sanctum (the `/garden` 3D walk) and for the site's
> email + admin tooling — **without implementing them yet**. This README is the
> master index + master to-do list.

## How this folder is organized

```
docs/future-updates/
  README.md              ← you are here: master index + master to-do
  TOOLS-CATALOG.md       ← passive ideas: libraries / apps / plugins / services
  CHANGELOG.md           ← what actually shipped (normal change log)
  CHANGELOG-DEFERRED.md  ← what was consciously deferred + why (deferred log)
  active/                ← "future updates": specs we intend to build next
  deferred/              ← "future updates deferred": parked / blocked / someday
```

Mapping to the dictated request: `active/` is the **"future updates"** folder,
`deferred/` is the **"future updates deferred"** folder, and the two changelogs
are the **normal** and **deferred** change logs — all inside this one container.

## Working agreement (read before touching code later)

1. **Pick from `active/`.** Each file is a self-contained "frame" you can resume
   cold. It has Goal / Current state / Wireframe / To-do (frames) / Tools /
   Acceptance / Dependencies / Status.
2. **Update the file's `Status:` line** as you progress (🟡 Planned → 🔵 In
   progress → 🟢 Shipped → ⏸️ Deferred).
3. **When something ships**, add a dated line to `CHANGELOG.md` and flip Status.
4. **When something is parked**, move the file to `deferred/`, flip Status to
   ⏸️, and add a dated line to `CHANGELOG-DEFERRED.md` with the *reason* and the
   *condition to revisit*.
5. **Never commit non-CC0 assets.** Authored assets follow the pipeline in
   [../EXPERIENCE_ROADMAP.md](../EXPERIENCE_ROADMAP.md).
6. **Verify gate stays green:** `npm run build` clean + `node scripts/screenshot.mjs`.

## North-star (the why)

Make the Sanctum feel like a **AAA-studio scene you walk through in first
person** — a Witcher 3 / Skellige calm: real terrain, a running stream, dense
living grass, a soundscape that breathes per zone, and a natural footstep walk
(not a flyby). It must be previewable and playable **inline on the homepage**,
and run **smoothly** on a laptop. Around the experience, the site needs grown-up
**email** and an **admin dashboard** so it can be run and sold.

---

## Master to-do (priority order)

Legend — Effort: S(<½d) M(~1d) L(2-4d) XL(>1wk) · Pri: P0 blocking → P3 polish

### A. Sanctum experience (the game scene)
- [ ] **P0 · M** Fix homepage snap so the Sanctum section actually docks &
      becomes playable inline → [active/01-homepage-sanctum-preview.md](active/01-homepage-sanctum-preview.md)
- [ ] **P1 · L** Kill choppiness — frame-budget + adaptive quality pass →
      [active/07-performance-smoothness.md](active/07-performance-smoothness.md)
- [ ] **P1 · L** Free-roam movement: arrow/WASD walk through the whole scene +
      up the staircase; mobile drag-to-pan →
      [active/05-movement-and-walk-feel.md](active/05-movement-and-walk-feel.md)
- [ ] **P1 · M** Natural first-person walk cycle (head-bob, footstep cadence,
      foot SFX) — feel like walking, not gliding → same file as above
- [ ] **P1 · L** Adaptive soundscape — per-checkpoint nature audio that
      crossfades (mirror the lighting `moods.ts` pattern) →
      [active/06-adaptive-soundscape.md](active/06-adaptive-soundscape.md)
- [ ] **P2 · XL** World/terrain buildout — Witcher-3-Skellige vista + a running
      stream with fluid feel → [active/03-world-terrain-and-water.md](active/03-world-terrain-and-water.md)
- [ ] **P2 · L** Denser, prettier flora — grass/foliage shaders & textures →
      [active/04-flora-grass-shaders.md](active/04-flora-grass-shaders.md)
- [ ] **P2 · M** "Living monitor" — render the real website live on the in-scene
      computer screen as a POV reward →
      [active/02-living-monitor.md](active/02-living-monitor.md)

### B. Site operations (run it & sell it)
- [ ] **P1 · M** Email list fully built out + tool choices locked →
      [active/08-email-list-buildout.md](active/08-email-list-buildout.md)
- [ ] **P2 · L** Admin dashboard to view/manage the whole site + "plugins for
      sale" surface → [active/09-site-admin-dashboard.md](active/09-site-admin-dashboard.md)

### Deferred (see deferred/ + CHANGELOG-DEFERRED.md)
- ⏸️ NPC "essay walk" lectures · GPU fluid sim · Blender/UE5 authored hero asset
  · multiplayer presence · VR/XR mode.

---

## Index of specs

| # | Spec | Area | Pri | Status |
|---|------|------|-----|--------|
| 01 | [Homepage Sanctum preview/snap](active/01-homepage-sanctum-preview.md) | Homepage | P0 | 🔵 partial |
| 02 | [Living monitor (site-in-scene)](active/02-living-monitor.md) | Sanctum | P2 | 🟢 shipped |
| 03 | [World terrain + stream/water](active/03-world-terrain-and-water.md) | Sanctum | P2 | 🔵 partial |
| 04 | [Flora / grass shaders](active/04-flora-grass-shaders.md) | Sanctum | P2 | 🔵 partial |
| 05 | [Movement + walk feel](active/05-movement-and-walk-feel.md) | Sanctum | P1 | 🟢 core shipped |
| 06 | [Adaptive soundscape](active/06-adaptive-soundscape.md) | Sanctum | P1 | 🟢 shipped |
| 07 | [Performance / smoothness](active/07-performance-smoothness.md) | Sanctum | P1 | 🔵 partial |
| 08 | [Email list buildout](active/08-email-list-buildout.md) | Email | P1 | 🟡 |
| 09 | [Site admin dashboard](active/09-site-admin-dashboard.md) | Infra | P2 | 🟡 |
| 10 | [Walkable audio essays](active/10-walkable-audio-essays.md) | Sanctum+Essays | P2 | 🟡 wireframed |
| D01 | [NPC essay walk](deferred/D01-npc-essay-walk.md) | Sanctum | — | ⏸️ |
| D02 | [Realtime GPU fluid sim](deferred/D02-realtime-fluid-sim.md) | Sanctum | — | ⏸️ |
| D03 | [Authored hero assets (Blender/UE5)](deferred/D03-authored-assets.md) | Sanctum | — | ⏸️ |
| D04 | [Multiplayer presence](deferred/D04-multiplayer-presence.md) | Sanctum | — | ⏸️ |
| D05 | [VR / XR mode](deferred/D05-vr-xr-mode.md) | Sanctum | — | ⏸️ |

See also the existing high-level [../EXPERIENCE_ROADMAP.md](../EXPERIENCE_ROADMAP.md)
(shared engineering spine + asset pipeline) and [../email-system.md](../email-system.md).
