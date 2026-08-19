import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Supabase manages `auth.users` itself — we only need a typed reference to
 * point `profile.user_id` at it. Never create/alter this table via our
 * migrations.
 */
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

/**
 * Case-insensitive text, used for `handle`. Requires `CREATE EXTENSION IF
 * NOT EXISTS citext;` — run once in the first migration (see
 * src/db/migrations/0000_extensions.sql).
 */
const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Providers a creator can connect for auto-synced sections. */
export const connectionProviderEnum = pgEnum("connection_provider", [
  "spotify",
  "letterboxd",
]);

/** Connection health — drives whether a synced section is shown at all. */
export const connectionStatusEnum = pgEnum("connection_status", [
  "active",
  "error",
  "revoked",
]);

/** What kind of thing a synced/manual activity item represents. */
export const activityKindEnum = pgEnum("activity_kind", [
  "track",
  "album",
  "film",
  "book",
  "podcast",
]);

/**
 * The status chip on a pick — this is what makes the shelf feel alive.
 * Mongolian labels live in the UI layer, not here.
 */
export const pickStatusEnum = pgEnum("pick_status", [
  "testing",
  "recommend",
  "repurchased",
  "wont_rebuy",
]);

/**
 * Ask message lifecycle. `hidden` is where the wordlist filter lands matches —
 * they never surface to the creator unprompted; `reported`/`blocked` are
 * moderation outcomes.
 */
export const askStatusEnum = pgEnum("ask_status", [
  "new",
  "answered",
  "hidden",
  "reported",
  "blocked",
]);

/**
 * Visual themes a creator can pick for their public profile. Each key maps to a
 * palette in src/lib/themes.ts; the names are the designer's (Figma: Coral
 * Wave / On Fire / Dalai #1 / Dalai #2). `on_fire` is the default because it IS
 * the palette every existing profile already renders with — so adding this
 * column changes nothing visually until a creator chooses otherwise.
 */
export const profileThemeEnum = pgEnum("profile_theme", [
  "on_fire",
  "coral_wave",
  "dalai_1",
  "dalai_2",
]);

/**
 * Sections an admin can switch off per creator. `entertainment` is one flag
 * covering music + films + books together (they share the one MMB tab strip on
 * the public profile, so they turn on and off as a unit).
 */
export const featureEnum = pgEnum("feature", [
  "entertainment",
  "wishlist",
  "not_for_me",
  "my_picks",
  "ask",
  // Appended by migration 0005 — declared last so this matches the physical
  // enum order in Postgres. Display order is FEATURES in src/lib/features.ts.
  "top_picks",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/**
 * Admin accounts. There is exactly ONE tier: an auth user with a row here is an
 * admin with full control over every creator's picks, wishlist, collections and
 * feature flags. Presence in this table IS the permission — there is
 * deliberately no `role` column, because a column that can only hold one value
 * reads like an authorization boundary while enforcing nothing.
 *
 * Rows are granted out-of-band (SQL/Supabase console), never through the app:
 * `admin_user` has no INSERT/UPDATE/DELETE policy for any role, so no request
 * path can escalate its own privileges or grant another account.
 */
export const adminUser = pgTable("admin_user", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  authUserUnique: uniqueIndex("admin_user_auth_user_id_unique").on(
    table.authUserId,
  ),
}));

export const profile = pgTable("profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  handle: citext("handle").notNull(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  accentColor: text("accent_color"),
  /** Public-profile palette. See profileThemeEnum + src/lib/themes.ts. */
  theme: profileThemeEnum("theme").notNull().default("on_fire"),
  /** e.g. { instagram: "...", tiktok: "...", youtube: "..." } */
  socials: jsonb("socials").$type<Record<string, string>>().default({}),
  // --- Ask feature (v2) ---
  askEnabled: boolean("ask_enabled").notNull().default(true),
  /** Public-facing prompt on /[handle]/ask. Null → UI default. */
  askPrompt: text("ask_prompt"),
  /**
   * Age gate for Ask. When true, `ask_enabled` defaults off and requires an
   * explicit opt-in — anonymous inboxes are higher-risk for minors. Set at
   * onboarding; policy decision flagged in README before public launch.
   */
  isMinor: boolean("is_minor").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  handleUnique: uniqueIndex("profile_handle_unique").on(table.handle),
  userIdUnique: uniqueIndex("profile_user_id_unique").on(table.userId),
}));

