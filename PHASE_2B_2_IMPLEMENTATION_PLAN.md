# PHASE 2B.2 – Core Knowledge Database Implementation Plan (Corrected)

**Purpose** – Provide a migration roadmap that respects the frozen Phase 2B.1 architecture, the implementation constraints, and the updated temporal‑data strategy.

---

## 1. Temporal Data Strategy (Profile Tables)
All versioned *profile* tables (hero, item, emblem, spell, skill) now share a common temporal design.

### 1.1 Common pattern
| Table (example) | Surrogate PK | Foreign key to entity | Temporal columns |
|------------------|--------------|-----------------------|------------------|
| `hero_profile`   | `hero_profile_id` UUID PK | `hero_id` UUID NOT NULL → `hero(hero_id)` | `patch_version` TEXT NOT NULL, `server_version` TEXT NOT NULL, `effective_range` **TSTZRANGE** NOT NULL, `status` TEXT NOT NULL CHECK (status IN ('ACTIVE','EXPERIMENTAL','CANCELLED','REMOVED','REWORKED')) |

### 1.2 Why surrogate PK?
A surrogate key allows **multiple rows** for the same `(hero_id, patch_version, server_version)` with different `effective_range` values (e.g., overlapping experimental periods). The natural key `(hero_id, patch_version, server_version, effective_range)` is not unique because the range can be split.

### 1.3 Exclusion constraint (prevents overlapping ACTIVE intervals)
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- required for GiST on text fields

