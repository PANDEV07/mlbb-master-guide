import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestampsColumns } from "./conventions";
import {
  claimClassificationEnum,
  confidenceLevelEnum,
  entityTypeEnum,
  proBuildItemCatalogStatusEnum,
  proMatchResultEnum,
  proMatchTeamSideEnum,
  serverTypeEnum,
  sourceTierEnum,
  verificationStatusEnum,
} from "./enums";
import { sources } from "./governance";
import { knowledgeEntities } from "./knowledge_entities";
import { patchVersions } from "./patch_versions";

/**
 * Tabel 1: Pertandingan pro (turnamen, tim, tanggal, dan patch).
 */
export const proMatches = pgTable(
  "pro_matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tournamentName: varchar("tournament_name", { length: 160 }).notNull(),
    stageName: varchar("stage_name", { length: 120 }),
    matchCode: varchar("match_code", { length: 160 }),
    gameNumber: integer("game_number"),
    teamAName: varchar("team_a_name", { length: 120 }).notNull(),
    teamBName: varchar("team_b_name", { length: 120 }).notNull(),
    winnerTeamName: varchar("winner_team_name", { length: 120 }),
    matchDate: date("match_date"),
    playedAt: timestamp("played_at", { withTimezone: true }),
    patchVersionId: uuid("patch_version_id"),
    serverType: serverTypeEnum("server_type")
      .notNull()
      .default("ORIGINAL_SERVER"),
    rawPatchVersion: varchar("raw_patch_version", { length: 64 }),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("UNVERIFIED"),
    ...timestampsColumns,
  },
  (table) => [
    foreignKey({
      columns: [table.patchVersionId, table.serverType],
      foreignColumns: [patchVersions.id, patchVersions.serverType],
      name: "fk_pro_matches_patch_version",
    }).onDelete("restrict"),
    check(
      "chk_pro_matches_teams_distinct",
      sql`lower(trim(${table.teamAName})) <> lower(trim(${table.teamBName}))`,
    ),
    check(
      "chk_pro_matches_winner_valid",
      sql`${table.winnerTeamName} IS NULL OR ${table.winnerTeamName} = ${table.teamAName} OR ${table.winnerTeamName} = ${table.teamBName}`,
    ),
    check(
      "chk_pro_matches_game_number_positive",
      sql`${table.gameNumber} IS NULL OR ${table.gameNumber} >= 1`,
    ),
    check(
      "chk_pro_matches_patch_required_for_verified",
      sql`${table.verificationStatus} <> 'VERIFIED' OR ${table.patchVersionId} IS NOT NULL`,
    ),
    index("idx_pro_matches_tournament_date").on(
      table.tournamentName,
      table.matchDate,
    ),
    index("idx_pro_matches_patch_server").on(
      table.patchVersionId,
      table.serverType,
    ),
    index("idx_pro_matches_match_code").on(table.matchCode),
    index("idx_pro_matches_verification_status").on(table.verificationStatus),
  ],
);

/**
 * Tabel 2: Build pemain pro per pertandingan (pemain, hero, battle spell, emblem, hasil).
 */
