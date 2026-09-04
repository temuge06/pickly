"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { answerAsk, hideAsk } from "@/lib/actions/ask";
import { MAX_ASK_ANSWER } from "@/lib/validation";

export type PendingAsk = { id: string; body: string };

/**
 * The creator's unanswered questions, answered in place on their own profile.
 *
 * The inbox already existed at /dashboard/ask, but reaching it meant leaving
 * the profile, opening the editor and finding a tile — three steps to type one
 * sentence, which the design review called out: the box should be here, on the
 * profile, "zaaval edit hiih gj orohdoo hariulahguigeer".
 *
 * So this is a second face on the same actions, not a second implementation:
 * `answerAsk` and `hideAsk` are the ones the dashboard calls, ownership is
 * re-checked server-side inside them, and both revalidate this page — so an
 * answered question leaves this list and reappears as a published card in the
 * shelf below without a reload.
 *
 * Rendered only when the server decided the viewer owns this profile. A visitor
 * receives HTML with none of it, the same rule the bell follows.
 */
export function AskOwnerInbox({
  questions,
  labels,
}: {
  questions: PendingAsk[];
  /** Localised on the server and passed down — see FollowButton. */
  labels: {
    title: string;
    empty: string;
    placeholder: string;
    send: string;
    publish: string;
    hide: string;
    all: string;
  };
}) {
  return (
    <div
      className="flex flex-col gap-[10px] rounded-[13px] px-[12px] pb-[14px] pt-[13px]"
      style={{ background: "var(--t-ask)", color: "var(--t-on-ask)" }}
    >
      <div className="flex items-baseline justify-between gap-[8px]">
        <p className="text-[15px] font-bold leading-[16px]">
          {labels.title}
          {questions.length > 0 ? ` (${questions.length})` : ""}
        </p>
        <Link
          href="/dashboard/ask"
          className="shrink-0 text-[11.5px] font-semibold leading-[14px] opacity-75"
        >
          {labels.all}
        </Link>
      </div>

      {questions.length === 0 ? (
        <p className="text-[13px] leading-[17px] opacity-70">{labels.empty}</p>
      ) : (
        questions.map((q) => (
          <PendingRow key={q.id} question={q} labels={labels} />
        ))
      )}
    </div>
  );
}

function PendingRow({
  question,
  labels,
}: {
  question: PendingAsk;
  labels: {
    placeholder: string;
    send: string;
    publish: string;
    hide: string;
  };
}) {
  const [answer, setAnswer] = useState("");
  const [publish, setPublish] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    const body = answer.trim();
    if (!body) return;
    setError(null);
    start(async () => {
      try {
        await answerAsk(question.id, body, publish);
        // No local "answered" state: the action revalidates this page, so the
        // row leaves the list because the server no longer sends it. Holding a
        // copy here would be a second source of truth that drifts.
      } catch (e) {
        setError(e instanceof Error ? e.message : "Илгээгдсэнгүй.");
      }
    });
  }

  return (
    // Both surfaces are a tint of the panel's OWN ink rather than the
    // `askField` pair, which is a placeholder grey (#ababab) built for the fake
    // composer below and left a real question barely readable. A percentage of
    // currentColor separates the row on the dark palette and on the light one
    // without either needing a token of its own.
    <div
      className={`flex flex-col gap-[8px] rounded-[10px] p-[10px] transition-opacity ${
        pending ? "opacity-60" : ""
      }`}
      style={{ background: "color-mix(in srgb, var(--t-on-ask) 8%, transparent)" }}
    >
      <p className="text-[14px] italic leading-[18px]">“{question.body}”</p>

      <textarea
        rows={2}
        value={answer}
        maxLength={MAX_ASK_ANSWER}
        disabled={pending}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={labels.placeholder}
        aria-label={labels.placeholder}
        // 16px, like every other field in this product: anything smaller makes
        // iOS Safari zoom the whole page in on focus.
        className="w-full resize-none rounded-[8px] px-[10px] py-[8px] text-[16px] leading-[20px] outline-none ring-1 ring-inset ring-[color-mix(in_srgb,currentColor_22%,transparent)] placeholder:text-current placeholder:opacity-50 focus:ring-2 focus:ring-[var(--t-accent)]"
        style={{
          background: "color-mix(in srgb, var(--t-on-ask) 7%, transparent)",
          color: "var(--t-on-ask)",
        }}
      />

      {error ? (
        <p className="text-[12px] leading-[15px] text-[var(--t-accent)]">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-[8px]">
        <label className="flex cursor-pointer items-center gap-[6px] text-[12.5px] leading-[15px]">
          <input
            type="checkbox"
            checked={publish}
            disabled={pending}
            onChange={(e) => setPublish(e.target.checked)}
            className="h-[15px] w-[15px] shrink-0 accent-[var(--t-accent)]"
          />
          {labels.publish}
        </label>

        <span className="flex items-center gap-[8px]">
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => void (await hideAsk(question.id)))}
            className="rounded-[7px] px-[8px] py-[5px] text-[12.5px] font-semibold leading-[15px] opacity-70 disabled:opacity-40"
          >
            {labels.hide}
          </button>
          <button
            type="button"
            disabled={pending || !answer.trim()}
            onClick={submit}
            className="rounded-[7px] px-[12px] py-[6px] text-[12.5px] font-bold leading-[15px] transition-transform active:scale-95 disabled:opacity-45"
            style={{ background: "var(--t-accent)", color: "var(--t-on-accent)" }}
          >
            {labels.send}
          </button>
        </span>
      </div>
    </div>
  );
}
