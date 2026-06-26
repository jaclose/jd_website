# D04 — Multiplayer presence (DEFERRED)

Status: ⏸️ Deferred · Area: Sanctum (realtime)
Deferred 2026-06-25 — REASON: needs a realtime backend + privacy thought and is
not core to the single-player feel. REVISIT WHEN the solo experience is polished
and there's a clear reason to socialize it.

## Idea
Other live visitors appear in the Sanctum as soft presences — e.g. extra
fireflies or faint lantern-lights that drift where others are walking — so the
space feels quietly inhabited. Possibly a shared "leave a light" guestbook that
persists (ties to the roadmap's "persistent world-state" idea).

## What it needs
- Realtime transport: Supabase Realtime (already in repo) or PartyKit/Liveblocks.
- Ephemeral position broadcast (throttled) → render as presence motes.
- Privacy: anonymous, no PII, opt-in; rate-limited.
- Persistence (optional): a "lit lantern stays lit on return" backed by storage.

## Revisit trigger
Solo Sanctum (05, 06, 07) feels great and there's intent to add social warmth.
