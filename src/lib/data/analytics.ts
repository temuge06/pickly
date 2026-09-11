import { and, asc, count, countDistinct, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { analyticsEvent, promoCode } from "@/db/schema";
import type { LinkKind } from "@/lib/analytics/events";

/**
 * Everything the staff analytics panel draws for one creator, aggregated in
 * the database. Nothing here is cached: staff open a creator's page to see
 * what is happening NOW, and the event table is indexed for exactly these
 * (creator, type) scans.
 */
export type CreatorAnalytics = {
  /** profile_view rows. */
  views: number;
  /** Distinct viewer_session_id across profile_view rows. */
  uniqueViewers: number;
  /** Sum of session_duration seconds. */
  totalSeconds: number;
  /** totalSeconds / views, or 0 with no views. */
  avgSeconds: number;
  promos: {
    /** Every promo ever tapped, live or deleted, plus live ones never tapped. */
    perCode: PromoStat[];
    clicks: number;
    used: number;
  };
  /** link_click grouped by `metadata.kind`, most-clicked first. */
  clicksByKind: { kind: LinkKind | "unknown"; clicks: number }[];
  /** The individual links behind those kinds, most-clicked first. */
  topLinks: { kind: LinkKind | "unknown"; label: string; href: string; clicks: number }[];
};

export type PromoStat = {
  promoId: string;
  /** The live code if the row still exists, else the snapshot in the event. */
  code: string;
  headline: string | null;
  /** False when the promo_code row is gone — the events outlived it. */
  exists: boolean;
  isActive: boolean;
  clicks: number;
  used: number;
};

const meta = analyticsEvent.metadata;

export async function getCreatorAnalytics(profileId: string): Promise<CreatorAnalytics> {
  const db = getDb();
  const mine = eq(analyticsEvent.creatorId, profileId);

  const [viewRows, durationRows, promoRows, livePromos, kindRows, linkRows] = await Promise.all([
    db
      .select({
        views: count(),
        uniqueViewers: countDistinct(analyticsEvent.viewerSessionId),
      })
      .from(analyticsEvent)
      .where(and(mine, eq(analyticsEvent.eventType, "profile_view"))),
    db
      .select({
        // `seconds` is validated as an integer at the door, but the cast is
        // still guarded so one malformed legacy row cannot fail the panel.
        total: sql<number>`coalesce(sum((${meta}->>'seconds')::int), 0)::int`,
      })
      .from(analyticsEvent)
      .where(and(mine, eq(analyticsEvent.eventType, "session_duration"))),
    db
      .select({
        promoId: sql<string>`${meta}->>'promoId'`,
        // The most recent snapshot of the code, so a renamed code shows its
        // new name even for a promo that has since been deleted.
        code: sql<string>`max(${meta}->>'code')`,
        clicks: sql<number>`count(*) filter (where ${analyticsEvent.eventType} = 'promo_click')::int`,
        used: sql<number>`count(*) filter (where ${analyticsEvent.eventType} = 'promo_used')::int`,
      })
      .from(analyticsEvent)
      .where(
        and(
          mine,
          sql`${analyticsEvent.eventType} in ('promo_click', 'promo_used')`,
          sql`${meta} ? 'promoId'`,
        ),
      )
      .groupBy(sql`${meta}->>'promoId'`),
    db
      .select({
        id: promoCode.id,
        code: promoCode.code,
        headline: promoCode.headline,
        isActive: promoCode.isActive,
        position: promoCode.position,
      })
      .from(promoCode)
      .where(eq(promoCode.profileId, profileId))
      .orderBy(asc(promoCode.position), asc(promoCode.createdAt)),
    db
      .select({
        kind: sql<string>`coalesce(${meta}->>'kind', 'unknown')`,
        clicks: sql<number>`count(*)::int`,
      })
      .from(analyticsEvent)
      .where(and(mine, eq(analyticsEvent.eventType, "link_click")))
      .groupBy(sql`coalesce(${meta}->>'kind', 'unknown')`)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({
        kind: sql<string>`coalesce(${meta}->>'kind', 'unknown')`,
        label: sql<string>`coalesce(${meta}->>'label', '')`,
        href: sql<string>`coalesce(${meta}->>'href', '')`,
        clicks: sql<number>`count(*)::int`,
      })
      .from(analyticsEvent)
      .where(and(mine, eq(analyticsEvent.eventType, "link_click")))
      .groupBy(
        sql`coalesce(${meta}->>'kind', 'unknown')`,
        sql`coalesce(${meta}->>'label', '')`,
        sql`coalesce(${meta}->>'href', '')`,
      )
      .orderBy(desc(sql`count(*)`))
      .limit(10),
  ]);

  const views = viewRows[0]?.views ?? 0;
  const uniqueViewers = viewRows[0]?.uniqueViewers ?? 0;
  const totalSeconds = durationRows[0]?.total ?? 0;

  // Live promos in the creator's display order first (tapped or not), then
  // anything the events remember that no longer has a row.
  const tapped = new Map(promoRows.map((r) => [r.promoId, r]));
  const perCode: PromoStat[] = livePromos.map((p) => {
    const t = tapped.get(p.id);
    tapped.delete(p.id);
    return {
      promoId: p.id,
      code: p.code,
      headline: p.headline,
      exists: true,
      isActive: p.isActive,
      clicks: t?.clicks ?? 0,
      used: t?.used ?? 0,
    };
  });
  for (const t of tapped.values()) {
    perCode.push({
      promoId: t.promoId,
      code: t.code ?? "?",
      headline: null,
      exists: false,
      isActive: false,
      clicks: t.clicks,
      used: t.used,
    });
  }

  return {
    views,
    uniqueViewers,
    totalSeconds,
    avgSeconds: views > 0 ? Math.round(totalSeconds / views) : 0,
    promos: {
      perCode,
      clicks: perCode.reduce((n, p) => n + p.clicks, 0),
      used: perCode.reduce((n, p) => n + p.used, 0),
    },
    clicksByKind: kindRows.map((r) => ({ kind: r.kind as LinkKind | "unknown", clicks: r.clicks })),
    topLinks: linkRows.map((r) => ({
      kind: r.kind as LinkKind | "unknown",
      label: r.label,
      href: r.href,
      clicks: r.clicks,
    })),
  };
}
