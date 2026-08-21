import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { searchMusic } from "@/lib/metadata/search";

export const dynamic = "force-dynamic";

/**
 * Song search for the dashboard's "Дуу хөгжим" section, proxied through our
 * own origin rather than called from the browser: iTunes answers with no CORS
 * headers, and going through a route keeps the lookup behind the same
 * signed-in check every other dashboard write already has.
 *
 * A route (not a server action like films/books) because the input is
 * debounced per keystroke — a plain GET is cancellable via AbortController,
 * which is what keeps a fast typist from racing stale results onto the screen.
 */
export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  return NextResponse.json({ results: await searchMusic(q) });
}
