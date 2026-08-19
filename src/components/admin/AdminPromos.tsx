"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPromo,
  deletePromo,
  reorderPromos,
  setPromoActive,
  updatePromo,
  uploadPromoImage,
  type PromoInput,
  type PromoRow,
} from "@/lib/actions/promos";
import { BannerCropper } from "./BannerCropper";
import { ALabel, AButton, AError, AHint, AInput, ASpinner, SaveState } from "./ui";
import { useSaveState } from "./useSaveState";

/** The ticket's artwork panel: 114x162 rendered, stored at 3x. */
const PROMO_FRAME = { w: 114, h: 162 };
const PROMO_OUTPUT = { w: 342, h: 486 };

/**
 * Promo codes for one creator. Staff-only — a creator cannot add these, so the
 * whole surface lives here rather than on their dashboard.
 */
export function AdminPromos({
  profileId,
  promos,
}: {
  profileId: string;
  promos: PromoRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<void>) {
    setError(null);
    start(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
      }
    });
  }

  function move(index: number, delta: number) {
    const next = [...promos];
    const t = index + delta;
    if (t < 0 || t >= next.length) return;
    [next[index], next[t]] = [next[t]!, next[index]!];
    run(() => reorderPromos(profileId, next.map((p) => p.id)));
  }

  return (
    <div className="flex flex-col gap-3">
      {promos.length === 0 && !adding ? (
        <p className="font-inter text-[12.5px] text-white/30">
          Промо код алга — профайл дээр энэ хэсэг харагдахгүй.
        </p>
      ) : null}

      {promos.map((p, i) =>
        editing === p.id ? (
          <div key={p.id} className="rounded-[14px] border border-white/[0.08] bg-white/[0.02] p-4">
            <PromoForm
              profileId={profileId}
              existing={p}
              onDone={() => {
                setEditing(null);
                router.refresh();
              }}
            />
          </div>
        ) : (
          <div
            key={p.id}
            className="flex items-center gap-2.5 rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-2.5"
          >
            <span className="font-malt text-[11px] font-bold text-white/30">{i + 1}</span>
            <div
              className="h-[46px] w-[32px] shrink-0 overflow-hidden rounded-[6px] bg-white/[0.05]"
              title="Промо зураг"
            >
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-inter text-[13.5px] font-semibold text-white">
                {p.headline}
                <span className="ml-2 rounded-[5px] bg-white/[0.08] px-1.5 py-0.5 font-malt text-[11px] text-white/70">
                  {p.code}
                </span>
              </p>
              <p className="truncate font-inter text-[11.5px] text-white/35">
                {p.url ?? "холбоосгүй"}
                {p.isActive ? "" : " · унтраалттай"}
              </p>
            </div>
            <button type="button" disabled={pending || i === 0} onClick={() => move(i, -1)}
              aria-label="Дээш"
              className="shrink-0 rounded-[7px] px-2 py-1 font-malt text-[13px] text-white/45 hover:text-white/85 disabled:opacity-25">↑</button>
            <button type="button" disabled={pending || i === promos.length - 1} onClick={() => move(i, 1)}
              aria-label="Доош"
              className="shrink-0 rounded-[7px] px-2 py-1 font-malt text-[13px] text-white/45 hover:text-white/85 disabled:opacity-25">↓</button>
            <button type="button" disabled={pending} onClick={() => setEditing(p.id)}
              className="shrink-0 rounded-[8px] px-2 py-1 font-malt text-[12px] font-bold text-white/45 hover:text-white/80 disabled:opacity-40">Засах</button>
            <button type="button" disabled={pending} onClick={() => run(() => setPromoActive(p.id, !p.isActive))}
              className="shrink-0 rounded-[8px] px-2 py-1 font-malt text-[12px] font-bold text-white/45 hover:text-white/80 disabled:opacity-40">
              {p.isActive ? "Зогсоох" : "Асаах"}
            </button>
            <button type="button" disabled={pending}
              onClick={() => { if (confirm(`«${p.code}» устгах уу?`)) run(() => deletePromo(p.id)); }}
              className="shrink-0 rounded-[8px] px-2 py-1 font-malt text-[12px] font-bold text-[#ffb3a3] hover:text-[#ff8a75] disabled:opacity-40">Устгах</button>
          </div>
        ),
      )}

      {adding ? (
        <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.02] p-4">
          <PromoForm
            profileId={profileId}
            onDone={() => {
              setAdding(false);
              router.refresh();
            }}
          />
        </div>
      ) : (
        <AButton onClick={() => setAdding(true)} disabled={pending}>
          + Промо код нэмэх
        </AButton>
      )}

      {pending ? <ASpinner className="h-4 w-4 text-[#fe7f42]" /> : null}
      {error ? <AError>{error}</AError> : null}
    </div>
  );
}

