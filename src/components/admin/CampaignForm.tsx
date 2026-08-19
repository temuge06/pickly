"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCampaign,
  updateCampaign,
  uploadCampaignBanner,
  type CampaignInput,
} from "@/lib/actions/campaigns";
import { ALabel, AButton, AError, AHint, AInput, ASpinner } from "./ui";

type Existing = CampaignInput & { id: string };

/**
 * Create/edit a campaign. The banner accepts either a file upload or a pasted
 * URL — a pasted one is re-hosted server-side, so either route ends up in our
 * own Storage and the advertiser cannot swap the creative underneath us.
 */
export function CampaignForm({
  existing,
  onSaved,
}: {
  existing?: Existing;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [banner, setBanner] = useState(existing?.bannerImageUrl ?? "");
  const [destination, setDestination] = useState(existing?.destinationUrl ?? "");
  const [label, setLabel] = useState(existing?.advertiserLabel ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const [saving, startSave] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    startUpload(async () => {
      const res = await uploadCampaignBanner(fd);
      if (res.error) setError(res.error);
      else if (res.url) setBanner(res.url);
    });
  }

  function save() {
    if (!title.trim()) return;
    setError(null);
    startSave(async () => {
      try {
        const payload: CampaignInput = {
          title,
          bannerImageUrl: banner || null,
          destinationUrl: destination || null,
          advertiserLabel: label || null,
        };
        if (existing) {
          await updateCampaign(existing.id, payload);
        } else {
          const id = await createCampaign(payload);
          router.push(`/admin/campaigns/${id}`);
        }
        onSaved?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Хадгалж чадсангүй.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <ALabel htmlFor="ctitle">Нэр *</ALabel>
        <AInput
          id="ctitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ayanga — Back to School"
        />
        <AHint>Дотоод нэр. Профайл дээр харагдахгүй.</AHint>
      </div>

      <div>
        <ALabel>Баннер зураг</ALabel>
        {banner ? (
          <div className="mb-2 aspect-[382/305] w-full max-w-[300px] overflow-hidden rounded-[12px] bg-white/[0.04]">
            <img src={banner} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onPick}
          />
          <AButton
            type="button"
            variant="ghost"
            onClick={() => fileRef.current?.click()}
            loading={uploading}
          >
            {uploading ? "Байршуулж байна…" : "Зураг сонгох"}
          </AButton>
          {banner ? (
            <AButton type="button" variant="ghost" onClick={() => setBanner("")}>
              Арилгах
            </AButton>
          ) : null}
        </div>
        <AInput
          className="mt-2"
          value={banner}
          onChange={(e) => setBanner(e.target.value)}
          placeholder="эсвэл зургийн холбоос https://…"
        />
        <AHint>382×305 харьцаагаар автоматаар тайрч, WebP болгож хадгална.</AHint>
      </div>

      <div>
        <ALabel htmlFor="cdest">Очих холбоос</ALabel>
        <AInput
          id="cdest"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="https://www.facebook.com/ayanga.store"
        />
      </div>

      <div>
        <ALabel htmlFor="clabel">Доор харагдах бичиг</ALabel>
        <AInput
          id="clabel"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="https://www.facebook.com/ayanga.store"
        />
        <AHint>Баннерын доор доогуур зураастай, том үсгээр гарна. Хоосон бол харагдахгүй.</AHint>
      </div>

      {error ? <AError>{error}</AError> : null}

      <div className="flex gap-2">
        <AButton onClick={save} loading={saving} disabled={!title.trim()}>
          {existing ? "Хадгалах" : "Үүсгэх"}
        </AButton>
        {uploading ? <ASpinner className="h-4 w-4 self-center text-[#fe7f42]" /> : null}
      </div>
    </div>
  );
}
