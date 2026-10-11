# JD-1184 — jafardabbagh.com

A personal universe. The hero is a solar system used as navigation: planets
are the main sections, lesser bodies are the living details. Scroll, and the
system collapses into the nav bar — the planets dock, keep rotating, and show
their names. Scroll back up and it unfolds again.

## The system

| Body | Designation | Section |
| --- | --- | --- |
| Gas giant (3 moons = 3 latest essays) | `JD-1184 b` | Essays |
| Periodic comet | `C/2025 JD` | Field Notes |
| Terraforming terrestrial | `JD-1184 c` | The Garden |
| Rocky inner world | `JD-1184 d` | About |
| Pulsar | `PSR J1184+22` | Quote of the Week |
| Star cluster | `GLD-7` | Achievements |

**The greening function** ([data/garden.ts](data/garden.ts)): every skill is a
tree with a growth stage 0–5. The garden planet's texture is generated from
the cumulative score — at 15 growth points vegetation shows from orbit, at 50
the first seas condense. Grow the skills, terraform the planet.

The garden ships **barren** — `skills` is an empty array until the first
pursuit is planted. Add an entry (a template lives at the top of
`data/garden.ts`) and the rows, the homepage teaser, the achievements, and
the hero planet all update on the next build.

### The Sanctum (`/garden`)

The full Garden route is **The Sanctum** — a guided, cinematic walk in three
zones: the **Room of Entanglement** (a dim interior of dead screens and cable
vines) → the **Threshold** (a doorway where vines cross and warm light leaks in)
→ the **Living Sanctum** (a cultivated forest of real CC0 vegetation, with each
life-chapter standing as a physical landmark). Built with R3F in
[components/sanctum](components/sanctum); see that folder's structure for the
camera rig, wind shaders, quality tiers, and zones. The walk reuses the existing
[data/gardenPaths.ts](data/gardenPaths.ts) node graph and
[data/gardenFeatures.ts](data/gardenFeatures.ts) plaque content. Real assets are
CC0 (Poly Haven + ambientCG) under `public/sanctum/` — see
`public/sanctum/CREDITS.md`. The homepage keeps the lighter original walk.

## Stack

- **Next.js 15** (App Router, static content + server routes) + **TypeScript**
- **React Three Fiber / three.js** — the spatial hero (procedural canvas
  textures, raycast hover through a pointer-transparent canvas)
- **Tailwind CSS 4** + **framer-motion**
- **Supabase** (optional — schema in [supabase/migrations](supabase/migrations),
  reading runs from local content; email confirmation requires the server database)
- Content migrated from WordPress via
  [scripts/import_wordpress.py](scripts/import_wordpress.py)

## Develop

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # production build
npm test           # domain, provider, database, and project-data checks
npm run lint
npm run typecheck
npm run test:browser:newsletter # after build; Chrome installed, no remote services
```

## Deploy

**Vercel:** import the GitHub repo at vercel.com/new. `vercel.json` pins the
framework to Next.js (the project must not use the "Other" preset / a
`public` output directory). Every push to `main` deploys.

**Supabase (when ready):** create a project, run
`supabase/migrations/0001_init.sql` in the SQL editor, then set
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel.

## Content

- `content/essays.json`, `content/field-notes.json`, `content/about.json` —
  migrated writing (re-run the import script to refresh from WordPress)
- `data/garden.ts` — the trees; plant one with the template, bump a `stage`,
  and the planet greens
- `data/meta.ts` — essay/field-note cover art + pull-quote highlights
- `data/works.ts` — the Archive (PDFs live in `public/works/`)
- `data/quotes.ts` — quote of the week (first entry wins)
- `data/changelog.ts` — the transmission log
- `data/achievements.ts` — unlock conditions computed from site state

## Current project and editorial direction

The active medical study project is **AXOM**, linked to [axom.info](https://axom.info)
and [jaclose/AXOM](https://github.com/jaclose/AXOM). Its own application mark is used
in the Duel Field. The early Med App remains in the collapsed garden history;
authored essays and dated changelog entries retain their original wording.

The homepage offers direct reading and email entry points alongside the JD-1184
solar navigation. Touch, reduced motion, and unavailable WebGL get a calm chart;
mobile and reduced-motion project cards have direct links. The garden's readable
catalog remains available alongside the 3D walk.

## Email and release

[Email setup and operations](docs/email-system.md) covers confirmed opt-in,
preferences, unsubscribe, the migration, and manual publication dispatch.
[Deployment audit and release gates](docs/release-2026-10-11.md) records the verified
production repository and missing configuration. A branch preview is not an
email-delivery acceptance test. Do not merge before the release gates are reviewed.
