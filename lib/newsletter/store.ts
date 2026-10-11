import { createClient } from "@supabase/supabase-js";
import type { NewsletterRequest, NewsletterStore } from "./subscription";

type StoredRequest = { token_hash: string; email: string; preferences: NewsletterRequest["preferences"]; intent: NewsletterRequest["intent"]; ip_hash: string };
const decode = (row: StoredRequest): NewsletterRequest => ({ tokenHash: row.token_hash, email: row.email, preferences: row.preferences, intent: row.intent, ipHash: row.ip_hash });

export function createNewsletterStore(): NewsletterStore | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return {
    async issue(input) {
      const { data, error } = await db.rpc("newsletter_issue", { p_token_hash: input.tokenHash, p_email: input.email, p_preferences: input.preferences, p_intent: input.intent, p_ip_hash: input.ipHash });
      if (error) throw new Error("Newsletter storage unavailable");
      return data === true;
    },
    async read(hash) {
      const { data, error } = await db.from("newsletter_requests").select("token_hash,email,preferences,intent,ip_hash").eq("token_hash", hash).is("used_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
      if (error) throw new Error("Newsletter storage unavailable");
      return data ? decode(data as StoredRequest) : null;
    },
    async consume(hash) {
      const { data, error } = await db.rpc("newsletter_consume", { p_token_hash: hash });
      if (error) throw new Error("Newsletter storage unavailable");
      return data?.[0] ? decode(data[0] as StoredRequest) : null;
    },
  };
}
