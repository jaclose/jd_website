import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase is optional: without env vars the site renders entirely from
 * the local content/ and data/ files. When the project is linked, dynamic
 * data (quotes, garden stages, guestbook) can move server-side without
 * touching the components.
 */
export function supabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
