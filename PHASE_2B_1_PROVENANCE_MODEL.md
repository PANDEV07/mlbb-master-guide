# PHASE 2B.1 – Provenance Model

## Core Tables
| Table | Primary Key | Description |
|-------|-------------|-------------|
| **Source** | `source_id` (UUID) | Stable definition of a data source (e.g., video, article, database dump). Includes `type` (VIDEO, ARTICLE, DATASET), `url`, `title`, `accessed_at`.
| **Evidence** | `evidence_id` (UUID) | Concrete artifact derived from a `Source`. Stores `source_id` (FK), `retrieved_at`, `published_at`, `locator` (e.g., `video_timestamp=00:12:34`, `pdf_page=42`), `excerpt` (optional), `content_hash`.
| **KnowledgeClaim** | `claim_id` (UUID) | Statement about an entity attribute. Fields: `entity_type`, `entity_id` (FK to `KnowledgeEntity.entity_id`), `attribute_key`, `value`, `verification_status` (enum: `VERIFIED`, `UNVERIFIED`, `CONFLICTED`, `OUTDATED`, `NOT_FOUND`, `NOT_RESEARCHED`), `confidence_level` (`HIGH`, `MEDIUM`, `LOW`).
| **ClaimEvidence** | Composite PK (`claim_id`,`evidence_id`) | Junction linking a claim to one or more pieces of evidence. Includes `stance` enum (`SUPPORTING`, `CONTRADICTING`, `INCONCLUSIVE`).

## Relationships & Constraints
- `Evidence.source_id → Source.source_id` (FK, `ON DELETE RESTRICT`).
- `KnowledgeClaim.entity_id → KnowledgeEntity.entity_id` (FK, ensures claim references a valid registry entry).
- `ClaimEvidence.claim_id → KnowledgeClaim.claim_id` and `ClaimEvidence.evidence_id → Evidence.evidence_id` (FKs).
- `ClaimEvidence.stance` captures the nature of the relationship; a single evidence can appear with different stances across multiple claims.

## Example Data Flow
1. **Source creation**: A video of a professional match is added as a `Source` (type=VIDEO, url=..., title="MLBB Worlds 2024 Finals").
2. **Evidence extraction**: An analyst extracts a clip at timestamp `00:15:20` showing a hero using a skill; this becomes an `Evidence` record with `locator='00:15:20'`, `content_hash='a1b2c3…'`.
3. **Claim authoring**: The analyst creates a `KnowledgeClaim` that `HeroProfile(Hero=Ezreal, Patch=2.2.23).skill_damage` equals `120%`. The claim links to the `KnowledgeEntity` for Ezreal and sets `verification_status = UNVERIFIED` initially.
4. **Linking evidence**: The claim is linked to the evidence via `ClaimEvidence` with `stance = SUPPORTING`.
5. **Contradiction**: Another piece of evidence (different video) suggests the damage is `115%`. A new `KnowledgeClaim` (or same claim with additional evidence) is linked with `stance = CONTRADICTING`, and the `verification_status` may become `CONFLICTED` until resolved.

## Verification Workflow (Conceptual)
- **Reviewer** examines all evidence linked to a claim, sets `verification_status` and `confidence_level`.
- **Status transitions**:
  - `UNVERIFIED` → `VERIFIED` when all supporting evidence is accepted and no contradictions remain.
  - `VERIFIED` → `OUTDATED` when the underlying `HeroProfile` or `ItemProfile` changes in a later patch.
  - `CONFLICTED` remains until a resolution (e.g., discard one evidence, update claim).
- **Audit trail** is maintained by storing `reviewer_id` and `reviewed_at` on the claim.

## Orphan Prevention
- Deleting a `Source` is prohibited while any `Evidence` exists (`ON DELETE RESTRICT`).
- Deleting an `Evidence` cascades to remove its rows in `ClaimEvidence`.
- Deleting a `KnowledgeEntity` is only allowed after all dependent `KnowledgeClaim` rows are removed, ensuring no orphan claims.

## Status Enum Definition
```sql
CREATE TYPE verification_status AS ENUM (
  'VERIFIED',
  'UNVERIFIED',
  'CONFLICTED',
  'OUTDATED',
  'NOT_FOUND',
  'NOT_RESEARCHED'
);
```

The model aligns with the project’s **SOURCE_VERIFICATION_POLICY.md** and supports explainable, auditable knowledge.
