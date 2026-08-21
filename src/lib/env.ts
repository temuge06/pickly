/**
 * Central feature-detection. Every provider/section keys off these booleans so
 * the app renders a complete public profile with zero keys configured (against
 * seed/fixture data) and only lights up a feature when its env is present.
 *
 * Never throw at import time here — a missing key is a hidden feature, not a
 * crash.
 */

function has(...keys: string[]): boolean {
  return keys.every((k) => {
    const v = process.env[k];
    return typeof v === "string" && v.length > 0;
  });
}

export const env = {
  // Database + Supabase Auth. The dashboard, auth, and all DB-backed reads
  // require this; without it the public profile falls back to fixtures.
  hasDatabase: has("DATABASE_URL"),
  hasSupabase: has(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ),
  hasSupabaseAdmin: has("SUPABASE_SERVICE_ROLE_KEY"),

  hasEncryptionKey: has("ENCRYPTION_KEY"),

  // Films degrade to manual entry without this. Music does not have an
  // equivalent — iTunes Search needs no key, so song search always works.
  hasTmdb: has("TMDB_API_KEY"),
  hasCronSecret: has("CRON_SECRET"),
  hasAskSalt: has("ASK_DAILY_SALT"),
} as const;

/**
 * True when the app has enough configured to run the authenticated dashboard.
 * The public profile works without this (fixtures); the dashboard does not.
 */
export const dashboardEnabled =
  env.hasDatabase && env.hasSupabase && env.hasSupabaseAdmin;

export function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}
