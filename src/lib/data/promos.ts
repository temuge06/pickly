import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { promoCode } from "@/db/schema";
import { env } from "@/lib/env";
import type { PublicPromo } from "@/components/lapis/PromoCard";

/**
 * Active promo codes for one profile, in display order. Mirrors the anon RLS
 * policy so the trusted read and the public-key read agree on what is live.
 */
export async function getProfilePromos(profileId: string): Promise<PublicPromo[]> {
  if (!env.hasDatabase) return [];
  return getDb()
    .select({
      id: promoCode.id,
      headline: promoCode.headline,
      description: promoCode.description,
      code: promoCode.code,
      url: promoCode.url,
      imageUrl: promoCode.imageUrl,
      expiresAt: promoCode.expiresAt,
    })
    .from(promoCode)
    .where(and(eq(promoCode.profileId, profileId), eq(promoCode.isActive, true)))
    .orderBy(asc(promoCode.position), asc(promoCode.createdAt));
}
