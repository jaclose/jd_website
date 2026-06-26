# D03 — Authored hero assets (Blender / UE5 / SpeedTree) (DEFERRED)

Status: ⏸️ Deferred · Area: Sanctum (assets)
Deferred 2026-06-25 — REASON: this coding environment **cannot run** Blender,
UE5, SpeedTree, or Substance (GUI desktop apps — CLAUDE.md / EXPERIENCE_ROADMAP).
Assets must be authored locally and dropped into the web pipeline. REVISIT WHEN
Jafar produces a CC0 GLB/texture set to commit.

## Idea
Replace/augment procedural geometry with hand-authored hero pieces: a sculpted
tree or rock formation, a detailed cabin/desk for the Room, a sculpted ravine —
for moments where procedural isn't enough.

## What it needs (the pipeline already supports this)
1. Author in Blender / assemble in UE5; real-world scale (m), Y-up.
2. Export GLB → optimize: `@gltf-transform/cli optimize ... --compress draco
   --texture-compress webp --simplify true`.
3. Register the key in [lib/assets.ts](../../../components/sanctum/lib/assets.ts)
   `MODEL_URL` + `ZONE_ASSETS`; scatter via `InstancedModel`.
4. Log provenance in `public/sanctum/CREDITS.md` — **CC0 only**.

## Revisit trigger
A finished CC0 asset exists locally and is ready to commit; tie its drop-in to a
specific scene beat (e.g. the Room desk for spec 02, or a hero tree for spec 03).
