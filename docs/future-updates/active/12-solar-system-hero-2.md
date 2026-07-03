# 12 — Solar System Hero 2.0 (the opening of the site)

Status: 🔵 In progress (2026-07-02) · Pri: P1 · Effort: XL · Area: Homepage hero + nav — DONE: F1 flame corona + prominences; F2 key-light pass (ambient cut to starlight, wrap-lit terminators via shared `hero/materials.ts`, deployments night-side settlement lights, garden cloud deck + ocean sheen, gas-giant aurora ovals + sun-scattering rings, sun-lit feathered atmospheres) and the comet's real double tail (ion ribbon w/ kinks, curved dust ribbon, drifting grains, perihelion breathing); F3 hover orbit focus + leading arcs (glow ahead, wake behind); F5a zodiacal wedge. Meteors + camera parallax pre-existed. NEXT: F4 dock choreography, F5 constellation egg.
Tracks: "start wireframing a much better solar system into the nav bar
experience — this is the opening of the page — make it fantastic." **No code
changes yet — planning surface only.**

## North-star

The first three seconds should feel like arriving at a real star system, not
loading a website: a sun with weight, planets with materials, light that
behaves, and the genie-collapse into the nav pill reading as *the system
docking itself* — one continuous camera thought from cosmos → instrument.

## What we have (baseline to beat)

- `components/hero/SystemScene.tsx` (~1.5k lines): procedural canvas textures,
  3-layer starfield (now per-star twinkle + spiked heroes), milky-way plane,
  nebula sprites, bloom, scroll-driven bezier collapse into `NavBar` slots.
- Weaknesses: planets read as textured billiard balls (no atmosphere rim, no
  terminator softness); sun is a shader ball + streaks (no corona dynamics);
  orbit lines are flat ellipses; dock transition eases positions but nothing
  *changes state* (no light response); no parallax authority from the pointer.

## Wireframe — the five upgrades that matter (in order)

### 1. The Sun becomes the light source you can feel
- Volumetric-feel corona: layered fresnel shells + radial "flame teeth" noise
  (vertex-displaced sprite ring), slow prominence arcs (2–3 animated bezier
  ribbons, additive).
- True key light: every planet's material lit by ONE directional from the sun
  position; terminator softened via wrap-lighting in a shared onBeforeCompile
  patch. Kill the current ambient flatness.
- Lens: anamorphic streak only when the sun is near screen centre; subtle
  chromatic ghost when it's off-axis. Bloom threshold tuned so only the sun +
  beacons bloom.

### 2. Planets get materials, atmospheres, and moments
- Shared `PlanetMaterial` patch: rim atmosphere (fresnel tinted per body),
  day/night terminator, specular ocean glint (garden world), city-light
  emissive on the night side of JD-1184 b (the "essays" gas giant gets aurora
  bands instead).
- Rings: light-scattering opacity (brighter where backlit by the sun).
- Each body gets ONE living detail: garden world cloud layer rotating
  independently; pulsar beam sweep already exists — keep; comet gets a real
  ion + dust double tail that always faces away from the sun.

### 3. Orbits become an instrument, not diagram lines
- Replace flat ellipse lines with gradient arcs that glow ahead of each planet
  (the path it's about to travel) and fade behind — reads as motion.
- Hover: the hovered body's arc brightens to full, others dim 30%; a thin
  "targeting" reticle eases onto the body (already have HoverCard — feed it).
- Pointer parallax: whole system yaws/pitches ≤2.5° toward the cursor with
  heavy damping (the Sanctum tilt feel, not a gimmick).

### 4. The dock (genie collapse) becomes a state change
- As scroll passes 30%: sun dims to ember, atmospheres compress, orbit arcs
  retract into the pill's hairline, starfield parallax-slides down 12% —
  "powering down to instrument mode."
- Each body arrives in its slot with a 60ms glow pulse in slot order (left →
  right), then the pill hairline draws itself 0→100%.
- Docked idle: bodies breathe (scale 1±0.02, 8s), sun ember flickers 1/f.

### 5. Deep sky that rewards stillness
- Once per ~40s idle on the hero: a meteor streak (1 quad, 400ms) on a random
  diagonal. Never during scroll/hover.
- Constellation easter egg: after 10s idle, faint hairlines connect the six
  nav bodies for 2s, then dissolve (the site's own constellation).
- Zodiacal light wedge (soft triangular gradient from the sun along the
  ecliptic) at 3% opacity — depth for free.

## Perf budget / guardrails
- All five upgrades are shader/sprite work on existing meshes — target ≤ +1ms
  GPU on the laptop baseline; zero new textures over 256²; no new deps.
- Reduced motion: parallax, meteors, prominences, breathing OFF; static corona.
- Mobile: upgrades 1–2 only (corona simplified to 2 shells), no parallax.

## Acceptance
- Cold-load hero elicits "whoa" without any interaction (test on 3 people).
- Docked pill still pixel-agrees with `slotCenters`/`pillBounds` store contract.
- `npm run build` clean; hero ≥ 55fps on the MacBook baseline; screenshot
  suite unchanged except intended visuals.

## To-do (frames)
- [x] F1 flame corona + prominences
- [x] F2 planet material patch (key light, wrap terminators, night lights,
      clouds, aurora, ring scattering, sun-lit atmospheres, comet double tail)
- [x] F3 hover focus + leading arcs (parallax pre-existed)
- [ ] F4 dock-as-state-change choreography
- [~] F5 partial: meteors pre-existed, zodiacal wedge shipped; constellation egg open

## Dependencies / risks
- Touches the hero store contract (slots/pill) — F4 must not change its shape.
- onBeforeCompile patches must respect the existing texture pipeline in
  `textures.ts`; keep every patch in one shared `hero/materials.ts`.
