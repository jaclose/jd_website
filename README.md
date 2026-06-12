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

## Stack

- **Next.js 15** (App Router, static output) + **TypeScript**
- **React Three Fiber / three.js** — the spatial hero (procedural canvas
  textures, raycast hover through a pointer-transparent canvas)
- **Tailwind CSS 4** + **framer-motion**
- **Supabase** (optional — schema in [supabase/migrations](supabase/migrations),
  the site runs fully from local content without it)
- Content migrated from WordPress via
  [scripts/import_wordpress.py](scripts/import_wordpress.py)

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
node scripts/screenshot.mjs   # visual smoke test (needs a running server)
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
- `data/garden.ts` — the trees; bump a `stage` and the planet greens
- `data/quotes.ts` — quote of the week (first entry wins)
- `data/changelog.ts` — the transmission log
- `data/achievements.ts` — unlock conditions computed from site state
