import type { NativeSignalId } from "@/data/signals";

export type NativeProvider = NativeSignalId;

export interface SetupSignalResponse {
  provider: NativeProvider;
  configured: false;
  message: string;
  needs: string[];
  docs?: string;
  scopes?: string[];
  officialApiAvailable?: boolean;
}

export interface StravaActivity {
  id: string;
  name: string;
  type: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  totalElevationGainMeters: number;
  startDate: string | null;
  averageSpeedMetersPerSecond: number | null;
  averageHeartRate: number | null;
  achievementCount: number;
  kudosCount: number;
}

export interface StravaSignalResponse {
  provider: "strava";
  configured: true;
  generatedAt: string;
  activities: StravaActivity[];
  summary: {
    activityCount: number;
    totalDistanceMeters: number;
    totalMovingTimeSeconds: number;
    latestStartDate: string | null;
  };
}

export interface SpotifyItem {
  id: string;
  name: string;
  type: string;
  artists: string[];
  collection: string | null;
  imageUrl: string | null;
  durationMs: number | null;
  playedAt: string | null;
}

export interface SpotifySignalResponse {
  provider: "spotify";
  configured: true;
  generatedAt: string;
  current: SpotifyItem | null;
  isPlaying: boolean;
  progressMs: number | null;
  device: string | null;
  note: string | null;
  recent: SpotifyItem[];
}

export type SignalResponse = SetupSignalResponse | StravaSignalResponse | SpotifySignalResponse;

export interface NativeState {
  loading: boolean;
  data: SignalResponse | null;
  error: string | null;
}

export function createNativeStates(): Record<NativeProvider, NativeState> {
  return {
    strava: { loading: false, data: null, error: null },
    spotify: { loading: false, data: null, error: null },
  };
}
