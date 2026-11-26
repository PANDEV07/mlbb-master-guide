CREATE TYPE "public"."claim_classification_enum" AS ENUM('OFFICIAL_FACT', 'SECONDARY_SOURCE', 'RESEARCH_BASED_ANALYSIS', 'STRATEGIC_INTERPRETATION', 'COMMUNITY_THEORY', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."confidence_level_enum" AS ENUM('HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."evidence_stance_enum" AS ENUM('SUPPORTING', 'CONFLICTING');--> statement-breakpoint
CREATE TYPE "public"."patch_change_type_enum" AS ENUM('BUFF', 'NERF', 'ADJUST', 'REVAMP', 'NEW', 'BUGFIX');--> statement-breakpoint
CREATE TYPE "public"."server_type_enum" AS ENUM('ORIGINAL_SERVER', 'ADVANCE_SERVER', 'EXPERIMENTAL');--> statement-breakpoint
CREATE TYPE "public"."source_tier_enum" AS ENUM('TIER_1_OFFICIAL', 'TIER_2_SECONDARY', 'TIER_3_ANALYTICAL', 'TIER_4_COMMUNITY');--> statement-breakpoint
CREATE TYPE "public"."verification_status_enum" AS ENUM('VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'OUTDATED', 'CONFLICTING', 'UNKNOWN', 'NOT_RESEARCHED', 'NOT_YET_AVAILABLE', 'NOT_FOUND');--> statement-breakpoint
CREATE TABLE "entity_evidences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" uuid NOT NULL,
	"aspect_name" varchar(64) DEFAULT 'GENERAL' NOT NULL,
	"source_id" uuid NOT NULL,
	"source_url" text,
	"claim_classification" "claim_classification_enum" DEFAULT 'UNKNOWN' NOT NULL,
	"verification_status" "verification_status_enum" DEFAULT 'UNVERIFIED' NOT NULL,
	"confidence_level" "confidence_level_enum" DEFAULT 'LOW' NOT NULL,
	"stance" "evidence_stance_enum" DEFAULT 'SUPPORTING' NOT NULL,
	"evidence_excerpt" text,
	"conflict_notes" text,
	"verified_by" varchar(128),
	"verified_at" timestamp with time zone,
	"patch_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patch_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patch_version_id" uuid NOT NULL,
	"target_entity_type" varchar(64) NOT NULL,
	"target_entity_id" uuid,
	"target_entity_slug" varchar(128),
	"change_type" "patch_change_type_enum" NOT NULL,
	"attribute_name" varchar(128),
	"previous_value" text,
	"new_value" text,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patch_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_code" varchar(32) NOT NULL,
	"version_order" integer NOT NULL,
	"server_type" "server_type_enum" DEFAULT 'ORIGINAL_SERVER' NOT NULL,
	"season_label" varchar(64),
	"release_date" date,
	"is_current_live" boolean DEFAULT false NOT NULL,
	"notes_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"domain" varchar(160) NOT NULL,
	"base_url" text NOT NULL,
	"source_tier" "source_tier_enum" NOT NULL,
	"source_category" varchar(64) NOT NULL,
	"reliability_notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entity_evidences" ADD CONSTRAINT "entity_evidences_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_evidences" ADD CONSTRAINT "entity_evidences_patch_version_id_patch_versions_id_fk" FOREIGN KEY ("patch_version_id") REFERENCES "public"."patch_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patch_changes" ADD CONSTRAINT "patch_changes_patch_version_id_patch_versions_id_fk" FOREIGN KEY ("patch_version_id") REFERENCES "public"."patch_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_entity_evidences_entity" ON "entity_evidences" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_entity_evidences_status" ON "entity_evidences" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "idx_entity_evidences_source_id" ON "entity_evidences" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_entity_evidences_patch_version_id" ON "entity_evidences" USING btree ("patch_version_id");--> statement-breakpoint
CREATE INDEX "idx_patch_changes_patch_version_id" ON "patch_changes" USING btree ("patch_version_id");--> statement-breakpoint
CREATE INDEX "idx_patch_changes_target_entity" ON "patch_changes" USING btree ("target_entity_type","target_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_patch_versions_version_code_server_type" ON "patch_versions" USING btree ("version_code","server_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_patch_versions_version_order_server_type" ON "patch_versions" USING btree ("version_order","server_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_patch_versions_live_per_server" ON "patch_versions" USING btree ("server_type") WHERE "patch_versions"."is_current_live" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sources_name_domain" ON "sources" USING btree ("name","domain");--> statement-breakpoint
CREATE INDEX "idx_sources_source_tier" ON "sources" USING btree ("source_tier");