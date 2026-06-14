import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface SpotifyTokenResponse {
  access_token?: string;
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

const needs = ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN"];

function missingEnv() {
  return needs.filter((key) => !process.env[key]);
}

function setupResponse(missing: string[]) {
  return NextResponse.json(
    {
      provider: "spotify",
      configured: false,
      message: "Spotify native listening needs OAuth credentials before this site can render now-playing or recent tracks.",
      needs: missing,
      scopes: ["user-read-currently-playing", "user-read-recently-played"],
      docs: "https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: process.env.SPOTIFY_REFRESH_TOKEN!,
  });
  const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString(
    "base64"
  );

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const payload = (await response.json()) as SpotifyTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? `Spotify token refresh failed with ${response.status}`);
  }

  return payload.access_token;
}

function normalizeSpotifyItem(item: SpotifyItem | null | undefined, playedAt?: string) {
  if (!item) return null;

  const artists = item.artists?.map((artist) => artist.name).filter(Boolean) ?? [];
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
  };
}

async function fetchCurrentlyPlaying(accessToken: string) {
  const response = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  if (response.status === 204) return { current: null, isPlaying: false, progressMs: null, note: null };
  if (!response.ok) {
    return {
      current: null,
      isPlaying: false,
      progressMs: null,
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

async function fetchRecentlyPlayed(accessToken: string) {
  const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=5", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as SpotifyRecentResponse;
  return (
    payload.items
      ?.map((entry) => normalizeSpotifyItem(entry.track, entry.played_at))
      .filter((track): track is NonNullable<ReturnType<typeof normalizeSpotifyItem>> => Boolean(track)) ?? []
  );
}

export async function GET() {
  const missing = missingEnv();
  if (missing.length) return setupResponse(missing);

  try {
    const accessToken = await getAccessToken();
    const [current, recent] = await Promise.all([fetchCurrentlyPlaying(accessToken), fetchRecentlyPlayed(accessToken)]);

    return NextResponse.json(
      {
        provider: "spotify",
        configured: true,
        generatedAt: new Date().toISOString(),
        current: current.current,
        isPlaying: current.isPlaying,
        progressMs: current.progressMs,
        device: current.device ?? null,
        note: current.note,
        recent,
      },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        provider: "spotify",
        configured: true,
        message: error instanceof Error ? error.message : "Spotify API request failed.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