export const proMatchPlayerBuilds = pgTable(
  "pro_match_player_builds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proMatchId: uuid("pro_match_id")
      .notNull()
      .references(() => proMatches.id, { onDelete: "restrict" }),
    playerName: varchar("player_name", { length: 120 }).notNull(),
    teamName: varchar("team_name", { length: 120 }).notNull(),
    teamSide: proMatchTeamSideEnum("team_side").notNull().default("UNKNOWN"),
    roleLane: varchar("role_lane", { length: 64 }),

    heroEntityId: uuid("hero_entity_id"),
    heroEntityType: entityTypeEnum("hero_entity_type")
      .notNull()
      .default("hero"),
    rawHeroName: varchar("raw_hero_name", { length: 120 }).notNull(),

    battleSpellEntityId: uuid("battle_spell_entity_id"),
    battleSpellEntityType: entityTypeEnum("battle_spell_entity_type")
      .notNull()
      .default("spell"),
    rawBattleSpellName: varchar("raw_battle_spell_name", { length: 120 }),

    emblemEntityId: uuid("emblem_entity_id"),
    emblemEntityType: entityTypeEnum("emblem_entity_type")
      .notNull()
      .default("emblem"),
    rawEmblemName: varchar("raw_emblem_name", { length: 120 }),
    rawEmblemTalents: jsonb("raw_emblem_talents")
      .$type<string[]>()
      .notNull()
      .default([]),

    matchResult: proMatchResultEnum("match_result")
      .notNull()
      .default("UNKNOWN"),
    kills: integer("kills"),
    deaths: integer("deaths"),
    assists: integer("assists"),

    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("UNVERIFIED"),
    ...timestampsColumns,
  },
  (table) => [
    foreignKey({
      columns: [table.heroEntityId, table.heroEntityType],
      foreignColumns: [
        knowledgeEntities.entityId,
        knowledgeEntities.entityType,
      ],
      name: "fk_pro_match_player_builds_hero",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.battleSpellEntityId, table.battleSpellEntityType],
      foreignColumns: [
        knowledgeEntities.entityId,
        knowledgeEntities.entityType,
      ],
      name: "fk_pro_match_player_builds_battle_spell",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.emblemEntityId, table.emblemEntityType],
      foreignColumns: [
        knowledgeEntities.entityId,
        knowledgeEntities.entityType,
      ],
      name: "fk_pro_match_player_builds_emblem",
    }).onDelete("restrict"),
    check(
      "chk_pro_match_player_builds_hero_type",
      sql`${table.heroEntityType} = 'hero'`,
    ),
    check(
      "chk_pro_match_player_builds_spell_type",
      sql`${table.battleSpellEntityType} = 'spell'`,
    ),
    check(
      "chk_pro_match_player_builds_emblem_type",
      sql`${table.emblemEntityType} = 'emblem'`,
    ),
    check(
      "chk_pro_match_player_builds_kda_non_negative",
      sql`(${table.kills} IS NULL OR ${table.kills} >= 0) AND (${table.deaths} IS NULL OR ${table.deaths} >= 0) AND (${table.assists} IS NULL OR ${table.assists} >= 0)`,
    ),
    check(
      "chk_pro_match_player_builds_hero_verified",
      sql`${table.heroEntityId} IS NOT NULL OR ${table.verificationStatus} <> 'VERIFIED'`,
    ),
    uniqueIndex("uq_pro_match_player_builds_match_team_player").on(
      table.proMatchId,
      table.teamName,
      table.playerName,
    ),
    index("idx_pro_match_player_builds_hero").on(table.heroEntityId),
    index("idx_pro_match_player_builds_player").on(table.playerName),
    index("idx_pro_match_player_builds_result").on(table.matchResult),
  ],
);

/**
 * Tabel 3: Enam item build pemain pro beserta urutan slot (1..6) dan referensi katalog.
 * Invarian: item yang belum cocok dengan katalog (item_entity_id IS NULL) boleh disimpan
 * dengan raw_item_name, tetapi dilarang berstatus terverifikasi.
 */
