/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Notification, NotificationKind } from "@/lib/data/notifications";

/**
 * The bell's feed. Themed with the same `--t-*` tokens as the public profile,
 * so it wears whichever palette the creator picked.
 *
 * Unread rows carry an accent hairline and a dot rather than a different
 * background: on the two light themes a tinted row is nearly indistinguishable
 * from a read one, while a 2px rule reads at any brightness.
 */
export function NotificationList({ items }: { items: Notification[] }) {
  return (
    <div className="flex flex-col gap-[8px]">
      {items.map((n) => (
        <Link
          key={n.id}
          href={n.href}
          className="relative flex items-center gap-[12px] overflow-hidden rounded-[14px] py-[11px] pl-[13px] pr-[12px] transition-transform active:scale-[0.995]"
          style={{
            background: n.unread
              ? "color-mix(in srgb, var(--t-accent) 10%, transparent)"
              : "var(--t-panel)",
            boxShadow: n.unread ? "inset 2px 0 0 0 var(--t-accent)" : undefined,
          }}
        >
          <Thumb notification={n} />

          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <p className="flex items-center gap-[5px] text-[11px] font-semibold uppercase leading-none tracking-[0.2px] text-[var(--t-muted)]">
              <span aria-hidden>{KIND_ICON[n.kind]}</span>
              {n.actor ? `@${n.actor.handle}` : "Таны Ask"}
            </p>
            <p className="truncate text-[14px] font-bold leading-[17px] tracking-[-0.28px] text-[var(--t-text)]">
              {n.title}
            </p>
            {n.subtitle ? (
              <p className="truncate text-[12px] font-light leading-[15px] text-[var(--t-muted)]">
                {n.subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-[6px]">
            <span className="text-[11px] font-light leading-none text-[var(--t-muted)]">
              {relativeTime(n.at)}
            </span>
            {n.unread ? (
              <span
                className="h-[8px] w-[8px] rounded-full"
                style={{ background: "var(--t-accent)" }}
                aria-label="шинэ"
              />
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

/**
 * Avatar of whoever the notification is about, with the item's own artwork
 * tucked into the corner — one glance answers both "who" and "what".
 */
function Thumb({ notification: n }: { notification: Notification }) {
  const cover = n.images[0] ?? n.imageUrl;
  return (
    <span className="relative h-[44px] w-[44px] shrink-0">
      <span
        className="flex h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-full text-[17px] font-semibold"
        style={{ background: "var(--t-avatar-bg)", color: "var(--t-accent)" }}
      >
        {n.actor?.avatarUrl ? (
          <img src={n.actor.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : n.actor ? (
          n.actor.displayName.trim().charAt(0).toUpperCase()
        ) : (
          <span aria-hidden>💬</span>
        )}
      </span>
      {cover ? (
        <span
          className="absolute -bottom-[2px] -right-[2px] h-[20px] w-[20px] overflow-hidden rounded-[6px]"
          style={{ boxShadow: "0 0 0 2px var(--t-bg)" }}
        >
          <img src={cover} alt="" className="h-full w-full object-cover" />
        </span>
      ) : null}
      {n.count > 1 ? (
        <span
          className="absolute -bottom-[3px] -right-[5px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[4px] text-[10px] font-bold leading-none"
          style={{
            background: "var(--t-accent)",
            color: "var(--t-on-accent)",
            boxShadow: "0 0 0 2px var(--t-bg)",
          }}
        >
          {n.count > 99 ? "99+" : n.count}
        </span>
      ) : null}
    </span>
  );
}

const KIND_ICON: Record<NotificationKind, string> = {
  track: "🎵",
  album: "💿",
  film: "🎬",
  book: "📚",
  campaign: "✨",
  promo: "🎟",
  ask_answered: "💬",
  ask_received: "✉️",
};

/**
 * Rendered on the server from a server-generated timestamp, so there is no
 * clock skew between the HTML and a client re-render to hydrate around.
 */
function relativeTime(at: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - at.getTime()) / 1000));
  if (seconds < 60) return "дөнгөж";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}м`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}ц`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}ө`;
  return `${Math.floor(days / 7)}д`;
}
