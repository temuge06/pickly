import { formatRelativeMn } from "@/lib/format";

/** The "this updated itself" tell — a marigold dot with a soft pulse ring,
 * paired with a coarse relative timestamp so freshness is felt, not just
 * stated. */
export function SyncPulse({ lastSyncAt }: { lastSyncAt: Date }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-marigold opacity-75 motion-reduce:animate-none" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-marigold" />
      </span>
      <span className="font-mono text-[10px] text-shelf/80">
        {formatRelativeMn(lastSyncAt)}
      </span>
    </div>
  );
}
