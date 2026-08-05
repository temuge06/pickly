"use client";

import { useState, useTransition } from "react";
import { disconnect, setLetterboxdUsername, syncNow } from "@/lib/actions/connections";
import { ConnectionBanner } from "./ConnectionBanner";
import { DashButton, DashInput, Spinner } from "./ui";

type Connection = {
  id: string;
  status: string;
  externalUsername: string | null;
  lastError: string | null;
};

/** Letterboxd username connect + health, shown at the top of the Watching
 * section (films from RSS sync in alongside manual TMDB adds). */
export function LetterboxdConnect({ connection }: { connection: Connection | null }) {
  const [username, setUsername] = useState(connection?.externalUsername ?? "");
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-2 rounded-[16px] bg-black/[0.03] p-3">
      {connection?.status === "error" ? (
        <ConnectionBanner provider="Letterboxd" message={connection.lastError} />
      ) : null}
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-1">
          <span className="shrink-0 font-header text-[13px] font-semibold text-black/40">
            letterboxd/
          </span>
          <DashInput
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <DashButton
          loading={pending}
          disabled={!username.trim()}
          onClick={() => start(async () => void (await setLetterboxdUsername(username)))}
        >
          {pending ? "" : connection ? "Шинэчлэх" : "Холбох"}
        </DashButton>
      </div>
      {connection && connection.status !== "error" ? (
        <div className="flex items-center gap-3 px-1">
          <button
            disabled={pending}
            onClick={() => start(async () => void (await syncNow(connection.id)))}
            className="font-header text-[11.5px] font-bold text-[#c23361]"
          >
            Одоо шинэчлэх
          </button>
          <button
            disabled={pending}
            onClick={() => start(async () => void (await disconnect(connection.id, false)))}
            className="font-header text-[11.5px] font-bold text-[#c2334a]"
          >
            Салгах
          </button>
          {pending ? <Spinner className="h-3.5 w-3.5 text-black/30" /> : null}
        </div>
      ) : null}
    </div>
  );
}
