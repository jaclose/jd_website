# Changelog — shipped

Normal change log: things that **actually landed**. Newest first. One line per
change, dated `YYYY-MM-DD`. When you ship an item from `active/`, add it here and
flip that spec's `Status:` to 🟢 Shipped.

Format: `YYYY-MM-DD — [area] short description (spec ref, commit/PR)`

## Unreleased

### 2026-07-02e — Email automation + desk environment + premium cards

- 2026-07-02 — [email] **Auto-broadcast pipeline**: deployments (duel field)
  join essays + field notes in the dispatch queue (`deployedAt` on
  `data/deployments.ts`, deployment template copy, optional
  SEGMENT_DEPLOYMENTS_ID riding the essays segment by default); new
  `--test-to=<email>` mode emails ONE address the latest item with the real
  template (no broadcast, no log); `.github/workflows/broadcast.yml` sends on
  every push to main touching content/deployments and commits the dispatch
  log (no-ops until RESEND secrets are added). Test path verified via
  DRY_RUN render. Actual test send pending env access (see README command).
- 2026-07-02 — [field-notes] **Letter scroll truly fixed**: `data-lenis-prevent`
  on both reader scroll columns — Lenis eats window wheel events even while
  stopped, which is why the first fix wasn't enough. Verified: reader 0→295px
  while page stayed at 0.
- 2026-07-02 — [field-notes] **The desk is the environment**: full-bleed plank
  wood (seams, knots, tonal drift), room vignette/lamp/dust lifted above the
  surface, visible "filed <date>" line on every letter, envelope-throat V
  seams, first-visit hint chip ("pick the letters up…") that dismisses on
  first grab, glideier collisions (friction .32, air .055, restitution .14).
- 2026-07-02 — [essays] **Premium pass on the cards** (they read cheap):
  foil ring desaturated + slowed (26s), machined dark rim + inner bevels,
  aged-bone chips/plaques, burnished banner gold, calmer sparkles/dots.
- 2026-07-02 — [homepage] **Dashboard essays section rebuilt**: the crossfade
  panel is now a working corner of the archive — three collector cards that
  unseal into the cinematic reader in place + "Enter the archive" CTA.
- 2026-07-02 — [docs] **Solar System Hero 2.0 wireframed (spec 12)** — sun
  corona/key-light, planet materials, living orbit arcs, dock-as-state-change,
  idle theatre. No hero code touched, per request.


### 2026-07-02d — Holo card pass + letter-scroll fix

- 2026-07-02 — [essays] **Collector-holo card restyle** (per TCG Pocket
  reference shots, translated into archive vocabulary): rotating rainbow foil
  ring tinted per collection, chip + name + reading-metric header with a
  collection sigil disc, sparkle fields over the art, holo-dot sheet, thesis
  rail pill, twin foot plaques (filed/length), rarity marks (✦/✦✦/rainbow ✦✦✦)
  and the gold diagonal collection banner. `useCardTilt` adds a ≤5° pointer
  tilt + tracked glare (fine pointers only; reduced-motion off). Rounded
  corners are deliberate here — the card is its own object.
- 2026-07-02 — [field-notes] **Letter scroll fixed**: Lenis hijacks wheel at
  window level, so the page scrolled behind the opened letter — both readers
  now stop/start Lenis and contain overscroll; the letter column scrolls
  natively.
- 2026-07-02 — [field-notes] **Fidelity pass**: contact shadows that grow as a
  letter lifts, real flap shading + back-of-envelope seams, perforated stamp +
  postmark ring on envelope styles, aged-edge vignettes, fold creases at
  thirds on the opened sheet.
- 2026-07-02 — [field-notes] **Physics throughput**: matter engine sleeping
  enabled + the rAF loop skips React commits entirely when every letter is at
  rest — idle table costs ~zero renders; grabbing wakes the body explicitly.

### 2026-07-02c — Essay Archive + Field Notes table

