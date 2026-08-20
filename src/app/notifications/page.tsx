import Link from "next/link";
import { redirect } from "next/navigation";
import { NotificationList } from "@/components/lapis/NotificationList";
import { getCurrentProfile } from "@/lib/auth/session";
import { getNotifications, markNotificationsSeen } from "@/lib/data/notifications";
import { getTheme, themeStyle } from "@/lib/themes";

export const metadata = { title: "Мэдэгдэл — Pickly" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/sign-in?next=%2Fnotifications");

  // Read the feed BEFORE moving the watermark, so this render still shows
  // which rows were new. The next visit sees them as read.
  const feed = await getNotifications(me);
  await markNotificationsSeen(me.id);

  const theme = getTheme(me.theme);

  return (
    // Same themed device frame as the public profile — this screen belongs to
    // the creator, so it wears the palette they chose for their own page.
    <div
      className="min-h-dvh bg-[var(--t-bg)] sm:bg-neutral-800 sm:py-8"
      style={themeStyle(me.theme)}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `html,body{background-color:${theme.tokens.bg};overscroll-behavior-y:none}`,
        }}
      />
      <div className="relative mx-auto flex min-h-dvh w-full flex-col overflow-x-clip bg-[var(--t-bg)] font-malt sm:min-h-0 sm:max-w-[402px] sm:shadow-[0_0_80px_rgba(0,0,0,0.4)]">
        <header className="sticky top-0 z-30 flex items-center gap-[10px] border-b-[0.5px] border-[var(--t-border)] bg-[var(--t-bg)]/95 px-[10px] py-[10px] pt-[calc(env(safe-area-inset-top)+10px)] backdrop-blur-md">
          <Link
            href={`/${me.handle}`}
            aria-label="Профайл руу буцах"
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[var(--t-accent)] transition-transform active:scale-95"
            style={{ background: "color-mix(in srgb, var(--t-accent) 12%, transparent)" }}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-extrabold uppercase leading-none tracking-[-0.34px] text-[var(--t-accent)]">
              Мэдэгдэл
            </p>
            <p className="mt-[4px] truncate font-inter text-[12px] leading-none text-[var(--t-muted)]">
              {feed.followingCount > 0
                ? `${feed.followingCount} хүнийг дагаж байна`
                : "Хэн ч дагаагүй байна"}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex h-[32px] shrink-0 items-center rounded-[10px] px-[11px] font-inter text-[12px] font-semibold text-[var(--t-accent)]"
            style={{ background: "color-mix(in srgb, var(--t-accent) 12%, transparent)" }}
          >
            Засах
          </Link>
        </header>

        <div className="flex-1 px-[10px] py-[16px]">
          {feed.items.length > 0 ? (
            <NotificationList items={feed.items} />
          ) : (
            <Empty followingCount={feed.followingCount} />
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ followingCount }: { followingCount: number }) {
  return (
    <div
      className="flex flex-col items-center gap-[10px] rounded-[16px] px-[24px] py-[44px] text-center"
      style={{ background: "var(--t-panel)" }}
    >
      <span className="text-[30px] leading-none" aria-hidden>
        🔔
      </span>
      <p className="text-[15px] font-bold text-[var(--t-text)]">
        {followingCount > 0 ? "Одоогоор шинэ мэдэгдэл алга" : "Хоосон байна"}
      </p>
      <p className="max-w-[260px] font-inter text-[12.5px] leading-[17px] text-[var(--t-muted)]">
        {followingCount > 0
          ? "Дагасан хүмүүс чинь шинэ дуу, кино, ном, кампанит ажил нэмэхэд эсвэл асуултад хариулахад энд харагдана."
          : "Хүсэлтэй бүтээгчээ дагаад эхлээрэй — тэдний шинэ дуу, кино, ном, кампанит ажил энд цуглана."}
      </p>
    </div>
  );
}
