import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  text,
  date,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { serverTypeEnum } from "./enums";

export const patchVersions = pgTable(
  "patch_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    versionCode: varchar("version_code", { length: 32 }).notNull(),
    versionOrder: integer("version_order").notNull(),
    serverType: serverTypeEnum("server_type")
      .default("ORIGINAL_SERVER")
      .notNull(),
    seasonLabel: varchar("season_label", { length: 64 }),
    releaseDate: date("release_date"),
    isCurrentLive: boolean("is_current_live").default(false).notNull(),
    notesSummary: text("notes_summary"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_patch_versions_version_code_server_type").on(
      table.versionCode,
      table.serverType,
    ),
    uniqueIndex("uq_patch_versions_version_order_server_type").on(
      table.versionOrder,
      table.serverType,
    ),
    uniqueIndex("uq_patch_versions_live_per_server")
      .on(table.serverType)
      .where(sql`${table.isCurrentLive} = true`),
    uniqueIndex("uq_patch_versions_id_server_type").on(
      table.id,
      table.serverType,
    ),
  ],
);
