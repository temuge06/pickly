import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { campaign, campaignAssignment } from "@/db/schema";
import { env } from "@/lib/env";

export type ProfileCampaign = {
  id: string;
  title: string;
  bannerImageUrl: string | null;
  destinationUrl: string | null;
  advertiserLabel: string | null;
};

/**
 * The banners running on one creator's Top Picks shelf, in display order.
 *
 * Both `is_active` flags must be true: the campaign's (a paused banner stops
 * everywhere at once) and the assignment's (a banner dropped from this one
 * profile). Mirrors the anon RLS policy exactly, so the trusted-connection
 * read and the public-key read can never disagree about what is live.
 */
export async function getProfileCampaigns(
  profileId: string,
): Promise<ProfileCampaign[]> {
  if (!env.hasDatabase) return [];
  const db = getDb();
  return db
    .select({
      id: campaign.id,
      title: campaign.title,
      bannerImageUrl: campaign.bannerImageUrl,
      destinationUrl: campaign.destinationUrl,
      advertiserLabel: campaign.advertiserLabel,
    })
    .from(campaignAssignment)
    .innerJoin(campaign, eq(campaign.id, campaignAssignment.campaignId))
    .where(
      and(
        eq(campaignAssignment.profileId, profileId),
        eq(campaignAssignment.isActive, true),
        eq(campaign.isActive, true),
      ),
    )
    .orderBy(asc(campaignAssignment.position), asc(campaignAssignment.createdAt));
}
