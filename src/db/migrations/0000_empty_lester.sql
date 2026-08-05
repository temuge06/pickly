CREATE TYPE "public"."activity_kind" AS ENUM('track', 'album', 'film', 'book', 'podcast');--> statement-breakpoint
CREATE TYPE "public"."ask_status" AS ENUM('new', 'answered', 'hidden', 'reported', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."connection_provider" AS ENUM('spotify', 'letterboxd');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('active', 'error', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."pick_status" AS ENUM('testing', 'recommend', 'repurchased', 'wont_rebuy');--> statement-breakpoint
CREATE TABLE "activity_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"kind" "activity_kind" NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"image_url" text,
	"external_url" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ask_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ask_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"body" text NOT NULL,
	"status" "ask_status" DEFAULT 'new' NOT NULL,
	"answer_body" text,
	"answer_pick_id" uuid,
	"is_public" boolean DEFAULT false NOT NULL,
	"asker_ip_hash" text,
	"asker_fingerprint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"answered_at" timestamp with time zone
);
--> statement-breakpoint
-- NOTE: auth.users is managed by Supabase Auth. Drizzle emits a CREATE TABLE
-- for it because profile.user_id references it; that statement is removed by
-- hand so this migration does not fight Supabase's schema. The FK below still
-- binds to the existing auth.users table.
CREATE TABLE "collection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"provider" "connection_provider" NOT NULL,
	"access_token_enc" text,
	"refresh_token_enc" text,
	"expires_at" timestamp with time zone,
	"external_username" text,
	"scopes" text,
	"last_sync_at" timestamp with time zone,
	"status" "connection_status" DEFAULT 'active' NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"icon" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pick" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"collection_id" uuid,
	"title" text NOT NULL,
	"brand" text,
	"image_url" text,
	"price_mnt" bigint,
	"note" text,
	"status" "pick_status" DEFAULT 'testing' NOT NULL,
	"outbound_url" text,
	"source_url" text,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"status_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"handle" "citext" NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	"avatar_url" text,
	"accent_color" text,
	"socials" jsonb DEFAULT '{}'::jsonb,
	"ask_enabled" boolean DEFAULT true NOT NULL,
	"ask_prompt" text,
	"is_minor" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_item" ADD CONSTRAINT "activity_item_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_block" ADD CONSTRAINT "ask_block_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_message" ADD CONSTRAINT "ask_message_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_message" ADD CONSTRAINT "ask_message_answer_pick_id_pick_id_fk" FOREIGN KEY ("answer_pick_id") REFERENCES "public"."pick"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection" ADD CONSTRAINT "connection_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link" ADD CONSTRAINT "link_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick" ADD CONSTRAINT "pick_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick" ADD CONSTRAINT "pick_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activity_item_dedupe_unique" ON "activity_item" USING btree ("profile_id","provider","kind","external_id","occurred_at");--> statement-breakpoint
CREATE INDEX "activity_item_profile_kind_occurred_idx" ON "activity_item" USING btree ("profile_id","kind","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ask_block_profile_fingerprint_unique" ON "ask_block" USING btree ("profile_id","fingerprint");--> statement-breakpoint
CREATE INDEX "ask_message_profile_status_created_idx" ON "ask_message" USING btree ("profile_id","status","created_at");--> statement-breakpoint
CREATE INDEX "ask_message_profile_ip_created_idx" ON "ask_message" USING btree ("profile_id","asker_ip_hash","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "collection_profile_slug_unique" ON "collection" USING btree ("profile_id","slug");--> statement-breakpoint
CREATE INDEX "collection_profile_position_idx" ON "collection" USING btree ("profile_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "connection_profile_provider_unique" ON "connection" USING btree ("profile_id","provider");--> statement-breakpoint
CREATE INDEX "link_profile_position_idx" ON "link" USING btree ("profile_id","position");--> statement-breakpoint
CREATE INDEX "pick_profile_active_position_idx" ON "pick" USING btree ("profile_id","is_active","position");--> statement-breakpoint
CREATE INDEX "pick_collection_position_idx" ON "pick" USING btree ("collection_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_handle_unique" ON "profile" USING btree ("handle");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_user_id_unique" ON "profile" USING btree ("user_id");