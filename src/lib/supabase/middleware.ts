import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { withTimeout } from "@/lib/timeout";

// Middleware runs before every page, so whatever it waits on is a hard ceiling
// for the whole site. Supabase gets this long and no longer.
const SUPABASE_TIMEOUT_MS = 3000;

function isProtected(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    // The notification feed is one creator's own inbox — it belongs behind the
    // same gate as /dashboard, not just behind the page's own redirect.
    pathname.startsWith("/notifications")
  );
}

/**
 * Served instead of a protected page when Supabase can't answer. We can't tell
 * who the visitor is, so the gate fails closed — but with a fast 503, not a
 * hang. Public pages never get here: they pass through and handle their own
 * data errors.
 */
function unavailable(): NextResponse {
  return new NextResponse(
    `<!doctype html><html lang="mn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LinkSpot</title></head><body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px;text-align:center"><div><h1 style="font-size:20px">Түр ажиллахгүй байна</h1><p>Temporarily unavailable. Please try again in a moment.</p></div></body></html>`,
    {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8", "retry-after": "30" },
    },
  );
}

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

  const { pathname } = request.nextUrl;
  const guarded = isProtected(pathname);

  let user: { id: string } | null = null;
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getUser(),
      SUPABASE_TIMEOUT_MS,
      "supabase.auth.getUser",
    );
    // A missing/expired session is an AuthSessionMissingError with status 400
    // — that is "signed out", not an outage. Only a network-level failure
    // (no status) means Supabase itself is unreachable.
    if (error && !error.status) throw error;
    user = data.user;
  } catch (err) {
    console.error("[middleware] Supabase unreachable:", err instanceof Error ? err.message : err);
    return guarded ? unavailable() : response;
  }

  const isAdmin = pathname.startsWith("/admin");

  // /admin has its own staff sign-in form rather than the creator /sign-in.
  // It is a rewrite, not a redirect, so the URL stays /admin and signing in
  // simply reloads the page the visitor asked for.
  const staffLogin = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/staff-login";
    url.search = "";
    const rewrite = NextResponse.rewrite(url, { request });
    for (const c of response.cookies.getAll()) rewrite.cookies.set(c);
    return rewrite;
  };

  if (isAdmin && !user) return staffLogin();

  if (guarded && !user) {
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
    let data: unknown = null;
    let error: unknown = null;
    try {
      ({ data, error } = await withTimeout(
        supabase.from("admin_user").select("id").eq("auth_user_id", user!.id).maybeSingle(),
        SUPABASE_TIMEOUT_MS,
        "admin_user lookup",
      ));
    } catch (err) {
      error = err;
    }

    // Fail closed: an errored check is a denied check. A signed-in non-staff
    // account gets the staff form too, so it can switch to a staff login.
    if (error || !data) return staffLogin();
  }

  return response;
}
