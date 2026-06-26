# 06 — Adaptive soundscape (per-checkpoint, crossfading, nature)

Status: 🟡 Planned · Pri: P1 · Effort: L · Area: Sanctum (audio)
Tracks: "The sound is cool, but it doesn't sound like a nature scene. Make it
that within each checkpoint the soundscape will effortlessly and smoothly change
to what is required. I want a beautiful soundscape."

## Goal
Give each zone/checkpoint its own ambience and **crossfade smoothly** between
them as you move — exactly the way lighting/fog already crossfade via `moods.ts`.
The Living Sanctum should sound like a forest (birds, wind in leaves, stream,
distant water), the Room like a cold interior hum, the Threshold a blend.

## Why it matters
The visuals already mood-shift per zone; audio doesn't, so the scene "looks like
a forest but doesn't sound like one." Sound is half of immersion.

## Current state (in repo)
- [components/sanctum/SanctumAudioSystem.tsx](../../../components/sanctum/SanctumAudioSystem.tsx)
  — fully procedural: one global wind bed (noise→lowpass + gust LFO) + a single
  positional water source at the tide-pool. Gated behind a user gesture via
  `sanctumAudio`. **No per-zone variation.**
- [components/sanctum/lib/moods.ts](../../../components/sanctum/lib/moods.ts)
  — the *pattern to copy*: per-`Zone` mood object that `SanctumLighting` /
  `SanctumFog` ease toward, so zones crossfade rather than cut.
- [components/sanctum/lib/store.ts](../../../components/sanctum/lib/store.ts)
  — `sanctumAudio` bridge across the R3F boundary.

## Design: an "audioMoods" table mirroring moods.ts
```
  Zone      bed              layers (positional / 2D)          target gains
  ─────────────────────────────────────────────────────────────────────────
  room      cold HVAC hum    crt whine, distant muffled wind   wind 0.1
  threshold hum⇄wind blend   doorway air, first birds          wind 0.4
  sanctum   leaf-wind bed    birds(2D), stream(positional),    wind 0.7
                             insects, occasional gust          water on
  ── per frame: ease each layer's gain toward active zone's target (exp smooth)
     → moving between zones crossfades the whole mix, no cut ──
```

## To-do (frames)
- [ ] Create `lib/audioMoods.ts`: per-`Zone` target gains + filter targets for
      each layer (wind, leaves, birds, stream, insects, room hum). Mirror the
      shape/usage of `moods.ts`.
- [ ] Refactor `SanctumAudioSystem` to hold N persistent layers and **ease each
      layer's gain/filter toward the active zone's targets per frame** (read the
      active zone from the journey/store, same source the lighting uses).
- [ ] Add nature layers: birdsong (2D, sparse random one-shots), leaf-rustle bed,
      insect shimmer, positional stream tied to spec 03's channel (replace the
      single tide-pool source or add to it).
- [ ] Footstep SFX hook from spec 05's walk-cycle cadence event (surface
      material → step timbre; grass vs stone).
- [ ] Keep it gesture-gated + respect a mute control; default off until enabled.
- [ ] Decide source: stay procedural where possible; for birds/stream consider
      **CC0 stems** via `howler.js` (verify license, log in CREDITS.md).

## Tools / libraries
Web Audio API (current), `howler.js` (layered stems + crossfade), `three`
`PositionalAudio` (already used), CC0 stems from Freesound (license-checked).
TOOLS-CATALOG §4.

## Acceptance criteria
- Each zone has a distinct bed; walking between zones crossfades smoothly (no
  pops/cuts), matching the visual mood transition.
- Stream audio is positional (swells as you approach); footsteps audible.
- Still gated behind a gesture; mute works; no autoplay violations.

## Dependencies / risks
- Stream position depends on spec 03; footsteps depend on spec 05.
- Bundle weight if using stems — prefer short looped CC0 clips or stay procedural.
- Keep setState out of the frame loop (CLAUDE.md) — drive via the audio bridge.
