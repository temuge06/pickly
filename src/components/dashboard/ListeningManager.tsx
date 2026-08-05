"use client";

import { useTransition } from "react";
import { disconnect, syncNow } from "@/lib/actions/connections";
import { formatDateNumeric } from "@/lib/format";
import { DashSection, EmptyHint } from "./Section";
import { ConnectionBanner } from "./ConnectionBanner";
import { DashButton } from "./ui";

type Connection = {
  id: string;
  provider: string;
  status: string;
  externalUsername: string | null;
  lastSyncAt: Date | null;
  lastError: string | null;
};

export function ListeningManager({
  spotify,
  trackCount,
  spotifyConfigured,
}: {
  spotify: Connection | null;
  trackCount: number;
  spotifyConfigured: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <DashSection icon="🎵" label="Listening">
      {!spotifyConfigured ? (
        <EmptyHint>
          Spotify тохиргоо серверт ороогүй байна. Тохируулсны дараа энд холбоно.
        </EmptyHint>
      ) : !spotify || spotify.status === "revoked" ? (
        <>
          {spotify?.status === "revoked" ? (
            <ConnectionBanner provider="Spotify" message={spotify.lastError} />
          ) : null}
          <a
            href="/api/auth/spotify/connect"
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-[#1DB954] px-5 font-header text-[15px] font-bold text-white shadow-[0_6px_16px_-8px_rgba(29,185,84,0.9)] transition-transform active:scale-[0.99]"
          >
            <SpotifyGlyph /> Spotify холбох
          </a>
          <p className="px-1 font-header text-[12.5px] text-black/40">
            Топ дуунууд болон сүүлд сонссоноо автоматаар шинэчилнэ.
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-2.5 rounded-[16px] bg-black/[0.03] p-4">
          {spotify.status === "error" ? (
            <ConnectionBanner provider="Spotify" message={spotify.lastError} />
          ) : null}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1DB954]/15 text-[#1DB954]">
                <SpotifyGlyph />
              </span>
              <div>
                <p className="font-header text-[14px] font-bold text-spotly-ink">
                  Spotify холбогдсон
                </p>
                <p className="font-header text-[11.5px] text-black/45">
                  {trackCount} дуу
                  {spotify.lastSyncAt ? ` · ${formatDateNumeric(spotify.lastSyncAt)}` : ""}
                </p>
              </div>
            </div>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1DB954] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1DB954]" />
            </span>
          </div>
          <div className="flex gap-2">
            <DashButton
              variant="ghost"
              loading={pending}
              onClick={() => start(async () => void (await syncNow(spotify.id)))}
              className="flex-1"
            >
              {pending ? "Шинэчилж байна…" : "Одоо шинэчлэх"}
            </DashButton>
            <DashButton
              variant="danger"
              disabled={pending}
              onClick={() => start(async () => void (await disconnect(spotify.id, false)))}
            >
              Салгах
            </DashButton>
          </div>
        </div>
      )}
    </DashSection>
  );
}

function SpotifyGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.62.62 0 0 1-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 1 1-.28-1.21c3.8-.87 7.08-.5 9.72 1.11.3.18.39.57.21.85Zm1.23-2.74a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.98-1.17a.78.78 0 1 1-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.36.22.48.7.26 1.07Zm.1-2.85C14.8 8.96 9.5 8.79 6.42 9.72a.93.93 0 1 1-.54-1.78c3.53-1.07 9.38-.86 13.08 1.33a.93.93 0 1 1-.95 1.6Z" />
    </svg>
  );
}
