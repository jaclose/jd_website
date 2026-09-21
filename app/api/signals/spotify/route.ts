import { NextResponse } from "next/server";
import {
  RefreshTokenRejected,
  clearFailure,
  errorResponse,
  liveToken,
  missingEnv,
  recentFailure,
  setupResponse,
  type CachedToken,
} from "@/lib/signals/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface SpotifyTokenResponse {
  access_token?: string;
  /** seconds */
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface SpotifyImage {
  url: string;
}

interface SpotifyArtist {
  name?: string;
}

interface SpotifyItem {
  id?: string;
  uri?: string;
  name?: string;
  type?: string;
  duration_ms?: number;
  external_urls?: { spotify?: string };
  album?: {
    name?: string;
    images?: SpotifyImage[];
  };
  artists?: SpotifyArtist[];
  images?: SpotifyImage[];
  show?: {
    name?: string;
    images?: SpotifyImage[];
  };
}

interface SpotifyCurrentResponse {
  is_playing?: boolean;
  progress_ms?: number | null;
  currently_playing_type?: string;
  item?: SpotifyItem | null;
  device?: {
    name?: string;
    type?: string;
  } | null;
}

interface SpotifyRecentResponse {
  items?: {
    played_at?: string;
    track?: SpotifyItem;
  }[];
}

const NEEDS = ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN"];

/** access tokens live 1h; reuse them across requests on a warm instance */
let accessToken: CachedToken | null = null;

async function getAccessToken() {
  const cached = liveToken(accessToken);
  if (cached) return cached;

  const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: process.env.SPOTIFY_REFRESH_TOKEN! }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as SpotifyTokenResponse;
  if (response.ok && payload.access_token) {
    accessToken = { value: payload.access_token, expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000 };
    return accessToken.value;
  }

  if (payload.error === "invalid_grant") {
    // Spotify refresh tokens expire 6 months after the original authorization
    // (refreshing does not extend them) — re-authorize to get a new one.
    throw new RefreshTokenRejected(
      "Spotify rejected the refresh token (invalid_grant: expired after 6 months, or revoked). " +
        "Run `npm run spotify:token` and update SPOTIFY_REFRESH_TOKEN in Vercel."
    );
  }
  throw new Error(payload.error_description ?? payload.error ?? `Spotify token refresh failed with ${response.status}`);
}

function normalizeSpotifyItem(item: SpotifyItem | null | undefined, playedAt?: string) {
  if (!item) return null;

  const artists = item.artists?.map((artist) => artist.name).filter((name): name is string => Boolean(name)) ?? [];
  const imageUrl = item.album?.images?.[0]?.url ?? item.images?.[0]?.url ?? item.show?.images?.[0]?.url ?? null;

  return {
    id: item.id ?? item.uri ?? item.name ?? "spotify-item",
    name: item.name ?? "Untitled",
    type: item.type ?? "track",
    artists: artists.length ? artists : item.show?.name ? [item.show.name] : [],
    collection: item.album?.name ?? item.show?.name ?? null,
    imageUrl,
    durationMs: item.duration_ms ?? null,
    playedAt: playedAt ?? null,
    url: item.external_urls?.spotify ?? null,
  };
}

async function fetchCurrentlyPlaying(token: string) {
  const response = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode",
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (response.status === 204) return { current: null, isPlaying: false, progressMs: null, device: null, note: null };
  if (response.status === 401) accessToken = null;
  if (!response.ok) {
    // 403 here usually means the app owner's Premium lapsed or the listening
    // account isn't on the app's allowlist (Spotify dev-mode rules, Feb 2026)
    console.error(`[signals:spotify] currently-playing returned ${response.status}`);
    return {
      current: null,
      isPlaying: false,
      progressMs: null,
      device: null,
      note: `Currently-playing request returned ${response.status}`,
    };
  }

  const payload = (await response.json()) as SpotifyCurrentResponse;
  return {
    current: normalizeSpotifyItem(payload.item),
    isPlaying: Boolean(payload.is_playing),
    progressMs: payload.progress_ms ?? null,
    device: payload.device?.name ?? payload.device?.type ?? null,
    note: null,
  };
}

async function fetchRecentlyPlayed(token: string) {
  const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=6", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error(`[signals:spotify] recently-played returned ${response.status}`);
    return [];
  }

  const payload = (await response.json()) as SpotifyRecentResponse;
  return (
    payload.items
      ?.map((entry) => normalizeSpotifyItem(entry.track, entry.played_at))
      .filter((track): track is NonNullable<ReturnType<typeof normalizeSpotifyItem>> => Boolean(track)) ?? []
  );
}

export async function GET() {
  const missing = missingEnv(NEEDS);
  if (missing.length) {
    return setupResponse("spotify", missing, {
      scopes: ["user-read-currently-playing", "user-read-recently-played"],
      docs: "https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens",
    });
  }

  const backoff = recentFailure("spotify");
  if (backoff) return backoff;

  try {
    const token = await getAccessToken();
    const [current, recent] = await Promise.all([fetchCurrentlyPlaying(token), fetchRecentlyPlayed(token)]);
    clearFailure("spotify");

    return NextResponse.json(
      {
        provider: "spotify",
        configured: true,
        generatedAt: new Date().toISOString(),
        current: current.current,
        isPlaying: current.isPlaying,
        progressMs: current.progressMs,
        device: current.device,
        note: current.note,
        recent,
      },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    if (error instanceof RefreshTokenRejected) accessToken = null;
    return errorResponse("spotify", error);
  }
}
