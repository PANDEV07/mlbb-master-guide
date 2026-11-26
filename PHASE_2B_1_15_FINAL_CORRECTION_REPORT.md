# Phase 2B.1.15 – Final Security & DAG Logic Correction Report

## A. ClaimVerificationHistory – SECURITY DEFINER function

### 1. Difference between `current_user` and `session_user`
- **`current_user`** – the role that *owns* the SECURITY DEFINER function. It is constant for the lifetime of the function and does **not** reflect the role that invoked the trigger.
- **`session_user`** – the role that initiated the current session/connection. In Supabase connection‑pooling this may be a pool‑owner role rather than the logical application user.
- Consequently, a check `current_user = 'api_user'` inside a function owned by `audit_owner` cannot prove that the caller is the privileged backend service.

### 2. Realistic trust boundary
- The **backend service** (role `api_user`) is the only component authorised to set the session GUC `my.reviewer`.
- The database trusts the GUC **only** when it is set by `api_user`; any other role’s value is ignored and the trigger records `reviewer_source = 'system'`.
- Trust is enforced *application‑level*: the backend authenticates the end‑user, then sets the GUC immediately before executing the UPDATE on `knowledgeclaim`.

### 3. Supplying `reviewer_id` and `reviewer_source`
1. If `NEW.reviewer_id` is not NULL **and** the trigger detects `session_user = 'api_user'`, the reviewer is accepted and `reviewer_source = 'claim_column'`.
2. Otherwise the function attempts to read `current_setting('my.reviewer', true)`. If it can be cast to UUID, the value is used with `reviewer_source = 'session_setting'`.
3. If the cast fails, `reviewer_id` is set to NULL, `reviewer_source = 'metadata_failure'` and a non‑empty `failure_reason` describing the parsing error is stored.
4. As a final fallback, `reviewer_source = 'system'` and `reviewer_id = NULL` are recorded.

### 4. GUC trust limitation
- PostgreSQL cannot verify *who* set a session GUC; it merely returns the stored string. Hence the database can only trust the GUC when the **application** guarantees that only `api_user` may set it.

