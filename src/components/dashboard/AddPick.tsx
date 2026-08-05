"use client";

import { useState, useTransition } from "react";
import {
  createPick,
  extractPickPreview,
  type PickPreview,
} from "@/lib/actions/picks";
import { DashButton, DashInput, DashLabel, DashSelect, DashTextArea, Hint } from "./ui";

type Collection = { id: string; title: string };

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "testing", label: "Одоо туршиж байна" },
  { value: "recommend", label: "Баттай санал болгоно" },
  { value: "repurchased", label: "Дахин авсан" },
  { value: "wont_rebuy", label: "Дахин авахгүй" },
];

export function AddPick({
  collections,
  onDone,
  seedNote,
}: {
  collections: Collection[];
  onDone?: () => void;
  seedNote?: string;
}) {
  const [step, setStep] = useState<"url" | "extracting" | "form">("url");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<PickPreview | null>(null);
  const [saving, startSaving] = useTransition();

  // Form fields.
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [priceMnt, setPriceMnt] = useState("");
  const [note, setNote] = useState(seedNote ?? "");
  const [status, setStatus] = useState("testing");
  const [collectionId, setCollectionId] = useState("");
  const [rawCurrency, setRawCurrency] = useState<string | null>(null);
  const [rawPrice, setRawPrice] = useState<number | null>(null);

  function applyPreview(p: PickPreview) {
    setTitle(p.title ?? "");
    setBrand(p.brand ?? "");
    setImageUrl(p.imageUrl ?? "");
    if (p.price != null && (p.currency ?? "MNT").toUpperCase() === "MNT") {
      setPriceMnt(String(Math.round(p.price)));
    } else {
      setPriceMnt("");
      if (p.price != null) {
        setRawPrice(p.price);
        setRawCurrency(p.currency);
      }
    }
  }

  async function onExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setStep("extracting");
    try {
      const p = await extractPickPreview(url);
      setPreview(p);
      applyPreview(p);
    } catch {
      setPreview({
        title: null,
        brand: null,
        imageUrl: null,
        price: null,
        currency: null,
        sourceUrl: url,
        confident: false,
        failureReason: "fetch_failed",
      });
    } finally {
      setStep("form");
    }
  }

  function startManual() {
    setPreview({
      title: null,
      brand: null,
      imageUrl: null,
      price: null,
      currency: null,
      sourceUrl: url.trim(),
      confident: false,
      failureReason: null,
    });
    setStep("form");
  }

  function onSave() {
    if (!title.trim()) return;
    startSaving(async () => {
      await createPick({
        title,
        brand: brand || null,
        imageUrl: imageUrl || null,
        priceMnt: priceMnt ? Number.parseInt(priceMnt, 10) : null,
        rawPrice,
        rawCurrency,
        note: note || null,
        status,
        sourceUrl: preview?.sourceUrl || url || null,
        outboundUrl: preview?.sourceUrl || url || null,
        collectionId: collectionId || null,
      });
      onDone?.();
    });
  }

  // Step 1: paste URL.
  if (step === "url") {
    return (
      <form onSubmit={onExtract} className="animate-pop flex flex-col gap-3 rounded-[16px] bg-black/[0.03] p-4">
        <div>
          <DashLabel htmlFor="pickurl">Барааны холбоос</DashLabel>
          <DashInput
            id="pickurl"
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
          />
          <Hint>Холбоосыг тавихад нэр, зураг, үнийг автоматаар татна.</Hint>
        </div>
        <div className="flex gap-2">
          <DashButton type="submit" disabled={!url.trim()} className="flex-1">
            Үргэлжлүүлэх
          </DashButton>
          <DashButton type="button" variant="ghost" onClick={startManual}>
            Гараар
          </DashButton>
        </div>
      </form>
    );
  }

  // Step 1.5: extracting — animated skeleton of the form that's coming.
  if (step === "extracting") {
    return (
      <div className="animate-pop flex flex-col gap-4 rounded-[16px] bg-black/[0.03] p-4">
        <div className="flex items-center justify-center gap-2 py-1 font-header text-[13px] font-bold text-black/55">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-spotly-accent border-t-transparent" />
          Мэдээлэл татаж байна…
        </div>
        <div className="skeleton mx-auto aspect-square w-32 rounded-2xl" />
        <div className="skeleton h-11 w-full rounded-[14px]" />
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-11 rounded-[14px]" />
          <div className="skeleton h-11 rounded-[14px]" />
        </div>
        <div className="skeleton h-11 w-full rounded-[14px]" />
      </div>
    );
  }

  // Step 2: pre-filled / manual form.
  return (
    <div className="animate-pop flex flex-col gap-4 rounded-[16px] bg-black/[0.03] p-4">
      {preview && !preview.confident ? (
        <p className="rounded-[12px] bg-spotly-accent/10 px-3 py-2.5 font-header text-[12.5px] font-medium text-[#c23361]">
          {preview.failureReason === "js_rendered"
            ? "Энэ сайт мэдээллээ JavaScript-ээр ачаалдаг тул автоматаар татаж чадсангүй. Доор гараар бөглөнө үү — хадгалахад асуудалгүй."
            : preview.failureReason === "blocked"
              ? "Энэ сайт автомат хандалтыг блокложээ. Доор гараар бөглөнө үү."
              : preview.failureReason === "fetch_failed"
                ? "Хуудсыг татаж чадсангүй. Холбоосоо шалгаад, доор гараар бөглөнө үү."
                : "Мэдээллийг бүрэн татаж чадсангүй. Доор гараар нөхнө үү."}
        </p>
      ) : null}

      {imageUrl ? (
        <div className="animate-fade-up relative mx-auto aspect-square w-32 overflow-hidden rounded-2xl bg-black/[0.05] shadow-[0_4px_16px_-6px_rgba(0,0,0,0.3)]">
          {/* Plain <img>: transient preview of an arbitrary external product
              URL. Re-hosted to Supabase on save, so next/image can't be used. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
      ) : null}

      <div>
        <DashLabel htmlFor="p-title">Нэр *</DashLabel>
        <DashInput
          id="p-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Барааны нэр"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <DashLabel htmlFor="p-brand">Брэнд</DashLabel>
          <DashInput id="p-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
        <div>
          <DashLabel htmlFor="p-price">Үнэ (₮)</DashLabel>
          <DashInput
            id="p-price"
            inputMode="numeric"
            value={priceMnt}
            onChange={(e) => setPriceMnt(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="45000"
          />
        </div>
      </div>

      {rawCurrency ? (
        <p className="font-header text-[11.5px] text-black/45">
          Эх сурвалж: {rawPrice} {rawCurrency} — ₮ рүү хөрвүүлээгүй.
        </p>
      ) : null}

      <div>
        <DashLabel htmlFor="p-image">Зургийн холбоос</DashLabel>
        <DashInput
          id="p-image"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div>
        <DashLabel htmlFor="p-note">Тэмдэглэл</DashLabel>
        <DashTextArea
          id="p-note"
          rows={2}
          value={note}
          maxLength={200}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Яагаад санал болгож байгаа вэ?"
        />
      </div>

      <div>
        <DashLabel htmlFor="p-status">Төлөв</DashLabel>
        <DashSelect
          id="p-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </DashSelect>
      </div>

      {collections.length > 0 ? (
        <div>
          <DashLabel htmlFor="p-collection">Цуглуулга</DashLabel>
          <DashSelect
            id="p-collection"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
          >
            <option value="">Байхгүй (үндсэн тавиур)</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </DashSelect>
        </div>
      ) : null}

      <div className="flex gap-2">
        <DashButton onClick={onSave} loading={saving} disabled={!title.trim()} className="flex-1">
          {saving ? "Хадгалж байна…" : "Пик нэмэх"}
        </DashButton>
        <DashButton variant="ghost" onClick={() => setStep("url")} disabled={saving}>
          Буцах
        </DashButton>
      </div>
    </div>
  );
}
