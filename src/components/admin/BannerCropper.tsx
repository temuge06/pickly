"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { AButton, AHint } from "./ui";

/** The banner's fixed aspect, straight from the card spec. */
const FRAME_W = 382;
const FRAME_H = 305;
/**
 * Exported at 3x the 382px card. 2x looked soft on modern phones, which run at
 * DPR 3 — the browser was upscaling the last 50%. 3x covers every DPR in use
 * and still lands well under 300KB as WebP.
 */
const OUT_W = 1146;
const OUT_H = 915;

type Props = {
  /** Receives the cropped image as a WebP blob, ready to upload. */
  onCropped: (blob: Blob) => void;
  busy?: boolean;
};

/**
 * Drag-and-drop banner cropper.
 *
 * Written against the canvas directly rather than pulling in a crop library:
 * the requirement is one fixed aspect with pan and zoom, and the same transform
 * that positions the preview also drives the export, so what the admin frames
 * is exactly what gets uploaded.
 */
export function BannerCropper({ onCropped, busy }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Scale at which the image exactly covers the frame — zoom multiplies this,
  // so zoom=1 is always "no empty edges" regardless of the source dimensions.
  const baseScale = img ? Math.max(FRAME_W / img.naturalWidth, FRAME_H / img.naturalHeight) : 1;
  const scale = baseScale * zoom;

  const clamp = useCallback(
    (o: { x: number; y: number }) => {
      if (!img) return o;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const maxX = Math.max(0, (w - FRAME_W) / 2);
      const maxY = Math.max(0, (h - FRAME_H) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, o.x)),
        y: Math.min(maxY, Math.max(-maxY, o.y)),
      };
    },
    [img, scale],
  );

  useEffect(() => {
    setOffset((o) => clamp(o));
  }, [clamp]);

  function accept(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Зураг файл сонгоно уу.");
    if (file.size > 12 * 1024 * 1024) return setError("Зураг хэтэрхий том (12MB-аас бага).");
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setSrc(url);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    image.onerror = () => setError("Зургийг уншиж чадсангүй.");
    image.src = url;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!img) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d || !frameRef.current) return;
    // The preview is CSS-scaled to fit the panel, so pointer deltas have to be
    // converted back into frame units or dragging drifts from the cursor.
    const ratio = FRAME_W / frameRef.current.getBoundingClientRect().width;
    setOffset(clamp({ x: d.ox + (e.clientX - d.x) * ratio, y: d.oy + (e.clientY - d.y) * ratio }));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  function exportCrop() {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return setError("Canvas дэмжигдэхгүй байна.");
    const k = OUT_W / FRAME_W; // frame units → output pixels
    const w = img.naturalWidth * scale * k;
    const h = img.naturalHeight * scale * k;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      (OUT_W - w) / 2 + offset.x * k,
      (OUT_H - h) / 2 + offset.y * k,
      w,
      h,
    );
    canvas.toBlob(
      (blob) => (blob ? onCropped(blob) : setError("Зургийг боловсруулж чадсангүй.")),
      "image/webp",
      0.92,
    );
  }

  if (!src || !img) {
    return (
      <div className="flex flex-col gap-2">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            accept(e.dataTransfer.files?.[0]);
          }}
          onClick={() => fileRef.current?.click()}
          className={`flex aspect-[382/305] w-full max-w-[340px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed p-4 text-center transition-colors ${
            dragOver
              ? "border-[#fe7f42] bg-[#fe7f42]/10"
              : "border-white/15 bg-white/[0.02] hover:border-white/30"
          }`}
        >
          <span className="text-[26px]" aria-hidden>
            🖼
          </span>
          <span className="font-inter text-[13.5px] font-semibold text-white/75">
            Зургаа энд чирж оруулна уу
          </span>
          <span className="font-inter text-[12px] text-white/35">
            эсвэл дарж сонгоно уу · JPG / PNG / WebP
          </span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => accept(e.target.files?.[0])}
        />
        {error ? (
          <p className="font-inter text-[12.5px] text-[#ffb3a3]">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative aspect-[382/305] w-full max-w-[340px] cursor-grab touch-none overflow-hidden rounded-[14px] bg-black/40 active:cursor-grabbing"
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
          style={{
            width: img.naturalWidth * scale,
            height: img.naturalHeight * scale,
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
          }}
        />
        {/* Mirrors where the live CTA sits, so the admin can avoid framing
            something important underneath it. */}
        <span className="pointer-events-none absolute bottom-[5%] right-[3%] flex h-[12%] w-[42%] items-center justify-center rounded-full border border-white/40 bg-white/10 font-inter text-[9px] text-white/70 backdrop-blur-[4px]">
          Дэлгэрэнгүй Үзэх
        </span>
      </div>

      <label className="flex items-center gap-2">
        <span className="font-malt text-[11.5px] font-bold uppercase tracking-wide text-white/40">
          Хэмжээ
        </span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer accent-[#fe7f42]"
          aria-label="Томруулах"
        />
      </label>
      <AHint>Чирж байрлуулаад, гулсуураар томруулна. 382×305 хэмжээгээр тайрна.</AHint>

      {error ? <p className="font-inter text-[12.5px] text-[#ffb3a3]">{error}</p> : null}

      <div className="flex gap-2">
        <AButton type="button" onClick={exportCrop} loading={busy} disabled={busy}>
          {busy ? "Байршуулж байна…" : "Энэ хэсгийг ашиглах"}
        </AButton>
        <AButton
          type="button"
          variant="ghost"
          onClick={() => {
            URL.revokeObjectURL(src);
            setSrc(null);
            setImg(null);
          }}
        >
          Өөр зураг
        </AButton>
      </div>
    </div>
  );
}
