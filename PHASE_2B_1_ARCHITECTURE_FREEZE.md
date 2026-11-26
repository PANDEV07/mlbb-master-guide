# PHASE 2B.1 – Architecture Freeze

## 1. Approved Architecture Decisions
| # | Decision | Status |
|---|----------|--------|
| A1 | Use **item_id** as the graph node for the Recipe DAG. | **APPROVED_WITH_ACCEPTED_RISKS** |
| A2 | `PatchVersion` remains the **primary key**; a composite `UNIQUE(patch_version, server_version)` is defined for FK consumers. | **APPROVED_WITH_ACCEPTED_RISKS** |
| A3 | `ClaimVerificationHistory` is **append‑only** with `ON DELETE RESTRICT` and protected by `SECURITY DEFINER` trigger. | **APPROVED_WITH_ACCEPTED_RISKS** |
| A4 | Reviewer identity is trusted **only** when set by the backend service (`api_user`). This is an **application‑level** control. | **APPROVED_WITH_ACCEPTED_RISKS** |
| A5 | Historical pricing uses the **RecipeUsage / ComponentExpansion** model; root items without a recipe use the leaf `ItemProfile` price directly. | **APPROVED_WITH_ACCEPTED_RISKS** |
| A6 | Temporal model: every versioned entity is scoped by `patch_version`, `server_version` and an `effective_range` (PostgreSQL `tstzrange`). | **APPROVED_WITH_ACCEPTED_RISKS** |
| A7 | Security model: all privileged mutation procedures run as `SECURITY DEFINER` with a **safe `search_path`** and acquire a **global advisory lock** (`-9223372036854775808`). | **APPROVED_WITH_ACCEPTED_RISKS** |
| A8 | All other design decisions from Phase 2B.1 (entity definitions, provenance, competitive intelligence) are **frozen**. | **APPROVED** |

## 2. Database Architecture & Entity Relationships
- **Core entities**: `KnowledgeEntity`, `KnowledgeClaim`, `ClaimVerificationHistory`.
- **Game entities**: `Hero`, `Item`, `ItemProfile`, `ItemRecipeVersion`, `ItemComponentRelation`, `Emblem`, `Spell`, `Skill`, `Build`, `BuildVersion`.
- **Temporal versioning**: `PatchVersion(patch_version PK, server_version, effective_range)`; every versioned table references the composite FK `(patch_version, server_version)`.
- **Provenance**: `KnowledgeEntity` ↔ `KnowledgeClaim` (one‑to‑many); each claim stores `source`, `verification_status`, `reviewer_id`, `reviewer_source`, `failure_reason`.
- **Recipe DAG**: `ItemComponentRelation` edges (`parent_item_id → component_item_id`) derived from the active `ItemRecipeVersion` (filtered by patch/server/effective timestamp).
- **Competitive intelligence**: tables `Matchup`, `Counter`, `Synergy` reference `Hero`/`Item` by IDs and include contextual `patch_version`/`server_version`.

## 3. Temporal Patch/Server Model
- Every mutable entity stores `patch_version` (FK to `PatchVersion.patch_version`) and `server_version` (FK to `PatchVersion.server_version`).
- `effective_range` (`tstzrange`) defines the validity window for a given version. Queries always include `@> now()` to pick the *active* row.
- The composite FK guarantees that a row cannot reference a non‑existent `(patch_version, server_version)` pair.

## 4. KnowledgeEntity & Provenance Architecture
- `KnowledgeEntity(entity_id PK, entity_type, created_at, created_by, ...)`.
- `KnowledgeClaim(claim_id PK, entity_id FK→KnowledgeEntity, verification_status, reviewer_id, reviewer_source, failure_reason, ...)`.
- `ClaimVerificationHistory` stores immutable audit rows with `ON DELETE RESTRICT` and **append‑only** triggers.

## 5. KnowledgeClaim & Evidence Model
- Claims are independent; evidence is not inherited automatically.
- Each claim may link to supporting rows in domain‑specific tables (e.g., a `Hero` claim links to `Hero` row via `entity_id`).
- Verification history records every status transition.

