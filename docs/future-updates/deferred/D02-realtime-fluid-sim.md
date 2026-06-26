# D02 — Realtime GPU fluid simulation (DEFERRED)

Status: ⏸️ Deferred · Area: Sanctum (water)
Deferred 2026-06-25 — REASON: a true Navier–Stokes / SPH sim is a perf risk on
laptops and overkill for a stream; the shader "flow" approach in spec 03 gets
~90% of the look for ~5% of the cost. REVISIT WHEN the shader stream ships and
ultra-tier still has clear GPU headroom and a reason to go further.

## Idea
GPU fluid sim (FBO ping-pong velocity/pressure fields, or SPH particles) so the
stream reacts to obstacles, the camera, and footsteps — ripples that emanate and
interact, not just a scrolling normal map.

## What it needs
- A ping-pong simulation pass (`useFBO` double buffer) feeding the water shader,
  or a particle SPH system; careful step/perf budgeting on top of spec 07.
- Boundary handling against the carved stream channel from spec 03.
- Strict ultra-tier gate; graceful fallback to the spec-03 flow-map water.

## Revisit trigger
Spec 03 flow-map stream is live, perf budget (07) is comfortable, and there's a
specific interactive-water moment worth the cost.
