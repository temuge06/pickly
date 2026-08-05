import Image from "next/image";
import type { pick } from "@/db/schema";
import { formatMnt } from "@/lib/format";
import { StatusChip } from "./StatusChip";

type Pick = typeof pick.$inferSelect;

export function PickCard({ pick }: { pick: Pick }) {
  return (
    <a
      href={pick.outboundUrl ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="group w-[168px] shrink-0 snap-start"
    >
      <div
        className="relative aspect-square overflow-hidden rounded-2xl"
        style={{
          boxShadow: "0 12px 16px -10px rgba(35,27,34,0.55)",
        }}
      >
        {pick.imageUrl ? (
          <Image
            src={pick.imageUrl}
            alt={pick.title}
            fill
            sizes="168px"
            className="object-cover transition-transform duration-300 group-active:scale-[1.03]"
          />
        ) : null}
        <div className="absolute left-2 top-2">
          <StatusChip status={pick.status} />
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        {pick.brand ? (
          <p className="truncate font-mono text-[10px] uppercase tracking-wide text-ink/55">
            {pick.brand}
          </p>
        ) : null}
        <p className="mt-0.5 truncate font-body text-[14px] font-medium leading-snug text-ink">
          {pick.title}
        </p>
        {pick.priceMnt != null ? (
          <p className="mt-0.5 font-mono text-[12px] font-medium text-ink/80">
            {formatMnt(pick.priceMnt)}
          </p>
        ) : null}
        {pick.note ? (
          <p className="mt-1 line-clamp-2 font-body text-[12.5px] leading-snug text-ink/65">
            {pick.note}
          </p>
        ) : null}
      </div>
    </a>
  );
}
