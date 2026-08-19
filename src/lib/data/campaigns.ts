import { and, asc, eq, isNotNull, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { campaign, campaignAssignment } from "@/db/schema";
import { env } from "@/lib/env";

export type ProfileCampaign = {
  id: string;
  title: string;
  bannerImageUrl: string | null;
  destinationUrl: string | null;
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
      // advertiserLabel is deliberately NOT selected: the profile no longer
      // shows a caption, so shipping it would put an unused string in the
      // page payload.
    })
    .from(campaignAssignment)
    .innerJoin(campaign, eq(campaign.id, campaignAssignment.campaignId))
    .where(
      and(
        eq(campaignAssignment.profileId, profileId),
        eq(campaignAssignment.isActive, true),
        eq(campaign.isActive, true),
        // A banner with no image is an empty box with a button on it. Skip it
        // rather than render a broken card if one ever reaches this far.
        isNotNull(campaign.bannerImageUrl),
        ne(campaign.bannerImageUrl, ""),
      ),
    )
    .orderBy(asc(campaignAssignment.position), asc(campaignAssignment.createdAt));
}
