import assert from "node:assert/strict";
import test from "node:test";
import { forgetMemoryToken } from "../lib/signals/tokenStore";
import { clearFailure } from "../lib/signals/server";

/**
 * Relay behaviour against a fake upstream: token reuse, Strava refresh-token
 * rotation (memory → store → env fallback) and visitor-safe failures.
 */
type Call = { url: string; body: string };

function fakeUpstream(handlers: Record<string, (call: Call) => { status: number; body: unknown }>) {
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? String(init.body) : "";
    const call = { url, body };
    calls.push(call);
    const key = Object.keys(handlers).find((prefix) => url.startsWith(prefix));
    if (!key) throw new Error(`unexpected fetch ${url}`);
    const { status, body: payload } = handlers[key](call);
    return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return calls;
}

type RouteModule = { GET: () => Promise<Response> };

/** a cold serverless instance: fresh route module, empty token memory, no backoff */
function freshRoute(provider: "strava" | "spotify"): RouteModule {
  if (provider === "strava") forgetMemoryToken("signals:strava:refresh_token");
  clearFailure(provider);
  const file = require.resolve(`../app/api/signals/${provider}/route.ts`);
  delete require.cache[file];
  return require(file) as RouteModule;
}
const freshStravaRoute = async () => freshRoute("strava");

const ACTIVITY = { id: 42, name: "Morning run", sport_type: "Run", distance: 5000, moving_time: 1500, start_date: "2026-09-20T10:00:00Z" };

test("strava: rotation is followed, access tokens are reused, env is the last resort", async () => {
  process.env.STRAVA_CLIENT_ID = "id";
  process.env.STRAVA_CLIENT_SECRET = "secret";
  process.env.STRAVA_REFRESH_TOKEN = "R0";
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;

  const valid = new Set(["R0"]);
  let issued = 0;
  const calls = fakeUpstream({
    "https://www.strava.com/oauth/token": ({ body }) => {
      const token = new URLSearchParams(body).get("refresh_token")!;
      if (!valid.has(token)) return { status: 400, body: { message: "Bad Request" } };
      // rotate: kill the old token, issue a new one
      valid.delete(token);
      const next = `R${++issued}`;
      valid.add(next);
      return { status: 200, body: { access_token: `A${issued}`, refresh_token: next, expires_at: Math.floor(Date.now() / 1000) + 6 * 3600 } };
    },
    "https://www.strava.com/api/v3/athlete/activities": () => ({ status: 200, body: [ACTIVITY] }),
  });

  const route = await freshStravaRoute();
  const first = await route.GET();
  assert.equal(first.status, 200);
  const payload = await first.json();
  assert.equal(payload.configured, true);
  assert.equal(payload.activities[0].url, "https://www.strava.com/activities/42");
  assert.match(first.headers.get("cache-control") ?? "", /s-maxage=900/);

  // second request on the same instance reuses the access token: no refresh
  const before = calls.filter((c) => c.url.includes("oauth")).length;
  await route.GET();
  assert.equal(calls.filter((c) => c.url.includes("oauth")).length, before, "access token should be reused");

  // a cold instance only has the (now dead) env token R0 → visitor-safe 502, no leak
  const cold = await freshStravaRoute();
  const dead = await cold.GET();
  assert.equal(dead.status, 502);
  const deadBody = await dead.json();
  assert.doesNotMatch(JSON.stringify(deadBody), /Bad Request|STRAVA_|refresh/i);
});

test("strava: a rotated token survives cold starts through the store", async () => {
  process.env.STRAVA_REFRESH_TOKEN = "S0";
  process.env.KV_REST_API_URL = "https://kv.test";
  process.env.KV_REST_API_TOKEN = "kv-token";

  const kv = new Map<string, string>();
  const valid = new Set(["S0"]);
  let issued = 0;
  fakeUpstream({
    "https://kv.test": ({ body }) => {
      const [cmd, key, value] = JSON.parse(body) as string[];
      if (cmd === "SET") kv.set(key, value);
      return { status: 200, body: { result: cmd === "GET" ? kv.get(key) ?? null : "OK" } };
    },
    "https://www.strava.com/oauth/token": ({ body }) => {
      const token = new URLSearchParams(body).get("refresh_token")!;
      if (!valid.has(token)) return { status: 400, body: { message: "Bad Request" } };
      valid.delete(token);
      const next = `S${++issued}`;
      valid.add(next);
      return { status: 200, body: { access_token: `B${issued}`, refresh_token: next, expires_at: Math.floor(Date.now() / 1000) + 30 } };
    },
    "https://www.strava.com/api/v3/athlete/activities": () => ({ status: 200, body: [ACTIVITY] }),
  });

  const a = await freshStravaRoute();
  assert.equal((await a.GET()).status, 200);
  assert.equal(kv.get("signals:strava:refresh_token"), "S1", "rotated token persisted");

  // cold instance: env S0 is dead, but the store has S1 → still live
  const b = await freshStravaRoute();
  assert.equal((await b.GET()).status, 200);
  assert.equal(kv.get("signals:strava:refresh_token"), "S2");
});

test("spotify: invalid_grant stays visitor-safe", async () => {
  process.env.SPOTIFY_CLIENT_ID = "id";
  process.env.SPOTIFY_CLIENT_SECRET = "secret";
  process.env.SPOTIFY_REFRESH_TOKEN = "expired";
  fakeUpstream({
    "https://accounts.spotify.com/api/token": () => ({ status: 400, body: { error: "invalid_grant", error_description: "Refresh token revoked" } }),
  });
  const route = freshRoute("spotify");
  const response = await route.GET();
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.doesNotMatch(JSON.stringify(body), /invalid_grant|revoked|SPOTIFY_/i);
});
