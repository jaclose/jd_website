// Strava → STRAVA_REFRESH_TOKEN in .env.local
//
//   1. strava.com/settings/api → create an app:
//      Website  https://www.jafardabbagh.com
//      Authorization Callback Domain  localhost
//   2. put STRAVA_CLIENT_ID + STRAVA_CLIENT_SECRET in .env.local
//   3. npm run strava:token   (approve in the browser; keep "View data about
//      your activities" ticked → token saved)
//
// Strava can rotate refresh tokens; the relay handles that when Upstash Redis
// is connected in Vercel (docs/signals-setup.md). Otherwise re-run this if the
// board goes dark and the logs mention a rejected refresh token.
// Flags: --print-url · --code=<pasted redirect URL>  (see scripts/lib/oauth-cli.mjs)
import { randomBytes } from "node:crypto";
import { loadEnv, upsertEnvLocal } from "./lib/env-local.mjs";
import { runAuthorizationCode } from "./lib/oauth-cli.mjs";

const env = loadEnv();
const clientId = env("STRAVA_CLIENT_ID");
const clientSecret = env("STRAVA_CLIENT_SECRET");
const redirectUri = env("STRAVA_REDIRECT_URI") || "http://localhost:8889/callback";
const scope = "read,activity:read";

if (!clientId || !clientSecret) {
  console.error(
    [
      "Missing Strava credentials.",
      "",
      "Add these to .env.local (from strava.com/settings/api):",
      "  STRAVA_CLIENT_ID=…",
      "  STRAVA_CLIENT_SECRET=…",
    ].join("\n")
  );
  process.exit(1);
}

const state = randomBytes(16).toString("hex");
const authorizeUrl = new URL("https://www.strava.com/oauth/authorize");
authorizeUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: "code",
  approval_prompt: "force",
  scope,
  state,
}).toString();

async function exchange(code, params) {
  const granted = params.get("scope");
  if (granted && !granted.split(/[ ,]/).some((item) => item === "activity:read" || item === "activity:read_all")) {
    throw new Error(
      `Strava granted "${granted}" without activity access. Run again and leave "View data about your activities" ticked.`
    );
  }

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, grant_type: "authorization_code" }),
  });
  const token = await response.json().catch(() => ({}));
  if (!response.ok || !token.refresh_token) {
    throw new Error(token.message ?? `Strava token exchange failed: ${response.status}`);
  }

  upsertEnvLocal({
    STRAVA_CLIENT_ID: clientId,
    STRAVA_CLIENT_SECRET: clientSecret,
    STRAVA_REFRESH_TOKEN: token.refresh_token,
  });

  const who = [token.athlete?.firstname, token.athlete?.lastname].filter(Boolean).join(" ");
  console.log(`\n✓ Strava connected${who ? ` as ${who}` : ""} — STRAVA_REFRESH_TOKEN saved to .env.local.`);

  const activities = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=1", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (activities.ok) {
    const [latest] = await activities.json();
    console.log(`  Relay check: ${latest ? `latest activity "${latest.name}"` : "no activities yet"}.`);
  } else {
    console.log(
      `  Relay check failed (${activities.status}). 401 = activity scope missing; 403/429 = API access or quota ` +
        "(Strava's Standard tier now needs an active subscription)."
    );
  }
  console.log("\nNext: npm run signals:check");
}

runAuthorizationCode({ label: "Strava", authorizeUrl: authorizeUrl.toString(), redirectUri, state, exchange }).catch(
  (error) => {
    console.error(`\n✗ ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
);
