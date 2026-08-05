import type { link } from "@/db/schema";
import { iconForKey } from "@/components/profile/icons";
import { SpotlySectionHead } from "./SpotlySectionHead";

type Link = typeof link.$inferSelect;

/**
 * Links — spotly light theme adaptation (no Figma frame). A vertical list of
 * light rows with the resolved icon in the accent color.
 */
export function SpotlyLinks({ links }: { links: Link[] }) {
  if (links.length === 0) return null;

  return (
    <section className="relative pt-[6px]">
      <SpotlySectionHead icon="🔗" title="Холбоос" seeAllHref="#" />
      <div className="mt-[12px] flex flex-col gap-[10px] px-[20px]">
        {links.map((l) => {
          const Icon = iconForKey(l.icon);
          return (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[52px] items-center gap-3 rounded-[15px] bg-black/[0.04] px-4 py-3 transition-colors active:bg-black/[0.08]"
            >
              <Icon className="h-5 w-5 shrink-0 text-spotly-accent" />
              <span className="truncate font-header text-[14px] font-bold text-spotly-ink">
                {l.label}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
