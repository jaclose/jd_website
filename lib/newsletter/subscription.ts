import { createHash, randomBytes } from "node:crypto";
import { parsePreferences, type NewsletterPreference } from "./preferences";

export type NewsletterRequest = {
  tokenHash: string;
  email: string;
  preferences: NewsletterPreference[];
  intent: "subscribe" | "manage";
  ipHash: string;
};
export interface NewsletterStore {
  issue(input: NewsletterRequest): Promise<boolean>;
  read(tokenHash: string): Promise<NewsletterRequest | null>;
  consume(tokenHash: string): Promise<NewsletterRequest | null>;
}
export interface NewsletterProvider {
  sendLink(email: string, url: string, idempotencyKey: string): Promise<void>;
  preferences(email: string): Promise<NewsletterPreference[]>;
  save(email: string, preferences: NewsletterPreference[]): Promise<void>;
}
export type NewsletterResult = { ok: true; status: "check_email" | "saved"; httpStatus: number } | { ok: false; error: string; httpStatus: number };
export const tokenDigest = (token: string) => createHash("sha256").update(token).digest("hex");
export const validToken = (token: unknown): token is string => typeof token === "string" && /^[a-f0-9]{64}$/.test(token);
const fail = (error: string, httpStatus: number): NewsletterResult => ({ ok: false, error, httpStatus });

export async function subscribeToNewsletter({ body, store, provider, origin, ipHash }: {
  body: unknown; store: NewsletterStore | null; provider: NewsletterProvider | null; origin: string; ipHash: string;
}): Promise<NewsletterResult> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Invalid request.", 400);
  const input = body as Record<string, unknown>;
  // Never contact an address supplied by a honeypot submission.
  if (typeof input.company === "string" && input.company.trim()) return { ok: true, status: "check_email", httpStatus: 200 };
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Enter a valid email address.", 400);
  const intent = input.intent === "manage" ? "manage" : "subscribe";
  const preferences = parsePreferences(input.preferences);
  if (intent === "subscribe" && (!preferences?.length || input.consent !== true)) return fail("Choose at least one kind of update and agree to receive it.", 400);
  if (!store || !provider) return fail("Email signup is temporarily unavailable. Your address has not been subscribed. Please try again later.", 503);
  const token = randomBytes(32).toString("hex");
  const tokenHash = tokenDigest(token);
  try {
    const accepted = await store.issue({ tokenHash, email, preferences: preferences ?? [], intent, ipHash });
    if (!accepted) return fail("Too many requests. Please wait an hour before trying again.", 429);
    // Fragment keeps the bearer credential out of access logs and referrers.
    await provider.sendLink(email, `${origin}/newsletter/confirm#${token}`, `newsletter/${tokenHash}`);
    return { ok: true, status: "check_email", httpStatus: 200 };
  } catch {
    return fail("We couldn’t send the confirmation link. Please try again later.", 502);
  }
}

export async function saveNewsletterPreferences({ token, preferences, store, provider }: {
  token: unknown; preferences: unknown; store: NewsletterStore; provider: NewsletterProvider;
}): Promise<NewsletterResult> {
  const selected = parsePreferences(preferences);
  if (!validToken(token) || !selected) return fail("Invalid preference request.", 400);
  try {
    // Atomic, single use. A failed provider call also consumes the credential;
    // request a fresh link rather than replaying old consent after an unsubscribe.
    const request = await store.consume(tokenDigest(token));
    if (!request) return fail("This link has expired or was already used. Request a new link.", 410);
    await provider.save(request.email, selected);
    return { ok: true, status: "saved", httpStatus: 200 };
  } catch {
    return fail("We couldn’t finish saving. Request a new link to check your preferences and try again.", 502);
  }
}
