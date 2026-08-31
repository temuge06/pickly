import { Wordmark } from "@/components/brand/Wordmark";

/**
 * Dark shell for the auth + onboarding surfaces (#2a1617 canvas, orange
 * #fe7f42, cream #feedd5) — matches the On Fire profile palette so sign-in
 * feels like the same product. Type is GIP, set globally on `body`.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-900 sm:py-8">
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
