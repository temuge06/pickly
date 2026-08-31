"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/**
 * MN / EN switch in the profile's top bar.
 *
 * Writes a cookie and calls router.refresh() rather than swapping strings in
 * the browser. The profile is a server component, so the server has to be the
 * one that re-renders: that keeps a single string table on the server instead
 * of shipping both languages to every visitor, and it means a shared link
 * arrives already in the right language rather than flashing Mongolian first.
 *
 * The choice is per visitor and per browser, which is what a cookie gives us
 * for free — no account needed, and it survives a reload without the creator
 * having to decide what language their audience reads in.
 *
 * `Max-Age` is a year and `SameSite=Lax` so following a shared profile link
 * from a message app still carries the preference. No `Secure` flag: it would
 * silently drop the cookie on plain-http local development, and the value is a
 * two-letter display preference with nothing to protect.
 */
export function LangToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const next: Locale = locale === "mn" ? "en" : "mn";

  function switchTo() {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={switchTo}
      disabled={pending}
      // Labelled with the language it switches TO, in that language, so it is
      // legible to someone who cannot read the current one.
      aria-label={next === "en" ? "Switch to English" : "Монгол руу шилжих"}
      className="flex h-[26px] shrink-0 items-center gap-[3px] rounded-[9px] border border-[var(--t-accent)] px-[8px] text-[11px] font-bold uppercase leading-none text-[var(--t-accent)] transition-opacity disabled:opacity-50"
    >
      <span className="opacity-100">{locale.toUpperCase()}</span>
      <span aria-hidden className="opacity-45">
        / {next.toUpperCase()}
      </span>
    </button>
  );
}
