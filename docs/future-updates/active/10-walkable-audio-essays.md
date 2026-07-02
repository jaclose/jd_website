# 10 — Walkable audio essays (spatial editions of published essays)

Status: 🟡 Planned (wireframed 2026-07-01) · Pri: P2 · Effort: L · Area: Sanctum + Essays
Tracks: "wireframing for future essays to be published as essays or the
visual/auditory/spatial experience of a walkable audio essay."

## Goal
Any published essay can ship a **spatial edition**: the visitor walks a trail
through the Sanctum while the essay plays as narrated segments. Each segment is
anchored to a station (an existing journey node or a bare world position),
advances on arrival or on audio end, shows its text as captions, and may dress
the world (mood shift, a set-piece). Same essay, three editions: read it
(/essays/slug), hear it, or **walk it**.

## Current state (in repo — the wireframe)
- [data/audioEssays.ts](../../../data/audioEssays.ts) — the full data contract
  (`AudioEssay`, `AudioEssaySegment`, anchors, advance modes, moods, set-pieces)
  plus a **draft** entry: "The Cost of Knowing Better" traced over the medicine
  fork. `draft: true` entries never render.
- The journey graph ([lib/journey.ts](../../../components/sanctum/lib/journey.ts))
  + quest layer (`lib/quests.ts`, `SanctumGuide`, `SanctumQuestSensor`) already
  provide stations, arrival tripwires and a wayfinding beacon — the essay walk
  is a *playlist over the same primitives*.
- The AudioSystem ([SanctumAudioSystem.tsx](../../../components/sanctum/SanctumAudioSystem.tsx))
  already streams layered loops through one AudioContext with a user-gesture
  resume; narration is one more (non-loop) channel with ducking.

## Wireframe
```
 /essays/<slug>          /garden?essay=<slug>
 ┌───────────────┐        ┌──────────────────────────────────────┐
 │  READ │ WALK ●│──────► │ trailhead gate: title · runtime · ▶   │
 └───────────────┘        │  ┌─ segment n ────────────────────┐  │
                          │  │ beacon → station · narration ▷  │  │
                          │  │ caption line (bottom, serif)    │  │
                          │  │ progress ring · pause · skip    │  │
                          │  └────────────────────────────────┘  │
                          │  arrive → next segment (or dwell)    │
                          └──────────────────────────────────────┘
```

## To-do (frames)
- [ ] **Narration channel** in AudioSystem: play/pause/seek one segment file,
      duck ambience −8dB while speaking, resume on gesture (reuse `sanctumAudio`).
- [ ] **EssayWalkController**: a quest-like state machine over `segments[]` —
      reuses `SanctumGuide` for the beacon and the sensor's tripwires for
      arrival; `advance: "audio-end"` uses the audio element's `ended`.
- [ ] **Caption bar**: serif line bottom-centre (the essay voice, not the mono
      UI voice), fed by the active segment.
- [ ] **Entry points**: a "Walk this essay" button on essay pages whose slug has
      a non-draft `AudioEssay`; `/garden?essay=<slug>` deep link starts the walk.
- [ ] **Set-pieces**: registry keyed by `setPiece` string → small scene
      components (start with `study-lantern-circle`).
- [ ] **Record + encode narration** (mp3 + opus, ~48kbps mono) under
      `public/sanctum/essays/<slug>/` — the only asset dependency.
- [ ] Achievement: "Listener" — finish any essay walk end to end.

## Tools / libraries
Nothing new: existing AudioContext plumbing, journey graph, quest sensor/guide.
Encoding via ffmpeg in the asset scratch pipeline.

## Acceptance criteria
- An essay with audio ships a walkable edition behind one data entry.
- Narration ducks ambience, captions stay in sync per segment, arrival advances.
- Abandoning mid-walk (Esc / scroll away) pauses cleanly and can resume.

## Dependencies / risks
- Narration recording is the long pole — schema is deliberately audio-last so
  trails can be authored and tested silent (captions only) first.
- Supersedes the NPC framing of [D01](../deferred/D01-npc-essay-walk.md) with a
  narrator-first cut; D01 stays deferred for the embodied-NPC version.
