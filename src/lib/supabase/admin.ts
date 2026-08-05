import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role client — bypasses RLS. Server-only. Used for storage uploads
 * (re-hosting pick images) and any path that must act outside a user session.
 * Never import this into client code.
 */
let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!env.hasSupabase || !env.hasSupabaseAdmin) {
    throw new Error("Supabase admin client requires URL + service role key.");
  }
  if (_admin) return _admin;
  _admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return _admin;
}
