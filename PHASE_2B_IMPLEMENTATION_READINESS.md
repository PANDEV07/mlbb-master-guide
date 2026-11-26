# PHASE 2B.2 – Implementation Readiness Report

## 1. Status of Phase 2B.1 Freeze
- The **Architecture Freeze** document (`PHASE_2B_1_ARCHITECTURE_FREEZE.md`) is present and unchanged.
- All decisions listed there are marked *APPROVED_WITH_ACCEPTED_RISKS* or *APPROVED* and will not be altered.

## 2. Status of Phase 2B.2 Implementation Plan
- `PHASE_2B_2_IMPLEMENTATION_PLAN.md` exists and contains the corrected design (temporal profiles, KnowledgeEntity registry, claim‑evidence model, DAG mutation, build subsystem, competitive‑intelligence scope, migration order, validation matrix, acceptance criteria).
- The only edit performed in this round was an explicit clarification that `claimverificationhistory` is **append‑only** (`ON DELETE RESTRICT` trigger) and that claim status changes must be recorded manually.

## 3. Final Migration Order (re‑stated)
```
1. Enable extension `btree_gist` (one‑time).
2. Ensure `patch_versions` table provides a unique `(patch_version, server_version)` pair – satisfied by the existing unique indexes on `(versionCode, serverType)` and `(versionOrder, serverType)`.
3. Create `knowledgeentity`.
4. Create claim‑related tables: `knowledgeclaim`, `claimverificationhistory`, `claimevidence`, `entityevidence` (mapped to existing `entity_evidences`), `claimevidence_entityevidence`.
5. Core catalogs: `hero`, `item`, `emblem`, `spell`, `skill` (FK to `knowledgeentity`).
6. Profile tables with surrogate PKs and exclusion constraints (`hero_profile`, `item_profile`, `emblem_profile`, `spell_profile`, `skill_profile`).
7. Recipe infrastructure: `itemrecipeversion`, `itemcomponentrelation`.
8. Build subsystem: `build`, `buildversion`, `buildcontext`, `builditem`, `alternativeitem`, `buildreasoning`, `buildreasoningclaim`.
9. Competitive‑intelligence core (implementation‑required): `match`, `matchgame`, `draftaction`, `observation`, `strategicinterpretation`.
10. Existing Phase 2B.1 tables for matchup/counter/synergy are validated.
11. Deferred competitive tables (`team`, `player`, `roster`, `protoranked_adaptation`) can be added later.
```
Each step is intended to be a single migration file to keep transactions small.

## 4. Phase 2A Tables Already Present
- `patch_versions` – defined in `src/lib/db/schema/governance.ts`.
- `patch_changes` – defined in the same file.
- `sources` – defined in the same file.
- `entity_evidences` – defined (note the plural table name; implementation plan maps to this existing table).

## 5. Dependencies & Constraints to Verify Before First Migration
| Dependency | Current State | Action Needed |
|------------|---------------|----------------|
| `btree_gist` extension | Not yet enabled – required for exclusion constraints. | Ensure the migration step **1** runs with `CREATE EXTENSION IF NOT EXISTS btree_gist;` before any profile tables are created. |
| Composite uniqueness `(patch_version, server_version)` | Enforced via unique indexes on `patch_versions.versionCode + serverType` and `patch_versions.versionOrder + serverType`. | No additional index required; document this mapping. |
| Foreign keys to `patch_versions` | All future tables will reference `patch_versions.id` (PK) and the `server_type` column via the composite FK pattern. | Verify that migration scripts use `(patch_version_id, server_type)` correctly.
| Re‑use of `entity_evidences` | Table exists with PK `id` and columns matching the intended `entityevidence` definition (including `stance`). | Implementation plan must reference `entity_evidences` (plural) rather than a new `entityevidence`. |
| `knowledgeentity` not yet present | Will be created in migration step 3. | Ensure no existing object (view, function) collides with that name. |

