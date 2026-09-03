import type { CSSProperties } from "react";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * Warm palette for the auth + onboarding surfaces (#2a1617 canvas, orange
 * #fe7f42, cream #feedd5). Written as the SAME `--t-*` contract a themed
 * profile root publishes, not as literals in the markup, because these screens
 * reuse the dashboard primitives (LInput, LButton, Hint) and the onboarding
 * chip pickers — all of which read tokens. Without them here those controls
 * render with transparent fills and no rings.
 *
 * Hand-written rather than pulled from THEMES: the palette they came from
 * ("On Fire") was retired from the profile picker, and the sign-in screens
 * keeping their own warm identity is deliberate.
 */
const AUTH_TOKENS = {
  "--t-bg": "#2a1617",
  "--t-accent": "#fe7f42",
  "--t-on-accent": "#2a1617",
  "--t-text": "#feedd5",
  "--t-muted": "rgba(254,237,213,0.6)",
  "--t-well": "rgba(255,255,255,0.04)",
  "--t-field": "rgba(255,255,255,0.06)",
  "--t-ring": "rgba(255,255,255,0.14)",
  "--t-danger": "#ff9a8a",
  "--t-success": "#8fe0a0",
} as CSSProperties;

/** Dark shell for the auth + onboarding surfaces. Type is SF Pro, set globally. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-900 sm:py-8" style={AUTH_TOKENS}>
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center bg-[#2a1617] px-6 pb-16 pt-[calc(env(safe-area-inset-top)+24px)] shadow-[0_0_80px_rgba(0,0,0,0.4)] sm:min-h-0">
        {children}
      </div>
    </div>
  );
}

/** LinkSpot wordmark + optional subtitle, centered — the auth page header. */
export function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      {/* --t-brand is not defined outside a themed profile root, so the mark's
          arrow falls back to LinkSpot green here — which is what the auth
          screens want anyway. */}
      <Wordmark height={19} className="text-[#fe7f42]" title="LinkSpot" />
      <h1 className="mt-3 text-[24px] font-extrabold text-white">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-[14px] leading-relaxed text-[#feedd5]/60">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
