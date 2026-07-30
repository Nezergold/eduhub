function getEnv(): Record<string, string | undefined> {
  return ((import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env ?? {});
}

/** True when Supabase URL + anon key are configured (multi-device cloud mode). */
export function isCloudEnabled(): boolean {
  const env = getEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url?.trim() && key?.trim());
}

export function getSupabaseUrl(): string | undefined {
  return getEnv().VITE_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string | undefined {
  return getEnv().VITE_SUPABASE_ANON_KEY;
}

/** JWT anon key (eyJ...) or modern publishable key (sb_publishable_...). */
export function isValidSupabaseAnonKey(key: string | undefined): boolean {
  if (!key?.trim()) return false;
  const k = key.trim();
  if (k.startsWith("eyJ") && k.length > 80) return true;
  if (k.startsWith("sb_publishable_")) return true;
  return false;
}

/** Human-readable issue when cloud env vars are misconfigured. */
export function getCloudConfigIssue(): string | null {
  const env = getEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  if (!isValidSupabaseAnonKey(key)) {
    return "Invalid API key in .env.eduhub — use the anon/public key from Supabase Dashboard → Settings → API (starts with eyJ... or sb_publishable_...), not the project ID.";
  }
  return null;
}
