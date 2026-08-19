"use client";

import { useState } from "react";
import { getClientFingerprint } from "@/lib/ask/fingerprint";
import { submitAsk } from "@/lib/ask/submit";

const MAX = 500;

/**
 * Themed ask form. Every surface reads a theme token, so the page matches
 * whichever palette the creator picked rather than the old fixed dark one.
 */
export function AskForm({ handle, prompt }: { handle: string; prompt: string }) {
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || state === "sending") return;
    setState("sending");
    // The server returns a uniform success shape regardless of filtering or
    // rate limits — the asker never learns whether a message landed, was
    // dropped, or was hidden.
    await submitAsk(handle, body, getClientFingerprint());
    setBody("");
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div
        className="flex flex-col items-center gap-[10px] rounded-[16px] p-6 text-center"
        style={{ background: "var(--t-card)", color: "var(--t-on-card)" }}
      >
        <p className="font-malt text-[17px] font-extrabold uppercase">Илгээгдлээ 💛</p>
        <p className="font-inter text-[13.5px] leading-relaxed opacity-80">
          Асуултыг чинь хүлээж авлаа.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-1 flex h-[37px] items-center justify-center rounded-[10px] border px-4 font-malt text-[13px] font-semibold"
          style={{
            background: "var(--t-card-btn)",
            color: "var(--t-on-card-btn)",
            borderColor: "var(--t-card-btn-border)",
          }}
        >
          Дахин асуух
        </button>
      </div>
    );
  }

  const remaining = MAX - body.length;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[10px]">
      <textarea
        name="body"
        rows={5}
        maxLength={MAX}
        required
        placeholder={prompt}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        autoFocus
        className="w-full resize-none rounded-[16px] border-2 bg-transparent px-4 py-3.5 font-inter text-[16px] leading-relaxed outline-none transition-colors placeholder:opacity-45"
        style={{
          borderColor: "color-mix(in srgb, var(--t-accent) 45%, transparent)",
          color: "var(--t-text)",
          background: "color-mix(in srgb, var(--t-accent) 6%, transparent)",
        }}
      />

      <div className="flex items-center justify-end px-1">
        <span
          className="font-inter text-[11.5px] tabular-nums"
          style={{ color: remaining <= 40 ? "var(--t-accent)" : "var(--t-muted)" }}
        >
          {body.length}/{MAX}
        </span>
      </div>

      <button
        type="submit"
        disabled={state === "sending" || !body.trim()}
        className="flex h-[46px] items-center justify-center rounded-[14px] font-malt text-[14.5px] font-bold transition-all duration-150 disabled:pointer-events-none disabled:opacity-45"
        style={{ background: "var(--t-accent)", color: "var(--t-on-accent)" }}
      >
        {state === "sending" ? "Илгээж байна…" : "Асуулт илгээх"}
      </button>

      <p
        className="mt-1 text-center font-inter text-[12px] leading-relaxed"
        style={{ color: "var(--t-muted)" }}
      >
        Хүндэтгэлтэй байгаарай. Зохисгүй мессежийг шүүнэ.
      </p>
    </form>
  );
}