- 2026-07-02 — [essays] **Essay Archive experience**: /essays rebuilt as a
  private reading room — atmospheric hero (grain/dust/constellations, slow
  parallax, "ARCHIVE STATUS: 07 WORKS PRESERVED"), a featured centerpiece, and
  the collection shelved in three standings (Archive Entry / Relic Essay /
  Immersive Record) across five theme collections (Return, Sanctum, Blackout,
  Legacy, Field Study — CSS variables in `data/essayThemes.ts`). Artifacts open
  through a cinematic reader (artwork expands from the shelf rect → title →
  meta → body), Escape + focus return, reduced-motion fades. Driven entirely by
  `data/essays.ts` joined with the real migrated content; /essays/[slug]
  permanent pages untouched.
- 2026-07-02 — [field-notes] **The table, finished**: the orphaned physics
  table (matter-js components/hooks/data existed with no CSS and no page) got
  its full visual layer (`fieldNotesTable.css`, `fieldNoteReader.css`) — wood
  desk from gradients + SVG grain, lamplight, dust, eight letter variants with
  seals/ribbons/photographs, hover lift, drag/throw shadows, and the
  envelope→seal→flap→sheet→reader opening sequence with a settle-back close.
  /field-notes now renders the table full-screen with the server-rendered
  dispatch log kept beneath for SEO + signup. Verified headless: drag + throw
  displaces neighbours, letter opens to the paper reader, Escape returns.

### 2026-07-02b — Merge-to-main + mobile walk + perf stepping

- 2026-07-02 — [repo] **Everything merged to main + pushed** so Vercel deploys:
  sanctum/build-stamp (game layer et al.) fast-forwarded into main; Vercel Web
  Analytics + Speed Insights branches merged (`<Analytics/>` + `<SpeedInsights/>`
  in the root layout). Stale branches deliberately *not* merged: the two
  duel-field agent branches are already ancestors of main; the "refactor" +
  codex-backup branches touch deleted pre-Sanctum files (would resurrect dead
  code); the wordpress-migration branch is the pre-redesign site.
- 2026-07-02 — [sanctum] **Mobile walk joystick (spec 05 → fully walkable on
  touch)**: `SanctumJoystick` (coarse pointers only, Living Sanctum only) writes
  an analog vector into the `touchMove` bridge; the rig blends it with the keys,
  keeps analog magnitude, and entering the stick auto-starts free-roam like WASD.
- 2026-07-02 — [sanctum] **fps→tier auto-stepping (spec 07)**: sustained decline
  from `PerformanceMonitor` now steps the resolved quality tier down one notch
  at a time (down-only, so it can never oscillate) until "low".

### 2026-07-02 — Game layer + first-person pass (spec 05 core ✅; 03/04 partial; 10 wireframed)

- 2026-07-02 — [sanctum] **Quests, secrets, achievements**: data-driven quest
  layer (`lib/quests.ts`) + persistent progress store (`lib/progress.ts`,
  zustand + localStorage, explicit post-mount hydration). Top-right quest
  tracker with live distance-to-objective; achievement toasts; 12 achievements
  (5 secret, masked as ???); four hidden secret landmarks (`SanctumSecrets`:
  listening stone, stone fox, mushroom ring, first seed); proximity tripwires
  (`SanctumQuestSensor`) — everything completes by *walking there*, not clicking.
- 2026-07-02 — [sanctum] **Guide beacon** (`SanctumGuide`): the tracked quest
  renders a soft light column + pulsing ring at its next objective and a chevron
  that swims ~3m ahead of the walker; all of it fades out inside ~7m so arrival
  belongs to the world. The secret quest deliberately gets no guide.
