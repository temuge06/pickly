"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCampaign,
  updateCampaign,
  uploadCampaignBanner,
  type CampaignInput,
} from "@/lib/actions/campaigns";
import { BannerCropper } from "./BannerCropper";
import { ALabel, AButton, AError, AHint, AInput, ASpinner, SaveState } from "./ui";
import { useSaveState } from "./useSaveState";

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
  // advertiser_label is retained on the row for existing data but is no longer
  // shown on the profile — the banner links out directly — so the form does
  // not collect it any more.
  const [label] = useState(existing?.advertiserLabel ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const save = useSaveState();

  /** The cropper hands back a already-framed WebP blob; upload it as-is. */
  function onCropped(blob: Blob) {
    setError(null);
    const fd = new FormData();
    fd.set("file", new File([blob], "banner.webp", { type: "image/webp" }));
    startUpload(async () => {
      const res = await uploadCampaignBanner(fd);
      if (res.error) setError(res.error);
      else if (res.url) setBanner(res.url);
    });
  }

  function onSave() {
    if (!title.trim()) return;
    setError(null);
    save.run(async () => {
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
          <div className="flex flex-col gap-2">
            <div className="aspect-[382/305] w-full max-w-[340px] overflow-hidden rounded-[14px] bg-white/[0.04]">
              <img src={banner} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <AButton type="button" variant="ghost" onClick={() => setBanner("")}>
                Өөр зураг
              </AButton>
              <span className="font-inter text-[12.5px] font-semibold text-[#9ee7b4]">
                ✓ Зураг байршлаа
              </span>
            </div>
          </div>
        ) : (
          <BannerCropper onCropped={onCropped} busy={uploading} />
        )}
        <AInput
          className="mt-2"
          value={banner}
          onChange={(e) => setBanner(e.target.value)}
          placeholder="эсвэл зургийн холбоос https://…"
        />
        <AHint>Чирж оруулаад тайрна. Хадгалахдаа 764×610 WebP болгоно.</AHint>
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

      {error ? <AError>{error}</AError> : null}

      {/* A campaign with no banner renders an empty box on every profile it is
          assigned to, and the upload takes a moment — so saving is blocked both
          while it is in flight and while the banner is still missing. Without
          this, hitting save early silently stored a campaign with a null
          banner and the image looked like it had "not been saved". */}
      {!banner ? (
        <p className="font-inter text-[12.5px] text-white/40">
          {uploading
            ? "Зураг байршиж байна… дуустал хүлээнэ үү."
            : "Баннер зураг заавал — үүнгүйгээр профайл дээр хоосон харагдана."}
        </p>
      ) : null}

      <div className="flex gap-2">
        <AButton
          onClick={onSave}
          loading={save.busy}
          disabled={!title.trim() || !banner || uploading || save.busy}
        >
          {existing ? "Хадгалах" : "Үүсгэх"}
        </AButton>
        <span className="self-center">
          <SaveState
            status={save.status}
            error={save.error}
            labels={{ saved: existing ? "Хадгаллаа" : "Үүслээ" }}
          />
        </span>
        {uploading ? <ASpinner className="h-4 w-4 self-center text-[#fe7f42]" /> : null}
      </div>
    </div>
  );
}
