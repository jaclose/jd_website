// Pre-flight for the live features: validates the keys in .env.local (or the
// shell) against the real APIs and prints what to copy into Vercel.
// Never prints secret values.
//
//   npm run signals:check
import { loadEnv, readEnvLocal, upsertEnvLocal } from "./lib/env-local.mjs";

const env = loadEnv();
const results = [];
const ok = (group, detail) => results.push({ group, pass: true, detail });
const fail = (group, detail) => results.push({ group, pass: false, detail });
const has = (...keys) => keys.every((key) => env(key));

async function json(response) {
  return response.json().catch(() => ({}));
}

async function checkSpotify() {
  const group = "Spotify";
  if (!has("SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN")) {
    return fail(group, "missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET / SPOTIFY_REFRESH_TOKEN → npm run spotify:token");
  }
  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env("SPOTIFY_CLIENT_ID")}:${env("SPOTIFY_CLIENT_SECRET")}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: env("SPOTIFY_REFRESH_TOKEN") }),
  });
  const token = await json(tokenResponse);
  if (!tokenResponse.ok) {
    return fail(
      group,
      token.error === "invalid_grant"
        ? "refresh token rejected (expired after 6 months, or revoked) → npm run spotify:token"
        : `token refresh failed: ${token.error_description ?? token.error ?? tokenResponse.status}`
    );
  }
  const auth = { headers: { Authorization: `Bearer ${token.access_token}` } };
  const [now, recent] = await Promise.all([
    fetch("https://api.spotify.com/v1/me/player/currently-playing", auth),
    fetch("https://api.spotify.com/v1/me/player/recently-played?limit=5", auth),
  ]);
  if (now.status === 403 || recent.status === 403) {
    return fail(group, "403 from the player API: Premium lapsed on the app owner, or this account isn't on the app's User Management list");
  }
  if (!recent.ok) return fail(group, `recently-played returned ${recent.status}`);
  const plays = (await json(recent)).items?.length ?? 0;
  ok(group, `token ok · now playing: ${now.status === 200 ? "yes" : "nothing right now"} · ${plays} recent plays visible`);
}

async function checkStrava() {
  const group = "Strava";
  if (!has("STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET", "STRAVA_REFRESH_TOKEN")) {
    return fail(group, "missing STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET / STRAVA_REFRESH_TOKEN → npm run strava:token");
  }
  const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("STRAVA_CLIENT_ID"),
      client_secret: env("STRAVA_CLIENT_SECRET"),
      refresh_token: env("STRAVA_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
  });
  const token = await json(tokenResponse);
  if (!tokenResponse.ok) {
    return fail(group, `token refresh failed (${tokenResponse.status}: ${token.message ?? "rejected"}) → npm run strava:token`);
  }
  let rotated = "";
  if (token.refresh_token && token.refresh_token !== env("STRAVA_REFRESH_TOKEN")) {
    // the old token is dead the moment Strava hands out a new one — keep the new one
    if (process.env.STRAVA_REFRESH_TOKEN) {
      rotated = " · ⚠ Strava rotated the refresh token; the shell value is now stale — re-run npm run strava:token";
    } else {
      upsertEnvLocal({ STRAVA_REFRESH_TOKEN: token.refresh_token });
      rotated = " · Strava rotated the refresh token: .env.local updated, use the NEW value in Vercel";
    }
  }
  const activities = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=3", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (activities.status === 401) return fail(group, `activity scope missing → npm run strava:token (keep activity access ticked)${rotated}`);
  if (activities.status === 403) return fail(group, `403: Strava refused API access (Standard tier needs an active subscription)${rotated}`);
  if (activities.status === 429) return fail(group, `429: Strava rate limit hit, try again in 15 minutes${rotated}`);
  if (!activities.ok) return fail(group, `activities returned ${activities.status}${rotated}`);
  const list = await json(activities);
  ok(group, `token ok · ${Array.isArray(list) ? list.length : 0} recent activities visible${rotated}`);
}

async function checkResend() {
  const group = "Email (Resend)";
  if (!has("RESEND_API_KEY")) return fail(group, "missing RESEND_API_KEY (resend.com → API Keys → Full access)");
  const auth = { headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}` } };

  const domainsResponse = await fetch("https://api.resend.com/domains", auth);
  const domains = await json(domainsResponse);
  if (domains.name === "restricted_api_key" || domainsResponse.status === 401 || domainsResponse.status === 403) {
    return fail(group, "API key is Sending-only; signups need a Full access key (Resend → API Keys)");
  }
  if (!domainsResponse.ok) {
    return fail(group, `API key refused: ${domains.message ?? domains.name ?? domainsResponse.status}`);
  }

  const from = env("RESEND_FROM_EMAIL");
  const fromDomain = from.split("@")[1]?.toLowerCase();
  const domain = domains.data?.find((item) => item.name?.toLowerCase() === fromDomain);
  if (!from) fail(group, "missing RESEND_FROM_EMAIL (e.g. notes@jafardabbagh.com)");
  else if (!domain) fail(group, `${fromDomain} is not added in Resend → Domains`);
  else if (domain.status !== "verified") fail(group, `${fromDomain} is "${domain.status}" in Resend, not verified yet`);
  else ok(group, `sending domain ${fromDomain} verified`);

  const segmentsResponse = await fetch("https://api.resend.com/segments", auth);
  const segments = await json(segmentsResponse);
  if (!segmentsResponse.ok) return fail(group, `segments request failed: ${segmentsResponse.status}`);
  for (const key of ["SEGMENT_ESSAYS_ID", "SEGMENT_FIELDNOTES_ID"]) {
    const id = env(key);
    const segment = segments.data?.find((item) => item.id === id);
    if (!id) fail(group, `missing ${key} (Resend → Segments → create one, copy its ID)`);
    else if (!segment) fail(group, `${key} doesn't match any segment in this Resend account`);
    else ok(group, `${key} → "${segment.name}"`);
  }
}

async function checkStore() {
  const url = env("KV_REST_API_URL") || env("UPSTASH_REDIS_REST_URL");
  const token = env("KV_REST_API_TOKEN") || env("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) return; // optional
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(["PING"]),
  });
  const payload = await json(response);
  if (response.ok && payload.result === "PONG") ok("Token store (Upstash)", "reachable; Strava token rotation is covered");
  else fail("Token store (Upstash)", `PING failed: ${payload.error ?? response.status}`);
}

for (const check of [checkSpotify, checkStrava, checkResend, checkStore]) {
  try {
    await check();
  } catch (error) {
    fail(check.name.replace(/^check/, ""), `request failed: ${error instanceof Error ? error.message : error}`);
  }
}

let width = 0;
for (const result of results) width = Math.max(width, result.group.length);
console.log("");
for (const result of results) console.log(`${result.pass ? "✓" : "✗"} ${result.group.padEnd(width)}  ${result.detail}`);

const vercelKeys = [
  "SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN",
  "STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET", "STRAVA_REFRESH_TOKEN",
  "RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_FROM_NAME", "SEGMENT_ESSAYS_ID", "SEGMENT_FIELDNOTES_ID",
].filter((key) => readEnvLocal()[key]);
if (vercelKeys.length) {
  console.log(`\nFor Vercel → Settings → Environment Variables (Production), paste .env.local or add:\n  ${vercelKeys.join("\n  ")}`);
}
process.exit(results.some((result) => !result.pass) ? 1 : 0);
