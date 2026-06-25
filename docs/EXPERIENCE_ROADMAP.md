# JD-1184 — Experience Roadmap

The site is moving from "pages with 3D on them" toward an **interactive medium**:
a vertical rhythm of cinematic, explorable scenes interleaved with calm,
conventional reading. This file captures the direction so the ideas live in the
repo, not just in chat. It is a working plan, not a contract.

## North-star page flow

Alternate **immersive scene → quiet theme → immersive scene → quiet theme …**
so the page breathes:

1. **Solar-system hero** (exists) — navigation as a living system.
2. **The Sanctum** (exists, `/garden` + homepage section) — the 3-zone walk.
3. **Travels / Vision Board** (planned) — a spatial map of places + aspirations.
4. **Essays as a guided walk** (planned) — follow-the-player audio lectures.
5. Field notes, deployments, archive, log, signals (exist) — the quiet themes.

Each immersive scene shares the same engineering spine (see "Shared spine").

---

## Hard constraint (read first)

This coding environment **cannot run Unreal Engine 5, Blender, SpeedTree, or
Substance** — they are GUI desktop apps. So the *shipping* renderer is always
**Three.js / React Three Fiber with real GLSL**, procedural generation, and CC0
assets. UE5/Blender are **authoring tools you run locally**; their output (GLB +
textures) drops into the web pipeline below. Anything described here as "shader"
or "procedural" is web-native and already achievable; anything described as
"authored asset" is a Blender/UE5 export you produce and commit.

---

## Shared spine (already built, reuse it)

- `components/sanctum/SanctumQualityManager` — 4 device tiers (`low|medium|high|ultra`).
- `components/sanctum/lib/store.ts` — module bridges across the R3F boundary
  (pointer look, audio control). Pattern to copy for any new scene.
- `components/sanctum/shaders/` — wind (grass/leaf/vine/mist/fireflies), water,
  mist; all keyed off one `windUniforms` clock.
- `components/sanctum/SanctumCameraRig` — guided dolly + BVH ground-conform +
  bounded free-walk. Reusable for the essay walk.
- `components/sanctum/lib/assets.ts` — GLB loader (Draco + webp, KTX2-ready),
  instancing helpers, per-zone preload.
- `SanctumExperience` is **lazy-mounted** (IntersectionObserver) so heavy scenes
  can live as homepage sections without taxing first paint. Copy this gate.

### Staged tooling (installed for the work below)
- `three-custom-shader-material` — extend `MeshStandardMaterial` with GLSL while
  keeping PBR lighting/shadows; for richer bark, foliage translucency, terrain
  blends, water. (Current shaders use `onBeforeCompile`/`ShaderMaterial`; migrate
  hot paths to CSM as they grow.)
- `zustand` — structured state for quests / dialogue / vision-board selection
  (replaces ad-hoc module stores once state gets graphy).
- `maath` — easing, damping, random distributions for camera + scatter.

---

## Asset pipeline (Blender / UE5 → web)

Drop authored assets straight in; the loader already supports them.

```
public/sanctum/
  models/      *.glb   (Draco-compressed; EXT_texture_webp or KTX2 textures)
  textures/    *.webp  (PBR sets: _color _normal _rough)
  hdri/        *.hdr   (IBL; ultra-tier only — see note)
  decoders/    draco/ basis/   (self-hosted; never CDN)
  CREDITS.md   (license provenance for every asset — CC0 only here)
```

Authoring → web checklist:
1. Model in Blender / assemble in UE5; keep it real-world scale (metres), Y-up.
2. Export GLB. Optimise: `npx @gltf-transform/cli optimize in.glb out.glb
   --compress draco --texture-compress webp --texture-size 1024 --simplify true`.
3. For multi-million-tri scans, raise `--simplify-ratio` / `--simplify-error`.
4. Register the key in `lib/assets.ts` `MODEL_URL` + `ZONE_ASSETS`; scatter with
   `InstancedModel`.
5. Record the source + license in `public/sanctum/CREDITS.md` (CC0 only).

**IBL note:** the HDR PMREM probe washes PBR white on software-GL, so HDRI IBL is
**ultra-tier only**; the analytic light rig is the verified baseline (see
`SanctumLighting`).

---

## Planned scenes

### Travels / Vision Board
A spatial scene: a stylised globe or layered parallax map with pins for places
visited + a "vision board" of aspirations (study, travel, family). Pins are
diegetic markers (reuse `SanctumInteractionMarker`); clicking opens a panel with
photos/notes (reuse `SanctumInspector`). Data-driven from a new `data/travels.ts`.
Start as a quiet themed section; upgrade to full 3D later.

### Essays as a guided walk (NPC lectures)
The big one. A walkable scene where a **character NPC follows a path** and you
can:
- **Listen**: positional audio of the author narrating the gist of an essay
  (TTS or recorded), so you get the idea conversationally before reading.
- **Quest**: tiny objectives ("walk to the anatomy stone", "find the three
  figures") that reveal essay sections.
- **Read**: open the full essay (existing `content/essays.json`) any time.

Build order: (1) reuse `SanctumCameraRig` for a follow-cam along an essay spline;
(2) a simple NPC (GLB or capsule) with idle/walk states + waypoint logic;
(3) `zustand` dialogue/quest store; (4) positional audio per stop (reuse
`SanctumAudioSystem` patterns); (5) captions + a "read the essay" affordance.
Always keep a **non-3D reading path** (accessibility + SEO).

### Solar system + Duel field (later polish)
- Solar system: depth-of-field on focus, better sun shader, comet trails,
  procedural planet surfaces via CSM, subtle bloom.
- Duel field: more interaction, audio, win/lose states.

---

## Sanctum — near-term polish backlog
- True biome distinction per zone (Fern Ravine middle beat with a sculpted
  ravine + per-zone scatter masks: moisture/slope/canopy).
- Persistent world-state (a lantern lights and stays lit on return via stored
  state) wired to real site activity.
- Tree LOD via drei `<Detailed>` + far impostor billboards baked from the GLB.
- Optional god-rays via `@react-three/postprocessing` `GodRays` on ultra.
- Migrate grass/bark to `three-custom-shader-material` for translucency + SSS-ish
  rim light.