## 6. Mandatory SQL Tests (as described in the Implementation Plan)
1. **Extension** – `CREATE EXTENSION IF NOT EXISTS btree_gist;` succeeds.
2. **PatchVersion uniqueness** – Attempt duplicate `(versionCode, serverType)`; expect failure.
3. **KnowledgeEntity** – Insert each allowed `entity_type`; reject invalid type.
4. **Claims/Evidence** – Create claim, attach supporting & contradicting evidence; verify `claimverificationhistory` rows are created with non‑null `reviewer_source` and `failure_reason`.
5. **Catalog inserts** – Simple inserts respecting FK to `knowledgeentity`.
6. **Temporal profiles** – Insert ACTIVE profile, then overlapping ACTIVE – expect rejection; overlapping EXPERIMENTAL – expect success; query active profile with `effective_range @> now()` returns a single row.
7. **Recipe DAG** – Unit tests for self‑cycle, indirect cycle, acyclic path, depth‑limit; ensure transaction rolls back on failure and audit entry is written in a separate transaction.
8. **Build hierarchy** – Insert build → version → items; attempt delete of parent with children – expect FK restriction.
9. **Competitive core** – Insert match referencing existing heroes and a valid `patch_version`; query only active matches (`effective_range @> now()`).
10. **Deferred tables** – No tests required for initial release.

## 7. Security Prerequisites (Supabase Managed PostgreSQL)
- **Migration credentials** – Must use an administrative role (e.g., `service_role`) that has `CREATE`, `ALTER`, and `DROP` privileges but is **not** the public `anon` role.
- **Least‑privilege runtime role** – After migration, application services should connect using a role limited to `SELECT` on read tables and `EXECUTE` on privileged functions (`mutate_item_component`, claim‑audit functions, etc.).
- **RLS** – Review existing Row‑Level Security policies on Phase 2A tables; ensure new tables inherit appropriate policies or have explicit RLS definitions before they become API‑exposed.
- **Grant hygiene** – No new grants are added in this readiness step; they will be applied in later migration scripts.
- **Credential handling** – Migration scripts must retrieve `DATABASE_URL` from a secure secret store; never hard‑code credentials.

## 8. Known Accepted Risks (still open)
- **R‑013** – Trigger disabling before bulk `COPY`. *Mitigation*: Operational policy & audit logs.
- **R‑014** – Advisory‑lock contention. *Mitigation*: Monitoring; future sharding.
- **R‑015** – Reviewer metadata may be missing for system changes. *Mitigation*: `reviewer_source = 'system'` recorded.
- **R‑016** – Historical pricing engine not materialised. *Mitigation*: Marked **NOT_VERIFIABLE**; will be built later.
- **R‑017 / R‑021** – Depth‑limit may hide deep cycles; `INCOMPLETE` status must be treated as potential risk.
- **R‑018** – Superuser can drop append‑only triggers. *Mitigation*: Policy & audit.
- **R‑019** – Composite UNIQUE may be missing if duplicate patch/server rows exist today. *Mitigation*: Data‑quality audit before migration step 2.
- **R‑020** – GUC `my.reviewer` trust relies on backend control. *Mitigation*: Enforce via application code.
- **R‑022** – Stale `recipe_version_id` usage. *Mitigation*: Updated DAG logic.
- **R‑023** – Mandatory `build_version` removal would break FK. *Mitigation*: Ensure FK is `ON DELETE RESTRICT`.

## 9. Go / No‑Go Decision
- **Readiness of documentation** – **GO**. The readiness document has been created and references all required artifacts.
- **Permission to start first migration** – **GO**, **provided** that the following pre‑checks are performed **before** executing migration step 1:
  1. Verify that the deployment environment can run `CREATE EXTENSION btree_gist;` with the admin role.
  2. Run a quick data‑quality script to confirm there are **no duplicate** `(versionCode, serverType)` or `(versionOrder, serverType)` rows in `patch_versions` (addresses R‑019).
  3. Confirm that the `entity_evidences` table name is used consistently in migration scripts (avoids duplicate `entityevidence`).
- **Remaining blockers** – None that prevent the **first migration** (extension enablement and data‑quality audit are preparatory but not blockers if they pass). All other design elements are documented and validated.

---
*Prepared by Antigravity agent (Phase 2B.2 readiness check).*