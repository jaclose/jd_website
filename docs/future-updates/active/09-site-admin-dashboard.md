# 09 — Site admin dashboard (view it & sell it)

Status: 🟡 Planned · Pri: P2 · Effort: L · Area: Infra
Tracks: "tools to have a dashboard of the website to fully view it … or plugins
needed for sale to run it … allow it to be viewed in the dashboard."

> Note: the user also uses "dashboard" to mean *the homepage* (spec 01). This
> spec is the **admin/operator** dashboard — a private `/admin` to run the site.
> If "dashboard" turns out to mean only the homepage preview, this is still a
> worthwhile separate tool; confirm intent before building.

## Goal
A single private surface to **see the whole site at a glance** and manage it:
traffic + web-vitals, content status, email/subscriber health, error monitoring,
and (if monetizing) a "plugins / products for sale" area with checkout.

## Why it matters
Right now the site is run by editing files + reading Resend/Vercel separately.
One operator view = faster iteration and a foundation for selling.

## Wireframe
```
  /admin  (auth-gated)
  ┌───────────────────────────────────────────────────────────┐
  │ ▣ Traffic   ▣ Web Vitals   ▣ Errors        (live tiles)    │
  │ ── Content ───────────────  ── Email ───────────────────── │
  │  essays: 12  drafts: 3       subs: 480  last broadcast: ... │
  │  field-notes: 22             open rate: ..  domain: ✓ verified│
  │ ── Sanctum health ───────    ── Products / "plugins" ────── │
  │  build stamp · perf tier      [ item ]  $—  Stripe/LS link  │
  │ ── Quick actions ── [dispatch broadcast] [open /garden]     │
  └───────────────────────────────────────────────────────────┘
```

## To-do (frames)
- [ ] Decide scope: **operator dashboard** vs **homepage preview** (spec 01) vs
      both. Confirm with Jafar.
- [ ] Gate `/admin` behind auth (Supabase Auth or next-auth; single-admin OK).
- [ ] Traffic + Web Vitals tile: Vercel Analytics / Speed Insights (or Plausible
      / PostHog) — the "fully view it" signal.
- [ ] Error monitoring tile: Sentry (catch WebGL context-loss + API errors).
- [ ] Content tile: counts/status from `content/*.json` + draft flags.
- [ ] Email tile: subscriber counts + last broadcast pulled from Resend API
      (read-only); "dispatch broadcast" quick action → existing script/route.
- [ ] Sanctum health tile: build/commit stamp (reuse `SanctumBuildStamp`) + last
      measured perf tier.
- [ ] (Monetize) "plugins/products for sale" surface: list items + Stripe /
      Lemon Squeezy / Gumroad checkout. LS/Gumroad = merchant-of-record (handles
      sales tax) — likely simplest.
- [ ] Build UI with shadcn-ui + Tremor/Recharts; keep the site's palette/type.

## Tools / libraries
Supabase (in repo, `supabase/`) or next-auth; Vercel Analytics + Speed Insights;
Sentry; Tremor/shadcn-ui + Recharts; Stripe / Lemon Squeezy / Gumroad for sales;
Resend API (read). TOOLS-CATALOG §6.

## Acceptance criteria
- `/admin` is auth-gated and shows live traffic, vitals, content, and email
  health in one view.
- A broadcast can be triggered from the dashboard (or links to the safe path).
- If monetizing: at least one product is purchasable end-to-end in test mode.

## Dependencies / risks
- Auth + secrets handling must be careful (no keys client-side; mirror the
  newsletter route's server-only pattern).
- Overlaps spec 08 (email visibility). Monetization adds payment-provider + tax
  obligations — scope the "for sale" part as its own phase.
- Scope creep risk — ship read-only tiles first, actions later.
