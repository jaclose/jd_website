# Live features setup — Signal Layer + email list

One-time setup for the homepage **Signal Layer** (Strava + Spotify) and the
**email signup**. Keys go into `.env.local` first (gitignored), get verified
against the real APIs with `npm run signals:check`, then get copied to Vercel.
The helpers are dependency-free — they run without `npm install`.

Until a relay is configured, visitors see a calm offline line — never setup
detail. Missing env names are only shown in `npm run dev`.

## 1 · Spotify — needs Spotify Premium on the app owner's account

Spotify's developer mode stops working without Premium (Feb 2026 rules).

1. [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → **Create app**
   - App name: `JD-1184 Signal Layer` (no "Spotify" in the name)
   - Website: `https://www.jafardabbagh.com`
   - Redirect URI: `http://127.0.0.1:8888/callback` (Spotify rejects `localhost`)
   - APIs used: **Web API**
2. App → **Settings** → copy the Client ID and Client secret into `.env.local`
   (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`).
3. `npm run spotify:token` → approve in the browser → `SPOTIFY_REFRESH_TOKEN`
   is written to `.env.local`.
4. Listening on a different Spotify account than the developer one? Add it
   under the app's **User Management**.

**Every 6 months:** Spotify ends the authorization six months after you approve
it (refreshing doesn't extend it). The board goes dark with `invalid_grant` in
the logs → re-run `npm run spotify:token`, update the value in Vercel, redeploy.

## 2 · Strava — needs an active Strava subscription (June 2026 rules)

1. [strava.com/settings/api](https://www.strava.com/settings/api) → create an app
   - Application Name: `JD-1184 Signal` (the name can't contain "Strava")
   - Category: Visualizer · Website: `https://www.jafardabbagh.com`
   - Authorization Callback Domain: `localhost`
   - Upload any icon (Strava requires one)
2. Copy the Client ID and Client Secret into `.env.local`
   (`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`).
3. `npm run strava:token` → approve, leaving **View data about your activities**
   ticked → `STRAVA_REFRESH_TOKEN` is written to `.env.local`.

Terms: Strava's API Agreement says a user's data "can only be displayed or
disclosed in your Developer Application to that user". Showing the owner's
own activity to visitors conflicts with the letter of that clause; the site
owner has accepted that risk. The board links activities with the required
"View on Strava" wording and never draws Strava's logo.

**Token rotation:** Strava may issue a new refresh token on any refresh and
kill the old one. The relay persists rotated tokens when Upstash Redis is
connected (step 6); without it, a rotation lasts until the serverless instance
recycles, then the board goes dark and the logs say to re-run
`npm run strava:token`.

## 3 · Email — Resend

The DNS side is already done: `jafardabbagh.com` carries Resend's DKIM, SPF
(`send.`) and DMARC records.

1. [resend.com/domains](https://resend.com/domains) → confirm `jafardabbagh.com` shows **Verified**.
2. **API Keys** → Create → permission **Full access** (Sending access can't
   create contacts) → `RESEND_API_KEY`.
3. **Segments** → create `Essays` and `Field Notes` → copy their IDs →
   `SEGMENT_ESSAYS_ID`, `SEGMENT_FIELDNOTES_ID`.
4. `RESEND_FROM_EMAIL=notes@jafardabbagh.com`, `RESEND_FROM_NAME=Jafar Dabbagh`.

## 4 · Verify locally

```bash
npm run signals:check
```

Every line should read ✓. It never prints secret values. If Strava rotates the
token during the check, `.env.local` is updated — copy the new value.

## 5 · Vercel

Project → **Settings → Environment Variables** → paste the contents of
`.env.local` into the key field (Vercel splits it into variables) → Environment:
**Production** → Save. Then redeploy (Deployments → ⋯ → Redeploy), or push —
env changes only apply to new deployments.

Check: `https://www.jafardabbagh.com/api/signals/spotify` and `/strava` should
return `"configured": true` with data.

## 6 · Optional — Upstash Redis (covers Strava token rotation)

Vercel → **Storage** → Create Database → **Upstash for Redis** (free tier) →
connect it to this project. It injects `KV_REST_API_URL` / `KV_REST_API_TOKEN`;
redeploy. `npm run signals:check` pings it when those are in `.env.local`.
The same store can back the newsletter rate limiter later (spec 08).

## Auto-broadcast (not needed for signups)

`.github/workflows/broadcast.yml` emails the list when content lands on `main`,
once `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SEGMENT_ESSAYS_ID` and
`SEGMENT_FIELDNOTES_ID` exist as **GitHub repo secrets**. The dispatch log was
baselined on 2026-09-21 (`npm run email:dispatch -- --baseline`), so the back
catalogue won't be re-sent — only work published after that.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Spotify dark, logs `invalid_grant` | 6-month authorization ended or access revoked | `npm run spotify:token`, update Vercel, redeploy |
| Spotify 403 on player endpoints | Premium lapsed on the app owner, or account not in User Management | renew Premium / add the account |
| Strava dark, logs "refresh token rejected" | token rotated without a store, or access revoked | `npm run strava:token`; connect Upstash |
| Strava 403 | API access refused (subscription lapsed) | renew the subscription |
| Strava 429 | read quota (100/15 min, 1,000/day) | responses are edge-cached 15 min; wait it out |
| Signup says "isn't configured yet" | missing `RESEND_API_KEY` or segment IDs in Vercel | step 3 + 5 |
