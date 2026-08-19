"use client";

import { useState, useTransition } from "react";
import {
  answerAsk,
  blockAsker,
  hideAsk,
  setAskEnabled,
  setAskFlaggedForPick,
  setAskPrompt,
  toggleAskPublic,
  unhideAsk,
} from "@/lib/actions/ask";
import {
  Empty,
  Hint,
  LButton,
  LInput,
  LSection,
  LTextArea,
  Spinner,
} from "./lapis/ui";

/**
 * Ask inbox, in the dashboard's own design language (#2a1617 surface, #fe7f42
 * accent, Montserrat Alternates). It previously used the older paper/marigold
 * palette, which left section headings almost invisible against the dark
 * shell — this reuses the same primitives as every other dashboard section so
 * it can't drift again.
 */

type Message = {
  id: string;
  body: string;
  status: string;
  answerBody: string | null;
  isPublic: boolean;
  flaggedForPick: boolean;
  createdAt: Date;
};

/** Shared checkbox row — the native control tinted to the dashboard accent. */
function Check({
  checked,
  onChange,
  disabled,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-malt text-[13px] text-[#feedd5]/75">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-[16px] w-[16px] shrink-0 accent-[#fe7f42]"
      />
      {children}
    </label>
  );
}

export function AskInbox({
  handle,
  askEnabled,
  askPrompt,
  messages,
}: {
  handle: string;
  askEnabled: boolean;
  askPrompt: string | null;
  messages: { new: Message[]; answered: Message[]; hidden: Message[] };
}) {
  const [showHidden, setShowHidden] = useState(false);

  return (
    <div className="flex flex-col gap-7">
      <AskSettings handle={handle} askEnabled={askEnabled} askPrompt={askPrompt} />

      <LSection icon="✉️" title={`Шинэ (${messages.new.length})`}>
        {messages.new.length === 0 ? (
          <Empty>Одоогоор шинэ асуулт алга.</Empty>
        ) : (
          messages.new.map((m) => <NewMessage key={m.id} message={m} />)
        )}
      </LSection>

      {messages.answered.length > 0 ? (
        <LSection icon="💬" title="Хариулсан">
          {messages.answered.map((m) => (
            <AnsweredMessage key={m.id} message={m} />
          ))}
        </LSection>
      ) : null}

      {messages.hidden.length > 0 ? (
        <LSection
          icon="🛡"
          title={`Шүүгдсэн (${messages.hidden.length})`}
          action={
            <button
              onClick={() => setShowHidden((v) => !v)}
              className="rounded-full bg-[#fe7f42]/15 px-3 py-1.5 font-malt text-[12px] font-bold text-[#fe7f42] transition-colors active:bg-[#fe7f42]/25"
            >
              {showHidden ? "Нуух" : "Харах"}
            </button>
          }
        >
          {showHidden ? (
            messages.hidden.map((m) => <HiddenMessage key={m.id} message={m} />)
          ) : (
            <Hint>Автоматаар шүүгдсэн мессежүүд. Санаатай нээж үзнэ үү.</Hint>
          )}
        </LSection>
      ) : null}
    </div>
  );
}

function AskSettings({
  handle,
  askEnabled,
  askPrompt,
}: {
  handle: string;
  askEnabled: boolean;
  askPrompt: string | null;
}) {
  const [prompt, setPrompt] = useState(askPrompt ?? "");
  const [enabled, setEnabled] = useState(askEnabled);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !enabled;
    setEnabled(next); // optimistic — reverts below if the write fails
    start(async () => {
      try {
        await setAskEnabled(next);
      } catch {
        setEnabled(!next);
      }
    });
  }

  return (
    <section className="animate-fade-up px-4">
      <div className="flex flex-col gap-3.5 rounded-[16px] bg-white/[0.04] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-malt text-[14.5px] font-bold text-[#feedd5]">
              Ask идэвхтэй
            </p>
            <p className="truncate font-malt text-[12px] text-[#feedd5]/45">
              pickly.mn/{handle}/ask
            </p>
          </div>
          {/* left-[3px] is load-bearing: a <button> centres its content, so an
              absolutely-positioned knob with `left: auto` takes its origin from
              the track's midpoint and lands outside it. */}
          <button
            role="switch"
            aria-checked={enabled}
            aria-label="Ask идэвхтэй"
            disabled={pending}
            onClick={toggle}
            className={`relative h-[28px] w-[48px] shrink-0 cursor-pointer rounded-full transition-colors duration-150 disabled:opacity-60 ${
              enabled ? "bg-[#fe7f42]" : "bg-white/[0.16]"
            }`}
          >
            <span
              className={`absolute left-[3px] top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-transform duration-150 ${
                enabled ? "translate-x-[20px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <LInput
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setSaved(false);
            }}
            placeholder="Асуух зүйл байна уу?"
            aria-label="Асуултын урилга"
          />
          <div className="flex items-center gap-2">
            <LButton
              variant="soft"
              loading={pending}
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await setAskPrompt(prompt);
                  setSaved(true);
                })
              }
            >
              Хадгалах
            </LButton>
            {saved && !pending ? (
              <span className="font-malt text-[12.5px] font-bold text-[#8fe0a0]">
                ✓ Хадгаллаа
              </span>
            ) : null}
          </div>
          <Hint>Энэ бичиг таны Ask хуудсан дээр урилга болж харагдана.</Hint>
        </div>
      </div>
    </section>
  );
}

function NewMessage({ message }: { message: Message }) {
  const [answer, setAnswer] = useState("");
  const [makePublic, setMakePublic] = useState(false);
  const [flagForPick, setFlagForPick] = useState(message.flaggedForPick);
  const [pending, start] = useTransition();

  return (
    <div
      className={`flex flex-col gap-3 rounded-[16px] bg-white/[0.04] p-4 transition-opacity ${
        pending ? "opacity-60" : ""
      }`}
    >
      <p className="font-malt text-[14.5px] leading-relaxed text-[#feedd5]">
        {message.body}
      </p>

      <LTextArea
        rows={2}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Хариултаа бичих…"
      />

      <Check checked={makePublic} onChange={setMakePublic} disabled={pending}>
        Профайл дээр нийтлэх
      </Check>
      <Check checked={flagForPick} onChange={setFlagForPick} disabled={pending}>
        Барааны асуулт — Pickly-ийн багт илгээх
      </Check>

      <div className="flex flex-wrap items-center gap-2">
        <LButton
          loading={pending}
          disabled={pending || !answer.trim()}
          onClick={() =>
            start(async () => {
              await answerAsk(message.id, answer, makePublic);
              // A separate write, so the answer still lands even if the
              // creator never ticked the box.
              if (flagForPick) await setAskFlaggedForPick(message.id, true);
            })
          }
        >
          Хариулах
        </LButton>
        <LButton
          variant="ghost"
          disabled={pending}
          onClick={() => start(async () => void (await hideAsk(message.id)))}
        >
          Нуух
        </LButton>
        <LButton
          variant="danger"
          disabled={pending}
          onClick={() => start(async () => void (await blockAsker(message.id)))}
        >
          Блоклох
        </LButton>
      </div>
    </div>
  );
}

function AnsweredMessage({ message }: { message: Message }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2 rounded-[16px] bg-white/[0.04] p-4">
      <p className="font-malt text-[13.5px] leading-relaxed text-[#feedd5]/60">
        {message.body}
      </p>
      <p className="border-l-2 border-[#fe7f42]/70 pl-2.5 font-malt text-[14px] leading-relaxed text-[#feedd5]">
        {message.answerBody}
      </p>
      <div className="flex items-center gap-2">
        <Check
          checked={message.isPublic}
          disabled={pending}
          onChange={(v) =>
            start(async () => void (await toggleAskPublic(message.id, v)))
          }
        >
          Нийтэд харагдаж байна
        </Check>
        {pending ? <Spinner className="h-3.5 w-3.5 text-[#feedd5]/40" /> : null}
      </div>
    </div>
  );
}

function HiddenMessage({ message }: { message: Message }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between gap-2 rounded-[16px] bg-white/[0.03] p-3">
      <p className="min-w-0 flex-1 truncate font-malt text-[13px] text-[#feedd5]/50">
        {message.body}
      </p>
      {message.status === "hidden" ? (
        <button
          disabled={pending}
          onClick={() => start(async () => void (await unhideAsk(message.id)))}
          className="shrink-0 rounded-lg px-2 py-1 font-malt text-[11.5px] font-bold text-[#fe7f42] transition-colors active:bg-white/[0.05] disabled:opacity-50"
        >
          Сэргээх
        </button>
      ) : (
        <span className="shrink-0 rounded-full bg-[#ff9a8a]/12 px-2 py-0.5 font-malt text-[10.5px] font-bold uppercase text-[#ff9a8a]">
          Блоклосон
        </span>
      )}
    </div>
  );
}
