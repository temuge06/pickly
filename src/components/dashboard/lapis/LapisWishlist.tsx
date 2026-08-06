"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import { extractPickPreview, type PickPreview } from "@/lib/actions/picks";
import { createWishlistItem, deleteWishlistItem } from "@/lib/actions/wishlist";
import { formatMnt } from "@/lib/format";
import { LButton, LInput, LLabel, LTextArea, LSection, Empty, Hint, Spinner } from "./ui";

type Item = {
  id: string;
  title: string;
  imageUrl: string | null;
  priceMnt: number | null;
  url: string | null;
  note: string | null;
};

export function LapisWishlistManager({ items }: { items: Item[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <LSection
      icon="✨"
      title="Wishlist"
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          className="rounded-full bg-[#fe7f42]/15 px-3 py-1.5 font-malt text-[12px] font-bold text-[#fe7f42] transition-colors active:bg-[#fe7f42]/25"
        >
          {adding ? "Хаах" : "+ Нэмэх"}
        </button>
      }
    >
      {adding ? <AddWishlist onDone={() => setAdding(false)} /> : null}
      {items.length === 0 && !adding ? (
        <Empty>Авмаар байгаа зүйлээ нэмээрэй. Барааны холбоос тавихад л болно.</Empty>
      ) : null}
      {items.map((it) => (
        <ItemRow key={it.id} item={it} />
      ))}
    </LSection>
  );
}

function AddWishlist({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"url" | "extracting" | "form">("url");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<PickPreview | null>(null);
  const [saving, startSave] = useTransition();

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [priceMnt, setPriceMnt] = useState("");
  const [note, setNote] = useState("");
  const [rawPrice, setRawPrice] = useState<number | null>(null);
  const [rawCurrency, setRawCurrency] = useState<string | null>(null);

  function apply(p: PickPreview) {
    setTitle(p.title ?? "");
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
      await createWishlistItem({
        title,
        imageUrl: imageUrl || null,
        priceMnt: priceMnt ? Number.parseInt(priceMnt, 10) : null,
        rawPrice,
        rawCurrency,
        url: preview?.sourceUrl || url || null,
        note: note || null,
      });
      onDone();
    });
  }

  if (step === "url") {
    return (
      <form onSubmit={onExtract} className="animate-pop flex flex-col gap-3 rounded-[16px] bg-white/[0.04] p-4">
        <div>
          <LLabel htmlFor="wu">Барааны холбоос</LLabel>
          <LInput id="wu" type="url" inputMode="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} autoFocus />
          <Hint>Авмаар байгаа барааныхаа холбоосыг тавь.</Hint>
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
        <div className="skeleton-dark h-11 w-2/3 rounded-[14px]" />
      </div>
    );
  }

  return (
    <div className="animate-pop flex flex-col gap-4 rounded-[16px] bg-white/[0.04] p-4">
      {preview && !preview.confident ? (
        <p className="rounded-[12px] bg-[#fe7f42]/12 px-3 py-2.5 font-malt text-[12.5px] font-medium text-[#fe7f42]">
          Мэдээллийг бүрэн татсангүй. Доор гараар нөхнө үү.
        </p>
      ) : null}
      {imageUrl ? (
        <div className="animate-fade-up relative mx-auto aspect-square w-32 overflow-hidden rounded-2xl bg-white/[0.05]">
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
      ) : null}
      <div>
        <LLabel htmlFor="wt">Нэр *</LLabel>
        <LInput id="wt" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Барааны нэр" />
      </div>
      <div>
        <LLabel htmlFor="wp">Үнэ (₮)</LLabel>
        <LInput id="wp" inputMode="numeric" value={priceMnt} onChange={(e) => setPriceMnt(e.target.value.replace(/[^0-9]/g, ""))} placeholder="45000" />
      </div>
      {rawCurrency ? (
        <p className="font-malt text-[11.5px] text-[#feedd5]/45">Эх сурвалж: {rawPrice} {rawCurrency} — ₮ рүү хөрвүүлээгүй.</p>
      ) : null}
      <div>
        <LLabel htmlFor="wi">Зургийн холбоос</LLabel>
        <LInput id="wi" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div>
        <LLabel htmlFor="wn">Тэмдэглэл</LLabel>
        <LTextArea id="wn" rows={2} value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="Яагаад авмаар байна вэ?" />
      </div>
      <div className="flex gap-2">
        <LButton onClick={save} loading={saving} disabled={!title.trim()} className="flex-1">
          {saving ? "Хадгалж байна…" : "Нэмэх"}
        </LButton>
        <LButton variant="ghost" onClick={() => setStep("url")} disabled={saving}>Буцах</LButton>
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: Item }) {
  const [pending, start] = useTransition();
  return (
    <div className={`flex gap-3 rounded-[16px] bg-white/[0.04] p-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-white/[0.06]">
        {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-malt text-[14.5px] font-bold text-[#feedd5]">{item.title}</p>
        {item.priceMnt != null ? <p className="font-malt text-[12px] font-semibold text-[#feedd5]/55">{formatMnt(item.priceMnt)}</p> : null}
        {item.note ? <p className="mt-0.5 line-clamp-1 font-malt text-[12px] text-[#feedd5]/45">{item.note}</p> : null}
        <div className="mt-1.5 flex items-center gap-2">
          {pending ? <Spinner className="h-3.5 w-3.5 text-[#feedd5]/40" /> : null}
          <button
            disabled={pending}
            onClick={() => start(async () => void (await deleteWishlistItem(item.id)))}
            className="ml-auto min-h-[34px] rounded-lg px-2 font-malt text-[11px] font-bold text-[#ff9a8a] transition-colors active:bg-white/[0.05]"
          >
            Устгах
          </button>
        </div>
      </div>
    </div>
  );
}
