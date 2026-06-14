import { NextResponse } from "next/server";

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
  achievement_count?: number;
  kudos_count?: number;
}

interface StravaTokenResponse {
  access_token?: string;
  message?: string;
}

const needs = ["STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET", "STRAVA_REFRESH_TOKEN"];

function missingEnv() {
  return needs.filter((key) => !process.env[key]);
}

function setupResponse(missing: string[]) {
  return NextResponse.json(
    {
      provider: "strava",
      configured: false,
      message: "Strava native activity needs OAuth credentials before this site can render your activities.",
      needs: missing,
      docs: "https://developers.strava.com/docs/authentication/",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    client_secret: process.env.STRAVA_CLIENT_SECRET!,
    refresh_token: process.env.STRAVA_REFRESH_TOKEN!,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const payload = (await response.json()) as StravaTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.message ?? `Strava token refresh failed with ${response.status}`);
  }

  return payload.access_token;
}

function toNativeActivity(activity: StravaApiActivity) {
  return {
    id: String(activity.id),
    name: activity.name ?? "Untitled activity",
    type: activity.sport_type ?? activity.type ?? "Activity",
    distanceMeters: Math.round(activity.distance ?? 0),
    movingTimeSeconds: activity.moving_time ?? 0,
    totalElevationGainMeters: Math.round(activity.total_elevation_gain ?? 0),
    startDate: activity.start_date ?? null,
    averageSpeedMetersPerSecond: activity.average_speed ?? null,
    achievementCount: activity.achievement_count ?? 0,
    kudosCount: activity.kudos_count ?? 0,
  };
}

export async function GET() {
  const missing = missingEnv();
  if (missing.length) return setupResponse(missing);

  try {
    const accessToken = await getAccessToken();
    const limit = Math.min(Number(process.env.STRAVA_ACTIVITY_LIMIT ?? 5), 10);
    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${limit}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Strava activities request failed with ${response.status}`);
    }

    const payload = (await response.json()) as StravaApiActivity[];
    const activities = Array.isArray(payload) ? payload.map(toNativeActivity) : [];

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
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        provider: "strava",
        configured: true,
        message: error instanceof Error ? error.message : "Strava API request failed.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
