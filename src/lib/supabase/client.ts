"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client, used only to kick off magic-link sign-in from the
 * sign-in page. The anon key is public by design; RLS is what keeps it safe.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