function PromoForm({
  profileId,
  existing,
  onDone,
}: {
  profileId: string;
  existing?: PromoRow;
  onDone: () => void;
}) {
  const [headline, setHeadline] = useState(existing?.headline ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [code, setCode] = useState(existing?.code ?? "");
  const [url, setUrl] = useState(existing?.url ?? "");
  const [image, setImage] = useState(existing?.imageUrl ?? "");
  const [expires, setExpires] = useState(
    existing?.expiresAt ? new Date(existing.expiresAt).toISOString().slice(0, 10) : "",
  );
  const [uploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const save = useSaveState();

  function onCropped(blob: Blob) {
    setUploadError(null);
    const fd = new FormData();
    fd.set("file", new File([blob], "promo.webp", { type: "image/webp" }));
    startUpload(async () => {
      const res = await uploadPromoImage(fd);
      if (res.error) setUploadError(res.error);
      else if (res.url) setImage(res.url);
    });
  }

  function submit() {
    const payload: PromoInput = {
      headline,
      description: description || null,
      code,
      url: url || null,
      imageUrl: image || null,
      expiresAt: expires || null,
    };
    save.run(async () => {
      if (existing) await updatePromo(existing.id, payload);
      else await createPromo(profileId, payload);
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <ALabel htmlFor="ph">Гарчиг *</ALabel>
          <AInput id="ph" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="10% OFF" />
        </div>
        <div>
          <ALabel htmlFor="pc">Промо код *</ALabel>
          <AInput id="pc" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ANU10" />
        </div>
      </div>

      <div>
        <ALabel htmlFor="pd">Тайлбар</ALabel>
        <AInput id="pd" value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="биетээр үйлчлүүлэхдээ ашиглана уу." />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <ALabel htmlFor="pu">Сайтын холбоос</ALabel>
          <AInput id="pu" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          <AHint>Copy дарахад код хуулагдаад энэ сайт нээгдэнэ.</AHint>
        </div>
        <div>
          <ALabel htmlFor="pe">Дуусах огноо</ALabel>
          <AInput id="pe" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          <AHint>Хоосон бол хугацаа харагдахгүй.</AHint>
        </div>
      </div>

      <div>
        <ALabel>Зураг</ALabel>
        {image ? (
          <div className="flex items-center gap-3">
            <div className="h-[162px] w-[114px] overflow-hidden rounded-[10px] bg-white/[0.04]">
              <img src={image} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col gap-2">
              <AButton type="button" variant="ghost" onClick={() => setImage("")}>Өөр зураг</AButton>
              <span className="font-inter text-[12.5px] font-semibold text-[#9ee7b4]">✓ Зураг байршлаа</span>
            </div>
          </div>
        ) : (
          <BannerCropper
            onCropped={onCropped}
            busy={uploading}
            frame={PROMO_FRAME}
            output={PROMO_OUTPUT}
            showCtaGuide={false}
          />
        )}
        {uploadError ? <AError>{uploadError}</AError> : null}
      </div>

      <div className="flex items-center gap-2">
        <AButton
          onClick={submit}
          loading={save.busy}
          disabled={!headline.trim() || !code.trim() || uploading || save.busy}
        >
          {existing ? "Хадгалах" : "Нэмэх"}
        </AButton>
        <AButton variant="ghost" onClick={onDone} disabled={save.busy}>Болих</AButton>
        <SaveState status={save.status} error={save.error} />
      </div>
    </div>
  );
}
