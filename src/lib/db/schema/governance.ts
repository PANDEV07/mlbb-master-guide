import {
    boolean,
    index,
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
    evidenceStanceEnum,
    patchChangeTypeEnum,
    sourceTierEnum,
    verificationStatusEnum,
} from "./enums";
import { patchVersions } from "./patch_versions";

/**
 * Catatan perubahan terstruktur per patch.
 */
export const patchChanges = pgTable(
    "patch_changes",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        patchVersionId: uuid("patch_version_id")
            .notNull()
            .references(() => patchVersions.id, { onDelete: "restrict" }),
        targetEntityType: varchar("target_entity_type", { length: 64 }).notNull(),
        targetEntityId: uuid("target_entity_id"),
        targetEntitySlug: varchar("target_entity_slug", { length: 128 }),
        changeType: patchChangeTypeEnum("change_type").notNull(),
        attributeName: varchar("attribute_name", { length: 128 }),
        previousValue: text("previous_value"),
        newValue: text("new_value"),
        summary: text("summary").notNull(),
        ...timestampsColumns,
    },
    (table) => [
        index("idx_patch_changes_patch_version_id").on(table.patchVersionId),
        index("idx_patch_changes_target_entity").on(
            table.targetEntityType,
            table.targetEntityId
        ),
    ]
);

/**
 * Registry sumber rujukan resmi, sekunder, analitis, dan komunitas.
 */
export const sources = pgTable(
    "sources",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        name: varchar("name", { length: 160 }).notNull(),
        domain: varchar("domain", { length: 160 }).notNull(),
        baseUrl: text("base_url").notNull(),
        sourceTier: sourceTierEnum("source_tier").notNull(),
        sourceCategory: varchar("source_category", { length: 64 }).notNull(),
        reliabilityNotes: text("reliability_notes"),
        isActive: boolean("is_active").notNull().default(true),
        ...timestampsColumns,
    },
    (table) => [
        uniqueIndex("uq_sources_name_domain").on(table.name, table.domain),
        index("idx_sources_source_tier").on(table.sourceTier),
    ]
);

/**
 * Bukti granular per entitas dan aspek.
 */
export const entityEvidences = pgTable(
    "entity_evidences",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        entityType: varchar("entity_type", { length: 64 }).notNull(),
        entityId: uuid("entity_id").notNull(),
        aspectName: varchar("aspect_name", { length: 64 })
            .notNull()
            .default("GENERAL"),
        sourceId: uuid("source_id")
            .notNull()
            .references(() => sources.id, { onDelete: "restrict" }),
        sourceUrl: text("source_url"),
        claimClassification: claimClassificationEnum("claim_classification")
            .notNull()
            .default("UNKNOWN"),
        verificationStatus: verificationStatusEnum("verification_status")
            .notNull()
            .default("UNVERIFIED"),
        confidenceLevel: confidenceLevelEnum("confidence_level")
            .notNull()
            .default("LOW"),
        stance: evidenceStanceEnum("stance")
            .notNull()
            .default("SUPPORTING"),
        evidenceExcerpt: text("evidence_excerpt"),
        conflictNotes: text("conflict_notes"),
        verifiedBy: varchar("verified_by", { length: 128 }),
        verifiedAt: timestamp("verified_at", { withTimezone: true }),
        patchVersionId: uuid("patch_version_id").references(
            () => patchVersions.id,
            { onDelete: "set null" }
        ),
        ...timestampsColumns,
    },
    (table) => [
        index("idx_entity_evidences_entity").on(table.entityType, table.entityId),
        index("idx_entity_evidences_status").on(table.verificationStatus),
        index("idx_entity_evidences_source_id").on(table.sourceId),
        index("idx_entity_evidences_patch_version_id").on(table.patchVersionId),
    ]
);
