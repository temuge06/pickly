/**
 * Lapis-dark shell for the auth + onboarding surfaces (#2a1617 canvas, orange
 * #fe7f42, cream #feedd5, Montserrat Alternates) — matches the profile and
 * dashboard so sign-in feels like the same product.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-900 sm:py-8">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center bg-[#2a1617] px-6 pb-16 pt-[calc(env(safe-area-inset-top)+24px)] font-malt shadow-[0_0_80px_rgba(0,0,0,0.4)] sm:min-h-0">
        {children}
      </div>
    </div>
  );
}

/** Pickly wordmark + optional subtitle, centered — the auth page header. */
export function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 text-center">
      <p className="font-malt text-[15px] font-extrabold text-[#fe7f42]">
        Pickly
      </p>
      <h1 className="mt-3 font-malt text-[24px] font-extrabold text-white">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 font-inter text-[14px] leading-relaxed text-[#feedd5]/60">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
