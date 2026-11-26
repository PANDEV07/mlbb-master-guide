CREATE TYPE "public"."pro_build_item_catalog_status_enum" AS ENUM('MATCHED', 'UNMATCHED', 'AMBIGUOUS');--> statement-breakpoint
CREATE TYPE "public"."pro_match_result_enum" AS ENUM('WIN', 'LOSS', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."pro_match_team_side_enum" AS ENUM('BLUE', 'RED', 'UNKNOWN');--> statement-breakpoint
CREATE TABLE "hero_builds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hero_entity_id" uuid NOT NULL,
	"hero_entity_type" "entity_type_enum" DEFAULT 'hero' NOT NULL,
	"patch_version_id" uuid NOT NULL,
	"server_type" "server_type_enum" NOT NULL,
	"profile" jsonb NOT NULL,
	"status" varchar(24) DEFAULT 'DRAFT' NOT NULL,
	"verification_status" "verification_status_enum" DEFAULT 'UNVERIFIED' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pro_match_build_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_build_id" uuid NOT NULL,
	"slot_order" integer NOT NULL,
	"raw_item_name" varchar(160) NOT NULL,
	"item_entity_id" uuid,
	"item_entity_type" "entity_type_enum" DEFAULT 'item' NOT NULL,
	"catalog_match_status" "pro_build_item_catalog_status_enum" DEFAULT 'UNMATCHED' NOT NULL,
	"verification_status" "verification_status_enum" DEFAULT 'UNVERIFIED' NOT NULL,
	"is_verified_item" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_pro_match_build_items_slot_order" CHECK ("pro_match_build_items"."slot_order" >= 1 AND "pro_match_build_items"."slot_order" <= 6),
	CONSTRAINT "chk_pro_match_build_items_item_type" CHECK ("pro_match_build_items"."item_entity_type" = 'item'),
	CONSTRAINT "chk_pro_match_build_items_raw_name_not_blank" CHECK (length(trim("pro_match_build_items"."raw_item_name")) > 0),
	CONSTRAINT "chk_pro_match_build_items_catalog_verification_guard" CHECK (("pro_match_build_items"."item_entity_id" IS NULL AND "pro_match_build_items"."catalog_match_status" IN ('UNMATCHED', 'AMBIGUOUS') AND "pro_match_build_items"."is_verified_item" = false AND "pro_match_build_items"."verification_status" NOT IN ('VERIFIED', 'PARTIALLY_VERIFIED')) OR ("pro_match_build_items"."item_entity_id" IS NOT NULL AND "pro_match_build_items"."catalog_match_status" = 'MATCHED' AND (("pro_match_build_items"."verification_status" = 'VERIFIED' AND "pro_match_build_items"."is_verified_item" = true) OR ("pro_match_build_items"."verification_status" <> 'VERIFIED' AND "pro_match_build_items"."is_verified_item" = false))))
);
--> statement-breakpoint
CREATE TABLE "pro_match_player_builds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pro_match_id" uuid NOT NULL,
	"player_name" varchar(120) NOT NULL,
	"team_name" varchar(120) NOT NULL,
	"team_side" "pro_match_team_side_enum" DEFAULT 'UNKNOWN' NOT NULL,
	"role_lane" varchar(64),
	"hero_entity_id" uuid,
	"hero_entity_type" "entity_type_enum" DEFAULT 'hero' NOT NULL,
	"raw_hero_name" varchar(120) NOT NULL,
	"battle_spell_entity_id" uuid,
	"battle_spell_entity_type" "entity_type_enum" DEFAULT 'spell' NOT NULL,
	"raw_battle_spell_name" varchar(120),
	"emblem_entity_id" uuid,
	"emblem_entity_type" "entity_type_enum" DEFAULT 'emblem' NOT NULL,
	"raw_emblem_name" varchar(120),
	"raw_emblem_talents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"match_result" "pro_match_result_enum" DEFAULT 'UNKNOWN' NOT NULL,
	"kills" integer,
	"deaths" integer,
	"assists" integer,
	"verification_status" "verification_status_enum" DEFAULT 'UNVERIFIED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_pro_match_player_builds_hero_type" CHECK ("pro_match_player_builds"."hero_entity_type" = 'hero'),
	CONSTRAINT "chk_pro_match_player_builds_spell_type" CHECK ("pro_match_player_builds"."battle_spell_entity_type" = 'spell'),
	CONSTRAINT "chk_pro_match_player_builds_emblem_type" CHECK ("pro_match_player_builds"."emblem_entity_type" = 'emblem'),
	CONSTRAINT "chk_pro_match_player_builds_kda_non_negative" CHECK (("pro_match_player_builds"."kills" IS NULL OR "pro_match_player_builds"."kills" >= 0) AND ("pro_match_player_builds"."deaths" IS NULL OR "pro_match_player_builds"."deaths" >= 0) AND ("pro_match_player_builds"."assists" IS NULL OR "pro_match_player_builds"."assists" >= 0)),
	CONSTRAINT "chk_pro_match_player_builds_hero_verified" CHECK ("pro_match_player_builds"."hero_entity_id" IS NOT NULL OR "pro_match_player_builds"."verification_status" <> 'VERIFIED')
);
--> statement-breakpoint
CREATE TABLE "pro_match_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pro_match_id" uuid NOT NULL,
	"player_build_id" uuid,
	"source_registry_id" uuid,
	"provider" varchar(100) NOT NULL,
	"source_url" text NOT NULL,
	"source_tier" "source_tier_enum" DEFAULT 'TIER_2_SECONDARY' NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verification_status" "verification_status_enum" DEFAULT 'UNVERIFIED' NOT NULL,
	"claim_classification" "claim_classification_enum" DEFAULT 'UNKNOWN' NOT NULL,
	"confidence_level" "confidence_level_enum" DEFAULT 'LOW' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" varchar(128),
	"evidence_excerpt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_pro_match_sources_provider_not_blank" CHECK (length(trim("pro_match_sources"."provider")) > 0),
	CONSTRAINT "chk_pro_match_sources_url_not_blank" CHECK (length(trim("pro_match_sources"."source_url")) > 0)
);
--> statement-breakpoint
CREATE TABLE "pro_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_name" varchar(160) NOT NULL,
	"stage_name" varchar(120),
	"match_code" varchar(160),
	"game_number" integer,
	"team_a_name" varchar(120) NOT NULL,
	"team_b_name" varchar(120) NOT NULL,
	"winner_team_name" varchar(120),
	"match_date" date,
	"played_at" timestamp with time zone,
	"patch_version_id" uuid,
	"server_type" "server_type_enum" DEFAULT 'ORIGINAL_SERVER' NOT NULL,
	"raw_patch_version" varchar(64),
	"verification_status" "verification_status_enum" DEFAULT 'UNVERIFIED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_pro_matches_teams_distinct" CHECK (lower(trim("pro_matches"."team_a_name")) <> lower(trim("pro_matches"."team_b_name"))),
	CONSTRAINT "chk_pro_matches_winner_valid" CHECK ("pro_matches"."winner_team_name" IS NULL OR "pro_matches"."winner_team_name" = "pro_matches"."team_a_name" OR "pro_matches"."winner_team_name" = "pro_matches"."team_b_name"),
	CONSTRAINT "chk_pro_matches_game_number_positive" CHECK ("pro_matches"."game_number" IS NULL OR "pro_matches"."game_number" >= 1),
	CONSTRAINT "chk_pro_matches_patch_required_for_verified" CHECK ("pro_matches"."verification_status" <> 'VERIFIED' OR "pro_matches"."patch_version_id" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "hero_builds" ADD CONSTRAINT "fk_hero_builds_hero" FOREIGN KEY ("hero_entity_id","hero_entity_type") REFERENCES "public"."knowledge_entities"("entity_id","entity_type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_builds" ADD CONSTRAINT "fk_hero_builds_patch" FOREIGN KEY ("patch_version_id","server_type") REFERENCES "public"."patch_versions"("id","server_type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_match_build_items" ADD CONSTRAINT "pro_match_build_items_player_build_id_pro_match_player_builds_id_fk" FOREIGN KEY ("player_build_id") REFERENCES "public"."pro_match_player_builds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_match_build_items" ADD CONSTRAINT "fk_pro_match_build_items_item" FOREIGN KEY ("item_entity_id","item_entity_type") REFERENCES "public"."knowledge_entities"("entity_id","entity_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_match_player_builds" ADD CONSTRAINT "pro_match_player_builds_pro_match_id_pro_matches_id_fk" FOREIGN KEY ("pro_match_id") REFERENCES "public"."pro_matches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_match_player_builds" ADD CONSTRAINT "fk_pro_match_player_builds_hero" FOREIGN KEY ("hero_entity_id","hero_entity_type") REFERENCES "public"."knowledge_entities"("entity_id","entity_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_match_player_builds" ADD CONSTRAINT "fk_pro_match_player_builds_battle_spell" FOREIGN KEY ("battle_spell_entity_id","battle_spell_entity_type") REFERENCES "public"."knowledge_entities"("entity_id","entity_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_match_player_builds" ADD CONSTRAINT "fk_pro_match_player_builds_emblem" FOREIGN KEY ("emblem_entity_id","emblem_entity_type") REFERENCES "public"."knowledge_entities"("entity_id","entity_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_match_sources" ADD CONSTRAINT "pro_match_sources_pro_match_id_pro_matches_id_fk" FOREIGN KEY ("pro_match_id") REFERENCES "public"."pro_matches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_match_sources" ADD CONSTRAINT "pro_match_sources_player_build_id_pro_match_player_builds_id_fk" FOREIGN KEY ("player_build_id") REFERENCES "public"."pro_match_player_builds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_match_sources" ADD CONSTRAINT "pro_match_sources_source_registry_id_sources_id_fk" FOREIGN KEY ("source_registry_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_matches" ADD CONSTRAINT "fk_pro_matches_patch_version" FOREIGN KEY ("patch_version_id","server_type") REFERENCES "public"."patch_versions"("id","server_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_hero_builds_hero" ON "hero_builds" USING btree ("hero_entity_id");--> statement-breakpoint
CREATE INDEX "idx_hero_builds_patch_server" ON "hero_builds" USING btree ("patch_version_id","server_type");--> statement-breakpoint
CREATE INDEX "idx_hero_builds_status" ON "hero_builds" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pro_match_build_items_build_slot" ON "pro_match_build_items" USING btree ("player_build_id","slot_order");--> statement-breakpoint
CREATE INDEX "idx_pro_match_build_items_item_entity" ON "pro_match_build_items" USING btree ("item_entity_id");--> statement-breakpoint
CREATE INDEX "idx_pro_match_build_items_catalog_status" ON "pro_match_build_items" USING btree ("catalog_match_status","is_verified_item");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pro_match_player_builds_match_team_player" ON "pro_match_player_builds" USING btree ("pro_match_id","team_name","player_name");--> statement-breakpoint
CREATE INDEX "idx_pro_match_player_builds_hero" ON "pro_match_player_builds" USING btree ("hero_entity_id");--> statement-breakpoint
CREATE INDEX "idx_pro_match_player_builds_player" ON "pro_match_player_builds" USING btree ("player_name");--> statement-breakpoint
CREATE INDEX "idx_pro_match_player_builds_result" ON "pro_match_player_builds" USING btree ("match_result");--> statement-breakpoint
CREATE INDEX "idx_pro_match_sources_match" ON "pro_match_sources" USING btree ("pro_match_id");--> statement-breakpoint
CREATE INDEX "idx_pro_match_sources_player_build" ON "pro_match_sources" USING btree ("player_build_id");--> statement-breakpoint
CREATE INDEX "idx_pro_match_sources_provider_status" ON "pro_match_sources" USING btree ("provider","verification_status");--> statement-breakpoint
CREATE INDEX "idx_pro_match_sources_match_url" ON "pro_match_sources" USING btree ("pro_match_id","source_url");--> statement-breakpoint
CREATE INDEX "idx_pro_matches_tournament_date" ON "pro_matches" USING btree ("tournament_name","match_date");--> statement-breakpoint
CREATE INDEX "idx_pro_matches_patch_server" ON "pro_matches" USING btree ("patch_version_id","server_type");--> statement-breakpoint
CREATE INDEX "idx_pro_matches_match_code" ON "pro_matches" USING btree ("match_code");--> statement-breakpoint
CREATE INDEX "idx_pro_matches_verification_status" ON "pro_matches" USING btree ("verification_status");