"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import { socialGlyph } from "@/components/social-icons";
import { removeAvatar, uploadAvatar } from "@/lib/actions/avatar";
import { setProfileTheme, updateProfile } from "@/lib/actions/profile";
import {
  SOCIAL_PLATFORMS,
  displaySocial,
  getPlatform,
  isSocialKey,
  type SocialKey,
} from "@/lib/socials";
import { THEMES, type ThemeKey } from "@/lib/themes";
import { useDashboardTheme } from "./ThemeShell";
import { LButton, LInput, LLabel, LTextArea, LSection, Spinner, Well } from "./ui";

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
      <Well className="flex flex-col gap-4 p-4">
        {/* Avatar uploader */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--t-ring)]"
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-[var(--t-avatar-bg)] font-inter text-[30px] font-semibold text-[var(--t-accent)]">
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
                <Spinner className="h-5 w-5 text-[var(--t-accent)]" />
              </span>
            ) : null}
          </button>
          <div className="min-w-0">
            <p className="font-malt text-[14px] font-bold text-[var(--t-text)]">Профайл зураг</p>
            <div className="mt-1 flex gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="font-malt text-[12px] font-bold text-[var(--t-accent)]"
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
                  className="font-malt text-[12px] font-bold text-[var(--t-danger)]"
                >
                  Устгах
                </button>
              ) : null}
            </div>
            {avatarError ? (
              <p className="mt-1 font-malt text-[11.5px] text-[var(--t-danger)]">{avatarError}</p>
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
            <LLabel htmlFor="bio">Bio</LLabel>
            <LTextArea
              id="bio"
              name="bio"
              rows={2}
              maxLength={160}
              defaultValue={profile.bio ?? ""}
              placeholder="Write your bio here…"
            />
          </div>

          <SocialsEditor socials={profile.socials ?? {}} />

          <input type="hidden" name="accentColor" value={profile.accentColor ?? ""} />

          {/* Inside the one form on purpose. Splitting it left the submit
              button in a second <form> with no displayName field, so saving
              failed with "Expected string, received null". Every control in
              ThemePicker is type="button", so nesting it submits nothing. */}
          <ThemePicker current={profile.theme} />

          {state?.error ? (
            <p className="font-malt text-[13px] text-[var(--t-danger)]">{state.error}</p>
          ) : null}
          {state?.ok ? (
            <p className="font-malt text-[13px] text-[var(--t-success)]">Хадгаллаа ✓</p>
          ) : null}
          <LButton type="submit" loading={saving}>
            {saving ? "Хадгалж байна…" : "Хадгалах"}
          </LButton>
        </form>
      </Well>
    </LSection>
  );
}

/**
 * Social links, Linktree-style: a row per platform the creator has actually
 * added, and a picker to add another.
 *
 * The old version was a fixed three-up grid of bare `<input placeholder="…">`
 * boxes — no icons, no indication that a handle was enough, and no way to add
 * anything beyond Instagram / TikTok / YouTube. Showing an empty field for all
 * fourteen platforms instead would bury the rest of the form, hence
 * add-on-demand: the screen only grows with what is in use.
 *
 * Every row submits `social_<key>`, including the ones left empty, so clearing
 * a field and saving actually removes it (a key absent from the FormData would
 * simply keep its old value).
 */
