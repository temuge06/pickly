"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import {
  adminCreateProduct,
  adminExtractPreview,
  type AdminSection,
} from "@/lib/actions/admin";
import type { PickPreview } from "@/lib/extract/preview";
import { ALabel, AButton, AError, AHint, AInput, ASelect, ASpinner, ATextArea } from "./ui";

type Collection = { id: string; title: string };

const SECTIONS: { value: AdminSection; label: string; hint: string }[] = [
  { value: "top_picks", label: "Top Picks", hint: "Цуглуулгад ороогүй үндсэн тавиур." },
  { value: "my_picks", label: "My Picks", hint: "Тодорхой цуглуулга дотор." },
  { value: "wishlist", label: "Wishlist", hint: "Хүсэж буй, аваагүй зүйл." },
  { value: "not_for_me", label: "Not For Me", hint: "Төлөв нь «Дахин авахгүй» болно." },
];

const STATUS = [
  { value: "testing", label: "Одоо туршиж байна" },
  { value: "recommend", label: "Баттай санал болгоно" },
  { value: "repurchased", label: "Дахин авсан" },
];

/**
 * Panel A. The paste-URL pipeline is the creator flow's, unchanged — the only
 * difference is that the row lands on the SELECTED creator's profile instead of
 * the signed-in one.
 *
 * Extraction never blocks: a failed fetch drops straight into the same manual
 * form with the URL preserved, so a product can always be filed by hand.
 */
