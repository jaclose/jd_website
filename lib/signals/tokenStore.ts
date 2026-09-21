/**
 * Durable home for OAuth refresh tokens that rotate (Strava).
 *
 * Strava may hand back a *new* refresh token on any refresh and invalidates the
 * old one immediately, so a token pinned in an env var can go stale. When the
 * Upstash Redis integration is connected in Vercel (Storage → Upstash for
 * Redis), the rotated token is written there and every instance reads it back.
 * Without it, rotated tokens live in module memory only and the relay logs a
 * warning telling you to refresh the env var (`npm run strava:token`).
 *
 * Env (injected automatically by the Vercel Marketplace integration):
 *   KV_REST_API_URL + KV_REST_API_TOKEN            (Vercel KV naming), or
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 */
function storeConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  return url && token ? { url, token } : null;
}

export function hasDurableStore(): boolean {
  return storeConfig() !== null;
}

const memory = new Map<string, string>();

async function command(args: string[]): Promise<unknown> {
  const { url, token } = storeConfig()!;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as { result?: unknown; error?: string };
  if (!response.ok || payload.error) {
    throw new Error(`token store ${args[0]} failed: ${payload.error ?? response.status}`);
  }
  return payload.result;
}

/** value cached in this instance, if any */
export function memoryToken(key: string): string | null {
  return memory.get(key) ?? null;
}

/** read straight from the durable store (bypasses this instance's memory) */
export async function durableToken(key: string): Promise<string | null> {
  if (!hasDurableStore()) return null;
  try {
    const value = await command(["GET", key]);
    return typeof value === "string" && value ? value : null;
  } catch (error) {
    console.error(`[signals] ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

/** remember a token in memory and, when available, in the durable store */
export async function rememberToken(key: string, value: string): Promise<boolean> {
  memory.set(key, value);
  if (!hasDurableStore()) return false;
  try {
    await command(["SET", key, value]);
    return true;
  } catch (error) {
    console.error(`[signals] ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

export function forgetMemoryToken(key: string) {
  memory.delete(key);
}