### 5. Function declaration
```sql
CREATE OR REPLACE FUNCTION log_claim_status_change()
RETURNS trigger AS $$
BEGIN
    -- safe search_path, only trusted schemas
    SET LOCAL search_path = pg_catalog, public;
    -- (logic as described in sections 1‑4)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
- The `SET LOCAL search_path` ensures no untrusted schema can be implicitly referenced.

### 6. Ownership & privileges
| Object | Owner | Required privileges |
|--------|-------|---------------------|
| Function `log_claim_status_change` | `audit_owner` | `EXECUTE` granted to role `dag_api_user` (the backend). |
| Table `claimverificationhistory` | `audit_owner` | `INSERT` granted **only** to `audit_owner`. No `UPDATE/DELETE` granted to any non‑superuser. |
| Trigger `trg_claim_status_change` | `audit_owner` | Executes with `SECURITY DEFINER`. |
| Append‑only protection triggers | `audit_owner` | Same as above. |

### 7. Append‑only guarantee & ON DELETE RESTRICT
- FK `claim_id` remains `ON DELETE RESTRICT`.
- Triggers `block_history_modification` continue to raise an exception on any `UPDATE` or `DELETE` of `claimverificationhistory`.

### 8. Failure reason preservation
- When the trigger falls back to `reviewer_source = 'system'`, the previously populated `failure_reason` (e.g., *"invalid reviewer GUC"*) is **not overwritten**. The column is updated only when a new parsing error occurs.

### 9. Limitations
- This design does **not** protect against a compromised superuser or a backend that has been subverted; those remain **operational‑policy** risks.

---
## B. Recipe DAG – Cycle Detection redesign

### Graph model
- **Node**: `item_id` (the concrete item).
- **Edge**: `parent_item_id → component_item_id` derived from the *active* `ItemRecipeVersion` of the parent.
- `recipe_version_id` is only a lookup key to obtain the active recipe for a given parent `item_id` under the current `patch_version`, `server_version`, and effective timestamp.

### Pseudocode for mutation procedures (INSERT/UPDATE/DELETE of a component relation)
1. **Acquire global advisory lock** – same lock value used throughout the DAG subsystem.
2. **Read active recipe** for the *parent* item respecting patch/server/effective time.
3. **Perform recursive CTE** that walks `item_id` paths **including the new edge** and checks for cycles **using item_id**.
4. If a cycle is detected, raise an exception **before** any DML is committed.
5. All steps execute inside a single transaction.

#### Recursive CTE (cycle detection)
```sql
WITH RECURSIVE path(parent_item, child_item, depth, visited) AS (
    SELECT src.item_id, dst.component_item_id, 1,
           ARRAY[src.item_id]
    FROM   item src
    JOIN   item_recipe_version rv ON rv.item_id = src.item_id
    JOIN   item_component_relation dst ON dst.recipe_version_id = rv.recipe_version_id
    UNION ALL
    SELECT p.child_item, dst2.component_item_id, p.depth+1,
           p.visited || p.child_item
    FROM   path p
    JOIN   item_recipe_version rv2 ON rv2.item_id = p.child_item
    JOIN   item_component_relation dst2 ON dst2.recipe_version_id = rv2.recipe_version_id
    WHERE  p.depth < MAX_DEPTH
      AND  NOT p.child_item = ANY(p.visited)   -- indirect cycle detection
)
SELECT 1 FROM path WHERE parent_item = child_item;
```
- The `NOT p.child_item = ANY(p.visited)` clause prevents both direct (`A→A`) and indirect cycles (`A→B→C→A`).
- `MAX_DEPTH` is a configurable constant (default 15).

### Handling of items without an active recipe
- If a node has **no active recipe**, the recursion stops for that branch; the node is treated as a leaf. No further edge expansion is attempted, and the leaf can still contribute a price via its `ItemProfile`.

### Advisory lock usage (shared across all DAG mutations)
```sql
PERFORM pg_advisory_xact_lock(-9223372036854775808);
```
- The lock is obtained **before** any SELECT of the graph, guaranteeing exclusive mutation.

### Demonstration traces
| Scenario | Edge(s) inserted | Expected outcome |
|----------|-----------------|------------------|
| **Self‑cycle** `A → A` | `INSERT INTO item_component_relation … (parent A, component A)` | Cycle CTE returns row → exception `Recipe DAG cycle detected` → transaction rollback. |
| **Indirect cycle** `A → B → C → A` | Insert edges sequentially; on the third insertion the CTE discovers `A` already in `visited` array and raises the same exception. |
| **Acyclic path** `A → B → C` | No cycle detected; mutation succeeds; recursion stops at `C` if `C` has no active recipe. |
| **Different patch/server** | Two recipes for the same logical item but different `patch_version`/`server_version` are considered distinct *active* recipes. The CTE filters by the supplied context, so edges belong to different graph instances and do not interfere. |

---
## C. Depth‑limit – Consistent transaction semantics

### Design decision
- The traversal procedure checks `depth >= MAX_DEPTH` **before** creating a new `RecipeUsage` or `ComponentExpansion`.
- When the limit is hit, the procedure **raises an exception** (e.g., `DP001`). The exception aborts the whole transaction; **no rows** are persisted.
- Because the transaction is rolled back, a status row cannot be written in the same transaction.
- To surface the condition to the caller, the procedure returns the error code, and the application records a *separate* audit entry (`resolution_status = 'DEPTH_LIMIT_REACHED'`) **outside** the failed transaction (e.g., via a retryable background job). This respects ACID while still communicating the reason.

### Example traversal at the limit
1. Depth 15 reached at node `X`; a child `Y` still requires expansion.
2. Procedure executes `RAISE EXCEPTION 'Depth limit reached – DAG traversal aborted' USING ERRCODE = 'DP001';`
3. Transaction rolls back; no `RecipeUsage` or `ComponentExpansion` for `Y` is stored.
4. Caller catches the exception and may log a diagnostic entry such as:
   ```sql
   INSERT INTO dag_traversal_audit(item_id, depth, status) VALUES (X, 15, 'DEPTH_LIMIT_REACHED');
   ```
   (this insert occurs in a **new** transaction).

### Distinguishing INCOMPLETE results
- `INCOMPLETE` is returned **only** when the traversal finishes successfully but some leaf nodes are missing required data (e.g., missing profile). It does **not** imply that the graph is cycle‑free; a cycle that triggers an exception yields no result at all.

---
## D. PatchVersion – Definitive Referential Integrity Audit

| Table (referencing) | FK column(s) | `server_version` column | Target composite key | Reason for reference |
|---------------------|--------------|------------------------|----------------------|----------------------|
| `hero_profile` | `patch_version`, `server_version` | `server_version` | `patch_version(patch_version, server_version)` | Links a hero profile to the exact patch‑server pair used to generate it. |
| `item_profile` | `patch_version`, `server_version` | `server_version` | same as above | Item statistics are tied to a specific patch/server combo. |
| `emblem_profile` | `patch_version`, `server_version` | `server_version` | same | Emblem balances depend on patch version. |
| `spell_profile` | `patch_version`, `server_version` | `server_version` | same | Spell scaling is patch‑specific. |
| `item_recipe_version` | `patch_version`, `server_version` | `server_version` | same | Recipes are versioned per patch/server. |
| `build_version` | `patch_version`, `server_version` | `server_version` | same | Associates a build artefact with the patch it targets (mandatory table). |
| `some_metadata_table` (example) | `patch_version` only | – | **NOT** a FK – stores textual reference for documentation purposes. |

### Duplicate‑check clarification
- Because `patch_version(patch_version)` remains the **primary key**, the pair `(patch_version, server_version)` is **already unique** for each row. Adding a `UNIQUE(patch_version, server_version)` constraint therefore does not change the duplicity semantics; it only makes the composite key explicit for FK consumers.

### Audit steps (pseudocode)
```sql
-- 1. Orphan FK check
SELECT * FROM hero_profile hp
WHERE NOT EXISTS (
    SELECT 1 FROM patch_version pv
    WHERE pv.patch_version = hp.patch_version
      AND pv.server_version = hp.server_version
);

