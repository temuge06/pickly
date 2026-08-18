import type { featureFlag } from "@/db/schema";

/**
 * Client-safe half of the feature-flag system: the enum, its labels, and the
 * defaults. The database read lives in src/lib/data/features.ts — keeping it
 * out of here is what lets a client component (the admin toggles) import these
 * constants without dragging the postgres driver into the browser bundle.
 */

export type Feature = (typeof featureFlag.$inferSelect)["feature"];

/** Every flag, in the order the admin panel lists them. */
export const FEATURES: Feature[] = [
  "top_picks",
  "entertainment",
  "wishlist",
  "not_for_me",
  "my_picks",
  "ask",
];

export const FEATURE_LABELS: Record<Feature, string> = {
  top_picks: "Top Picks",
  entertainment: "Entertainment (дуу / кино / ном)",
  wishlist: "Wishlist",
  not_for_me: "Not For Me",
  my_picks: "My Picks",
  ask: "Ask",
};

export type FeatureFlags = Record<Feature, boolean>;

/** All features on — the state of a profile that has never been touched. */
export const ALL_ENABLED: FeatureFlags = Object.fromEntries(
  FEATURES.map((f) => [f, true]),
) as FeatureFlags;
