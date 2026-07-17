import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl, isCloudEnabled } from "./config";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isCloudEnabled()) return null;
  if (!client) {
    client = createClient(getSupabaseUrl()!, getSupabaseAnonKey()!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,
      },
    });
  }
  return client;
}

/** @deprecated use getSupabase() — kept for legacy imports */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const sb = getSupabase();
    if (!sb) {
      throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    }
    return Reflect.get(sb, prop);
  },
});