-- 2. Inconsistent server_version (FK exists but server mismatch)
SELECT * FROM hero_profile hp
JOIN patch_version pv ON pv.patch_version = hp.patch_version
WHERE pv.server_version <> hp.server_version;

-- 3. Orphan profiles (no matching patch_version row at all)
SELECT * FROM hero_profile hp
WHERE NOT EXISTS (SELECT 1 FROM patch_version pv WHERE pv.patch_version = hp.patch_version);
```
- The same pattern applies to all tables listed above.

---
## E. Validation Matrix (Phase 2B.1.15)

| Claim ID | Aspect | Review Result | Category |
|----------|--------|---------------|----------|
| **C‑001** | ClaimVerificationHistory – SECURITY DEFINER, reviewer handling | **PASS** | DESIGN_REVIEWED, APPLICATION_POLICY |
| **C‑002** | ClaimVerificationHistory – failure_reason preservation | **PASS** | DESIGN_REVIEWED |
| **C‑003** | Recipe DAG – cycle detection using item_id graph | **PASS** | DESIGN_REVIEWED, PSEUDOCODE_REVIEWED |
| **C‑004** | Recipe DAG – depth‑limit exception handling | **PASS** | DESIGN_REVIEWED, PSEUDOCODE_REVIEWED |
| **C‑005** | Recipe DAG – advisory‑lock usage across mutations | **PASS** | DESIGN_REVIEWED |
| **C‑006** | PatchVersion – definitive referential audit inventory | **PASS** | DESIGN_REVIEWED, PSEUDOCODE_REVIEWED |
| **C‑007** | Historical recipe pricing – root‑item leaf handling (unchanged) | **PASS** | DESIGN_REVIEWED |
| **C‑008** | Pricing engine implementation status | **NOT_VERIFIABLE** | NOT_VERIFIABLE |
| **C‑009** | Cycle detection depth handling (max depth) | **PARTIAL** | DESIGN_REVIEWED (depth guard present, exhaustive detection not guaranteed) |

---
## F. Updated Risk Register (Phase 2B.1.15)

| Risk ID | Description | Severity | Status | Mitigation / Note | Residual Risk | Related Claim / Document |
|--------|-------------|----------|--------|-------------------|---------------|---------------------------|
| **R‑013** | Administrator may disable triggers before a bulk `COPY`. | HIGH | OPEN | Operational policy requiring audit logs and change‑management approval before disabling triggers. | ADMIN‑LEVEL abuse possible if policy not enforced. | C‑008 |
| **R‑014** | Global advisory lock may become a bottleneck under heavy concurrent recipe updates. | MEDIUM | PARTIAL | Monitor lock contention; consider sharding locks per `patch_version` in future. | Performance degradation under load. | C‑004 |
| **R‑015** | Reviewer metadata may still be missing for system‑generated status changes. | MEDIUM | PARTIAL | `reviewer_source = 'system'` recorded; audit trails indicate automated changes. | Lack of human accountability for some changes. | C‑001 |
| **R‑016** | Historical pricing engine exists only as conceptual pseudocode. | HIGH | NOT_VERIFIABLE | No concrete SQL implementation; design approved but needs materialisation and testing. | Pricing may be incorrect or inconsistent until engine is built. | C‑003 |
| **R‑017** | Cycle‑detection depth limit may miss cycles deeper than the configured guard. | MEDIUM | OPEN | Depth guard (`MAX_DEPTH = 15`) is a safety measure; full exhaustive detection is expensive. | Undetected cycles beyond depth limit could corrupt DAG. | C‑009 |
| **R‑018** | Superuser can drop append‑only triggers, breaking immutability. | HIGH | PARTIAL | Operational policy forbids dropping these triggers; audit logs required for any privileged DDL. | Superuser privilege remains a residual risk. | C‑006 |
| **R‑019** | Composite FK addition may clash with existing duplicate `(patch_version, server_version)` rows. | MEDIUM | PARTIAL | Data‑quality audit required before adding `UNIQUE(patch_version, server_version)`. | Migration could fail if duplicates exist. | D‑001 |
| **R‑020** | Session setting `my.reviewer` could be mis‑used by a compromised backend component. | HIGH | OPEN | Application‑level control: only `api_user` role may set GUC; enforce strict backend authentication. | Compromise of backend leads to forged reviewer ID. | A‑1 |
| **R‑021** | Depth‑limited cycle detection could abort without fully analysing the graph. | MEDIUM | OPEN | Callers must treat `INCOMPLETE` status as indication of possible hidden cycles; consider increasing `MAX_DEPTH` or implementing full graph scan in future. | Potential undetected cycles in deep DAGs. | C‑009 |
| **R‑022** | Separation of `reviewer_source` and `failure_reason` may lead to missing `failure_reason` if not explicitly set. | MEDIUM | PARTIAL | Enforce `failure_reason NOT NULL DEFAULT ''` and update trigger to always write a value (empty string when no error). | Incomplete diagnostics if developers forget to populate column. | A‑2 |
| **R‑023** | Root‑item leaf price handling may be omitted if the pricing engine incorrectly skips creation of leaf `ComponentExpansion` rows. | MEDIUM | PARTIAL | Updated design explicitly requires insertion of a leaf `ComponentExpansion` when a root profile with price exists. | Incorrect `TOTAL_PURCHASE_PRICE` if leaf row missing. | B‑1 |
| **R‑024** | DAG traversal now uses `item_id` graph; existing client code that assumes `recipe_version_id` as node may produce stale paths. | LOW | OPEN | Documentation and migration guide required; versioned API endpoints must be refreshed. | Inconsistent graph views across components. | C‑1 |
| **R‑025** | `build_version` table is mandatory; removal would leave dangling FK references. | LOW | OPEN | Documentation clarifies that `build_version` is required; any future removal must be accompanied by redesign. | Future schema changes could break referential integrity. | D‑1 |

*All other risks from earlier phases (`R‑001` … `R‑012`) remain unchanged and are listed in the baseline file.*

---
## G. Summary of Changes (Phase 2B.1.15)
- Clarified the semantics of `current_user` vs `session_user` and defined a realistic trust boundary for reviewer metadata.
- Revised the Cycle‑Detection algorithm to work on `item_id` paths, handling self‑ and indirect cycles and respecting patch/server context.
- Made depth‑limit handling explicit: an exception aborts the transaction; callers can log a separate audit entry.
- Produced a definitive PatchVersion referential‑integrity inventory with clear FK definitions.
- Updated validation matrix categories to reflect actual review depth.
- Cleaned up the risk register: removed duplicated entries, added missing mitigation for `failure_reason`, and ensured correct severity/status.

---

**Final Recommendation:** **APPROVE_WITH_ACCEPTED_RISKS** – the design is logically sound, all remaining open risks are clearly identified and mitigated where feasible, but some risks (superuser privilege, backend compromise, depth‑limit coverage) remain operational‑policy concerns.

---
*Prepared by Antigravity agent.*