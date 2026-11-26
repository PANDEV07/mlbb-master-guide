import { pgTable, uuid, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { entityTypeEnum } from "./enums";
import { timestampsColumns } from "./conventions";

/**
 * KnowledgeEntity registry – central identity for all domain objects.
 * Matches the frozen Architecture (Phase 2B.1) and Implementation Plan.
 */
export const knowledgeEntities = pgTable(
  "knowledge_entities",
  {
    // Primary surrogate UUID
    entityId: uuid("entity_id").defaultRandom().primaryKey(),
    // Domain discriminator – must be one of the defined enum values
    entityType: entityTypeEnum("entity_type").notNull(),
    // Optional JSONB metadata for extensibility
    metadata: jsonb("metadata"),
    // Standard audit timestamps (UTC)
    ...timestampsColumns,
  },
  (table) => [
    // Index on discriminator for fast lookup per domain (hero, item, …)
    index("idx_knowledge_entities_type").on(table.entityType),
    // Composite unique constraint (entity_id, entity_type)
    uniqueIndex("uq_knowledge_entities_id_type").on(table.entityId, table.entityType),
  ]
);