export function AdminAddProduct({
  profileId,
  handle,
  collections,
}: {
  profileId: string;
  handle: string;
  collections: Collection[];
}) {
  const [step, setStep] = useState<"url" | "extracting" | "form">("url");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<PickPreview | null>(null);
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [section, setSection] = useState<AdminSection>("top_picks");
  const [collectionId, setCollectionId] = useState("");
  const [status, setStatus] = useState("testing");
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [priceMnt, setPriceMnt] = useState("");
  const [note, setNote] = useState("");
  const [rawPrice, setRawPrice] = useState<number | null>(null);
  const [rawCurrency, setRawCurrency] = useState<string | null>(null);

  function reset() {
    setStep("url");
    setUrl("");
    setPreview(null);
    setTitle("");
    setBrand("");
    setImageUrl("");
    setPriceMnt("");
    setNote("");
    setRawPrice(null);
    setRawCurrency(null);
    setError(null);
  }

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
    setSaved(null);
    setError(null);
    setStep("extracting");
    try {
      const p = await adminExtractPreview(url);
      setPreview(p);
      apply(p);
    } catch {
      // Even a thrown extractor must not dead-end the admin — fall through to
      // the manual form with the pasted URL intact.
      setPreview({
        title: null, brand: null, imageUrl: null, price: null, currency: null,
        sourceUrl: url.trim(), confident: false, failureReason: "fetch_failed",
      });
    } finally {
      setStep("form");
    }
  }

  function manual() {
    setSaved(null);
    setError(null);
    setPreview({
      title: null, brand: null, imageUrl: null, price: null, currency: null,
      sourceUrl: url.trim(), confident: false, failureReason: null,
    });
    setStep("form");
  }

  function save() {
    if (!title.trim()) return;
    setError(null);
    startSave(async () => {
      try {
        await adminCreateProduct({
          profileId,
          section,
          title,
          brand: brand || null,
          imageUrl: imageUrl || null,
          priceMnt: priceMnt ? Number.parseInt(priceMnt, 10) : null,
          rawPrice,
          rawCurrency,
          note: note || null,
          sourceUrl: preview?.sourceUrl || url || null,
          collectionId: section === "my_picks" ? collectionId || null : null,
          status: section === "not_for_me" ? null : status,
        });
        const label = SECTIONS.find((s) => s.value === section)?.label ?? "";
        setSaved(`«${title.trim()}» → @${handle} · ${label}`);
        reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Хадгалж чадсангүй.");
      }
    });
  }

  const needsCollection = section === "my_picks";
  const noCollections = needsCollection && collections.length === 0;

  if (step === "url") {
    return (
      <div className="flex flex-col gap-3">
        {saved ? (
          <p className="rounded-[10px] border border-[#7ddb9a]/25 bg-[#7ddb9a]/10 px-3 py-2.5 font-inter text-[12.5px] text-[#9ee7b4]">
            Нэмэгдлээ — {saved}
          </p>
        ) : null}
        <form onSubmit={onExtract} className="flex flex-col gap-3">
          <div>
            <ALabel htmlFor="au">Барааны холбоос</ALabel>
            <AInput
              id="au"
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <AHint>
              Нэр, зураг, үнийг автоматаар татна. Татаж чадаагүй ч гараар үргэлжлүүлж болно.
            </AHint>
          </div>
          <div className="flex gap-2">
            <AButton type="submit" disabled={!url.trim()}>Үргэлжлүүлэх</AButton>
            <AButton type="button" variant="ghost" onClick={manual}>Гараар нэмэх</AButton>
          </div>
        </form>
      </div>
    );
  }

  if (step === "extracting") {
    return (
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-2 font-malt text-[13px] font-bold text-white/60">
          <ASpinner className="h-4 w-4 text-[#fe7f42]" /> Мэдээлэл татаж байна…
        </div>
        <div className="skeleton-dark h-28 w-28 rounded-[12px]" />
        <div className="skeleton-dark h-11 w-full rounded-[10px]" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="skeleton-dark h-11 rounded-[10px]" />
          <div className="skeleton-dark h-11 rounded-[10px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {preview && !preview.confident ? (
        <p className="rounded-[10px] border border-[#fe7f42]/25 bg-[#fe7f42]/10 px-3 py-2.5 font-inter text-[12.5px] leading-relaxed text-[#ffb083]">
          {preview.failureReason === "js_rendered"
            ? "Автоматаар татаж чадсангүй. Доор гараар бөглөнө үү."
            : preview.failureReason === "blocked"
              ? "Энэ сайт автомат хандалтыг блокложээ. Доор гараар бөглөнө үү."
              : preview.failureReason === "fetch_failed"
                ? "Хуудсыг татаж чадсангүй. Холбоосоо шалгаад гараар бөглөнө үү."
                : "Мэдээллийг бүрэн татсангүй. Доор гараар нөхнө үү."}
        </p>
      ) : null}

      <div>
        <ALabel htmlFor="asec">Аль хэсэгт орох вэ</ALabel>
        <ASelect
          id="asec"
          value={section}
          onChange={(e) => setSection(e.target.value as AdminSection)}
        >
          {SECTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </ASelect>
        <AHint>{SECTIONS.find((s) => s.value === section)?.hint}</AHint>
      </div>

      {needsCollection ? (
        <div>
          <ALabel htmlFor="acol">Цуглуулга</ALabel>
          {noCollections ? (
            <AError>
              Энэ бүтээгчид цуглуулга алга. Тэд өөрсдөө цуглуулга үүсгэсний дараа
              My Picks рүү нэмэх боломжтой — эсвэл Top Picks-т нэмнэ үү.
            </AError>
          ) : (
            <ASelect
              id="acol"
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
            >
              <option value="">Сонгоно уу…</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </ASelect>
          )}
        </div>
      ) : null}

      {section !== "not_for_me" && section !== "wishlist" ? (
        <div>
          <ALabel htmlFor="ast">Төлөв</ALabel>
          <ASelect id="ast" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </ASelect>
        </div>
      ) : null}

      {imageUrl ? (
        <div className="h-28 w-28 overflow-hidden rounded-[12px] bg-white/[0.04]">
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div>
        <ALabel htmlFor="at">Нэр *</ALabel>
        <AInput id="at" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Барааны нэр" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {section !== "wishlist" ? (
          <div>
            <ALabel htmlFor="ab">Брэнд</ALabel>
            <AInput id="ab" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
        ) : null}
        <div>
          <ALabel htmlFor="ap">Үнэ (₮)</ALabel>
          <AInput
            id="ap"
            inputMode="numeric"
            value={priceMnt}
            onChange={(e) => setPriceMnt(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="45000"
          />
        </div>
      </div>

      {rawCurrency ? (
        <p className="font-inter text-[12px] text-white/40">
          Эх сурвалж: {rawPrice} {rawCurrency} — ₮ рүү хөрвүүлээгүй.
        </p>
      ) : null}

      <div>
        <ALabel htmlFor="ai">Зургийн холбоос</ALabel>
        <AInput id="ai" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
      </div>

      <div>
        <ALabel htmlFor="an">Тэмдэглэл</ALabel>
        <ATextArea
          id="an"
          rows={2}
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Яагаад санал болгож байгаа вэ?"
        />
      </div>

      {error ? <AError>{error}</AError> : null}

      <div className="flex gap-2">
        <AButton
          onClick={save}
          loading={saving}
          disabled={!title.trim() || (needsCollection && !collectionId)}
        >
          {saving ? "Хадгалж байна…" : `@${handle}-д нэмэх`}
        </AButton>
        <AButton variant="ghost" onClick={reset} disabled={saving}>Цуцлах</AButton>
      </div>
    </div>
  );
}
