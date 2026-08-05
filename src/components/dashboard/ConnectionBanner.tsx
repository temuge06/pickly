/** The reconnect banner for a dead connection. The public page hides the
 * section entirely; this is the only place the creator is told it went stale,
 * so the page never silently lies. */
export function ConnectionBanner({
  provider,
  message,
}: {
  provider: string;
  message?: string | null;
}) {
  return (
    <div className="rounded-[14px] bg-spotly-accent/[0.08] px-4 py-3 ring-1 ring-inset ring-spotly-accent/15">
      <p className="font-header text-[13px] font-bold text-[#c23361]">
        {provider} салсан байна — дахин холбож, хэсгээ идэвхтэй байлгаарай.
      </p>
      {message ? (
        <p className="mt-1 font-header text-[11px] text-[#c23361]/70">{message}</p>
      ) : null}
    </div>
  );
}
