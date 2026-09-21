/**
 * Shared plumbing for the Signal Layer relays (app/api/signals/*).
 *
 * Visitors only ever see calm, generic copy (data/signals.ts `offlineCopy`).
 * The real reason a relay is dark goes to the server log, and setup detail —
 * which env vars are missing — is returned only in local development.
 */
import { NextResponse } from "next/server";
import { nativeSignals, type NativeSignalId } from "@/data/signals";

export const IS_DEV = process.env.NODE_ENV === "development";

export interface CachedToken {
  value: string;
  /** epoch ms */
  expiresAt: number;
}

/** a cached access token that still has at least a minute of life */
export function liveToken(cache: CachedToken | null): string | null {
  return cache && cache.expiresAt - 60_000 > Date.now() ? cache.value : null;
}

/** thrown when the provider rejects the refresh token itself (revoked / expired / rotated) */
export class RefreshTokenRejected extends Error {}

function signal(provider: NativeSignalId) {
  return nativeSignals.find((item) => item.id === provider)!;
}

export function missingEnv(keys: string[]): string[] {
  return keys.filter((key) => !process.env[key]);
}

const warnedMissing = new Set<NativeSignalId>();

export function setupResponse(provider: NativeSignalId, missing: string[], extra: Record<string, unknown> = {}) {
  if (!warnedMissing.has(provider)) {
    warnedMissing.add(provider);
    console.warn(`[signals:${provider}] not configured — missing ${missing.join(", ")} (see docs/signals-setup.md)`);
  }
  return NextResponse.json(
    {
      provider,
      configured: false,
      message: IS_DEV
        ? `${signal(provider).label} needs ${missing.join(", ")} in .env.local — see docs/signals-setup.md.`
        : signal(provider).offlineCopy,
      ...(IS_DEV ? { needs: missing, ...extra } : {}),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * Failure backoff: after an upstream failure, answer from memory for a minute
 * instead of hammering the provider (and its rate limits) on every visit.
 */
const lastFailure = new Map<NativeSignalId, { at: number; detail: string }>();

export function recentFailure(provider: NativeSignalId) {
  const failure = lastFailure.get(provider);
  if (failure && Date.now() - failure.at < 60_000) return errorResponse(provider, failure.detail, false);
  return null;
}

export function errorResponse(provider: NativeSignalId, error: unknown, record = true) {
  const detail = error instanceof Error ? error.message : String(error);
  if (record) {
    lastFailure.set(provider, { at: Date.now(), detail });
    console.error(`[signals:${provider}] relay failed: ${detail}`);
  }
  return NextResponse.json(
    { provider, configured: true, message: IS_DEV ? detail : signal(provider).offlineCopy },
    { status: 502, headers: { "Cache-Control": "no-store" } }
  );
}

export function clearFailure(provider: NativeSignalId) {
  lastFailure.delete(provider);
}