- 2026-07-02 — [sanctum] **First-person walk (spec 05 core ✅)**: pressing WASD
  in the Living Sanctum *enters* free-roam (no toggle hunting); true 360°
  heading with drag-turn + screen-edge turn + ←→/Q/E keys; Shift sprint with a
  subtle FOV kick; velocity ease-in/out; axis-separated collision sliding along
  trunks; walked metres feed the Wanderer achievement. Overlay and rig sync
  through a `sanctumControl.setFreeRoam` pub/sub.
- 2026-07-02 — [sanctum] **Nature rehaul (specs 03/04 partial)**: `groundHeight`
  rebuilt on domain-warped value-noise FBM (kills the sine-grid look) + gentle
  bank lift so the trail sits cradled; cobbles replaced by a worn packed-dirt
  ribbon with ragged alpha edges; instanced stepping-stone slabs down the
  centreline; border stones strung along both shoulders (`trailLineScatter`);
  grass upgraded to bowed 3-blade tufts with per-instance colour variation.
- 2026-07-02 — [sanctum] **Visual discoveries**: landmarks introduce themselves
  with in-world nameplate sprites that resolve on approach (canvas textures, no
  font fetches); the inspector was redesigned visual-first — growth data drawn
  as concentric tree rings, long-form story collapsed behind "The Story".
- 2026-07-02 — [homepage] **Sanctum preloading**: `SanctumPreloader` warms all
  zone GLBs + PBR texture sets during idle time right after site load (skips
  data-saver/2g), so the walk mounts against hot caches from the dashboard.
- 2026-07-02 — [essays] **Walkable audio essays wireframed (spec 10)**: schema
  in `data/audioEssays.ts` (segments, anchors, advance modes, moods, set-pieces)
  plus a draft walk of "The Cost of Knowing Better" over the medicine fork.
- 2026-07-02 — [hero] Starfield: per-star twinkle (shader-patched points with a
  phase attribute) replaces whole-layer pulsing; added a sparse layer of large
  diffraction-spiked hero stars.
- 2026-07-02 — [field-notes] Fixed a stray `useEffect` outside the hook body in
  `useLetterPhysics.ts` that broke `next build`.
- 2026-07-02 — Verified: build clean; headless Chromium drive-through (trailhead
  vista, quest log open, WASD auto-free-roam, 360° turn, off-trail wander) with
  no console errors.

### 2026-06-26c — Iron-out pass (IDE clean + visually verified via headless Chromium)

- 2026-06-26 — [tooling] Added `.markdownlint.json` (project doc-lint policy) so
  the Problems pane is clean for the planning docs; removed the duplicate-`id`
  hint + dynamic-`aria` error by collapsing `SanctumExperience` to **one** stable
  `<section id>` for all states (loading/fallback/live). `touch-none` now applies
  only while walking, so it no longer traps mobile page-scroll past the section.
- 2026-06-26 — [sanctum] Terrain softened: the earlier amplitude carved a *trench*
  beside the path; reduced octaves + widened the flatten band (9m) → open, rolling
  Skellige-style clearing.
- 2026-06-26 — [sanctum] Cobblestone reworked for legibility: fewer/larger neutral-
  grey stones, dark mortar + crisp outline + specular nick + domed bump; now reads
  clearly as laid stone at walking distance.
- 2026-06-26 — **Visually verified** with headless Chromium (`scripts/screenshot`):
  no console errors on `/`, `/garden`; living monitor shows the jafardabbagh.com
  hero on the Room screen; room reads as furnished; cobble path + open terrain
  confirmed; homepage `#garden` section present and a valid snap target (renders
  the Sanctum inline). Build clean.

### 2026-06-26b — Feedback pass (snap root-cause, hero monitor, cobbles, terrain, room)

- 2026-06-26 — [homepage] **Snap root cause fixed (spec 01)**: `SanctumExperience`
  now keeps a stable `<section id>` wrapper in *all* states (loading / fallback /
  live). Before, the early returns rendered an id-less element, so when
  `SectionSnap` registered targets on first render the garden snap point didn't
  exist — hence "won't snap / not updated on the dashboard."
