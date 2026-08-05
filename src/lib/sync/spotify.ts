import { decryptToken, encryptToken } from "@/lib/crypto/tokens";
import { getDb } from "@/db";
import { connection } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  RevokedError,
  type Connection,
  type NormalizedItem,
  type ProviderAdapter,
  type Tokens,
} from "./types";

export const SPOTIFY_SCOPES = "user-top-read user-read-recently-played";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

function basicAuth(): string {
  const id = process.env.SPOTIFY_CLIENT_ID!;
  const secret = process.env.SPOTIFY_CLIENT_SECRET!;
  return Buffer.from(`${id}:${secret}`).toString("base64");
}

/** Exchange an authorization code for tokens (used by the OAuth callback). */
export async function exchangeSpotifyCode(code: string): Promise<Tokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    }),
  });
  if (!res.ok) throw new Error(`Spotify token exchange failed: ${res.status}`);
  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: new Date(Date.now() + json.expires_in * 1000),
    scopes: json.scope,
  };
}

export async function fetchSpotifyProfile(
  accessToken: string,
): Promise<{ id: string; display_name: string | null }> {
  const res = await fetch(`${API}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Spotify /me failed: ${res.status}`);
  return res.json();
}

type SpotifyImage = { url: string };
type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: SpotifyImage[] };
  external_urls: { spotify: string };
};

export const spotifyAdapter: ProviderAdapter = {
  provider: "spotify",

  async refreshAuth(conn: Connection): Promise<Tokens> {
    if (!conn.refreshTokenEnc) {
      throw new RevokedError("No refresh token stored.");
    }
    const refreshToken = decryptToken(conn.refreshTokenEnc);
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    if (res.status === 400 || res.status === 401) {
      // Password change / app revoked — token is permanently dead.
      throw new RevokedError(`Spotify refresh rejected: ${res.status}`);
    }
    if (!res.ok) throw new Error(`Spotify refresh failed: ${res.status}`);
    const json = (await res.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      scope?: string;
    };
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token, // Spotify may or may not rotate it.
      expiresAt: new Date(Date.now() + json.expires_in * 1000),
      scopes: json.scope,
    };
  },

  async sync(conn: Connection): Promise<NormalizedItem[]> {
    const accessToken = await ensureAccessToken(conn);

    const [top, recent] = await Promise.all([
      spotifyGet<{ items: SpotifyTrack[] }>(
        `${API}/me/top/tracks?time_range=short_term&limit=10`,
        accessToken,
      ),
      spotifyGet<{
        items: { track: SpotifyTrack; played_at: string }[];
      }>(`${API}/me/player/recently-played?limit=20`, accessToken),
    ]);

    const now = new Date();
    const items: NormalizedItem[] = [];

    top.items.forEach((track, i) => {
      items.push(
        normalizeTrack(track, now, { source: "top_tracks", rank: i + 1 }),
      );
    });

    for (const entry of recent.items) {
      items.push(
        normalizeTrack(entry.track, new Date(entry.played_at), {
          source: "recently_played",
        }),
      );
    }

    return items;
  },
};

function normalizeTrack(
  track: SpotifyTrack,
  occurredAt: Date,
  meta: Record<string, unknown>,
): NormalizedItem {
  return {
    provider: "spotify",
    kind: "track",
    externalId: track.id,
    title: track.name,
    subtitle: track.artists.map((a) => a.name).join(", "),
    imageUrl: track.album.images[0]?.url ?? null,
    externalUrl: track.external_urls.spotify,
    occurredAt,
    meta,
  };
}

/**
 * Returns a valid access token, refreshing (and persisting the new tokens)
 * when the stored one is expired. A dead refresh bubbles up as RevokedError.
 */
async function ensureAccessToken(conn: Connection): Promise<string> {
  const stillValid =
    conn.accessTokenEnc &&
    conn.expiresAt &&
    conn.expiresAt.getTime() - Date.now() > 60_000;
  if (stillValid) return decryptToken(conn.accessTokenEnc!);

  const tokens = await spotifyAdapter.refreshAuth!(conn);
  await getDb()
    .update(connection)
    .set({
      accessTokenEnc: encryptToken(tokens.accessToken),
      ...(tokens.refreshToken
        ? { refreshTokenEnc: encryptToken(tokens.refreshToken) }
        : {}),
      expiresAt: tokens.expiresAt ?? null,
    })
    .where(eq(connection.id, conn.id));
  return tokens.accessToken;
}

async function spotifyGet<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401) {
    // Caller refreshes on the next run; treat as transient here.
    throw new Error("Spotify 401 (token expired mid-sync).");
  }
  if (!res.ok) throw new Error(`Spotify GET ${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}
