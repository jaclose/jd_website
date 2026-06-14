import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI ?? "http://127.0.0.1:8888/callback";
const scopes = ["user-read-currently-playing", "user-read-recently-played"];

if (!clientId || !clientSecret) {
  console.error(
    [
      "Missing Spotify credentials.",
      "",
      "Run this with:",
      'SPOTIFY_CLIENT_ID="your_client_id" SPOTIFY_CLIENT_SECRET="your_client_secret" npm run spotify:token',
      "",
      `Make sure this Redirect URI is added in the Spotify dashboard: ${redirectUri}`,
    ].join("\n")
  );
  process.exit(1);
}

const callbackUrl = new URL(redirectUri);

if (callbackUrl.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(callbackUrl.hostname)) {
  console.error(`This helper only supports local HTTP redirect URIs. Got: ${redirectUri}`);
  process.exit(1);
}

const state = randomBytes(16).toString("hex");
const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("client_id", clientId);
authorizeUrl.searchParams.set("scope", scopes.join(" "));
authorizeUrl.searchParams.set("redirect_uri", redirectUri);
authorizeUrl.searchParams.set("state", state);
authorizeUrl.searchParams.set("show_dialog", "true");

function sendHtml(res, statusCode, title, body) {
  res.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!doctype html><title>${title}</title><body style="font-family: system-ui; padding: 2rem;">${body}</body>`);
}

async function exchangeCode(code) {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error_description ?? payload.error ?? `Spotify token exchange failed: ${response.status}`);
  }

  return payload;
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? "/", redirectUri);

  if (requestUrl.pathname !== callbackUrl.pathname) {
    sendHtml(res, 404, "Not found", "<h1>Not found</h1>");
    return;
  }

  const error = requestUrl.searchParams.get("error");
  if (error) {
    sendHtml(res, 400, "Spotify authorization failed", `<h1>Spotify authorization failed</h1><p>${error}</p>`);
    server.close();
    return;
  }

  if (requestUrl.searchParams.get("state") !== state) {
    sendHtml(res, 400, "State mismatch", "<h1>State mismatch</h1><p>Restart the helper and try again.</p>");
    server.close();
    return;
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    sendHtml(res, 400, "Missing code", "<h1>Missing code</h1>");
    server.close();
    return;
  }

  try {
    const token = await exchangeCode(code);
    console.log("\nSpotify token exchange succeeded.\n");
    console.log("Add these to Vercel Production environment variables:\n");
    console.log(`SPOTIFY_CLIENT_ID=${clientId}`);
    console.log("SPOTIFY_CLIENT_SECRET=<the same secret you used for this command>");
    console.log(`SPOTIFY_REFRESH_TOKEN=${token.refresh_token}`);
    console.log("\nThen redeploy the site.\n");

    sendHtml(
      res,
      200,
      "Spotify token ready",
      "<h1>Spotify token ready</h1><p>Return to your terminal. The refresh token was printed there.</p>"
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    sendHtml(
      res,
      500,
      "Spotify token exchange failed",
      "<h1>Spotify token exchange failed</h1><p>Return to your terminal for the error.</p>"
    );
  } finally {
    server.close();
  }
});

server.listen(Number(callbackUrl.port || 80), callbackUrl.hostname, () => {
  console.log(`Listening for Spotify callback at ${redirectUri}\n`);
  console.log("Open this URL and approve the app:\n");
  console.log(authorizeUrl.toString());
  console.log("\nWaiting for Spotify...");
});
