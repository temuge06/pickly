import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the Supabase session cookie on every matched request and guards
 * /dashboard and /notifications (signed in) and /admin (signed in AND staff).
 * When Supabase isn't configured, this is a pass-through so the public site
 * works with zero keys.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!env.hasSupabase) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");
  // The notification feed is one creator's own inbox — it belongs behind the
  // same gate as /dashboard, not just behind the page's own redirect.
  const isNotifications = pathname.startsWith("/notifications");

  if ((isDashboard || isAdmin || isNotifications) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // /admin is a real access boundary, not a hidden nav item: staff can write to
  // any creator's data. Signed in is not enough — the account must have an
  // admin_user row, checked HERE at the route level so a non-staff user never
  // reaches the page at all.
  //
  // The lookup runs through PostgREST with the *user's own* session, so the
  // admin_user_self_read RLS policy is what authorizes it — the same boundary
  // the server components and server actions re-check. A non-staff session can
  // only ever read back an empty set, so this cannot be spoofed from the client.
  if (isAdmin) {
    const { data, error } = await supabase
      .from("admin_user")
      .select("id")
      .eq("auth_user_id", user!.id)
      .maybeSingle();

    // Fail closed: an errored check is a denied check.
    if (error || !data) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
