"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { submitAsk } from "@/lib/ask/submit";
import { getClientFingerprint } from "@/lib/ask/fingerprint";

const MAX = 500;

export function AskForm({ handle, prompt }: { handle: string; prompt: string }) {
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || state === "sending") return;
    setState("sending");
    // Server returns a uniform success shape regardless of filtering/limits —
    // the asker never learns whether a message landed, was dropped, or hidden.
    await submitAsk(handle, body, getClientFingerprint());
    setBody("");
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="rounded-3xl bg-shelf p-6 text-center">
        <p className="font-display text-[17px] font-bold text-ink">
          Илгээгдлээ 💛
        </p>
        <p className="mt-2 font-body text-[14px] leading-relaxed text-ink/70">
          Асуултыг чинь хүлээж авлаа.
        </p>
        <Button
          variant="ghost"
          className="mt-4 !text-ink !ring-ink/15"
          onClick={() => setState("idle")}
        >
          Дахин асуух
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <TextArea
        name="body"
        rows={5}
        maxLength={MAX}
        required
        placeholder={prompt}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        autoFocus
      />
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-[11px] text-paper/40">
          {body.length}/{MAX}
        </span>
      </div>
      <Button type="submit" disabled={state === "sending" || !body.trim()}>
        {state === "sending" ? "Илгээж байна…" : "Асуулт илгээх"}
      </Button>
      <p className="mt-1 text-center font-body text-[12px] text-paper/40">
        Хүндэтгэлтэй байгаарай. Зохисгүй мессежийг шүүнэ.
      </p>
    </form>
  );
}
