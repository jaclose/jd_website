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
import { durableToken, forgetMemoryToken, hasDurableStore, memoryToken, rememberToken } from "@/lib/signals/tokenStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface StravaApiActivity {
  id: number | string;
  name?: string;
  type?: string;
  sport_type?: string;
  distance?: number;
  moving_time?: number;
  total_elevation_gain?: number;
  start_date?: string;
  average_speed?: number;
  average_heartrate?: number;
  achievement_count?: number;
  kudos_count?: number;
}

interface StravaTokenResponse {
  access_token?: string;
  refresh_token?: string;
  /** epoch seconds */
  expires_at?: number;
  message?: string;
}

const NEEDS = ["STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET", "STRAVA_REFRESH_TOKEN"];
const TOKEN_KEY = "signals:strava:refresh_token";

/** access tokens live ~6h; reuse them across requests on a warm instance */
let accessToken: CachedToken | null = null;

async function refreshWith(refreshToken: string): Promise<StravaTokenResponse & { access_token: string }> {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID!,
      client_secret: process.env.STRAVA_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as StravaTokenResponse;
  if (response.ok && payload.access_token) return payload as StravaTokenResponse & { access_token: string };

  const detail = payload.message ?? `Strava token refresh failed with ${response.status}`;
  // 400/401 = Strava rejected this refresh token (revoked, or rotated away)
  if (response.status === 400 || response.status === 401) throw new RefreshTokenRejected(detail);
  throw new Error(detail);
}

/**
 * Candidate refresh tokens, freshest first: this instance's memory → the
 * durable store (another instance may have rotated it) → the env var.
 */
async function* refreshCandidates() {
  const seen = new Set<string>();
  const fromMemory = memoryToken(TOKEN_KEY);
  if (fromMemory) {
    seen.add(fromMemory);
    yield fromMemory;
  }
  const fromStore = await durableToken(TOKEN_KEY);
  if (fromStore && !seen.has(fromStore)) {
    seen.add(fromStore);
    yield fromStore;
  }
  const fromEnv = process.env.STRAVA_REFRESH_TOKEN!;
  if (!seen.has(fromEnv)) yield fromEnv;
}

async function getAccessToken(): Promise<string> {
  const cached = liveToken(accessToken);
  if (cached) return cached;

  let rejected: unknown = null;
  for await (const candidate of refreshCandidates()) {
    try {
      const token = await refreshWith(candidate);
      accessToken = {
        value: token.access_token,
        expiresAt: token.expires_at ? token.expires_at * 1000 : Date.now() + 3_600_000,
      };

      const current = token.refresh_token || candidate;
      if (current !== candidate || memoryToken(TOKEN_KEY) !== current) {
        const durable = await rememberToken(TOKEN_KEY, current);
        if (current !== candidate && !durable) {
          console.warn(
            "[signals:strava] Strava rotated the refresh token. It is held in memory only; connect Upstash Redis " +
              "in Vercel or update STRAVA_REFRESH_TOKEN (npm run strava:token) before this instance recycles."
          );
        }
      }
      return accessToken.value;
    } catch (error) {
      if (!(error instanceof RefreshTokenRejected)) throw error;
      rejected = error;
      if (candidate === memoryToken(TOKEN_KEY)) forgetMemoryToken(TOKEN_KEY);
    }
  }

  const hint = hasDurableStore() ? "" : " Re-run `npm run strava:token` and update STRAVA_REFRESH_TOKEN in Vercel.";
  throw new Error(`${rejected instanceof Error ? rejected.message : "Strava refresh token rejected."}${hint}`);
}

function toNativeActivity(activity: StravaApiActivity) {
  const id = String(activity.id);
  return {
    id,
    name: activity.name ?? "Untitled activity",
    type: activity.sport_type ?? activity.type ?? "Activity",
    distanceMeters: Math.round(activity.distance ?? 0),
    movingTimeSeconds: activity.moving_time ?? 0,
    totalElevationGainMeters: Math.round(activity.total_elevation_gain ?? 0),
    startDate: activity.start_date ?? null,
    averageSpeedMetersPerSecond: activity.average_speed ?? null,
    averageHeartRate: activity.average_heartrate ?? null,
    achievementCount: activity.achievement_count ?? 0,
    kudosCount: activity.kudos_count ?? 0,
    url: `https://www.strava.com/activities/${encodeURIComponent(id)}`,
  };
}

export async function GET() {
  const missing = missingEnv(NEEDS);
  if (missing.length) return setupResponse("strava", missing, { docs: "https://developers.strava.com/docs/authentication/" });

  const backoff = recentFailure("strava");
  if (backoff) return backoff;

  try {
    const token = await getAccessToken();
    const limit = Math.min(Math.max(Number(process.env.STRAVA_ACTIVITY_LIMIT ?? 5) || 5, 1), 10);
    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (response.status === 401) accessToken = null; // scope lost or token revoked: refresh next time
    if (!response.ok) {
      throw new Error(`Strava activities request failed with ${response.status}`);
    }

    const payload = (await response.json()) as StravaApiActivity[];
    const activities = Array.isArray(payload) ? payload.map(toNativeActivity) : [];
    clearFailure("strava");

    return NextResponse.json(
      {
        provider: "strava",
        configured: true,
        generatedAt: new Date().toISOString(),
        activities,
        summary: {
          activityCount: activities.length,
          totalDistanceMeters: activities.reduce((total, activity) => total + activity.distanceMeters, 0),
          totalMovingTimeSeconds: activities.reduce((total, activity) => total + activity.movingTimeSeconds, 0),
          latestStartDate: activities[0]?.startDate ?? null,
        },
      },
      // training changes slowly and Strava's read quota is small (100/15min,
      // 1,000/day): cache at the edge for 15 min, serve stale for an hour
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } }
    );
  } catch (error) {
    return errorResponse("strava", error);
  }
}