## 6. Hero / Item / Recipe / Build Architecture
- **Hero**: `hero_id PK`, static attributes, linked to `HeroProfile` (patch‑versioned).
- **Item**: `item_id PK`, static meta, linked to `ItemProfile` (patch‑versioned) and `ItemRecipeVersion` (patch‑versioned).
- **Recipe DAG**: `ItemComponentRelation(component_relation_id PK, recipe_version_id FK→ItemRecipeVersion, component_item_id FK→Item, quantity, ...)`.
- **Build**: `Build(build_id PK, user_id, patch_version, server_version, created_at)`; `BuildVersion` links a build to a specific `patch_version`/`server_version`.

## 7. Competitive Intelligence Architecture
- `Matchup(matchup_id PK, hero_a_id FK, hero_b_id FK, patch_version, server_version, win_rate, ...)`.
- `Counter(counter_id PK, attacker_hero_id FK, defender_hero_id FK, ...)`.
- `Synergy(synergy_id PK, hero_a_id FK, hero_b_id FK, ...)`.
- All include temporal FK to `PatchVersion`.

## 8. Security & Access Model
| Object | Owner | Privileges |
|--------|-------|------------|
| Functions / Procedures (DAG mutation, claim audit) | `dag_owner` / `audit_owner` | `EXECUTE` granted to `api_user`; **no direct DML** privileges for other roles. |
| Tables (`ClaimVerificationHistory`, `ItemComponentRelation`, …) | `audit_owner` / `dag_owner` | `INSERT` only via privileged functions; `SELECT` granted to read‑only roles; `UPDATE/DELETE` prohibited (append‑only). |
| GUC `my.reviewer` | Set **only** by backend service `api_user` (application‑level control). |
| Advisory lock | Global lock `-9223372036854775808` acquired in every mutation procedure. |

## 9. Accepted Risks (still open)
- **R‑013**: Administrator may disable triggers before bulk `COPY`. *(OPEN)*
- **R‑014**: Advisory lock contention under heavy concurrency. *(PARTIAL)*
- **R‑015**: Reviewer metadata may be missing for system‑generated changes. *(PARTIAL)*
- **R‑016**: Historical pricing engine exists only as pseudocode. *(NOT_VERIFIABLE)*
- **R‑017**: Depth‑limit may hide deep cycles; `INCOMPLETE` must be reported. *(OPEN)*
- **R‑018**: Superuser can drop append‑only triggers. *(PARTIAL)*
- **R‑019**: Composite UNIQUE may be missing; referential inconsistency risk. *(PARTIAL)*
- **R‑020**: GUC trust relies on application‑level control. *(OPEN)*
- **R‑021**: Root‑item leaf price handling must be verified with numeric examples. *(PARTIAL)*
- **R‑022**: Client code assuming `recipe_version_id` as graph node may become stale. *(OPEN)*
- **R‑023**: Mandatory `build_version` table removal would break FK. *(OPEN)*

## 10. Mandatory Implementation Tests
- **Recipe DAG Cycle Detection**: unit tests for self‑cycle `A→A`, indirect cycle `A→B→C→A`, and acyclic path `A→B→C`. Verify that depth‑limit returns `INCOMPLETE` when `MAX_DEPTH` is reached.
- **ClaimVerificationHistory Trigger**: test that `reviewer_source` and `failure_reason` are populated correctly for:
  - Trusted backend set (`session_user = 'api_user'`).
  - Missing/invalid GUC.
  - Direct `reviewer_id` supplied by non‑trusted role.
- **PatchVersion FK Integrity**: insert rows referencing non‑existent `(patch_version, server_version)` should fail.
- **Historical Pricing Root Item**: confirm that a root item without a recipe but with a valid `ItemProfile.price` yields `TOTAL_PURCHASE_PRICE = price` and no dummy `RecipeUsage` rows.
- **Security Checks**: verify that only `api_user` can execute mutation procedures; other roles receive permission errors.

---
*Document generated by Antigravity agent.*