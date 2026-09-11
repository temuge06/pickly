"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminDeleteCreator } from "@/lib/actions/admin";
import { AButton, AError, AHint, AInput, ALabel } from "./ui";

/**
 * The one irreversible control on the creator page, so it earns more than the
 * `confirm()` the other rows use: the button opens an inline confirmation that
 * asks for the handle to be typed back, and the action re-checks that handle
 * against the row before it deletes anything. Nothing here is optimistic —
 * there is no state to revert to.
 */
export function AdminDeleteCreator({
  profileId,
  handle,
  displayName,
}: {
  profileId: string;
  handle: string;
  displayName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const matches = typed.trim().toLowerCase() === handle.toLowerCase();

  function submit() {
    if (!matches) return;
    setError(null);
    start(async () => {
      try {
        const { warning } = await adminDeleteCreator(profileId, typed);
        if (warning) window.alert(warning);
        router.push("/admin");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
      }
    });
  }

  if (!open) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="font-inter text-[12.5px] leading-relaxed text-white/40">
          Профайл, бараа, промо код, холбоос, асуулт, статистик — бүгд устана.
          Буцаах боломжгүй.
        </p>
        <AButton
          variant="ghost"
          onClick={() => setOpen(true)}
          className="border border-[#ff8a75]/30 !bg-[#ff8a75]/10 !text-[#ffb3a3] hover:!bg-[#ff8a75]/20"
        >
          Бүртгэл устгах
        </AButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-[#ff8a75]/25 bg-[#ff8a75]/[0.06] p-4">
      <p className="font-inter text-[13px] leading-relaxed text-white/80">
        <span className="font-semibold text-white">{displayName}</span> (@{handle})
        бүртгэлийг бүх өгөгдөлтэй нь хамт устгах гэж байна.
      </p>
      <div>
        <ALabel htmlFor="del-handle">Баталгаажуулахын тулд @{handle} гэж бичнэ үү</ALabel>
        <AInput
          id="del-handle"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={handle}
          autoComplete="off"
          spellCheck={false}
          disabled={pending}
        />
        <AHint>Нэвтрэх бүртгэл нь ч устана — энэ имэйлээр дахин бүртгүүлж болно.</AHint>
      </div>
      <div className="flex items-center gap-2">
        <AButton
          onClick={submit}
          loading={pending}
          disabled={!matches || pending}
          className="!bg-[#ff6a55] !text-[#2a0f0a]"
        >
          Бүрмөсөн устгах
        </AButton>
        <AButton
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setTyped("");
            setError(null);
          }}
          disabled={pending}
        >
          Болих
        </AButton>
      </div>
      {error ? <AError>{error}</AError> : null}
    </div>
  );
}
