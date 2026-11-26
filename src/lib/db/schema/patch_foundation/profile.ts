// src/lib/db/schema/patch_foundation/profile.ts
import { pgTable, uuid, jsonb, timestamp, foreignKey, customType } from 'drizzle-orm/pg-core';
import { entityTypeEnum, serverTypeEnum } from '../enums';
import { knowledgeEntities } from '../knowledge_entities';
import { patchVersions } from '../patch_versions';

// Helper for tstzrange type (PostgreSQL range of timestamps with time zone)
const tstzrange = customType<{
  data: string;
  driverData: string;
}>({
  dataType: () => "tstzrange",
});

/**
 * profiles table stores perâ€‘entity, perâ€‘server profiling information.
 * References:
 *   - knowledge_entities (entity_id, entity_type)
 *   - patch_versions (id, server_type)
 * ON DELETE RESTRICT is enforced in the SQL migration.
 * Exclusion constraint (defined in migration 0004) prevents overlapping effective_range.
 */
export const profiles = pgTable(
  'profiles',
  {
    // Primary key â€“ UUID
    id: uuid('id').defaultRandom().primaryKey(),
    // Composite reference to knowledge_entities
    entityId: uuid('entity_id').notNull(),
    entityType: entityTypeEnum('entity_type').notNull(),
    // Reference to patch_versions
    patchVersionId: uuid('patch_version_id').notNull(),
    serverType: serverTypeEnum('server_type').notNull(),
    // Effective time range
    effectiveRange: tstzrange('effective_range').notNull(),
    // JSON payload
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // FK to knowledge_entities (entity_id, entity_type)
    fkKnowledgeEntity: foreignKey({
      columns: [table.entityId, table.entityType],
      foreignColumns: [knowledgeEntities.entityId, knowledgeEntities.entityType],
      name: 'fk_profiles_knowledge_entities',
    }),
    // FK to patch_versions (id, server_type)
    fkPatchVersion: foreignKey({
      columns: [table.patchVersionId, table.serverType],
      foreignColumns: [patchVersions.id, patchVersions.serverType],
      name: 'fk_profiles_patch_versions',
    }),
  })
);

// NOTE: Unique index removed; exclusion constraint handled in migration 0004_patch_foundation.sql.