/**
 * Per-creator section switches, written only by staff. A MISSING ROW MEANS ON
 * — we never backfill a row per profile per feature, so every read must treat
 * absence as `enabled = true` (see getFeatureFlags). Off means the section is
 * omitted server-side entirely, not hidden in CSS.
 */
export const featureFlag = pgTable("feature_flag", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  feature: featureEnum("feature").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: uuid("updated_by").references(() => adminUser.id, {
    onDelete: "set null",
  }),
}, (table) => ({
  profileFeatureUnique: uniqueIndex("feature_flag_profile_feature_unique").on(
    table.profileId,
    table.feature,
  ),
}));

export const connection = pgTable("connection", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  provider: connectionProviderEnum("provider").notNull(),
  accessTokenEnc: text("access_token_enc"),
  refreshTokenEnc: text("refresh_token_enc"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  externalUsername: text("external_username"),
  /** Space-delimited OAuth scopes granted, e.g. Spotify's scope string. */
  scopes: text("scopes"),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  status: connectionStatusEnum("status").notNull().default("active"),
  errorCount: integer("error_count").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  // One connection per provider per profile — reconnecting replaces it.
  profileProviderUnique: uniqueIndex("connection_profile_provider_unique").on(
    table.profileId,
    table.provider,
  ),
}));

export const activityItem = pgTable("activity_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  /**
   * Free text, not the connection enum — a manually-entered book has no
   * `connection` row, and future adapters (Apple Music, Trakt, ...) must not
   * require an enum migration to land.
   */
  provider: text("provider").notNull(),
  kind: activityKindEnum("kind").notNull(),
  externalId: text("external_id").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  externalUrl: text("external_url"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  /** Provider-specific extras: rating, artist, isbn, duration_ms, etc. */
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  dedupe: uniqueIndex("activity_item_dedupe_unique").on(
    table.profileId,
    table.provider,
    table.kind,
    table.externalId,
    table.occurredAt,
  ),
  profileKindOccurredIdx: index("activity_item_profile_kind_occurred_idx").on(
    table.profileId,
    table.kind,
    table.occurredAt,
  ),
}));

export const collection = pgTable("collection", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  profileSlugUnique: uniqueIndex("collection_profile_slug_unique").on(
    table.profileId,
    table.slug,
  ),
  profilePositionIdx: index("collection_profile_position_idx").on(
    table.profileId,
    table.position,
  ),
}));

export const pick = pgTable("pick", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  /** Null = renders in the default, ungrouped shelf. */
  collectionId: uuid("collection_id").references(() => collection.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  brand: text("brand"),
  imageUrl: text("image_url"),
  /** Whole MNT (tögrög has no minor unit in practice) — bigint per spec. */
  priceMnt: bigint("price_mnt", { mode: "number" }),
  note: text("note"),
  status: pickStatusEnum("status").notNull().default("testing"),
  outboundUrl: text("outbound_url"),
  /** The URL originally pasted into the dashboard, for re-extraction/audit. */
  sourceUrl: text("source_url"),
  /**
   * Extractor extras. Holds a non-MNT source price verbatim
   * ({ rawPrice, rawCurrency }) so it can be shown as-is — we never
   * auto-convert currencies (rates go stale and mislead).
   */
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  profileActivePositionIdx: index("pick_profile_active_position_idx").on(
    table.profileId,
    table.isActive,
    table.position,
  ),
  collectionPositionIdx: index("pick_collection_position_idx").on(
    table.collectionId,
    table.position,
  ),
}));

export const link = pgTable("link", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  /** Icon key resolved client-side, e.g. "youtube" | "tiktok" | "newsletter". */
  icon: text("icon"),
  position: integer("position").notNull().default(0),
}, (table) => ({
  profilePositionIdx: index("link_profile_position_idx").on(
    table.profileId,
    table.position,
  ),
}));

/**
 * Wishlist — things the creator WANTS but doesn't own yet (distinct from
 * `pick`, which is stuff they use/recommend). Populated via the same paste-a-
 * URL extraction flow as picks. `url` is where a tap sends people (the product
 * page); non-MNT source prices are kept raw in `meta` and never converted.
 */
