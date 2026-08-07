"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import {
  createPick,
  deletePick,
  extractPickPreview,
  setPickCollection,
  updatePickStatus,
  type PickPreview,
} from "@/lib/actions/picks";
import { formatMnt } from "@/lib/format";
import { LButton, LInput, LLabel, LSelect, LTextArea, LSection, Empty, Hint, Spinner } from "./ui";

type Pick = {
  id: string;
  title: string;
  brand: string | null;
  imageUrl: string | null;
  priceMnt: number | null;
  note: string | null;
  status: string;
  collectionId: string | null;
};
type Collection = { id: string; title: string };

const STATUS: { value: string; label: string }[] = [
  { value: "testing", label: "Одоо туршиж байна" },
  { value: "recommend", label: "Баттай санал болгоно" },
  { value: "repurchased", label: "Дахин авсан" },
  { value: "wont_rebuy", label: "Дахин авахгүй" },
];

export function LapisPicks({
  picks,
  collections,
}: {
  picks: Pick[];
  collections: Collection[];
}) {
  const [adding, setAdding] = useState(false);
  return (
    <LSection
      icon="💛"
      title="Picks"
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          className="rounded-full bg-[#fe7f42]/15 px-3 py-1.5 font-malt text-[12px] font-bold text-[#fe7f42] transition-colors active:bg-[#fe7f42]/25"
        >
          {adding ? "Хаах" : "+ Нэмэх"}
        </button>
      }
    >
      {adding ? <AddPick collections={collections} onDone={() => setAdding(false)} /> : null}
      {!adding && picks.length > 0 ? (
        <Hint>
          Төлөвийг «Дахин авахгүй» болговол пик профайл дээрх «Not For Me» хэсэгт орно.
        </Hint>
      ) : null}
      {picks.length === 0 && !adding ? (
        <Empty>Эхний пикээ нэмээрэй. Барааны холбоос тавихад л болно.</Empty>
      ) : null}
      {picks.map((p) => (
        <PickRow key={p.id} pick={p} collections={collections} />
      ))}
    </LSection>
  );
}

