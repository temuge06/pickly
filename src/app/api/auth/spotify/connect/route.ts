import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { getCurrentProfile } from "@/lib/auth/session";
import { SPOTIFY_SCOPES } from "@/lib/sync/spotify";

/**
 * Kicks off Spotify OAuth. Requires a signed-in, onboarded creator. Stores a
 * CSRF `state` in an http-only cookie to verify on callback.
 */
export async function GET(request: NextRequest) {
  if (!env.hasSpotify) {
    return NextResponse.redirect(new URL("/dashboard?error=spotify_off", request.url));
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const state = randomBytes(16).toString("hex");
  const authorize = new URL("https://accounts.spotify.com/authorize");
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", process.env.SPOTIFY_CLIENT_ID!);
  authorize.searchParams.set("scope", SPOTIFY_SCOPES);
  authorize.searchParams.set("redirect_uri", process.env.SPOTIFY_REDIRECT_URI!);
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize.toString());
  res.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