export const wishlistItem = pgTable("wishlist_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  priceMnt: bigint("price_mnt", { mode: "number" }),
  url: text("url"),
  note: text("note"),
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  profileActivePositionIdx: index("wishlist_item_profile_active_position_idx").on(
    table.profileId,
    table.isActive,
    table.position,
  ),
}));

/**
 * A sponsored banner. Campaigns are platform inventory, not creator content:
 * only staff create them, and one campaign is normally shown across many
 * profiles at once — which is why the banner lives here and the placement
 * lives in campaign_assignment rather than being denormalised per profile.
 *
 * This does NOT replace `pick`. My Picks, Wishlist and Not For Me keep using
 * pick exactly as before; only the Top Picks shelf renders campaigns.
 */
export const campaign = pgTable("campaign", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  /** Re-hosted to our own Storage, never hotlinked from the advertiser. */
  bannerImageUrl: text("banner_image_url"),
  /** Where a tap goes. The seam where click-tracking lands later. */
  destinationUrl: text("destination_url"),
  /** Shown as the underlined caption under the banner, e.g. "ayanga.store". */
  advertiserLabel: text("advertiser_label"),
  /** Off hides the banner on every profile at once, without unassigning. */
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by").references(() => adminUser.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  activeIdx: index("campaign_active_idx").on(table.isActive),
}));

/**
 * Placement of one campaign on one creator's Top Picks shelf. Two independent
 * `is_active` switches matter here: the campaign's (kill it everywhere) and
 * the assignment's (drop it from one profile), so pausing a banner globally
 * never loses the per-creator placements.
 */
export const campaignAssignment = pgTable("campaign_assignment", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaign.id, { onDelete: "cascade" }),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  /** Display order within that creator's Top Picks shelf. */
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  assignedBy: uuid("assigned_by").references(() => adminUser.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  campaignProfileUnique: uniqueIndex("campaign_assignment_campaign_profile_unique").on(
    table.campaignId,
    table.profileId,
  ),
  profileActivePositionIdx: index("campaign_assignment_profile_active_position_idx").on(
    table.profileId,
    table.isActive,
    table.position,
  ),
}));

/**
 * A promo code shown on one creator's profile. Staff-authored only — creators
 * cannot add these, same boundary as picks and campaigns.
 *
 * Unlike `campaign`, this is attached straight to a profile rather than going
 * through an assignment table: a code is negotiated per creator (ANU10), so
 * there is no shared inventory to fan out. If codes ever need to run across
 * many profiles at once, this grows an assignment table like campaigns did.
 */
export const promoCode = pgTable("promo_code", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  /** Big headline on the card, e.g. "10% OFF". */
  headline: text("headline").notNull(),
  /** Small print under the headline, e.g. "биетээр үйлчлүүлэхдээ ашиглана уу." */
  description: text("description"),
  /** The code the visitor copies, e.g. "ANU10". */
  code: text("code").notNull(),
  /** Where Copy sends them, so the code can be pasted straight away. */
  url: text("url"),
  /** Brand artwork on the left of the ticket. Re-hosted to our own Storage. */
  imageUrl: text("image_url"),
  /** Rendered as "EXP. JULY 31, 2026". Null → no expiry line. */
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  position: integer("position").notNull().default(0),
  createdBy: uuid("created_by").references(() => adminUser.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  profileActivePositionIdx: index("promo_code_profile_active_position_idx").on(
    table.profileId,
    table.isActive,
    table.position,
  ),
}));

export const askMessage = pgTable("ask_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  status: askStatusEnum("status").notNull().default("new"),
  answerBody: text("answer_body"),
  /** If the creator turned this question into a pick, the resulting pick. */
  answerPickId: uuid("answer_pick_id").references(() => pick.id, {
    onDelete: "set null",
  }),
  /**
   * Creators can no longer create picks themselves, so a product question is
   * handed to staff instead: answering + marking it product-related sets this,
   * and /admin surfaces the flagged messages as a work queue.
   */
  flaggedForPick: boolean("flagged_for_pick").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(false),
  /**
   * sha256(ip + rotating daily salt). Enough to rate-limit and detect abuse,
   * NOT enough to identify a person. Raw IP is never stored.
   */
  askerIpHash: text("asker_ip_hash"),
  /** Coarse client hash, for creator block/mute — not identity. */
  askerFingerprint: text("asker_fingerprint"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
}, (table) => ({
  // Inbox is ordered newest-first, filtered by status.
  profileStatusCreatedIdx: index("ask_message_profile_status_created_idx").on(
    table.profileId,
    table.status,
    table.createdAt,
  ),
  // Rate-limit lookups: count recent messages for (profile, ip hash).
  profileIpCreatedIdx: index("ask_message_profile_ip_created_idx").on(
    table.profileId,
    table.askerIpHash,
    table.createdAt,
  ),
}));

