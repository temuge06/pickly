-- Idempotent: migration 0005 already appended this value on databases that ran
-- it, and Drizzle re-emits it here because 0005 was hand-written without a
-- snapshot. IF NOT EXISTS makes this safe on both migrated and fresh databases.
ALTER TYPE "public"."feature" ADD VALUE IF NOT EXISTS 'top_picks';--> statement-breakpoint
CREATE TABLE "campaign" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"banner_image_url" text,
	"destination_url" text,
	"advertiser_label" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"assigned_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_created_by_admin_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_assignment" ADD CONSTRAINT "campaign_assignment_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_assignment" ADD CONSTRAINT "campaign_assignment_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_assignment" ADD CONSTRAINT "campaign_assignment_assigned_by_admin_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."admin_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaign_active_idx" ON "campaign" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_assignment_campaign_profile_unique" ON "campaign_assignment" USING btree ("campaign_id","profile_id");--> statement-breakpoint
CREATE INDEX "campaign_assignment_profile_active_position_idx" ON "campaign_assignment" USING btree ("profile_id","is_active","position");