# D01 — NPC "essay walk" lectures (DEFERRED)

Status: ⏸️ Deferred · Area: Sanctum
Deferred 2026-06-25 — REASON: large surface (rigged character + dialogue/quest
state + narration audio); depends on movement (05) + soundscape (06) landing
first. REVISIT WHEN 05 + 06 ship and you want narrated content in-world.

## Idea
A walkable scene where a character NPC follows a path and you can **Listen**
(positional narration of an essay's gist), **Quest** (tiny objectives reveal
sections), and **Read** (open the full essay). Already sketched in
[../../EXPERIENCE_ROADMAP.md](../../EXPERIENCE_ROADMAP.md) §"Essays as a guided walk".

## What it needs
- NPC GLB (or capsule) with idle/walk states + waypoint logic (reuse
  `SanctumCameraRig` for a follow-cam along an essay spline).
- `zustand` dialogue/quest store (already staged).
- Positional narration audio (TTS — ElevenLabs/OpenAI, or recorded) per stop.
- Captions + a "read the essay" affordance; **always keep a non-3D reading path**
  (accessibility + SEO) over `content/essays.json`.

## Revisit trigger
Specs 05 (movement) + 06 (soundscape) shipped; an essay chosen as the pilot.
