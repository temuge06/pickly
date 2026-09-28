import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on pages only. Everything under /_next, the icon/robots/sitemap files
  // browsers fetch on their own, and any path ending in a static-file
  // extension skip middleware entirely, so they never wait on Supabase. Route
  // protection for /dashboard lives in updateSession.
  matcher: [
    "/((?!_next/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:ico|png|jpe?g|gif|svg|webp|avif|bmp|tiff?|css|js|mjs|map|json|webmanifest|txt|xml|woff2?|ttf|otf|eot|mp3|mp4|webm|wav|ogg|pdf|zip)$).*)",
  ],
};
