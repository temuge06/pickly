/**
 * The 480px mobile canvas centered on the `wall` backdrop. Shared by the
 * dashboard and auth surfaces so they hold the same discipline as the public
 * profile. Respects the notch/home-indicator safe areas.
 */
export function Canvas({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto min-h-dvh max-w-[480px] bg-wall pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+32px)] shadow-[0_0_80px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </div>
  );
}
