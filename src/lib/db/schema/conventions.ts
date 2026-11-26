import { timestamp, varchar } from "drizzle-orm/pg-core";
import {
  claimClassificationEnum,
  confidenceLevelEnum,
  verificationStatusEnum,
} from "./enums";

/**
 * Standar timestamp audit wajib pada seluruh tabel (UTC-safe timestamptz).
 */
export const timestampsColumns = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/**
 * Kolom governance Lapis 1 tersemat untuk entitas pengetahuan utama (Phase 2B+).
 * Referensi patch_version_id didefinisikan eksplisit pada masing-masing tabel agar FK jelas.
 */
export const embeddedGovernanceColumns = {
  claimClassification: claimClassificationEnum("claim_classification")
    .notNull()
    .default("UNKNOWN"),
  verificationStatus: verificationStatusEnum("verification_status")
    .notNull()
    .default("NOT_RESEARCHED"),
  confidenceLevel: confidenceLevelEnum("confidence_level").notNull().default("LOW"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: varchar("verified_by", { length: 128 }),
};
