import type { link } from "@/db/schema";
import { iconForKey } from "./icons";

type Link = typeof link.$inferSelect;

/** The non-photographic exception: same plank surface, shallower, a
 * vertical list instead of a horizontal scroll of objects. */
export function LinksRail({ links }: { links: Link[] }) {
  if (links.length === 0) return null;

  return (
    <section className="px-4">
      <div className="relative">
        <div className="absolute -top-3 left-3 z-10 rounded-full bg-ink px-3 py-1.5">
          <span className="font-display text-[11px] font-bold uppercase tracking-wide text-shelf">
            Links
          </span>
        </div>
        <div
          className="flex flex-col gap-2 rounded-[28px] bg-shelf px-4 pb-4 pt-8"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.55), 0 22px 34px -16px rgba(20,14,20,0.6)",
          }}
        >
          {links.map((linkItem) => {
            const Icon = iconForKey(linkItem.icon);
            return (
              <a
                key={linkItem.id}
                href={linkItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] items-center gap-3 rounded-2xl bg-wall/[0.06] px-4 py-3 transition-colors active:bg-wall/[0.12]"
              >
                <Icon className="h-5 w-5 shrink-0 text-ink/70" />
                <span className="truncate font-body text-[14px] font-medium text-ink">
                  {linkItem.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
