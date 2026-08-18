CREATE TYPE "public"."feature" AS ENUM('entertainment', 'wishlist', 'not_for_me', 'my_picks', 'ask');--> statement-breakpoint
CREATE TABLE "admin_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"role" text DEFAULT 'staff' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"feature" "feature" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "ask_message" ADD COLUMN "flagged_for_pick" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_user" ADD CONSTRAINT "admin_user_auth_user_id_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag" ADD CONSTRAINT "feature_flag_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag" ADD CONSTRAINT "feature_flag_updated_by_admin_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_user_auth_user_id_unique" ON "admin_user" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flag_profile_feature_unique" ON "feature_flag" USING btree ("profile_id","feature");