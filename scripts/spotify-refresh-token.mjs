// Spotify → SPOTIFY_REFRESH_TOKEN in .env.local
//
//   1. developer.spotify.com/dashboard → your app → Settings:
//      Redirect URI  http://127.0.0.1:8888/callback   (Spotify rejects "localhost")
//   2. put SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET in .env.local
//   3. npm run spotify:token        (approve in the browser → token saved)
//
// Spotify ends an authorization 6 months after you approve it (refreshing does
// not extend it). Re-run this before then and update the value in Vercel.
// Flags: --print-url · --code=<pasted redirect URL>  (see scripts/lib/oauth-cli.mjs)
import { randomBytes } from "node:crypto";
import { loadEnv, upsertEnvLocal } from "./lib/env-local.mjs";
import { runAuthorizationCode } from "./lib/oauth-cli.mjs";

const env = loadEnv();
const clientId = env("SPOTIFY_CLIENT_ID");
const clientSecret = env("SPOTIFY_CLIENT_SECRET");
const redirectUri = env("SPOTIFY_REDIRECT_URI") || "http://127.0.0.1:8888/callback";
const scopes = ["user-read-currently-playing", "user-read-recently-played"];

if (!clientId || !clientSecret) {
  console.error(
    [
      "Missing Spotify credentials.",
      "",
      "Add these to .env.local (from developer.spotify.com/dashboard → your app → Settings):",
      "  SPOTIFY_CLIENT_ID=…",
      "  SPOTIFY_CLIENT_SECRET=…",
      "",
      `and make sure this Redirect URI is registered on the app: ${redirectUri}`,
    ].join("\n")
  );
  process.exit(1);
}

const callback = new URL(redirectUri);
if (callback.protocol !== "http:" || callback.hostname !== "127.0.0.1") {
  console.error(`Use a loopback redirect like http://127.0.0.1:8888/callback (got ${redirectUri}).`);
  process.exit(1);
}

const state = randomBytes(16).toString("hex");
const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
authorizeUrl.search = new URLSearchParams({
  response_type: "code",
  client_id: clientId,
  scope: scopes.join(" "),
  redirect_uri: redirectUri,
  state,
  show_dialog: "true",
}).toString();

async function exchange(code) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
  });
  const token = await response.json().catch(() => ({}));
  if (!response.ok || !token.refresh_token) {
    throw new Error(token.error_description ?? token.error ?? `Spotify token exchange failed: ${response.status}`);
  }

  upsertEnvLocal({
    SPOTIFY_CLIENT_ID: clientId,
    SPOTIFY_CLIENT_SECRET: clientSecret,
    SPOTIFY_REFRESH_TOKEN: token.refresh_token,
  });

  const renewBy = new Date(Date.now() + 182 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  console.log("\n✓ Spotify connected — SPOTIFY_REFRESH_TOKEN saved to .env.local.");
  console.log(`  Spotify ends this authorization around ${renewBy}; re-run npm run spotify:token before then.`);

  // prove the scopes work end to end
  const recent = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (recent.ok) {
    const latest = (await recent.json()).items?.[0]?.track;
    console.log(`  Relay check: ${latest ? `last played "${latest.name}"` : "no recent plays yet"}.`);
  } else {
    console.log(
      `  Relay check failed (${recent.status}). 403 usually means the app owner has no Premium, or this Spotify ` +
        "account isn't on the app's User Management list."
    );
  }
  console.log("\nNext: npm run signals:check");
}

runAuthorizationCode({ label: "Spotify", authorizeUrl: authorizeUrl.toString(), redirectUri, state, exchange }).catch(
  (error) => {
    console.error(`\n✗ ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
);
