"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState, useRef, useState, useTransition } from "react";
import { removeAvatar, uploadAvatar } from "@/lib/actions/avatar";
import { setProfileTheme, updateProfile } from "@/lib/actions/profile";
import { THEMES, type ThemeKey } from "@/lib/themes";
import { LButton, LInput, LLabel, LTextArea, LSection, Spinner } from "./ui";

type Profile = {
  displayName: string;
  handle: string;
  bio: string | null;
  avatarUrl: string | null;
  accentColor: string | null;
  theme: ThemeKey;
  socials: Record<string, string> | null;
};

export function LapisProfile({ profile }: { profile: Profile }) {
  const socials = profile.socials ?? {};
  const [avatar, setAvatar] = useState(profile.avatarUrl);
  const [uploading, startUpload] = useTransition();
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, action, saving] = useActionState(updateProfile, null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    const fd = new FormData();
    fd.set("file", file);
    startUpload(async () => {
      const res = await uploadAvatar(fd);
      if (res.error) setAvatarError(res.error);
      else if (res.url) setAvatar(res.url);
    });
  }

  return (
    <LSection icon="👤" title="Профайл">
      <div className="flex flex-col gap-4 rounded-[16px] bg-white/[0.04] p-4">
        {/* Avatar uploader */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-full ring-1 ring-white/10"
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-[#42282a] font-inter text-[30px] font-semibold text-[#fe7f42]">
                {profile.displayName.trim().charAt(0).toUpperCase() || "?"}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-active:opacity-100">
              {uploading ? (
                <Spinner className="h-5 w-5 text-white" />
              ) : (
                <span className="text-[11px] font-bold text-white">Солих</span>
              )}
            </span>
            {uploading ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Spinner className="h-5 w-5 text-[#fe7f42]" />
              </span>
            ) : null}
          </button>
          <div className="min-w-0">
            <p className="font-malt text-[14px] font-bold text-[#feedd5]">Профайл зураг</p>
            <div className="mt-1 flex gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="font-malt text-[12px] font-bold text-[#fe7f42]"
              >
                Зураг оруулах
              </button>
              {avatar ? (
                <button
                  type="button"
                  onClick={() =>
                    startUpload(async () => {
                      await removeAvatar();
                      setAvatar(null);
                    })
                  }
                  className="font-malt text-[12px] font-bold text-[#ff9a8a]"
                >
                  Устгах
                </button>
              ) : null}
            </div>
            {avatarError ? (
              <p className="mt-1 font-malt text-[11.5px] text-[#ff9a8a]">{avatarError}</p>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />
        </div>

        {/* Bio / name / socials form */}
        <form action={action} className="flex flex-col gap-3">
          <div>
            <LLabel htmlFor="displayName">Харагдах нэр</LLabel>
            <LInput id="displayName" name="displayName" defaultValue={profile.displayName} required />
          </div>
          <div>
            <LLabel htmlFor="bio">Танилцуулга</LLabel>
            <LTextArea id="bio" name="bio" rows={2} maxLength={160} defaultValue={profile.bio ?? ""} placeholder="Marketing · Gaming · Technology" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <LInput name="instagram" placeholder="Instagram" defaultValue={socials.instagram ?? ""} />
            <LInput name="tiktok" placeholder="TikTok" defaultValue={socials.tiktok ?? ""} />
            <LInput name="youtube" placeholder="YouTube" defaultValue={socials.youtube ?? ""} />
          </div>
          <input type="hidden" name="accentColor" value={profile.accentColor ?? ""} />

          {/* Inside the one form on purpose. Splitting it left the submit
              button in a second <form> with no displayName field, so saving
              failed with "Expected string, received null". Every control in
              ThemePicker is type="button", so nesting it submits nothing. */}
          <ThemePicker current={profile.theme} />

          {state?.error ? (
            <p className="font-malt text-[13px] text-[#ff9a8a]">{state.error}</p>
          ) : null}
          {state?.ok ? (
            <p className="font-malt text-[13px] text-[#8fe0a0]">Хадгаллаа ✓</p>
          ) : null}
          <LButton type="submit" loading={saving}>
            {saving ? "Хадгалж байна…" : "Хадгалах"}
          </LButton>
        </form>
      </div>
    </LSection>
  );
}

/**
 * Live theme picker. Each swatch previews the palette it applies — background,
 * accent, card and category — so the choice is made by looking, not by reading
 * four names. Selecting one saves immediately and revalidates the public page.
 */
function ThemePicker({ current }: { current: ThemeKey }) {
  const [choice, setChoice] = useState<ThemeKey>(current);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function choose(key: ThemeKey) {
    if (key === choice) return;
    const previous = choice;
    setChoice(key);
    setError(null);
    start(async () => {
      try {
        await setProfileTheme(key);
      } catch {
        setChoice(previous);
        setError("Хадгалж чадсангүй.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <LLabel>Загвар</LLabel>
        {pending ? <Spinner className="mb-1.5 h-3.5 w-3.5 text-[#fe7f42]" /> : null}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {THEMES.map((t) => {
          const active = t.key === choice;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => choose(t.key)}
              aria-pressed={active}
              className={`flex flex-col gap-2 rounded-[14px] p-2.5 text-left transition-all ${
                active
                  ? "ring-2 ring-[#fe7f42]"
                  : "ring-1 ring-inset ring-white/[0.1] active:ring-white/25"
              }`}
              style={{ background: t.tokens.bg }}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="h-5 w-5 shrink-0 rounded-full"
                  style={{ background: t.tokens.accent }}
                />
                <span
                  className="h-5 flex-1 rounded-[5px]"
                  style={{ background: t.tokens.card }}
                />
                <span
                  className="h-5 w-5 shrink-0 rounded-[5px]"
                  style={{ background: t.tokens.category }}
                />
              </span>
              <span
                className="font-malt text-[12.5px] font-bold"
                style={{ color: t.tokens.accent }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="font-malt text-[13px] text-[#ff9a8a]">{error}</p>
      ) : null}
    </div>
  );
}
