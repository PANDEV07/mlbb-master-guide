import {
  foreignKey,
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  entityTypeEnum,
  serverTypeEnum,
  verificationStatusEnum,
} from "./enums";
import { knowledgeEntities } from "./knowledge_entities";
import { patchVersions } from "./patch_versions";
import { timestampsColumns } from "./conventions";
import type { BuildProfile } from "@/features/builds";

export const heroBuilds = pgTable(
  "hero_builds",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    heroEntityId: uuid("hero_entity_id").notNull(),
    heroEntityType: entityTypeEnum("hero_entity_type")
      .notNull()
      .default("hero"),

    patchVersionId: uuid("patch_version_id").notNull(),
    serverType: serverTypeEnum("server_type").notNull(),

    profile: jsonb("profile").$type<BuildProfile>().notNull(),

    status: varchar("status", { length: 24 })
      .notNull()
      .default("DRAFT"),

    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("UNVERIFIED"),

    publishedAt: timestamp("published_at", { withTimezone: true }),

    ...timestampsColumns,
  },
  (table) => [
    foreignKey({
      columns: [table.heroEntityId, table.heroEntityType],
      foreignColumns: [
        knowledgeEntities.entityId,
        knowledgeEntities.entityType,
      ],
      name: "fk_hero_builds_hero",
    }),

    foreignKey({
      columns: [table.patchVersionId, table.serverType],
      foreignColumns: [patchVersions.id, patchVersions.serverType],
      name: "fk_hero_builds_patch",
    }),

    index("idx_hero_builds_hero").on(table.heroEntityId),
    index("idx_hero_builds_patch_server").on(
      table.patchVersionId,
      table.serverType,
    ),
    index("idx_hero_builds_status").on(table.status),
  ],
);