import { z } from "zod";

/**
 * The wire format between the profile page's tracker and /api/analytics —
 * shared so the client can only build what the server will accept.
 *
 * Kept deliberately small: a beacon has to be built in the last milliseconds
 * before a tab closes, and the route has to validate it without trusting a
 * byte of it. Metadata is an open object but every key the dashboard reads is
 * declared here, and free-text values are clamped so a hostile client cannot
 * park a megabyte in a row.
 */

export const ANALYTICS_EVENT_TYPES = [
  "profile_view",
  "promo_click",
  "promo_used",
  "link_click",
  "session_duration",
] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

/** What an outbound tap was on. Stored as `metadata.kind` on link_click. */
export const LINK_KINDS = [
  "social",
  "quick_link",
  "campaign",
  "pick",
  "wishlist",
  "promo",
] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

const short = z.string().trim().max(200);

const metadataSchema = z
  .object({
    kind: z.enum(LINK_KINDS).optional(),
    href: z.string().trim().max(2000).optional(),
    label: short.optional(),
    promoId: z.string().uuid().optional(),
    code: short.optional(),
    // Four hours is already past what a foreground tab plausibly means; a
    // laptop that slept with the page open fires `hidden` first anyway.
    seconds: z.number().int().min(1).max(4 * 60 * 60).optional(),
  })
  .strict();

export type AnalyticsMetadata = z.infer<typeof metadataSchema>;

export const analyticsEventSchema = z.object({
  type: z.enum(ANALYTICS_EVENT_TYPES),
  metadata: metadataSchema.default({}),
});

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

/** One beacon. Capped so a runaway client cannot turn one request into a bulk load. */
export const MAX_EVENTS_PER_BATCH = 25;

export const analyticsBatchSchema = z.object({
  creatorId: z.string().uuid(),
  sessionId: z.string().uuid(),
  events: z.array(analyticsEventSchema).min(1).max(MAX_EVENTS_PER_BATCH),
});

export type AnalyticsBatch = z.infer<typeof analyticsBatchSchema>;
