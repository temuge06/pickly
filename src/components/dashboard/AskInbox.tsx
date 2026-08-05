"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea, TextInput } from "@/components/ui/Field";
import {
  answerAsk,
  blockAsker,
  hideAsk,
  setAskEnabled,
  setAskPrompt,
  toggleAskPublic,
  unhideAsk,
} from "@/lib/actions/ask";
import { DashSection, EmptyHint } from "./Section";
import { AddPick } from "./AddPick";

type Message = {
  id: string;
  body: string;
  status: string;
  answerBody: string | null;
  isPublic: boolean;
  createdAt: Date;
};
type Collection = { id: string; title: string };

export function AskInbox({
  handle,
  askEnabled,
  askPrompt,
  collections,
  messages,
}: {
  handle: string;
  askEnabled: boolean;
  askPrompt: string | null;
  collections: Collection[];
  messages: { new: Message[]; answered: Message[]; hidden: Message[] };
}) {
  const [showHidden, setShowHidden] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <AskSettings handle={handle} askEnabled={askEnabled} askPrompt={askPrompt} />

      <DashSection label={`Шинэ (${messages.new.length})`}>
        {messages.new.length === 0 ? (
          <EmptyHint>Одоогоор шинэ асуулт алга.</EmptyHint>
        ) : (
          messages.new.map((m) => (
            <NewMessage key={m.id} message={m} collections={collections} />
          ))
        )}
      </DashSection>

      {messages.answered.length > 0 ? (
        <DashSection label="Хариулсан">
          {messages.answered.map((m) => (
            <AnsweredMessage key={m.id} message={m} />
          ))}
        </DashSection>
      ) : null}

      {messages.hidden.length > 0 ? (
        <DashSection
          label={`Шүүгдсэн (${messages.hidden.length})`}
          action={
            <button
              onClick={() => setShowHidden((v) => !v)}
              className="font-mono text-[11px] text-paper/50"
            >
              {showHidden ? "Нуух" : "Харах"}
            </button>
          }
        >
          {showHidden ? (
            messages.hidden.map((m) => <HiddenMessage key={m.id} message={m} />)
          ) : (
            <p className="px-1 font-body text-[12px] text-paper/40">
              Автоматаар шүүгдсэн мессежүүд. Санаатай нээж үзнэ үү.
            </p>
          )}
        </DashSection>
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
  const [pending, start] = useTransition();

  return (
    <div className="mx-4 flex flex-col gap-3 rounded-2xl bg-paper/[0.05] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-[14px] font-medium text-paper">
            Ask идэвхтэй
          </p>
          <p className="font-mono text-[11px] text-paper/50">
            pickly.mn/{handle}/ask
          </p>
        </div>
        <button
          role="switch"
          aria-checked={askEnabled}
          disabled={pending}
          onClick={() => start(async () => void (await setAskEnabled(!askEnabled)))}
          className={`relative h-7 w-12 rounded-full transition ${
            askEnabled ? "bg-jade" : "bg-paper/20"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
              askEnabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>
      <div className="flex gap-2">
        <TextInput
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Асуух зүйл байна уу?"
        />
        <Button
          variant="ghost"
          disabled={pending}
          onClick={() => start(async () => void (await setAskPrompt(prompt)))}
        >
          Хадгалах
        </Button>
      </div>
    </div>
  );
}

function NewMessage({
  message,
  collections,
}: {
  message: Message;
  collections: Collection[];
}) {
  const [answer, setAnswer] = useState("");
  const [makePublic, setMakePublic] = useState(false);
  const [turningIntoPick, setTurningIntoPick] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-paper/[0.05] p-4">
      <p className="font-body text-[14.5px] leading-relaxed text-paper">
        {message.body}
      </p>

      {turningIntoPick ? (
        <AddPick
          collections={collections}
          seedNote=""
          onDone={() => setTurningIntoPick(false)}
        />
      ) : (
        <>
          <TextArea
            rows={2}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Хариултаа бичих…"
          />
          <label className="flex items-center gap-2 font-body text-[13px] text-paper/70">
            <input
              type="checkbox"
              checked={makePublic}
              onChange={(e) => setMakePublic(e.target.checked)}
              className="h-4 w-4 accent-marigold"
            />
            Профайл дээр нийтлэх
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={pending || !answer.trim()}
              onClick={() =>
                start(async () => {
                  await answerAsk(message.id, answer, makePublic);
                })
              }
            >
              Хариулах
            </Button>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => setTurningIntoPick(true)}
            >
              Пик болгох
            </Button>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => start(async () => void (await hideAsk(message.id)))}
            >
              Нуух
            </Button>
            <Button
              variant="ghost"
              disabled={pending}
              className="!text-berry/80"
              onClick={() => start(async () => void (await blockAsker(message.id)))}
            >
              Блоклох
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function AnsweredMessage({ message }: { message: Message }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-paper/[0.05] p-4">
      <p className="font-body text-[13.5px] text-paper/70">{message.body}</p>
      <p className="border-l-2 border-marigold/60 pl-2.5 font-body text-[14px] text-paper">
        {message.answerBody}
      </p>
      <label className="flex items-center gap-2 font-body text-[12.5px] text-paper/60">
        <input
          type="checkbox"
          checked={message.isPublic}
          disabled={pending}
          onChange={(e) =>
            start(async () => void (await toggleAskPublic(message.id, e.target.checked)))
          }
          className="h-4 w-4 accent-marigold"
        />
        Нийтэд харагдаж байна
      </label>
    </div>
  );
}

function HiddenMessage({ message }: { message: Message }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-paper/[0.04] p-3">
      <p className="min-w-0 flex-1 truncate font-body text-[13px] text-paper/55">
        {message.body}
      </p>
      {message.status === "hidden" ? (
        <button
          disabled={pending}
          onClick={() => start(async () => void (await unhideAsk(message.id)))}
          className="shrink-0 font-mono text-[11px] text-paper/60"
        >
          Сэргээх
        </button>
      ) : (
        <span className="shrink-0 font-mono text-[10px] text-berry/70">
          Блоклосон
        </span>
      )}
    </div>
  );
}
