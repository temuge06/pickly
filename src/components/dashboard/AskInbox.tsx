"use client";

import { useState, useTransition } from "react";
import {
  answerAsk,
  blockAsker,
  hideAsk,
  setAskEnabled,
  toggleAskPublic,
  unhideAsk,
} from "@/lib/actions/ask";
import { MAX_ASK_ANSWER } from "@/lib/validation";
import {
  Empty,
  Hint,
  LButton,
  LSection,
  LTextArea,
  Spinner,
} from "./lapis/ui";

/**
 * Ask inbox, in the dashboard's own design language. Every colour is a --t-*
 * token from the creator's chosen theme, same as the rest of the editor, so a
 * light palette does not leave this screen unreadable.
 */

type Message = {
  id: string;
  body: string;
  status: string;
  answerBody: string | null;
  isPublic: boolean;
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
    <label className="flex cursor-pointer items-center gap-2 font-malt text-[13px] text-[var(--t-text)]">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-[16px] w-[16px] shrink-0 accent-[var(--t-accent)]"
      />
      {children}
    </label>
  );
}

export function AskInbox({
  handle,
  askEnabled,
  messages,
}: {
  handle: string;
  askEnabled: boolean;
  messages: { new: Message[]; answered: Message[]; hidden: Message[] };
}) {
  const [showHidden, setShowHidden] = useState(false);

  return (
    <div className="flex flex-col gap-7">
      <AskSettings handle={handle} askEnabled={askEnabled} />

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
              className="rounded-full bg-[color-mix(in_srgb,var(--t-accent)_15%,transparent)] px-3 py-1.5 font-malt text-[12px] font-bold text-[var(--t-accent)] transition-colors "
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

/**
 * The one switch that matters: whether the public /[handle]/ask page accepts
 * questions at all.
 *
 * The custom prompt field that used to sit under it is gone. It asked the
 * creator to write marketing copy for a page most of them never open, its
 * value showed up nowhere in the editor, and the design review asked for this
 * card to be the toggle and nothing else. The column stays (profile.ask_prompt)
 * and the public page still renders a saved value — this only stops the
 * dashboard from asking for one.
 */
function AskSettings({
  handle,
  askEnabled,
}: {
  handle: string;
  askEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(askEnabled);
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
      <div className="flex items-center justify-between gap-3 rounded-[16px] bg-[var(--t-well)] p-4">
        <div className="min-w-0">
          <p className="font-malt text-[14.5px] font-bold text-[var(--t-text)]">
            Ask идэвхтэй
          </p>
          <p className="truncate font-malt text-[12px] text-[var(--t-muted)]">
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
            enabled ? "bg-[var(--t-accent)]" : "bg-[var(--t-ring)]"
          }`}
        >
          <span
            className={`absolute left-[3px] top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-transform duration-150 ${
              enabled ? "translate-x-[20px]" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </section>
  );
}

function NewMessage({ message }: { message: Message }) {
  const [answer, setAnswer] = useState("");
  const [makePublic, setMakePublic] = useState(false);
  const [pending, start] = useTransition();
  // Warn before the cap rather than only at it: a creator who has been typing
  // for a while should see the limit coming, not discover it when the field
  // stops accepting keystrokes.
  const remaining = MAX_ASK_ANSWER - answer.length;

  return (
    <div
      className={`flex flex-col gap-3 rounded-[16px] bg-[var(--t-well)] p-4 transition-opacity ${
        pending ? "opacity-60" : ""
      }`}
    >
      <p className="font-malt text-[14.5px] leading-relaxed text-[var(--t-text)]">
        {message.body}
      </p>

      <div className="flex flex-col gap-1">
        <LTextArea
          rows={2}
          value={answer}
          maxLength={MAX_ASK_ANSWER}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Хариултаа бичих…"
        />
        <span
          className={`self-end font-malt text-[11.5px] tabular-nums ${
            remaining <= 20 ? "text-[var(--t-danger)]" : "text-[var(--t-muted)]"
          }`}
        >
          {answer.length}/{MAX_ASK_ANSWER}
        </span>
      </div>

      <Check checked={makePublic} onChange={setMakePublic} disabled={pending}>
        Профайл дээр нийтлэх
      </Check>

      <div className="flex flex-wrap items-center gap-2">
        <LButton
          loading={pending}
          disabled={pending || !answer.trim()}
          onClick={() =>
            start(async () => void (await answerAsk(message.id, answer, makePublic)))
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
    <div className="flex flex-col gap-2 rounded-[16px] bg-[var(--t-well)] p-4">
      <p className="font-malt text-[13.5px] leading-relaxed text-[var(--t-muted)]">
        {message.body}
      </p>
      <p className="border-l-2 border-[var(--t-accent)] pl-2.5 font-malt text-[14px] leading-relaxed text-[var(--t-text)]">
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
        {pending ? <Spinner className="h-3.5 w-3.5 text-[var(--t-muted)]" /> : null}
      </div>
    </div>
  );
}

function HiddenMessage({ message }: { message: Message }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between gap-2 rounded-[16px] bg-[var(--t-well)] p-3">
      <p className="min-w-0 flex-1 truncate font-malt text-[13px] text-[var(--t-muted)]">
        {message.body}
      </p>
      {message.status === "hidden" ? (
        <button
          disabled={pending}
          onClick={() => start(async () => void (await unhideAsk(message.id)))}
          className="shrink-0 rounded-lg px-2 py-1 font-malt text-[11.5px] font-bold text-[var(--t-accent)] transition-colors active:bg-[var(--t-field)] disabled:opacity-50"
        >
          Сэргээх
        </button>
      ) : (
        <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--t-danger)_14%,transparent)] px-2 py-0.5 font-malt text-[10.5px] font-bold uppercase text-[var(--t-danger)]">
          Блоклосон
        </span>
      )}
    </div>
  );
}
