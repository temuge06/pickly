import { and, desc, eq, gt, inArray, isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  activityItem,
  askMessage,
  campaign,
  campaignAssignment,
  featureFlag,
  follow,
  profile,
  promoCode,
} from "@/db/schema";
import { env } from "@/lib/env";

/**
 * The notification feed, DERIVED at read time.
 *
 * There is no `notification` table. Every item below already exists as a row
 * with a `created_at`, so the feed is five range scans over the profiles the
 * creator follows plus one over their own inbox, merged and sorted. The
 * consequences that made this worth doing:
 *
 *  - A new notification source is a query here, not a fan-out write at every
 *    call site that could create one (sync worker, admin panel, ask submit).
 *  - Nothing can be "missed" because a trigger did not fire or a backfill was
 *    forgotten — if the row exists, the notification exists.
 *  - Unfollowing someone removes their past notifications too, which is what
 *    people expect and what a materialised table gets wrong.
 *
 * Read state is one watermark (`profile.notifications_seen_at`), not a flag
 * per item, for the same reason: there are no item rows to flag.
 */

export type NotificationKind =
  | "track"
  | "album"
  | "film"
  | "book"
  | "campaign"
  | "promo"
  | "ask_answered"
  | "ask_received";

export type NotificationActor = {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

export type Notification = {
  /** Stable across reloads: source table + row id (+ bucket, when grouped). */
  id: string;
  kind: NotificationKind;
  at: Date;
  /** Who it is about. Null for "someone asked YOU a question". */
  actor: NotificationActor | null;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  /** Up to 3 covers when several items are collapsed into one row. */
  images: string[];
  /** How many source rows this row stands for (1 unless grouped). */
  count: number;
  /** Where a tap goes. */
  href: string;
  unread: boolean;
};

/** How far back the bell looks. Older than this is history, not a notification. */
const WINDOW_DAYS = 30;
/** Hard cap on rendered rows. */
const MAX_ITEMS = 60;
/** Per-source query cap, before grouping and merging. */
const PER_SOURCE = 80;

export type NotificationFeed = {
  items: Notification[];
  unreadCount: number;
  /** How many creators this profile follows — drives the empty state's copy. */
  followingCount: number;
};

const EMPTY: NotificationFeed = { items: [], unreadCount: 0, followingCount: 0 };

/**
 * Everything the bell and /notifications need for one creator.
 *
 * `seenAt` is the creator's watermark; anything newer is unread. Passing it in
 * rather than re-reading keeps this callable from a page that already loaded
 * the profile row.
 */
export async function getNotifications(me: {
  id: string;
  handle: string;
  notificationsSeenAt: Date | null;
}): Promise<NotificationFeed> {
  if (!env.hasDatabase) return EMPTY;
  const db = getDb();
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const seenAt = me.notificationsSeenAt;
  const isUnread = (at: Date) => (seenAt ? at > seenAt : true);

  const followed = await db
    .select({
      id: profile.id,
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    })
    .from(follow)
    .innerJoin(profile, eq(profile.id, follow.followingProfileId))
    .where(eq(follow.followerProfileId, me.id));

  const followedIds = followed.map((f) => f.id);
  const actorById = new Map<string, NotificationActor>(
    followed.map((f) => [
      f.id,
      { handle: f.handle, displayName: f.displayName, avatarUrl: f.avatarUrl },
    ]),
  );

  // A section a creator has switched OFF is not public, so it must not
  // generate notifications either. Explicit `enabled = false` rows only —
  // a missing row means on (see getFeatureFlags).
  const disabled = new Set<string>();
  if (followedIds.length > 0) {
    const rows = await db
      .select({ profileId: featureFlag.profileId, feature: featureFlag.feature })
      .from(featureFlag)
      .where(
        and(
          inArray(featureFlag.profileId, followedIds),
          eq(featureFlag.enabled, false),
        ),
      );
    for (const r of rows) disabled.add(`${r.profileId}:${r.feature}`);
  }
  const off = (profileId: string, feature: string) =>
    disabled.has(`${profileId}:${feature}`);

  const [activity, campaigns, promos, answered, received] = await Promise.all([
    followedIds.length
      ? db
          .select({
            id: activityItem.id,
            profileId: activityItem.profileId,
            kind: activityItem.kind,
            title: activityItem.title,
            subtitle: activityItem.subtitle,
            imageUrl: activityItem.imageUrl,
            createdAt: activityItem.createdAt,
          })
          .from(activityItem)
          .where(
            and(
              inArray(activityItem.profileId, followedIds),
              gt(activityItem.createdAt, since),
            ),
          )
          .orderBy(desc(activityItem.createdAt))
          .limit(PER_SOURCE)
      : [],

    followedIds.length
      ? db
          .select({
            id: campaignAssignment.id,
            profileId: campaignAssignment.profileId,
            title: campaign.title,
            imageUrl: campaign.bannerImageUrl,
            createdAt: campaignAssignment.createdAt,
          })
          .from(campaignAssignment)
          .innerJoin(campaign, eq(campaign.id, campaignAssignment.campaignId))
          .where(
            and(
              inArray(campaignAssignment.profileId, followedIds),
              eq(campaignAssignment.isActive, true),
              eq(campaign.isActive, true),
              gt(campaignAssignment.createdAt, since),
            ),
          )
          .orderBy(desc(campaignAssignment.createdAt))
          .limit(PER_SOURCE)
      : [],

    followedIds.length
      ? db
          .select({
            id: promoCode.id,
            profileId: promoCode.profileId,
            headline: promoCode.headline,
            code: promoCode.code,
            imageUrl: promoCode.imageUrl,
            createdAt: promoCode.createdAt,
          })
          .from(promoCode)
          .where(
            and(
              inArray(promoCode.profileId, followedIds),
              eq(promoCode.isActive, true),
              gt(promoCode.createdAt, since),
            ),
          )
          .orderBy(desc(promoCode.createdAt))
          .limit(PER_SOURCE)
      : [],

    // Only questions the creator PUBLISHED. An unanswered or private question
    // is inbox content; surfacing it to followers would leak a stranger's
    // message to everyone who follows the recipient.
    followedIds.length
      ? db
          .select({
            id: askMessage.id,
            profileId: askMessage.profileId,
            body: askMessage.body,
            answerBody: askMessage.answerBody,
            answeredAt: askMessage.answeredAt,
          })
          .from(askMessage)
          .where(
            and(
              inArray(askMessage.profileId, followedIds),
              eq(askMessage.isPublic, true),
              eq(askMessage.status, "answered"),
              isNotNull(askMessage.answeredAt),
              gt(askMessage.answeredAt, since),
            ),
          )
          .orderBy(desc(askMessage.answeredAt))
          .limit(PER_SOURCE)
      : [],

    // "Someone asked YOU a question" — the creator's own inbox. This one is
    // about me, not about anyone I follow, so it has no actor.
    db
      .select({
        id: askMessage.id,
        body: askMessage.body,
        createdAt: askMessage.createdAt,
      })
      .from(askMessage)
      .where(
        and(
          eq(askMessage.profileId, me.id),
          eq(askMessage.status, "new"),
          gt(askMessage.createdAt, since),
        ),
      )
      .orderBy(desc(askMessage.createdAt))
      .limit(PER_SOURCE),
  ]);

  const items: Notification[] = [];

  // --- Entertainment: grouped ------------------------------------------------
  // A creator filling in their profile adds songs, films and books in one
  // sitting. Ungrouped, that is a run of near-identical rows and the rest of
  // the feed is gone. Items of the same kind from the same creator on the same
  // day collapse into one.
  const groups = new Map<
    string,
    { profileId: string; kind: string; at: Date; titles: string[]; images: string[] }
  >();
  for (const a of activity) {
    if (off(a.profileId, "entertainment")) continue;
    const day = a.createdAt.toISOString().slice(0, 10);
    const key = `${a.profileId}:${a.kind}:${day}`;
    const g = groups.get(key);
    if (g) {
      g.titles.push(a.title);
      if (a.imageUrl && g.images.length < 3) g.images.push(a.imageUrl);
      if (a.createdAt > g.at) g.at = a.createdAt;
    } else {
      groups.set(key, {
        profileId: a.profileId,
        kind: a.kind,
        at: a.createdAt,
        titles: [a.title],
        images: a.imageUrl ? [a.imageUrl] : [],
      });
    }
  }
  for (const [key, g] of groups) {
    const actor = actorById.get(g.profileId);
    if (!actor) continue;
    const noun = KIND_NOUN[g.kind] ?? "зүйл";
    items.push({
      id: `activity:${key}`,
      kind: g.kind as NotificationKind,
      at: g.at,
      actor,
      title:
        g.titles.length === 1
          ? `Шинэ ${noun}: ${g.titles[0]}`
          : `${g.titles.length} шинэ ${noun} нэмлээ`,
      subtitle: g.titles.length > 1 ? g.titles.slice(0, 3).join(" · ") : null,
      imageUrl: g.images[0] ?? null,
      images: g.images,
      count: g.titles.length,
      href: `/${actor.handle}`,
      unread: isUnread(g.at),
    });
  }

  // --- Campaigns -------------------------------------------------------------
  for (const c of campaigns) {
    const actor = actorById.get(c.profileId);
    if (!actor || off(c.profileId, "top_picks")) continue;
    items.push({
      id: `campaign:${c.id}`,
      kind: "campaign",
      at: c.createdAt,
      actor,
      title: "Шинэ кампанит ажил",
      subtitle: c.title,
      imageUrl: c.imageUrl,
      images: c.imageUrl ? [c.imageUrl] : [],
      count: 1,
      href: `/${actor.handle}`,
      unread: isUnread(c.createdAt),
    });
  }

  // --- Promo codes -----------------------------------------------------------
  for (const p of promos) {
    const actor = actorById.get(p.profileId);
    if (!actor) continue;
    items.push({
      id: `promo:${p.id}`,
      kind: "promo",
      at: p.createdAt,
      actor,
      title: `Шинэ хөнгөлөлт: ${p.headline}`,
      subtitle: p.code,
      imageUrl: p.imageUrl,
      images: p.imageUrl ? [p.imageUrl] : [],
      count: 1,
      href: `/${actor.handle}`,
      unread: isUnread(p.createdAt),
    });
  }

  // --- Published Q&A ---------------------------------------------------------
  for (const q of answered) {
    const actor = actorById.get(q.profileId);
    if (!actor || off(q.profileId, "ask")) continue;
    const at = q.answeredAt!;
    items.push({
      id: `ask:${q.id}`,
      kind: "ask_answered",
      at,
      actor,
      title: "Асуултад хариуллаа",
      subtitle: truncate(q.answerBody ?? q.body, 90),
      imageUrl: null,
      images: [],
      count: 1,
      href: `/${actor.handle}`,
      unread: isUnread(at),
    });
  }

  // --- My own inbox ----------------------------------------------------------
  // The body is NOT shown: an unanswered question is private until the creator
  // publishes it, and the bell can be read over someone's shoulder.
  for (const q of received) {
    items.push({
      id: `inbox:${q.id}`,
      kind: "ask_received",
      at: q.createdAt,
      actor: null,
      title: "Танаас асуулт асуулаа",
      subtitle: "Ask хайрцгаа нээж хариулаарай",
      imageUrl: null,
      images: [],
      count: 1,
      href: "/dashboard/ask",
      unread: isUnread(q.createdAt),
    });
  }

  items.sort((a, b) => b.at.getTime() - a.at.getTime());
  const sliced = items.slice(0, MAX_ITEMS);

  return {
    items: sliced,
    // Counted over the FULL merged set, not the slice — the badge would
    // under-report on a busy week otherwise.
    unreadCount: items.filter((i) => i.unread).length,
    followingCount: followedIds.length,
  };
}

/**
 * Just the badge number. Used by the profile page, which renders the bell on
 * every load and does not need the items.
 */
export async function getUnreadNotificationCount(me: {
  id: string;
  handle: string;
  notificationsSeenAt: Date | null;
}): Promise<number> {
  const feed = await getNotifications(me);
  return feed.unreadCount;
}

/**
 * Move the read watermark to now.
 *
 * Called straight from the /notifications render rather than through a server
 * action: an action would `revalidatePath`, and Next.js rejects a revalidate
 * issued during render. There is nothing to revalidate anyway — every page
 * that reads this is already `force-dynamic`.
 */
export async function markNotificationsSeen(profileId: string): Promise<void> {
  if (!env.hasDatabase) return;
  await getDb()
    .update(profile)
    .set({ notificationsSeenAt: new Date() })
    .where(eq(profile.id, profileId));
}

const KIND_NOUN: Record<string, string> = {
  track: "дуу",
  album: "цомог",
  film: "кино",
  book: "ном",
};

function truncate(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}
