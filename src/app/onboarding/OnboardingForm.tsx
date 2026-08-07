"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState, useRef, useState } from "react";
import { LButton, LInput, LLabel, Hint, Spinner } from "@/components/dashboard/lapis/ui";
import { uploadOnboardingAvatar } from "@/lib/actions/avatar";
import { completeOnboarding } from "@/lib/auth/onboarding";

export function OnboardingForm({ username }: { username: string }) {
  const [state, action, pending] = useActionState(completeOnboarding, null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setUploadErr("");
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadOnboardingAvatar(fd);
    setUploading(false);
    if (res.error) {
      setUploadErr(res.error);
      return;
    }
    if (res.url) setAvatarUrl(res.url);
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* Avatar uploader — pulls from the device camera / photo library */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative h-24 w-24 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/10 transition-transform active:scale-95"
          aria-label="Зураг оруулах"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[26px] text-[#feedd5]/40">
              {uploading ? "" : "＋"}
            </span>
          )}
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Spinner className="h-6 w-6 text-[#fe7f42]" />
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="font-malt text-[13px] font-bold text-[#fe7f42]"
        >
          {avatarUrl ? "Зураг солих" : "Зураг оруулах"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickFile}
        />
        <input type="hidden" name="avatarUrl" value={avatarUrl} />
        {uploadErr ? (
          <Hint>
            <span className="text-[#ff9a8a]">{uploadErr}</span>
          </Hint>
        ) : null}
      </div>

      <div>
        <LLabel htmlFor="handle">Хаяг</LLabel>
        <div className="flex items-center gap-1 rounded-[14px] bg-white/[0.04] px-4 py-3 font-malt text-[15px] text-[#feedd5]/70">
          <span className="text-[#feedd5]/40">pickly.mn/</span>
          <span className="font-bold text-[#feedd5]">{username}</span>
        </div>
        <Hint>Энэ таны хуудасны хаяг. Бүртгүүлэх үедээ сонгосон нэр.</Hint>
      </div>

      <div>
        <LLabel htmlFor="displayName">Харагдах нэр</LLabel>
        <LInput
          id="displayName"
          name="displayName"
          required
          defaultValue={username}
          placeholder="Сарнай Бат-Эрдэнэ"
        />
      </div>

      {state?.error ? (
        <p className="font-malt text-[13.5px] text-[#ff9a8a]">{state.error}</p>
      ) : null}

      <LButton type="submit" loading={pending} disabled={uploading} className="w-full">
        Хуудас үүсгэх
      </LButton>
    </form>
  );
}