export const proMatchBuildItems = pgTable(
  "pro_match_build_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerBuildId: uuid("player_build_id")
      .notNull()
      .references(() => proMatchPlayerBuilds.id, { onDelete: "restrict" }),
    slotOrder: integer("slot_order").notNull(),
    rawItemName: varchar("raw_item_name", { length: 160 }).notNull(),
    itemEntityId: uuid("item_entity_id"),
    itemEntityType: entityTypeEnum("item_entity_type")
      .notNull()
      .default("item"),
    catalogMatchStatus: proBuildItemCatalogStatusEnum("catalog_match_status")
      .notNull()
      .default("UNMATCHED"),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("UNVERIFIED"),
    isVerifiedItem: boolean("is_verified_item").notNull().default(false),
    ...timestampsColumns,
  },
  (table) => [
    foreignKey({
      columns: [table.itemEntityId, table.itemEntityType],
      foreignColumns: [
        knowledgeEntities.entityId,
        knowledgeEntities.entityType,
      ],
      name: "fk_pro_match_build_items_item",
    }).onDelete("restrict"),
    check(
      "chk_pro_match_build_items_slot_order",
      sql`${table.slotOrder} >= 1 AND ${table.slotOrder} <= 6`,
    ),
    check(
      "chk_pro_match_build_items_item_type",
      sql`${table.itemEntityType} = 'item'`,
    ),
    check(
      "chk_pro_match_build_items_raw_name_not_blank",
      sql`length(trim(${table.rawItemName})) > 0`,
    ),
    check(
      "chk_pro_match_build_items_catalog_verification_guard",
      sql`(${table.itemEntityId} IS NULL AND ${table.catalogMatchStatus} IN ('UNMATCHED', 'AMBIGUOUS') AND ${table.isVerifiedItem} = false AND ${table.verificationStatus} NOT IN ('VERIFIED', 'PARTIALLY_VERIFIED')) OR (${table.itemEntityId} IS NOT NULL AND ${table.catalogMatchStatus} = 'MATCHED' AND ((${table.verificationStatus} = 'VERIFIED' AND ${table.isVerifiedItem} = true) OR (${table.verificationStatus} <> 'VERIFIED' AND ${table.isVerifiedItem} = false)))`,
    ),
    uniqueIndex("uq_pro_match_build_items_build_slot").on(
      table.playerBuildId,
      table.slotOrder,
    ),
    index("idx_pro_match_build_items_item_entity").on(table.itemEntityId),
    index("idx_pro_match_build_items_catalog_status").on(
      table.catalogMatchStatus,
      table.isVerifiedItem,
    ),
  ],
);

/**
 * Tabel 4: Sumber rujukan impor pertandingan & build pro (URL, penyedia, waktu impor, status verifikasi).
 */
export const proMatchSources = pgTable(
  "pro_match_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proMatchId: uuid("pro_match_id")
      .notNull()
      .references(() => proMatches.id, { onDelete: "restrict" }),
    playerBuildId: uuid("player_build_id").references(
      () => proMatchPlayerBuilds.id,
      { onDelete: "restrict" },
    ),
    sourceRegistryId: uuid("source_registry_id").references(() => sources.id, {
      onDelete: "restrict",
    }),
    provider: varchar("provider", { length: 100 }).notNull(),
    sourceUrl: text("source_url").notNull(),
    sourceTier: sourceTierEnum("source_tier")
      .notNull()
      .default("TIER_2_SECONDARY"),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("UNVERIFIED"),
    claimClassification: claimClassificationEnum("claim_classification")
      .notNull()
      .default("UNKNOWN"),
    confidenceLevel: confidenceLevelEnum("confidence_level")
      .notNull()
      .default("LOW"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: varchar("verified_by", { length: 128 }),
    evidenceExcerpt: text("evidence_excerpt"),
    ...timestampsColumns,
  },
  (table) => [
    check(
      "chk_pro_match_sources_provider_not_blank",
      sql`length(trim(${table.provider})) > 0`,
    ),
    check(
      "chk_pro_match_sources_url_not_blank",
      sql`length(trim(${table.sourceUrl})) > 0`,
    ),
    index("idx_pro_match_sources_match").on(table.proMatchId),
    index("idx_pro_match_sources_player_build").on(table.playerBuildId),
    index("idx_pro_match_sources_provider_status").on(
      table.provider,
      table.verificationStatus,
    ),
    index("idx_pro_match_sources_match_url").on(
      table.proMatchId,
      table.sourceUrl,
    ),
  ],
);

export type ProMatchRow = typeof proMatches.$inferSelect;
export type NewProMatchRow = typeof proMatches.$inferInsert;
export type ProMatchPlayerBuildRow = typeof proMatchPlayerBuilds.$inferSelect;
export type NewProMatchPlayerBuildRow =
  typeof proMatchPlayerBuilds.$inferInsert;
export type ProMatchBuildItemRow = typeof proMatchBuildItems.$inferSelect;
export type NewProMatchBuildItemRow = typeof proMatchBuildItems.$inferInsert;
export type ProMatchSourceRow = typeof proMatchSources.$inferSelect;
export type NewProMatchSourceRow = typeof proMatchSources.$inferInsert;
