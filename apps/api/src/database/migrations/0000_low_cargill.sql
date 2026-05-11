CREATE TYPE "public"."auction_event_type" AS ENUM('CREATED', 'STATUS_CHANGED', 'BID_PLACED', 'EXTENDED_ANTI_SNIPING', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."auction_status" AS ENUM('SCHEDULED', 'LIVE', 'SOLD', 'UNSOLD', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('BID_PLACED', 'OUTBID', 'AUCTION_STARTED', 'AUCTION_ENDING_SOON', 'AUCTION_WON', 'AUCTION_LOST', 'AUCTION_CLOSED_NO_WINNER', 'PRODUCT_APPROVED', 'PRODUCT_REJECTED', 'FEEDBACK_RECEIVED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'AUTHORIZED', 'PAID', 'REFUNDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."product_approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."product_lifecycle_status" AS ENUM('DRAFT', 'LISTED', 'IN_AUCTION', 'SOLD', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."refresh_revoked_reason" AS ENUM('ROTATED', 'USER_LOGOUT', 'REUSE_DETECTED', 'ADMIN_REVOKED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'SELLER', 'BIDDER');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" NOT NULL,
	"email_verified_at" timestamp with time zone,
	"deactivated_at" timestamp with time zone,
	"is_locked" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"gender" "gender",
	"address" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"jti" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoked_reason" "refresh_revoked_reason",
	"replaced_by_id" uuid,
	"user_agent" text,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approval_status" "product_approval_status" DEFAULT 'PENDING' NOT NULL,
	"lifecycle_status" "product_lifecycle_status" DEFAULT 'DRAFT' NOT NULL,
	"review_note" text,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auctions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"status" "auction_status" DEFAULT 'SCHEDULED' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"start_price_minor" bigint NOT NULL,
	"min_bid_increment_minor" bigint NOT NULL,
	"reserve_price_minor" bigint,
	"soft_close_seconds" integer DEFAULT 0 NOT NULL,
	"current_highest_minor" bigint,
	"current_highest_bid_id" uuid,
	"bid_count" integer DEFAULT 0 NOT NULL,
	"winner_user_id" uuid,
	"winning_bid_id" uuid,
	"cancellation_reason" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "auctions_time_range_chk" CHECK ("auctions"."starts_at" < "auctions"."ends_at"),
	CONSTRAINT "auctions_start_price_chk" CHECK ("auctions"."start_price_minor" >= 0),
	CONSTRAINT "auctions_increment_chk" CHECK ("auctions"."min_bid_increment_minor" > 0),
	CONSTRAINT "auctions_soft_close_chk" CHECK ("auctions"."soft_close_seconds" >= 0 AND "auctions"."soft_close_seconds" <= 600)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" uuid NOT NULL,
	"bidder_id" uuid NOT NULL,
	"amount_minor" bigint NOT NULL,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bids_amount_chk" CHECK ("bids"."amount_minor" > 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedbacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedbacks_rating_chk" CHECK ("feedbacks"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"amount_minor" bigint NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"provider" text,
	"provider_ref" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auction_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" uuid NOT NULL,
	"actor_id" uuid,
	"event_type" "auction_event_type" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_id_refresh_tokens_id_fk" FOREIGN KEY ("replaced_by_id") REFERENCES "public"."refresh_tokens"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auctions" ADD CONSTRAINT "auctions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auctions" ADD CONSTRAINT "auctions_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auctions" ADD CONSTRAINT "auctions_winner_user_id_users_id_fk" FOREIGN KEY ("winner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bids" ADD CONSTRAINT "bids_bidder_id_users_id_fk" FOREIGN KEY ("bidder_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auction_events" ADD CONSTRAINT "auction_events_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auction_events" ADD CONSTRAINT "auction_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_user_id_uq" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_phone_uq" ON "profiles" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_jti_uq" ON "refresh_tokens" USING btree ("jti");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_family_id_idx" ON "refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_active_idx" ON "refresh_tokens" USING btree ("user_id","revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_uq" ON "categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_uq" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_seller_id_idx" ON "products" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_approval_status_idx" ON "products" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_lifecycle_status_idx" ON "products" USING btree ("lifecycle_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auctions_product_id_idx" ON "auctions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auctions_seller_id_idx" ON "auctions" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auctions_status_idx" ON "auctions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auctions_ends_at_idx" ON "auctions" USING btree ("ends_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auctions_status_ends_at_idx" ON "auctions" USING btree ("status","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "auctions_active_product_uq" ON "auctions" USING btree ("product_id") WHERE status in ('SCHEDULED','LIVE');--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bids_auction_id_idx" ON "bids" USING btree ("auction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bids_bidder_id_idx" ON "bids" USING btree ("bidder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bids_highest_idx" ON "bids" USING btree ("auction_id","amount_minor" desc,"placed_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "feedbacks_auction_reviewer_uq" ON "feedbacks" USING btree ("auction_id","reviewer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedbacks_auction_id_idx" ON "feedbacks" USING btree ("auction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_recipient_id_idx" ON "notifications" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_recipient_unread_idx" ON "notifications" USING btree ("recipient_id","read_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_auction_id_idx" ON "payments" USING btree ("auction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_buyer_id_idx" ON "payments" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_seller_id_idx" ON "payments" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auction_events_auction_id_idx" ON "auction_events" USING btree ("auction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auction_events_event_type_idx" ON "auction_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auction_events_created_at_idx" ON "auction_events" USING btree ("created_at");