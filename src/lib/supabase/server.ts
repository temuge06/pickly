import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client bound to the request's cookies, for reading the signed-in
 * user's session in server components / route handlers / server actions. Used
 * for AUTH ONLY — data reads/writes go through Drizzle with server-derived
 * ownership scoping. Returns null when Supabase isn't configured (dashboard
 * disabled, public profile still works).
 */
export async function createSupabaseServerClient() {
  if (!env.hasSupabase) return null;

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll can be called from a Server Component where mutating
            // cookies throws; the middleware refresh path handles renewal, so
            // this is safe to ignore.
          }
        },
      },
    },
  );
}