function SocialsEditor({ socials }: { socials: Record<string, string> }) {
  const initial = useMemo(
    () =>
      SOCIAL_PLATFORMS.filter((p) => socials[p.key]).map((p) => ({
        key: p.key,
        value: displaySocial(p.key, socials[p.key]!),
      })),
    [socials],
  );

  const [rows, setRows] = useState<{ key: SocialKey; value: string }[]>(initial);
  const [picking, setPicking] = useState(false);

  const used = new Set(rows.map((r) => r.key));
  const available = SOCIAL_PLATFORMS.filter((p) => !used.has(p.key));

  function add(key: string) {
    if (!isSocialKey(key)) return;
    setRows((r) => [...r, { key, value: "" }]);
    setPicking(false);
  }

  function update(key: SocialKey, value: string) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, value } : row)));
  }

  function remove(key: SocialKey) {
    setRows((r) => r.filter((row) => row.key !== key));
  }

  return (
    <div className="flex flex-col gap-2">
      <LLabel>Сошиал холбоос</LLabel>

      {rows.map(({ key, value }) => {
        const platform = getPlatform(key)!;
        return (
          <div
            key={key}
            className="animate-pop flex items-center gap-2 rounded-[14px] bg-[var(--t-field)] px-2.5 py-2 ring-1 ring-inset ring-[var(--t-ring)]"
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--t-accent)] text-[var(--t-on-accent)]">
              {socialGlyph(key, 15)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-malt text-[10.5px] font-bold uppercase tracking-wide text-[var(--t-muted)]">
                {platform.label}
              </p>
              <div className="flex items-baseline">
                {platform.display ? (
                  // Same 16px as the input beside it: at 13px the prefix read
                  // as a caption rather than as part of the address.
                  <span className="shrink-0 font-malt text-[16px] text-[var(--t-muted)]">
                    {platform.display}
                  </span>
                ) : null}
                <input
                  name={`social_${key}`}
                  value={value}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={platform.placeholder}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode={platform.key === "email" ? "email" : "url"}
                  className="min-w-0 flex-1 bg-transparent font-malt text-[16px] text-[var(--t-text)] outline-none placeholder:text-[var(--t-muted)] placeholder:opacity-55"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(key)}
              aria-label={`${platform.label} устгах`}
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[var(--t-danger)] transition-colors active:bg-[var(--t-well)]"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        );
      })}

      {/* A row the creator removed still has to reach the server, or its old
          value survives the save. Submitted empty → normalizeSocial drops it. */}
      {SOCIAL_PLATFORMS.filter((p) => socials[p.key] && !used.has(p.key)).map((p) => (
        <input key={p.key} type="hidden" name={`social_${p.key}`} value="" />
      ))}

      {available.length > 0 ? (
        picking ? (
          <div className="animate-pop rounded-[14px] bg-[var(--t-well)] p-2 ring-1 ring-inset ring-[var(--t-ring)]">
            <div className="mb-1.5 flex items-center justify-between px-1.5">
              <p className="font-malt text-[11.5px] font-bold uppercase tracking-wide text-[var(--t-muted)]">
                Аль сүлжээ вэ?
              </p>
              <button
                type="button"
                onClick={() => setPicking(false)}
                className="font-malt text-[11.5px] font-bold text-[var(--t-muted)]"
              >
                Хаах
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {available.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => add(p.key)}
                  className="flex flex-col items-center gap-1 rounded-[11px] px-1 py-2 transition-colors active:bg-[var(--t-field)]"
                >
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[var(--t-field)] text-[var(--t-accent)]">
                    {socialGlyph(p.key, 15)}
                  </span>
                  <span className="w-full truncate text-center font-malt text-[10px] font-semibold text-[var(--t-text)]">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-[var(--t-ring)] font-malt text-[13px] font-bold text-[var(--t-accent)] transition-colors active:bg-[var(--t-well)]"
          >
            <span className="text-[15px] leading-none">+</span> Сүлжээ нэмэх
          </button>
        )
      ) : null}
    </div>
  );
}

/**
 * Live theme picker. Each swatch previews the palette it applies — background,
 * accent, card and category — so the choice is made by looking, not by reading
 * four names. Selecting one repaints THIS screen immediately (via ThemeShell)
 * and saves in the background; the public page is revalidated server-side.
 */
function ThemePicker({ current }: { current: ThemeKey }) {
  const { theme: choice, setTheme } = useDashboardTheme();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function choose(key: ThemeKey) {
    if (key === choice) return;
    const previous = choice;
    setTheme(key);
    setError(null);
    start(async () => {
      try {
        await setProfileTheme(key);
      } catch {
        setTheme(previous);
        setError("Хадгалж чадсангүй.");
      }
    });
  }

  // `current` is the server's value; the shell owns the live one. They only
  // diverge while a save is in flight or after one failed.
  void current;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <LLabel>Загвар</LLabel>
        {pending ? <Spinner className="mb-1.5 h-3.5 w-3.5 text-[var(--t-accent)]" /> : null}
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
                active ? "ring-2 ring-[var(--t-accent)]" : "ring-1 ring-inset ring-[var(--t-ring)]"
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
        <p className="font-malt text-[13px] text-[var(--t-danger)]">{error}</p>
      ) : null}
    </div>
  );
}