/** Creator-muted askers. A blocked fingerprint gets silent-success drops. */
export const askBlock = pgTable("ask_block", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  fingerprint: text("fingerprint").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  profileFingerprintUnique: uniqueIndex("ask_block_profile_fingerprint_unique").on(
    table.profileId,
    table.fingerprint,
  ),
}));

// ---------------------------------------------------------------------------
// Relations (query-API ergonomics — no schema effect)
// ---------------------------------------------------------------------------

export const adminUserRelations = relations(adminUser, ({ many }) => ({
  featureFlags: many(featureFlag),
  campaignAssignments: many(campaignAssignment),
  promoCodes: many(promoCode),
}));

export const featureFlagRelations = relations(featureFlag, ({ one }) => ({
  profile: one(profile, {
    fields: [featureFlag.profileId],
    references: [profile.id],
  }),
  updatedByAdmin: one(adminUser, {
    fields: [featureFlag.updatedBy],
    references: [adminUser.id],
  }),
}));

export const profileRelations = relations(profile, ({ many }) => ({
  connections: many(connection),
  activityItems: many(activityItem),
  collections: many(collection),
  picks: many(pick),
  links: many(link),
  wishlistItems: many(wishlistItem),
  askMessages: many(askMessage),
  askBlocks: many(askBlock),
  featureFlags: many(featureFlag),
}));

export const wishlistItemRelations = relations(wishlistItem, ({ one }) => ({
  profile: one(profile, {
    fields: [wishlistItem.profileId],
    references: [profile.id],
  }),
}));

export const connectionRelations = relations(connection, ({ one }) => ({
  profile: one(profile, {
    fields: [connection.profileId],
    references: [profile.id],
  }),
}));

export const activityItemRelations = relations(activityItem, ({ one }) => ({
  profile: one(profile, {
    fields: [activityItem.profileId],
    references: [profile.id],
  }),
}));

export const collectionRelations = relations(collection, ({ one, many }) => ({
  profile: one(profile, {
    fields: [collection.profileId],
    references: [profile.id],
  }),
  picks: many(pick),
}));

export const pickRelations = relations(pick, ({ one }) => ({
  profile: one(profile, {
    fields: [pick.profileId],
    references: [profile.id],
  }),
  collection: one(collection, {
    fields: [pick.collectionId],
    references: [collection.id],
  }),
}));

export const linkRelations = relations(link, ({ one }) => ({
  profile: one(profile, {
    fields: [link.profileId],
    references: [profile.id],
  }),
}));

export const promoCodeRelations = relations(promoCode, ({ one }) => ({
  profile: one(profile, {
    fields: [promoCode.profileId],
    references: [profile.id],
  }),
}));

export const campaignRelations = relations(campaign, ({ one, many }) => ({
  assignments: many(campaignAssignment),
  creator: one(adminUser, {
    fields: [campaign.createdBy],
    references: [adminUser.id],
  }),
}));

export const campaignAssignmentRelations = relations(campaignAssignment, ({ one }) => ({
  campaign: one(campaign, {
    fields: [campaignAssignment.campaignId],
    references: [campaign.id],
  }),
  profile: one(profile, {
    fields: [campaignAssignment.profileId],
    references: [profile.id],
  }),
}));

export const askMessageRelations = relations(askMessage, ({ one }) => ({
  profile: one(profile, {
    fields: [askMessage.profileId],
    references: [profile.id],
  }),
  answerPick: one(pick, {
    fields: [askMessage.answerPickId],
    references: [pick.id],
  }),
}));

export const askBlockRelations = relations(askBlock, ({ one }) => ({
  profile: one(profile, {
    fields: [askBlock.profileId],
    references: [profile.id],
  }),
}));