function AddPick({ collections, onDone }: { collections: Collection[]; onDone: () => void }) {
  const [step, setStep] = useState<"url" | "extracting" | "form">("url");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<PickPreview | null>(null);
  const [saving, startSave] = useTransition();

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [priceMnt, setPriceMnt] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("testing");
  const [collectionId, setCollectionId] = useState("");
  const [rawPrice, setRawPrice] = useState<number | null>(null);
  const [rawCurrency, setRawCurrency] = useState<string | null>(null);

  function apply(p: PickPreview) {
    setTitle(p.title ?? "");
    setBrand(p.brand ?? "");
    setImageUrl(p.imageUrl ?? "");
    if (p.price != null && (p.currency ?? "MNT").toUpperCase() === "MNT") {
      setPriceMnt(String(Math.round(p.price)));
    } else if (p.price != null) {
      setRawPrice(p.price);
      setRawCurrency(p.currency);
    }
  }

  async function onExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setStep("extracting");
    try {
      const p = await extractPickPreview(url);
      setPreview(p);
      apply(p);
    } catch {
      setPreview({ title: null, brand: null, imageUrl: null, price: null, currency: null, sourceUrl: url, confident: false, failureReason: "fetch_failed" });
    } finally {
      setStep("form");
    }
  }

  function manual() {
    setPreview({ title: null, brand: null, imageUrl: null, price: null, currency: null, sourceUrl: url.trim(), confident: false, failureReason: null });
    setStep("form");
  }

  function save() {
    if (!title.trim()) return;
    startSave(async () => {
      await createPick({
        title, brand: brand || null, imageUrl: imageUrl || null,
        priceMnt: priceMnt ? Number.parseInt(priceMnt, 10) : null,
        rawPrice, rawCurrency, note: note || null, status,
        sourceUrl: preview?.sourceUrl || url || null,
        outboundUrl: preview?.sourceUrl || url || null,
        collectionId: collectionId || null,
      });
      onDone();
    });
  }

  if (step === "url") {
    return (
      <form onSubmit={onExtract} className="animate-pop flex flex-col gap-3 rounded-[16px] bg-white/[0.04] p-4">
        <div>
          <LLabel htmlFor="pu">Барааны холбоос</LLabel>
          <LInput id="pu" type="url" inputMode="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} autoFocus />
          <Hint>Холбоос тавихад нэр, зураг, үнийг автоматаар татна.</Hint>
        </div>
        <div className="flex gap-2">
          <LButton type="submit" disabled={!url.trim()} className="flex-1">Үргэлжлүүлэх</LButton>
          <LButton type="button" variant="ghost" onClick={manual}>Гараар</LButton>
        </div>
      </form>
    );
  }

  if (step === "extracting") {
    return (
      <div className="animate-pop flex flex-col gap-4 rounded-[16px] bg-white/[0.04] p-4">
        <div className="flex items-center justify-center gap-2 py-1 font-malt text-[13px] font-bold text-[#feedd5]/70">
          <Spinner className="h-4 w-4 text-[#fe7f42]" /> Мэдээлэл татаж байна…
        </div>
        <div className="skeleton-dark mx-auto aspect-square w-32 rounded-2xl" />
        <div className="skeleton-dark h-11 w-full rounded-[14px]" />
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton-dark h-11 rounded-[14px]" />
          <div className="skeleton-dark h-11 rounded-[14px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pop flex flex-col gap-4 rounded-[16px] bg-white/[0.04] p-4">
      {preview && !preview.confident ? (
        <p className="rounded-[12px] bg-[#fe7f42]/12 px-3 py-2.5 font-malt text-[12.5px] font-medium text-[#fe7f42]">
          {preview.failureReason === "js_rendered"
            ? "Автоматаар татаж чадсангүй. Доор гараар бөглөнө үү."
            : preview.failureReason === "blocked"
              ? "Энэ сайт автомат хандалтыг блокложээ. Доор гараар бөглөнө үү."
              : preview.failureReason === "fetch_failed"
                ? "Хуудсыг татаж чадсангүй. Холбоосоо шалгаад гараар бөглөнө үү."
                : "Мэдээллийг бүрэн татсангүй. Доор гараар нөхнө үү."}
        </p>
      ) : null}
      {imageUrl ? (
        <div className="animate-fade-up relative mx-auto aspect-square w-32 overflow-hidden rounded-2xl bg-white/[0.05]">
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
      ) : null}
      <div>
        <LLabel htmlFor="pt">Нэр *</LLabel>
        <LInput id="pt" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Барааны нэр" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <LLabel htmlFor="pb">Брэнд</LLabel>
          <LInput id="pb" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
        <div>
          <LLabel htmlFor="pp">Үнэ (₮)</LLabel>
          <LInput id="pp" inputMode="numeric" value={priceMnt} onChange={(e) => setPriceMnt(e.target.value.replace(/[^0-9]/g, ""))} placeholder="45000" />
        </div>
      </div>
      {rawCurrency ? (
        <p className="font-malt text-[11.5px] text-[#feedd5]/45">Эх сурвалж: {rawPrice} {rawCurrency} — ₮ рүү хөрвүүлээгүй.</p>
      ) : null}
      <div>
        <LLabel htmlFor="pi">Зургийн холбоос</LLabel>
        <LInput id="pi" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div>
        <LLabel htmlFor="pn">Тэмдэглэл</LLabel>
        <LTextArea id="pn" rows={2} value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="Яагаад санал болгож байгаа вэ?" />
      </div>
      <div>
        <LLabel htmlFor="ps">Төлөв</LLabel>
        <LSelect id="ps" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </LSelect>
      </div>
      {collections.length > 0 ? (
        <div>
          <LLabel htmlFor="pc">Цуглуулга</LLabel>
          <LSelect id="pc" value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
            <option value="">Байхгүй (Top Picks)</option>
            {collections.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}
          </LSelect>
        </div>
      ) : null}
      <div className="flex gap-2">
        <LButton onClick={save} loading={saving} disabled={!title.trim()} className="flex-1">
          {saving ? "Хадгалж байна…" : "Пик нэмэх"}
        </LButton>
        <LButton variant="ghost" onClick={() => setStep("url")} disabled={saving}>Буцах</LButton>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUS.map((s) => [s.value, s.label]));

function PickRow({ pick, collections }: { pick: Pick; collections: Collection[] }) {
  const [pending, start] = useTransition();
  const selectCls =
    "min-h-[34px] appearance-none rounded-[10px] bg-white/[0.06] px-2.5 py-1 pr-6 font-malt text-[11px] font-bold text-[#feedd5] outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-2 focus:ring-[#fe7f42]";
  return (
    <div className={`flex gap-3 rounded-[16px] bg-white/[0.04] p-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-white/[0.06]">
        {pick.imageUrl ? <img src={pick.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        {pick.brand ? <p className="truncate font-malt text-[10px] font-bold uppercase tracking-wide text-[#feedd5]/40">{pick.brand}</p> : null}
        <p className="truncate font-malt text-[14.5px] font-bold text-[#feedd5]">{pick.title}</p>
        {pick.priceMnt != null ? <p className="font-malt text-[12px] font-semibold text-[#feedd5]/55">{formatMnt(pick.priceMnt)}</p> : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={pick.status}
              disabled={pending}
              onChange={(e) => start(async () => void (await updatePickStatus(pick.id, e.target.value)))}
              className={selectCls}
            >
              {Object.entries(STATUS_LABEL).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
            </select>
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-[#fe7f42]">▼</span>
          </div>
          {collections.length > 0 ? (
            <div className="relative">
              <select
                value={pick.collectionId ?? ""}
                disabled={pending}
                onChange={(e) => start(async () => void (await setPickCollection(pick.id, e.target.value || null)))}
                className={selectCls}
              >
                <option value="">Цуглуулгагүй</option>
                {collections.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}
              </select>
              <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-[#fe7f42]">▼</span>
            </div>
          ) : null}
          {pending ? <Spinner className="h-3.5 w-3.5 text-[#feedd5]/40" /> : null}
          <button
            disabled={pending}
            onClick={() => start(async () => void (await deletePick(pick.id)))}
            className="ml-auto min-h-[34px] rounded-lg px-2 font-malt text-[11px] font-bold text-[#ff9a8a] transition-colors active:bg-white/[0.05]"
          >
            Устгах
          </button>
        </div>
      </div>
    </div>
  );
}