ALTER TABLE hero_profile ADD CONSTRAINT uq_hero_profile_active_excl EXCLUDE USING gist (
    hero_id WITH =,
    server_version WITH =,
    effective_range WITH &&
) WHERE (status = 'ACTIVE');
```
The same pattern is applied to `item_profile`, `emblem_profile`, `spell_profile`, `skill_profile` (replace column names accordingly).

### 1.4 Status overlap rules
- **ACTIVE** – only one ACTIVE interval per `(entity_id, server_version)` may exist at any point in time. Overlap is prohibited by the exclusion constraint.
- **EXPERIMENTAL** – may overlap with ACTIVE or other EXPERIMENTAL rows; used for future or test patches.
- **CANCELLED** – indicates a profile that was deprecated; overlaps permitted but never selected in reconstruction.
- **REMOVED** – entity removed from the game; kept for audit only.
- **REWORKED** – transitional state; may overlap with ACTIVE or EXPERIMENTAL.

Validation steps therefore **reject** overlapping ACTIVE periods and **accept** overlaps for all other statuses.

---

## 2. KnowledgeEntity Integration (Domain Discriminator)
All domain tables now reference the generic `knowledgeentity` registry.
```sql
CREATE TABLE knowledgeentity (
    entity_id   UUID PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('hero','item','emblem','spell','skill')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  UUID NOT NULL,
    metadata    JSONB
);
```
Domain tables include the FK and keep the discriminator for application‑level validation:
```sql
CREATE TABLE hero (
    hero_id    UUID PRIMARY KEY,
    entity_id  UUID NOT NULL REFERENCES knowledgeentity(entity_id) ON DELETE RESTRICT,
    name       TEXT NOT NULL,
    role       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
The same pattern applies to `item`, `emblem`, `spell`, and `skill`. Cross‑domain references are prevented by **application‑level checks** that compare `entity_type` with the expected type when creating a `knowledgeclaim`.

---

## 3. Claims and Evidence Model
Additional tables complete the evidence graph while allowing both supporting and contradicting evidence.
| Table | Columns (essential) |
|-------|----------------------|
| `knowledgeclaim` | unchanged (see Phase 2B.1) |
| `claimevidence` | `claim_evidence_id` UUID PK, `claim_id` UUID NOT NULL REFERENCES knowledgeclaim(claim_id) ON DELETE RESTRICT, `evidence_type` TEXT NOT NULL CHECK (evidence_type IN ('supporting','contradicting')) |
| `entityevidence` | `entity_evidence_id` UUID PK, `entity_id` UUID NOT NULL REFERENCES knowledgeentity(entity_id) ON DELETE RESTRICT, `source_id` UUID NOT NULL REFERENCES sources(source_id), `confidence` NUMERIC CHECK (confidence BETWEEN 0 AND 1), `recorded_at` TIMESTAMPTZ NOT NULL DEFAULT now() |
| `claimevidence_entityevidence` | `claim_evidence_id` UUID NOT NULL REFERENCES claimevidence(claim_evidence_id) ON DELETE RESTRICT, `entity_evidence_id` UUID NOT NULL REFERENCES entityevidence(entity_evidence_id) ON DELETE RESTRICT, PRIMARY KEY (claim_evidence_id, entity_evidence_id) |

**Key semantics**
- A claim may have many `claimevidence` rows, each linked to one or more `entityevidence` rows.
- The `evidence_type` column differentiates *supporting* from *contradicting* evidence.
- Verification status of a claim **does not auto‑upgrade** based on evidence verification; status changes must be recorded explicitly and are captured in `claimverificationhistory`, which is an **append‑only** table enforced by an `ON DELETE RESTRICT` trigger.

- The `claimverificationhistory` table remains unchanged from Phase 2B.1 and continues to provide an immutable audit trail for all claim status transitions.

---

## 4. Recipe DAG Transaction Safety (Clarified)
### 4.1 Procedure skeleton (common for INSERT/UPDATE/DELETE)
```plpgsql
CREATE OR REPLACE FUNCTION mutate_item_component(
    p_op               TEXT,   -- 'INSERT','UPDATE','DELETE'
    p_parent_item_id   UUID,
    p_child_item_id    UUID,
    p_recipe_version_id UUID,
    p_patch            TEXT,
    p_server           TEXT,
    p_ts               TIMESTAMPTZ,
    p_quantity         NUMERIC DEFAULT NULL,
    p_effective_range  TSTZRANGE DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_cycle BOOLEAN;
    v_depth BOOLEAN;
BEGIN
    -- Begin transaction is implicit in the caller context.
    PERFORM pg_advisory_xact_lock(-9223372036854775808);  -- global DAG lock

    -- Validate using the deterministic cycle‑detection function (Phase 2B.1.17)
    SELECT cycle_found, depth_limit_reached INTO v_cycle, v_depth
    FROM detect_cycle(
        p_parent_item_id, p_child_item_id, p_patch, p_server, p_ts
    );

    IF v_cycle THEN
        RAISE EXCEPTION 'Recipe DAG cycle detected (edge % → %)', p_parent_item_id, p_child_item_id USING ERRCODE = 'RG001';
    END IF;
    IF v_depth THEN
        RAISE EXCEPTION 'Depth limit reached – traversal incomplete' USING ERRCODE = 'DP001';
    END IF;

    -- Perform the actual mutation
    IF p_op = 'INSERT' THEN
        INSERT INTO item_component_relation(
            component_relation_id, recipe_version_id, component_item_id,
            quantity, effective_range, server_version, patch_version
        ) VALUES (gen_random_uuid(), p_recipe_version_id, p_child_item_id,
                p_quantity, p_effective_range, p_server, p_patch);
    ELSIF p_op = 'UPDATE' THEN
        UPDATE item_component_relation
           SET component_item_id = p_child_item_id,
               quantity = p_quantity,
               effective_range = p_effective_range,
               server_version = p_server,
               patch_version = p_patch
         WHERE component_relation_id = p_recipe_version_id;  -- assumes caller supplies correct id
    ELSIF p_op = 'DELETE' THEN
        DELETE FROM item_component_relation WHERE component_relation_id = p_recipe_version_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
### 4.2 Audit of failures
- When the function raises an exception, **the whole transaction rolls back**, including any attempt to write to an audit table inside the same transaction.
- The application layer must catch the exception and, in a **separate transaction**, insert a row into the existing `dag_mutation_audit` (or a similarly named audit table defined in Phase 2B.1) indicating the failure and the `INCOMPLETE` status.
- No new audit table is introduced here; the plan merely documents the required two‑step pattern.

---

## 5. Build Architecture (Expanded)
| Table | Primary Key | Essential Columns |
|-------|-------------|-------------------|
| `build` | `build_id` UUID PK | `user_id` UUID NOT NULL, `patch_version` TEXT NOT NULL, `server_version` TEXT NOT NULL, `created_at` TIMESTAMPTZ NOT NULL DEFAULT now(), FK composite to `patchversion` |
| `buildversion` | `build_version_id` UUID PK | `build_id` UUID NOT NULL REFERENCES build(build_id) ON DELETE RESTRICT, `patch_version` TEXT NOT NULL, `server_version` TEXT NOT NULL, `description` TEXT, `created_at` TIMESTAMPTZ NOT NULL DEFAULT now(), FK composite to `patchversion` |
| `buildcontext` | `build_context_id` UUID PK | `build_version_id` UUID NOT NULL REFERENCES buildversion(build_version_id) ON DELETE RESTRICT, `context_key` TEXT NOT NULL, `context_value` TEXT NOT NULL |
| `builditem` | `build_item_id` UUID PK | `build_version_id` UUID NOT NULL REFERENCES buildversion(build_version_id) ON DELETE RESTRICT, `item_id` UUID NOT NULL REFERENCES item(item_id), `slot` TEXT NOT NULL |
| `alternativeitem` | `alt_item_id` UUID PK | `build_item_id` UUID NOT NULL REFERENCES builditem(build_item_id) ON DELETE RESTRICT, `alternative_item_id` UUID NOT NULL REFERENCES item(item_id) |
| `buildreasoning` | `build_reasoning_id` UUID PK | `build_version_id` UUID NOT NULL REFERENCES buildversion(build_version_id) ON DELETE RESTRICT, `reason_text` TEXT NOT NULL |
| `buildreasoningclaim` | `br_claim_id` UUID PK | `build_reasoning_id` UUID NOT NULL REFERENCES buildreasoning(build_reasoning_id) ON DELETE RESTRICT, `claim_id` UUID NOT NULL REFERENCES knowledgeclaim(claim_id) ON DELETE RESTRICT |

No authentication tables are added; the `user_id` column can reference an external identity provider if needed later.

---

## 6. Competitive Intelligence (Full Scope)
The following tables constitute the **initial** competitive‑intelligence layer. Tables marked **DEFERRED** are part of the roadmap but not required for the first release.
| Table | Essential Columns | Status |
|-------|-------------------|--------|
| `match` | `match_id` UUID PK, `patch_version` TEXT, `server_version` TEXT, `effective_range` TSTZRANGE, `metadata` JSONB | **IMPLEMENTATION_REQUIRED** |
| `matchgame` | `match_game_id` UUID PK, `match_id` UUID NOT NULL REFERENCES "match"(match_id), `game_number` INT NOT NULL, `team_a_id` UUID NOT NULL, `team_b_id` UUID NOT NULL, `result` TEXT, `duration_seconds` INT | **IMPLEMENTATION_REQUIRED** |
| `draftaction` | `draft_action_id` UUID PK, `match_game_id` UUID NOT NULL REFERENCES matchgame(match_game_id), `player_id` UUID NOT NULL, `action_type` TEXT NOT NULL, `hero_id` UUID NOT NULL REFERENCES hero(hero_id), `timestamp` TIMESTAMPTZ NOT NULL | **IMPLEMENTATION_REQUIRED** |
| `team` | `team_id` UUID PK, `name` TEXT NOT NULL, `roster_id` UUID NOT NULL, `patch_version` TEXT, `server_version` TEXT | **DEFERRED** |
| `player` | `player_id` UUID PK, `summoner_name` TEXT NOT NULL, `region` TEXT, `account_id` UUID | **DEFERRED** |
| `roster` | `roster_id` UUID PK, `team_id` UUID NOT NULL REFERENCES team(team_id), `player_id` UUID NOT NULL REFERENCES player(player_id) | **DEFERRED** |
| `observation` | `observation_id` UUID PK, `match_id` UUID NOT NULL REFERENCES "match"(match_id), `observation_type` TEXT NOT NULL, `detail` JSONB, `recorded_at` TIMESTAMPTZ NOT NULL | **IMPLEMENTATION_REQUIRED** |
| `strategicinterpretation` | `interpretation_id` UUID PK, `observation_id` UUID NOT NULL REFERENCES observation(observation_id), `insight` TEXT NOT NULL, `confidence` NUMERIC CHECK (confidence BETWEEN 0 AND 1) | **IMPLEMENTATION_REQUIRED** |
| `protoranked_adaptation` | `proto_id` UUID PK, `interpretation_id` UUID NOT NULL REFERENCES strategicinterpretation(interpretation_id), `suggested_change` TEXT NOT NULL | **DEFERRED** |
All tables reference the composite FK `(patch_version, server_version)` from `patchversion` (or the existing `patch_versions` table).

---

## 7. Supabase Compatibility & Phase 2A Foundations
- The existing Phase 2A tables are **not recreated**: `patch_versions`, `patch_changes`, `sources`, `entity_evidences` already exist.
- The migration plan **uses** those tables directly (e.g., FK to `patch_versions(patch_version, server_version)`).
- The only **schema change** required on the platform is the one‑time enabling of the `btree_gist` extension for exclusion constraints.
- No changes to RLS, grants, or role definitions are introduced here; they remain as defined in Phase 2A.

---

## 8. Migration Order & Dependency Graph (Final)
```
1. Enable extension btree_gist (once, no data change).
2. patchversion (if not already present) – ensure UNIQUE(patch_version, server_version).
3. knowledgeentity.
4. knowledgeclaim, claimverificationhistory, claimevidence, entityevidence, claimevidence_entityevidence.
5. Core catalogs: hero, item, emblem, spell, skill (each FK to knowledgeentity).
6. Profile tables with surrogate PKs and exclusion constraints: hero_profile, item_profile, emblem_profile, spell_profile, skill_profile.
7. Item recipe infrastructure: itemrecipeversion, itemcomponentrelation (requires patchversion & item).
8. Build subsystem: build, buildversion, buildcontext, builditem, alternativeitem, buildreasoning, buildreasoningclaim.
9. Competitive core (implementation‑required): match, matchgame, draftaction, observation, strategicinterpretation.
10. Matchup / Counter / Synergy (remain from Phase 2B.1).
11. Deferred competitive tables (team, player, roster, protoranked_adaptation) – can be added in a later migration.
```
Each step corresponds to **one migration file** (or Supabase “SQL migration” batch) to keep transactions small and allow independent rollback.

---

## 9. Validation Requirements per Migration Step
| Step | Test Cases (must pass) | Acceptance Criteria |
|------|------------------------|----------------------|
| 1 – Extension | `CREATE EXTENSION IF NOT EXISTS btree_gist;` succeeds. | Extension available; subsequent exclusion constraints compile. |
| 2 – patchversion | Insert valid rows, attempt duplicate `(patch_version, server_version)`, verify FK rejects unknown combos. | Primary key and UNIQUE behave correctly; FK integrity enforced. |
| 3 – knowledgeentity | Insert entities of each allowed `entity_type`; attempt invalid type – fails at check constraint. | Entities stored, domain tables reference correct IDs. |
| 4 – claims/evidence | Create claim, attach supporting and contradicting evidence, verify `claimverificationhistory` trigger populates `reviewer_source` and non‑empty `failure_reason`. | Audit rows recorded, `failure_reason` never NULL. |
| 5 – catalogs | Simple inserts, uniqueness of `name` where required, FK to `knowledgeentity`. | No constraint violations. |
| 6 – profiles (temporal) | Insert ACTIVE profile for a hero; attempt second ACTIVE overlapping interval – must FAIL. Insert EXPERIMENTAL overlapping ACTIVE – must PASS. Query active profile with `effective_range @> now()` returns exactly one row per entity. | Exclusion works; temporal queries correct. |
| 7 – Recipe DAG | Unit‑tests for self‑cycle, indirect cycle, acyclic path, depth‑limit. Verify that on cycle or depth‑limit the transaction rolls back and no partial rows remain. Verify that failure is logged in a separate transaction. | All tests pass, no partial data persisted. |
| 8 – Builds | Insert build, then buildversion, then related items; attempt delete of build with existing versions – must FAIL (ON DELETE RESTRICT). | FK hierarchy enforced, mandatory buildversion present. |
| 9 – Competitive core | Insert match with active patch, ensure FK to heroes and patchversion; query only active matches (`effective_range @> now()`). | Data visible per patch, FK integrity works. |
| 10 – Matchup/Counter/Synergy | Existing definitions from Phase 2B.1 are validated (FK to hero and patchversion). | No violations. |
| 11 – Deferred tables (if added later) | Same pattern; not required for initial launch. | – |

---

## 10. Overall Acceptance Criteria
- All tables are created **exactly** as defined (column types, PK/FK/UNIQUE/CHECK/EXCLUSION). 
- No migration fails because of missing `(patch_version, server_version)` rows.
- Advisory‑lock‑protected mutation procedures compile without syntax errors.
- Comprehensive unit‑test suite (pgTAP or Supabase test runner) passes **100 %** for the mandatory tests above.
- Documentation (this plan) records the **implementation constraints**: advisory lock, depth‑limit handling, two‑step audit on failure, temporal exclusion, and application‑level trust for reviewer metadata.

---

*Prepared by Antigravity agent (Phase 2B.2 implementation plan correction).*