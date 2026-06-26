# Changelog — deferred

Deferred change log: things consciously **parked**, with the reason and the
condition that should bring them back. Newest first. When you move a spec into
`deferred/`, add a line here.

Format: `YYYY-MM-DD — [area] what was deferred — REASON — REVISIT WHEN`

## 2026-06-25 (initial triage)
- 2026-06-25 — [sanctum] NPC "essay walk" lectures — REASON: needs a rigged
  character GLB + dialogue/quest state + narration audio; large surface, depends
  on movement + soundscape landing first — REVISIT WHEN specs 05 + 06 ship.
  (deferred/D01-npc-essay-walk.md)
- 2026-06-25 — [sanctum] Realtime GPU fluid simulation for the stream — REASON:
  a true Navier–Stokes/SPH sim is overkill and a perf risk on laptops; a shader
  "flow" stream (spec 03) gets 90% of the look for 5% of the cost — REVISIT WHEN
  the shader stream ships and ultra-tier still has GPU headroom.
  (deferred/D02-realtime-fluid-sim.md)
- 2026-06-25 — [sanctum] Authored hero assets from Blender/UE5/SpeedTree —
  REASON: this coding environment can't run those GUI apps; assets must be
  authored locally then dropped into the web pipeline — REVISIT WHEN Jafar
  produces a CC0 GLB to drop in. (deferred/D03-authored-assets.md)
- 2026-06-25 — [sanctum] Multiplayer "fireflies are other visitors" presence —
  REASON: needs a realtime backend (Supabase Realtime / PartyKit) + privacy
  thought; not core to the single-player feel — REVISIT WHEN the solo experience
  is polished and there's a reason to socialize it. (deferred/D04-multiplayer-presence.md)
- 2026-06-25 — [sanctum] VR / XR (WebXR) mode — REASON: the experience must be
  great in flat first-person first; XR doubles QA + perf budget — REVISIT WHEN
  the desktop walk hits 60fps and there's demand. (deferred/D05-vr-xr-mode.md)
