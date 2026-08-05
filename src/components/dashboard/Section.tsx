/**
 * A dashboard section: an icon + Nunito-Black label (spotly section-head
 * language) and a content well, on the light theme. Fades in on mount.
 */
export function DashSection({
  icon,
  label,
  action,
  children,
}: {
  icon?: string;
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-up px-4">
      <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className="text-[17px] leading-none" aria-hidden>
              {icon}
            </span>
          ) : null}
          <h2 className="font-header text-[16px] font-black tracking-[-0.2px] text-spotly-ink">
            {label}
          </h2>
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[16px] bg-black/[0.03] px-4 py-5 text-center font-header text-[13.5px] leading-relaxed text-black/45">
      {children}
    </p>
  );
}
