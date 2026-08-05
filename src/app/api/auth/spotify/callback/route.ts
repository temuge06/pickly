import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { connection } from "@/db/schema";
import { env } from "@/lib/env";
import { getCurrentProfile } from "@/lib/auth/session";
import { encryptToken } from "@/lib/crypto/tokens";
import {
  exchangeSpotifyCode,
  fetchSpotifyProfile,
  SPOTIFY_SCOPES,
} from "@/lib/sync/spotify";
import { syncConnectionById } from "@/lib/sync/run";

export const dynamic = "force-dynamic";

/**
 * Spotify OAuth callback. Verifies state, exchanges the code, and upserts the
 * connection row with the refresh token encrypted at rest. Tokens never touch
 * the client. Kicks off a first sync so the section is populated immediately.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const dash = (q: string) => NextResponse.redirect(new URL(`/dashboard${q}`, request.url));

  if (!env.hasSpotify || !env.hasEncryptionKey) return dash("?error=spotify_off");

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.redirect(new URL("/sign-in", request.url));

  const error = url.searchParams.get("error");
  if (error) return dash("?error=spotify_denied");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.cookies.get("spotify_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return dash("?error=spotify_state");
  }

  let tokens;
  let spotifyProfile;
  try {
    tokens = await exchangeSpotifyCode(code);
    spotifyProfile = await fetchSpotifyProfile(tokens.accessToken);
  } catch {
    return dash("?error=spotify_exchange");
  }

  const db = getDb();
  const existing = await db
    .select({ id: connection.id })
    .from(connection)
    .where(
      and(
        eq(connection.profileId, profile.id),
        eq(connection.provider, "spotify"),
      ),
    )
    .limit(1);

  const values = {
    profileId: profile.id,
    provider: "spotify" as const,
    accessTokenEnc: encryptToken(tokens.accessToken),
    refreshTokenEnc: tokens.refreshToken
      ? encryptToken(tokens.refreshToken)
      : null,
    expiresAt: tokens.expiresAt ?? null,
    externalUsername: spotifyProfile.display_name ?? spotifyProfile.id,
    scopes: tokens.scopes ?? SPOTIFY_SCOPES,
    status: "active" as const,
    errorCount: 0,
    lastError: null,
  };

  let connectionId: string;
  if (existing[0]) {
    connectionId = existing[0].id;
    await db.update(connection).set(values).where(eq(connection.id, connectionId));
  } else {
    const inserted = await db
      .insert(connection)
      .values(values)
      .returning({ id: connection.id });
    connectionId = inserted[0]!.id;
  }

  // First sync now so Listening isn't empty on return. Failure is non-fatal —
  // the 6h cron will retry.
  try {
    await syncConnectionById(connectionId);
  } catch {
    /* handled by connection health on next run */
  }

  const res = dash("?connected=spotify");
  res.cookies.delete("spotify_oauth_state");
  return res;
}
