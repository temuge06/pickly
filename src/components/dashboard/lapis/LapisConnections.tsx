"use client";

import { useTransition } from "react";
import { disconnect, syncNow } from "@/lib/actions/connections";
import { formatDateNumeric } from "@/lib/format";
import { LButton, LSection, Empty, Well } from "./ui";

type Connection = {
  id: string;
  status: string;
  externalUsername: string | null;
  lastSyncAt: Date | null;
  lastError: string | null;
};

/** Outcome of the OAuth round-trip, read off the return URL by the page. */
export type SpotifyNotice = "connected" | "denied" | "failed" | null;

const NOTICE_TEXT: Record<Exclude<SpotifyNotice, null>, string> = {
  connected: "Spotify холбогдлоо — дуунуудаа татаж авлаа 🎧",
  denied: "Spotify холболтыг цуцаллаа. Дахин оролдоно уу.",
  failed: "Spotify холбогдож чадсангүй. Дахин оролдоно уу.",
};

/**
 * Songs (Дуу) come from Spotify — connect once and the sync worker keeps the
 * section current. Nothing is added by hand here.
 *
 * The connect path is deliberately one tap and no fields: the button goes
 * straight to Spotify's consent screen, the callback stores the tokens AND
 * runs the first sync, and the creator lands back here on a filled-in section.
 * The only thing this component adds around that is honest feedback — a
 * success or failure line for the round-trip that just happened, which the
 * dashboard previously swallowed.
 */
export function LapisSongs({
  spotify,
  trackCount,
  configured,
  notice = null,
}: {
  spotify: Connection | null;
  trackCount: number;
  configured: boolean;
  notice?: SpotifyNotice;
}) {
  const [pending, start] = useTransition();
  const connected = spotify !== null && spotify.status !== "revoked";

  return (
    <LSection icon="🎵" title="Дуу хөгжим">
      {notice ? (
        <p
          className="rounded-[12px] px-4 py-3 font-malt text-[13px] font-bold"
          style={
            notice === "connected"
              ? { background: "rgba(29,185,84,0.14)", color: "#1DB954" }
              : {
                  background: "color-mix(in srgb, var(--t-danger) 14%, transparent)",
                  color: "var(--t-danger)",
                }
          }
        >
          {NOTICE_TEXT[notice]}
        </p>
      ) : null}

      {!configured ? (
        <Empty>Spotify тохиргоо серверт ороогүй байна.</Empty>
      ) : !connected ? (
        <>
          {spotify?.status === "revoked" ? (
            <p className="rounded-[12px] bg-[var(--t-well)] px-4 py-3 font-malt text-[12.5px] text-[var(--t-muted)]">
              Холболт салсан байна — дахин холбоход хуучин дуунууд чинь эргэж
              харагдана.
            </p>
          ) : null}
          <a
            href="/api/auth/spotify/connect"
            className="flex min-h-[54px] items-center justify-center gap-2.5 rounded-[14px] bg-[#1DB954] px-5 font-malt text-[16px] font-bold text-white shadow-[0_8px_20px_-10px_rgba(29,185,84,0.9)] transition-transform active:scale-[0.99]"
          >
            <SpotifyGlyph size={22} /> Spotify-аар холбогдох
          </a>
          <p className="px-1 text-center font-malt text-[12.5px] text-[var(--t-muted)]">
            Нэг товшилт — нууц үг шаардахгүй. Топ дуунууд чинь шууд орж ирнэ.
          </p>
        </>
      ) : (
        <Well className="flex flex-col gap-2.5 p-4">
          {spotify.status === "error" ? (
            <p className="rounded-[12px] px-3 py-2 font-malt text-[12px] font-bold" style={{ background: "color-mix(in srgb, var(--t-danger) 14%, transparent)", color: "var(--t-danger)" }}>
              Сүүлийн шинэчлэл амжилтгүй. Дахин оролдоно уу.
            </p>
          ) : null}
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1DB954]/15 text-[#1DB954]">
                <SpotifyGlyph />
              </span>
              <div className="min-w-0">
                <p className="truncate font-malt text-[14px] font-bold text-[var(--t-text)]">
                  {spotify.externalUsername ?? "Spotify"}
                </p>
                <p className="truncate font-malt text-[11.5px] text-[var(--t-muted)]">
                  {trackCount} дуу
                  {spotify.lastSyncAt ? ` · ${formatDateNumeric(spotify.lastSyncAt)}` : ""}
                </p>
              </div>
            </div>
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1DB954] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1DB954]" />
            </span>
          </div>
          <div className="flex gap-2">
            <LButton
              variant="ghost"
              loading={pending}
              onClick={() => start(async () => void (await syncNow(spotify.id)))}
              className="flex-1"
            >
              {pending ? "Шинэчилж байна…" : "Одоо шинэчлэх"}
            </LButton>
            <LButton
              variant="danger"
              disabled={pending}
              onClick={() => start(async () => void (await disconnect(spotify.id, false)))}
            >
              Салгах
            </LButton>
          </div>
        </Well>
      )}
    </LSection>
  );
}

function SpotifyGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.62.62 0 0 1-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 1 1-.28-1.21c3.8-.87 7.08-.5 9.72 1.11.3.18.39.57.21.85Zm1.23-2.74a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.98-1.17a.78.78 0 1 1-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.36.22.48.7.26 1.07Zm.1-2.85C14.8 8.96 9.5 8.79 6.42 9.72a.93.93 0 1 1-.54-1.78c3.53-1.07 9.38-.86 13.08 1.33a.93.93 0 1 1-.95 1.6Z" />
    </svg>
  );
}
