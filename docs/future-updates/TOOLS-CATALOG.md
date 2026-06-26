# Tools catalog — passive ideas

A menu of libraries, apps, services, and plugins worth considering for the work
in `active/`. **Nothing here is installed or decided** — it's a shopping list to
pull from. Web-native (ships to the browser) is split from authoring tools (you
run locally; only their output ships). License column flags anything non-free.

Already staged in the repo (see EXPERIENCE_ROADMAP): `three-custom-shader-material`,
`zustand`, `maath`. Already used: `three`, `@react-three/fiber`,
`@react-three/drei`, `@react-three/postprocessing`, `three-mesh-bvh`, `lenis`.

---

## 1. 3D / rendering (web-native, ships to browser)

| Tool | Use it for | License | Notes |
|---|---|---|---|
| `three-custom-shader-material` | PBR-correct custom GLSL on grass/bark/terrain/water | MIT | already staged; migrate hot shaders to it |
| `@react-three/drei` `<Detailed>` / `<Instances>` | tree LOD + far billboards; grass instancing | MIT | already a dep |
| `@react-three/postprocessing` `GodRays`, `DepthOfField`, `Bloom`, `N8AO` | god-rays through canopy, focus, ground AO | MIT | ultra-tier only; watch cost |
| `three-mesh-bvh` | fast ground raycast + collision (already used) | MIT | reuse for staircase step-up |
| `troika-three-text` | crisp SDF diegetic labels/plaques in-scene | MIT | lighter than HTML overlays |
| `@react-three/rapier` | real physics if you want footstep collision / props | MIT/Apache | heavier; only if movement needs it |
| `meshline` / drei `<QuadraticBezierLine>` | stream edge foam, vine cables | MIT | cheap stylized lines |
| `lygia` (GLSL include lib) | noise/fbm/sdf snippets for terrain & water shaders | MIT | copy snippets, don't bloat bundle |
| `gltfjsx` | turn authored GLB into typed R3F components | MIT | dev-time only |

## 2. Procedural nature (web-native generation)

| Tool / technique | Use it for | Notes |
|---|---|---|
| FBM / domain-warped simplex noise in GLSL | terrain heightfield, moisture/slope masks | already partly in `lib/terrain.ts` |
| Poisson-disk / blue-noise scatter | natural grass & tree placement (no grid look) | `maath` has distributions |
| GPU instanced grass cards w/ wind vertex shader | dense Witcher-style meadow at low cost | mirror `grassWind.ts` |
| Flow-map (R/G = uv velocity) on water | river current without a sim | author flow-map as a texture |
| Gerstner waves (sum of sines) | stream/lake surface displacement | classic, cheap, tunable |
| Curl-noise particle drift | pollen, mist motes, leaf fall | reuse fireflies pattern |

## 3. Authoring tools (run locally; only exports ship — never run here)

| App | Output → web | License | Notes |
|---|---|---|---|
| Blender | `.glb` (Draco+webp) → `public/sanctum/models/` | GPL/free | hero props, terrain sculpt, bake |
| Blender Geometry Nodes | scatter/foliage baked to GLB | free | procedural authoring offline |
| SpeedTree (or free: Tree It, The Grove) | tree GLB | paid / free | LOD-friendly trees |
| Quixel Megascans / Poly Haven | CC0 PBR textures + HDRIs + scans | **CC0** | the safe source — see CREDITS rule |
| Substance / Materialize (free) | tiling PBR sets | paid / free | terrain & bark materials |
| Gaea / World Creator | terrain heightmaps + splat masks | paid | export heightmap → web heightfield |
| Audacity | clean/loop ambience stems | free | for soundscape stems |

> Hard rule from CLAUDE.md / EXPERIENCE_ROADMAP: **CC0 only** under
> `public/sanctum/`, logged in `public/sanctum/CREDITS.md`. UE5/Blender are
> authoring tools, not the shipping renderer.

## 4. Audio / soundscape

| Tool | Use it for | License | Notes |
|---|---|---|---|
| Web Audio API (native) | current procedural wind/water bed | — | already in `SanctumAudioSystem` |
| `howler.js` | layered ambience stems w/ crossfade + spatial | MIT | simplest path to per-zone beds |
| Tone.js | generative/granular ambient music layer | MIT | heavier; for a musical underscore |
| `positionalAudio` (three) | per-source 3D audio (stream, birds) | MIT | already used for water |
| Freesound.org / Soundstripe / Epidemic | CC0/licensed nature stems | mixed | **verify license**, prefer CC0 |
| ElevenLabs / OpenAI TTS | narration for the deferred NPC essay-walk | paid | deferred (D01) |

## 5. Email (spec 08)

| Tool | Role | Notes |
|---|---|---|
| **Resend** (current) | contacts, segments, broadcasts, deliverability | already wired; `docs/email-system.md` |
| React Email | author broadcast templates as components | pairs with Resend |
| Resend Audiences/Segments API | list management | already the chosen path |
| Alt: Buttondown / ConvertKit / Loops | if Resend limits hit | only if migrating |
| `@upstash/ratelimit` + Redis | durable signup rate-limit (vs in-memory) | for scale |

## 6. Site admin dashboard & "plugins to run/sell it" (spec 09)

| Tool | Role | License | Notes |
|---|---|---|---|
| Vercel Analytics + Speed Insights | traffic + Core Web Vitals on the live site | paid tier | quickest "view the whole site" signal |
| Supabase (already in repo) | data, auth, realtime for an admin area | free tier | `supabase/` dir exists |
| `next-auth` / Supabase Auth | gate `/admin` behind login | MIT | single-admin is fine |
| Tremor / shadcn-ui + Recharts | build the dashboard UI fast | MIT | charts + cards |
| Sentry | error monitoring for the 3D + API routes | paid tier | catch WebGL/context-loss crashes |
| Plausible / PostHog | privacy-friendly analytics + funnels | mixed | PostHog adds session replay |
| **Sell/monetize:** Stripe / Lemon Squeezy / Gumroad | "plugins for sale" checkout | paid % | LS/Gumroad = merchant-of-record (handles tax) |
| Vercel OG | auto social cards for essays/products | MIT | marketing polish |

## 7. Performance / smoothness (spec 07)

| Tool | Use it for | Notes |
|---|---|---|
| `r3f-perf` | live fps/draw-call/memory HUD in dev | first thing to add for spec 07 |
| Chrome DevTools Performance + `stats.js` | frame timeline, GC spikes | find the choppiness source |
| drei `<AdaptiveDpr>` / `<AdaptiveEvents>` | auto-drop resolution under load | quick smoothness win |
| drei `<PerformanceMonitor>` | escalate/de-escalate quality by fps | wire into `SanctumQualityManager` |
| `@gltf-transform/cli` | compress/simplify GLB (Draco+webp+meshopt) | already in pipeline notes |
| KTX2 / basis textures | GPU-compressed textures, less VRAM | loader is KTX2-ready |
| web workers / OffscreenCanvas | move terrain gen off main thread | for heavy procedural gen |

## 8. Dev / workflow

| Tool | Use it for | Notes |
|---|---|---|
| `node scripts/screenshot.mjs` | visual regression of hero/bar/garden | the project's verify step |
| Playwright | automate the screenshot/perf capture across routes | extends the existing script |
| Figma MCP (available) | design dashboard/admin UI before coding | code↔design bridge |
| Storybook | isolate the dashboard components | optional |