- 2026-06-26 — [sanctum] **Living monitor → real hero**: `LivingMonitor` rebuilt
  to mirror the actual jafardabbagh.com hero (nebula, ringed sun + orbiting
  bodies, "Jafar Dabbagh", the tagline, the top-right HUD readout, scroll prompt).
- 2026-06-26 — [sanctum] **Cobblestone path**: procedural cobble texture (baked
  rounding + bump) replaces the worn-dirt trail material; ribbon widened to 3.0m.
- 2026-06-26 — [sanctum] **Better terrain**: `groundHeight` now layers broad
  hills + mounds + fine bumps (trail stays flat so footing/cobbles read true).
- 2026-06-26 — [sanctum] **Wider cursor look + walk feel**: guided look cone
  widened (yaw 0.42→0.72, pitch 0.2→0.34); stronger footstep bob/sway so the
  guided traversal reads as walking from the POV.
- 2026-06-26 — [sanctum] **Room built out**: chair, rug, corkboard of notes, warm
  desk lamp, cold side window, strewn papers; cables rerouted off the central
  corridor + thinner to stop clipping the camera. _(WASD free-roam deferred per
  request — still wired but not the focus.)_
- 2026-06-26 — Verified: `npm run build` clean.

### 2026-06-26 — Sanctum core pass (specs 06, 02 complete; 05, 07, 01 partial)

- 2026-06-26 — [sanctum] **Adaptive soundscape (spec 06 ✅)**: new
  `lib/audioMoods.ts` (per-zone twin of `moods.ts`) + rewrote `SanctumAudioSystem`
  into layered procedural beds — wind, leaf-rustle, cold room hum, insect shimmer,
  scheduled birdsong, positional stream, and footstep one-shots — that crossfade
  per zone via Web Audio `setTargetAtTime`. Footfalls fire from the camera rig.
- 2026-06-26 — [sanctum] **Living monitor (spec 02 ✅)**: new
  `LivingMonitor.tsx` paints the site (browser chrome, name, orbiting
  solar-system motif, scanline) to a `CanvasTexture` on the Room's main screen
  (unlit emissive); warmed its practical light. No iframe/cross-origin/font risk.
- 2026-06-26 — [sanctum] **Free-roam + walk feel (spec 05, partial)**: camera rig
  gains a free-roam mode (`sanctumControl.freeRoam`) bounded by `SANCTUM_BOUNDS` +
  collisions, wider look cone, a speed-driven footstep head-bob + lateral sway,
  and footstep-cadence audio. _Remaining: authored staircase step-up, full 360°
  turning, on-screen mobile move control._
- 2026-06-26 — [sanctum] **Adaptive performance (spec 07, partial)**: added drei
  `PerformanceMonitor` + `AdaptiveDpr` + `AdaptiveEvents` to the scene.
  _Remaining: fps→tier auto-stepping, instancing/LOD audit, r3f-perf baseline._
- 2026-06-26 — [homepage] **Inline control handoff (spec 01, partial)**:
  "Walk here" pauses lenis scroll/snap so arrow keys + drag drive the scene
  inline (Esc/Exit returns); look-around now works on touch (drag) + mouse
  (hover). _Remaining: verify/repair the snap-root measurement itself._
- 2026-06-26 — Verified: `npm run build` clean (types + lint).

## 2026-06-25

- 2026-06-25 — [docs] Created the `future-updates/` control room: master index,
  tools catalog, normal + deferred changelogs, and 9 active / 5 deferred specs.
  No feature code changed. (planning only)

<!--
Reference of prior Sanctum work already in git (for context, not re-logged here):
  71a5022 cinematic pass — lit room, procedural sky/water, homepage wire-up
  4cbb809 heavier systems — spatial audio, BVH walking, denser flora
  95b5917 initial Sanctum: 3D forest sanctuary
-->
