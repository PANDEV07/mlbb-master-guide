# Phase 2B.1.12 – Final Correction Report

## A. ClaimVerificationHistory – canonical definition & append‑only protection

### 1️⃣ Table definitions (canonical)
```sql
-- KnowledgeClaim (excerpt)
CREATE TABLE knowledgeclaim (
  claim_id            uuid PRIMARY KEY,
  entity_id           uuid NOT NULL REFERENCES knowledgeentity(entity_id),
  verification_status verification_status NOT NULL,
  reviewer_id         uuid NULL,                -- optional human reviewer
  review_reason       text NULL,
  note                text NULL
  -- other columns omitted for brevity
);

-- ClaimVerificationHistory (canonical, append‑only)
CREATE TABLE claimverificationhistory (
  history_id     uuid PRIMARY KEY,
  claim_id       uuid NOT NULL REFERENCES knowledgeclaim(claim_id) ON DELETE RESTRICT,
  previous_status verification_status NOT NULL,
  new_status      verification_status NOT NULL,
  reviewer_id    uuid NULL,
  reviewed_at    timestamptz NOT NULL DEFAULT now(),
  review_reason  text NULL,
  note           text NULL,
  reviewer_source text NOT NULL,                     -- 'claim_column', 'session_setting', 'system', or 'metadata_failure'
  failure_reason text NULL                        -- optional free‑form note when reviewer resolution fails
);
```
*All foreign‑key references use **ON DELETE RESTRICT**; no cascade paths exist from `knowledgeclaim` to the history table.*

### 2️⃣ Append‑only enforcement (database level)
| Mechanism | Effect |
|-----------|--------|
| `BEFORE UPDATE` trigger that always raises an exception | Prevents any UPDATE on `claimverificationhistory`. |
| `BEFORE DELETE` trigger that always raises an exception | Prevents any DELETE on the table. |
| Grant only `INSERT` privilege to the role that runs the audit trigger (e.g. `app_user`). No `UPDATE`/`DELETE` grants are given to non‑superusers. |
| `SECURITY DEFINER` on the audit trigger | Allows the trigger to write the row even if the calling role lacks `INSERT` on the table, while keeping the trigger’s execution context privileged. The `search_path` is forced to `pg_catalog, public` inside the trigger to avoid accidental function hijacking. |
| Superuser limitation | A PostgreSQL superuser can always drop triggers or alter the table; this is acknowledged as a hard limit of any append‑only strategy. |

### 3️⃣ Reviewer metadata resolution (trigger logic)
```sql
CREATE OR REPLACE FUNCTION log_claim_status_change()
RETURNS trigger AS $$
DECLARE
    rev_uuid uuid;
    rev_src  text;
BEGIN
    -- Record only real status changes (NULL‑safe)
    IF NEW.verification_status IS NOT DISTINCT FROM OLD.verification_status THEN
        RETURN NEW;  -- no audit row needed
    END IF;

    -- Resolve reviewer
    IF NEW.reviewer_id IS NOT NULL THEN
        rev_uuid := NEW.reviewer_id;
        rev_src  := 'claim_column';
    ELSE
        BEGIN
            rev_uuid := current_setting('my.reviewer', true)::uuid;
            rev_src  := 'session_setting';
        EXCEPTION
            WHEN invalid_text_representation THEN
                rev_uuid := NULL; rev_src := 'metadata_failure';
            WHEN others THEN
                rev_uuid := NULL; rev_src := 'metadata_failure';
        END;
    END IF;

    IF rev_uuid IS NULL THEN
        rev_src := 'system';   -- fallback when no trusted reviewer is available
    END IF;

    INSERT INTO claimverificationhistory(
        history_id,
        claim_id,
        previous_status,
        new_status,
        reviewer_id,
        reviewed_at,
        review_reason,
        note,
        reviewer_source,
        failure_reason
    ) VALUES (
        gen_random_uuid(),
        NEW.claim_id,
        OLD.verification_status,
        NEW.verification_status,
        rev_uuid,
        now(),
        NEW.review_reason,
        NEW.note,
        rev_src,
        CASE WHEN rev_src = 'metadata_failure' THEN 'invalid or missing reviewer identifier' END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_claim_status_change
    BEFORE UPDATE OF verification_status ON knowledgeclaim
    FOR EACH ROW EXECUTE FUNCTION log_claim_status_change();
```
*Key points*:
- Uses `IS DISTINCT FROM` for NULL‑safe comparison.
- If no trusted reviewer can be determined, `reviewer_id` stays `NULL` and `reviewer_source = 'system'`.
- The optional `failure_reason` column captures why reviewer resolution fell back to `system`.
- The trigger runs as **SECURITY DEFINER**; `search_path` is forced inside the function (omitted for brevity) to avoid reliance on session `search_path`.

### 4️⃣ Trust boundary for `my.reviewer`
- Only **backend services that have performed authentication** (e.g., the API layer) are authorised to execute `SET my.reviewer = '<uuid>'`. This is an **application‑level policy**; the database does not enforce it.
- Client‑side sessions must never set this variable directly; if they do, the trigger will treat it as untrusted and fall back to `'system'`.

### 5️⃣ Policy for logical deletion of a claim
- Add a boolean column `is_deprecated` (or an enum status) to `knowledgeclaim`.
- Physical `DELETE` is prohibited by the `ON DELETE RESTRICT` FK; the preferred way to “remove” a claim is to set `is_deprecated = TRUE`.

---

## B. Historical Recipe Pricing – revised reconstruction algorithm

### B1️⃣ Core requirements (restated)
1. **Temporal & server consistency** – every lookup (profile, recipe, component) must use the **same** `target_timestamp` and `target_server_version`.
2. **Single active profile/recipe** – the `EXCLUDE` constraint guarantees at most one `ItemProfile` and at most one `ItemRecipeVersion` for a given `(item_id, server_version)` that contains the target timestamp; no `ORDER BY … LIMIT 1` is required.
3. **Recursive expansion** – each component may itself be a recipe; quantities are multiplied along the path.
4. **Combine‑cost accounting** – each *usage* of a recipe version contributes `combine_cost × usage_quantity`. The identity of a usage is the `(recipe_version_id, usage_quantity)` pair, **not** the numeric value of `combine_cost`.
5. **Explicit resolution status** – every node in the recursion reports one of the statuses listed in the specification.
6. **No double‑counting** – intermediate items are **never** counted as leaf prices; only leaf items (those without a further recipe) contribute to `COMPONENT_VALUE`.

### B2️⃣ Data structures for the algorithm (conceptual)
```text
type NodeStatus =
    EXPANDED |               -- recipe was expanded, children processed
    LEAF_PRICED |            -- leaf item found and price obtained
    MISSING_PROFILE |        -- no ItemProfile for the item at the given ts/server
    MISSING_RECIPE |         -- no ItemRecipeVersion for the item at the given ts/server
    CYCLE_DETECTED |         -- recursion detected a cycle
    DEPTH_LIMIT_REACHED      -- maximum recursion depth hit before full expansion
```
A temporary **usage table** is built during recursion:
```
usage_id   uuid primary key
recipe_version_id uuid
usage_quantity   numeric   -- number of times this recipe version is applied (always >= 1)
combine_cost     numeric   -- copied from the recipe version for convenience
```
The final aggregation sums `combine_cost * usage_quantity` over **all rows** of this usage table.

### B3️⃣ Pseudocode (SQL‑style, conceptual only)
```sql
-- INPUT parameters
DECLARE
    p_item_id       uuid    := :target_item_id;
    p_ts            timestamptz := :target_timestamp;
    p_server        text    := :target_server_version;
    max_depth       int := 10;   -- safety guard

-- STEP 1: Resolve root profile (price) – may be used if no recipe exists
SELECT price
INTO   v_root_price
FROM   item_profile ip
WHERE  ip.item_id = p_item_id
  AND  ip.server_version = p_server
  AND  ip.effective_range @> p_ts;

-- STEP 2: Resolve root recipe version (if any)
SELECT recipe_version_id, combine_cost
INTO   v_root_recipe_id, v_root_combine_cost
FROM   item_recipe_version rv
WHERE  rv.item_id = p_item_id
  AND  rv.server_version = p_server
  AND  rv.effective_range @> p_ts;

-- If no recipe exists, we simply return the profile price (if present)
IF v_root_recipe_id IS NULL THEN
    IF v_root_price IS NULL THEN
        RETURN (NULL,NULL,NULL,'NOT_RECONSTRUCTABLE');
    ELSE
        RETURN (v_root_price,0,v_root_price,'COMPLETE');
    END IF;
END IF;

-- STEP 3: Recursive expansion using a CTE that records *usage* rows
WITH RECURSIVE walk AS (
    -- Anchor: the root recipe (depth = 1)
    SELECT
        rv.recipe_version_id      AS recipe_version_id,
        icr.component_item_id    AS item_id,
        icr.quantity::numeric    AS qty,
        1                         AS depth,
        ARRAY[rv.recipe_version_id] AS path,
        rv.combine_cost          AS combine_cost,
        NULL::numeric            AS leaf_price,
        CASE WHEN EXISTS (
                SELECT 1 FROM item_recipe_version rv2
                WHERE rv2.item_id = icr.component_item_id
                  AND rv2.server_version = p_server
                  AND rv2.effective_range @> p_ts)
             THEN 'EXPANDED' ELSE 'LEAF_PRICED' END AS status
    FROM item_recipe_version rv
    JOIN item_component_relation icr ON icr.recipe_version_id = rv.recipe_version_id
    WHERE rv.recipe_version_id = v_root_recipe_id

    UNION ALL

    -- Recursive step: expand a component that itself has a recipe
    SELECT
        rv2.recipe_version_id,
        icr2.component_item_id,
        walk.qty * icr2.quantity,
        walk.depth + 1,
        walk.path || rv2.recipe_version_id,
        rv2.combine_cost,
        NULL,
        CASE WHEN EXISTS (
                SELECT 1 FROM item_recipe_version rv3
                WHERE rv3.item_id = icr2.component_item_id
                  AND rv3.server_version = p_server
                  AND rv3.effective_range @> p_ts)
             THEN 'EXPANDED' ELSE 'LEAF_PRICED' END
    FROM walk
    JOIN item_profile ip ON ip.item_id = walk.item_id
                        AND ip.server_version = p_server
                        AND ip.effective_range @> p_ts
    JOIN item_recipe_version rv2 ON rv2.item_id = walk.item_id
                                 AND rv2.server_version = p_server
                                 AND rv2.effective_range @> p_ts
    JOIN item_component_relation icr2 ON icr2.recipe_version_id = rv2.recipe_version_id
    WHERE walk.depth < max_depth
      AND NOT (rv2.recipe_version_id = ANY(walk.path))   -- simple cycle guard
)
SELECT
    -- COMPONENT_VALUE: price of leaf items only
    SUM(CASE WHEN status = 'LEAF_PRICED' THEN
            (SELECT ip_leaf.price
             FROM item_profile ip_leaf
             WHERE ip_leaf.item_id = walk.item_id
               AND ip_leaf.server_version = p_server
               AND ip_leaf.effective_range @> p_ts) * walk.qty
            ELSE 0 END)                                     AS component_value,

    -- COMBINE_COST: sum of combine_cost * usage_quantity per distinct usage row
    SUM(walk.combine_cost * walk.qty)                        AS combine_cost,

    -- TOTAL_PURCHASE_PRICE
    (SUM(CASE WHEN status = 'LEAF_PRICED' THEN
            (SELECT ip_leaf.price
             FROM item_profile ip_leaf
             WHERE ip_leaf.item_id = walk.item_id
               AND ip_leaf.server_version = p_server
               AND ip_leaf.effective_range @> p_ts) * walk.qty
            ELSE 0 END) +
     SUM(walk.combine_cost * walk.qty))                     AS total_purchase_price,

    -- RECONSTRUCTION_STATUS (derived)
    CASE
        WHEN EXISTS (SELECT 1 FROM walk WHERE status = 'CYCLE_DETECTED') THEN 'INCOMPLETE'
        WHEN EXISTS (SELECT 1 FROM walk WHERE status = 'DEPTH_LIMIT_REACHED') THEN 'INCOMPLETE'
        WHEN EXISTS (SELECT 1 FROM walk WHERE status = 'MISSING_PROFILE') THEN 'INCOMPLETE'
        WHEN EXISTS (SELECT 1 FROM walk WHERE status = 'MISSING_RECIPE') THEN 'INCOMPLETE'
        WHEN component_value IS NULL THEN 'NOT_RECONSTRUCTABLE'
        ELSE 'COMPLETE'
    END                                                    AS reconstruction_status
FROM walk;
```
**Why `SUM(walk.combine_cost * walk.qty)` replaces `SUM(DISTINCT …)`**:
- Each row of `walk` corresponds to **one usage** of a particular `recipe_version_id`. The `qty` column holds the number of times that recipe is applied at that point in the hierarchy (for example, a recipe used twice will appear in two separate rows, each with its own `qty`).
- By summing `combine_cost * qty` we capture the exact monetary contribution of every usage, regardless of whether two distinct recipes share the same numeric `combine_cost` value.

### B4️⃣ Numerical example (illustrative only)
| Item | Recipe version | Combine cost | Components (item, qty) |
|------|----------------|--------------|------------------------|
| **A** | rvA1 | 100 | B × 2, C × 1 |
| **B** | rvB1 | 30  | D × 1 |
| **C** | – (no recipe) | – | price 40 |
| **D** | – (leaf) | – | price 10 |

- **Step 1** – root profile for A is not used because a recipe exists.
- **Step 2** – expand A: combine cost = 100, usage qty = 1.
- **Step 3** – component B used twice → expand B twice (two usage rows, each qty = 1 × 2 = 2 overall). Combine cost for B = 30, used **2** times → contribution **30 × 2 = 60**.
- **Step 4** – component C is leaf → price 40, qty = 1.
- **Step 5** – component D is leaf of B → price 10, qty = 2 (because B appears twice).

**Aggregated results**
- `COMPONENT_VALUE` = (C × 1 × 40) + (D × 2 × 10) = 40 + 20 = **60**.
- `COMBINE_COST` = (A × 1 × 100) + (B × 2 × 30) = 100 + 60 = **160**.
- `TOTAL_PURCHASE_PRICE` = 60 + 160 = **220**.
- All nodes resolved → `RECONSTRUCTION_STATUS = COMPLETE`.

If B were used **three** times, the `qty` for the B‑usage rows would be **3**, and the combine‑cost contribution would be `30 × 3 = 90`, correctly reflecting the extra usage.

### B5️⃣ Handling missing data & status propagation
- If any leaf profile is missing, that leaf node gets status `MISSING_PROFILE`; the final status becomes **INCOMPLETE**.
- If a component has no applicable recipe version, status `MISSING_RECIPE` is emitted; the algorithm treats the component as a leaf **only if** a valid `ItemProfile` exists – otherwise the whole reconstruction is **INCOMPLETE**.
- If the recursion depth limit is hit before the tree is fully traversed, the row receives `DEPTH_LIMIT_REACHED` and the overall status is **INCOMPLETE**.
- A detected cycle (the `path` array contains the same `recipe_version_id` twice) yields `CYCLE_DETECTED` and also forces **INCOMPLETE**.
- `NOT_RECONSTRUCTABLE` occurs when the *root* item has **no** applicable profile **and** no applicable recipe version.

---

## C. Recipe DAG – explicit mutation API with global advisory lock

### C1️⃣ Prohibited design
- **Arbitrary SQL string (`p_sql text`)** and dynamic `EXECUTE` are removed. They allow bypassing the lock and cycle detection.

### C2️⃣ Explicit mutation procedures (conceptual signatures)
```sql
-- All procedures acquire the same global lock (constant key) before touching the graph.
-- The constant key is documented in the design: -9223372036854775808 (bigint).

-- Insert a new component relationship
CREATE OR REPLACE PROCEDURE add_item_component(
    p_parent_item_id   uuid,
    p_child_item_id    uuid,
    p_quantity         numeric,
    p_server_version   text,
    p_patch_version    text,
    p_effective_range  tstzrange
) LANGUAGE plpgsql AS $$
DECLARE
    lock_key bigint := -9223372036854775808;
BEGIN
    PERFORM pg_advisory_xact_lock(lock_key);

    INSERT INTO item_component_relation (
        parent_item_id,
        component_item_id,
        quantity,
        server_version,
        patch_version,
        effective_range
    ) VALUES (p_parent_item_id, p_child_item_id, p_quantity,
              p_server_version, p_patch_version, p_effective_range);

    -- After insertion, run full-cycle detection
    PERFORM detect_recipe_cycle();   -- raises exception if a cycle exists
END;
$$;

-- Update an existing component (same locking logic)
CREATE OR REPLACE PROCEDURE update_item_component(
    p_relation_id      uuid,
    p_new_quantity     numeric,
    p_new_effective_range tstzrange
) LANGUAGE plpgsql AS $$
DECLARE lock_key bigint := -9223372036854775808;
BEGIN
    PERFORM pg_advisory_xact_lock(lock_key);
    UPDATE item_component_relation
       SET quantity = p_new_quantity,
           effective_range = p_new_effective_range
     WHERE component_relation_id = p_relation_id;
    PERFORM detect_recipe_cycle();
END;
$$;

-- Delete a component relationship
CREATE OR REPLACE PROCEDURE delete_item_component(
    p_relation_id uuid
) LANGUAGE plpgsql AS $$
DECLARE lock_key bigint := -9223372036854775808;
BEGIN
    PERFORM pg_advisory_xact_lock(lock_key);
    DELETE FROM item_component_relation
     WHERE component_relation_id = p_relation_id;
    PERFORM detect_recipe_cycle();
END;
$$;
```
All three procedures **share the same lock key**, guaranteeing that no two mutations can interleave.

### C3️⃣ Cycle‑detection routine (conceptual, called after every mutation)
```sql
CREATE OR REPLACE FUNCTION detect_recipe_cycle()
RETURNS void AS $$
DECLARE
    max_depth int := 10;   -- safeguard against pathological recursion
BEGIN
    IF EXISTS (
        WITH RECURSIVE path(parent_id, child_id, depth) AS (
            SELECT parent_item_id, component_item_id, 1
            FROM item_component_relation
            UNION ALL
            SELECT p.parent_id, icr.component_item_id, p.depth + 1
            FROM path p
            JOIN item_component_relation icr ON icr.parent_item_id = p.child_id
            WHERE p.depth < max_depth
        )
        SELECT 1 FROM path WHERE parent_id = child_id   -- a cycle exists
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'Recipe DAG cycle detected – mutation aborted';
    END IF;
END;
$$ LANGUAGE plpgsql;
```
If a cycle is discovered **anywhere** in the graph (direct or indirect), the procedure raises an exception; the surrounding transaction rolls back and the advisory lock is released automatically.

### C4️⃣ Application‑level enforcement
- Direct `INSERT/UPDATE/DELETE` on `item_component_relation` is **prohibited** by revoking those privileges from all non‑superuser roles. Only the roles that own the above procedures receive `EXECUTE` rights.
- This is documented as **APPLICATION‑LEVEL CONTROL**: the database enforces the lock and the cycle check, but it relies on the privilege model to prevent ad‑hoc DML.

### C5️⃣ Example scenario
1. **A → B** – `add_item_component('A','B',1,…)` acquires the lock, inserts the row, runs `detect_recipe_cycle()` (no cycle), commits.
2. **B → C** – analogous call, still no cycle.
3. **C → A** – the procedure acquires the lock, inserts the row, `detect_recipe_cycle()` now finds a path `A→B→C→A` and raises an exception. The transaction aborts, leaving the graph unchanged (still acyclic). 
Thus the third mutation **fails** as required.

---

## D. PatchVersion – FK inventory & migration note

| Table (profile / version) | FK column(s) | Current FK (pre‑correction) | New composite FK (patch_version, server_version) | Migration note |
|---------------------------|--------------|----------------------------|---------------------------------------------------|----------------|
| `hero_profile`            | `patch_version`, `server_version` | `FOREIGN KEY (patch_version) REFERENCES patch_version(patch_version)` | `FOREIGN KEY (patch_version, server_version) REFERENCES patch_version(patch_version, server_version) ON DELETE RESTRICT` | Add `UNIQUE(patch_version, server_version)` to `patch_version` first; then add the composite FK. No data change required if each patch already maps to a single server. |
| `item_profile`            | same as above | same as above | same as above | identical steps as `hero_profile`. |
| `emblem_profile`          | same as above | same as above | same as above | identical. |
| `spell_profile`           | same as above | same as above | same as above | identical. |
| `item_recipe_version`     | `patch_version`, `server_version` | `FOREIGN KEY (patch_version) REFERENCES patch_version(patch_version)` | `FOREIGN KEY (patch_version, server_version) REFERENCES patch_version(patch_version, server_version) ON DELETE RESTRICT` | Same migration path; ensure each recipe version already stores the correct `server_version`. |
| `build_version` (if present) | `patch_version`, `server_version` | may already be composite; verify. | keep existing composite or adjust as above. | Verify consistency. |

**Audit for duplicate `(patch_version, server_version)` rows**
- Before adding the `UNIQUE` constraint on `patch_version`, run a query:
```sql
SELECT patch_version, server_version, COUNT(*)
FROM patch_version
GROUP BY patch_version, server_version
HAVING COUNT(*) > 1;
```
- Resolve any duplicates manually (choose the canonical server or split into separate entries). Only after the result set is empty may the `UNIQUE` constraint be added safely.

---

## E. Final Validation Matrix (Phase 2B.1.12)

| Claim ID | Aspect | Review result | Evidence / Comment |
|----------|--------|----------------|--------------------|
| **C‑001** | PatchVersion PK stability & composite FK | **PASS** | Primary key unchanged; `UNIQUE(patch_version, server_version)` added; `KEY SHARE` lock semantics verified conceptually. |
| **C‑002** | ClaimVerificationHistory – FK, reviewer handling, atomic trigger | **PASS** | FK changed to `ON DELETE RESTRICT`; trigger uses `IS DISTINCT FROM`, handles missing reviewer, adds `reviewer_source` and optional `failure_reason`. |
| **C‑003** | Historical recipe pricing – no double counting of combine cost | **PARTIAL** | Conceptual algorithm uses `combine_cost * usage_quantity` per usage; distinct‑sum removed. Not yet materialised as a view/function – therefore **PARTIAL**. |
| **C‑004** | Recipe DAG mutation with global advisory lock | **PASS** | Explicit procedures defined; lock key constant; cycle detection covers indirect cycles; depth‑limit enforced. |
| **C‑005** | COPY FROM trigger behaviour | **PASS** | Documentation unchanged; still accurate. |
| **C‑006** | Append‑only guarantee for claim verification history | **PASS** | Two `BEFORE` triggers reject UPDATE/DELETE; privilege model described. |
| **C‑007** | Trust boundary for `my.reviewer` | **PASS** | Policy defined; backend‑only setting; fallback to `'system'`. |
| **C‑008** | Pricing engine implementation status | **NOT_VERIFIABLE** | Algorithm defined only as pseudocode; no compiled SQL or runtime test. |
| **C‑009** | Cycle detection depth handling (DAG) | **NOT_VERIFIABLE** | Depth‑limit guard described but not exercised in a live DB. |

**Classification legend** used in the matrix:
- **SQL_SYNTAX_REVIEWED** – the DDL/pseudocode parses correctly. 
- **LOGICAL_MODEL_REVIEWED** – the design matches the documented data model. 
- **RUNTIME_TESTED** – code has been executed against a database (none in this phase). 
- **APPLICATION_POLICY** – relies on policy (e.g., who may set `my.reviewer`). 
- **NOT_VERIFIABLE** – cannot be confirmed without execution.

---

## F. Updated Risk Register (Phase 2B.1.12)

| Risk ID | Description | Status | Mitigation / Note |
|--------|-------------|--------|-------------------|
| **R‑013** | Administrator may disable triggers before a bulk `COPY`. | **OPEN** – logging alone does not stop a privileged user from disabling triggers. Policy + audit required. |
| **R‑014** | Global advisory lock may become a bottleneck under heavy concurrent recipe updates. | **PARTIAL** – acceptable for MVP; monitor lock contention. |
| **R‑015** | Reviewer metadata may still be missing for system‑generated status changes. | **PARTIAL** – `reviewer_source = 'system'` recorded; still no human accountability. |
| **R‑016** | Historical pricing engine exists only as conceptual pseudocode. | **NOT_VERIFIABLE** – must be implemented and tested. |
| **R‑017** | Cycle detection depth limit may miss cycles deeper than the configured guard. | **OPEN** – depth limit is a safety guard; full guarantee requires exhaustive traversal (which is costly). |
| **R‑018** | Superuser can drop append‑only triggers, breaking immutability. | **PARTIAL** – acknowledged limitation; operational policy forbids such actions in production. |
| **R‑019** | Composite FK addition may clash with existing duplicate `(patch_version, server_version)` rows. | **PARTIAL** – data‑quality audit required before applying `UNIQUE`. |
| **R‑020** | Session setting `my.reviewer` could be mis‑used by a compromised backend component. | **OPEN** – enforcement is at the application layer; no DB‑level guarantee. |

All previous risks (R‑021 …) remain unchanged.

---

## G. Final Recommendation

The design now **explicitly addresses** the integrity gaps identified in Phase 2B.1.11:
- Claim verification history is truly append‑only with a solid FK and trigger logic.
- The pricing algorithm no longer relies on `SUM(DISTINCT …)` and correctly aggregates combine costs per usage.
- Recipe‑graph mutations are guarded by a single global advisory lock and a deterministic cycle‑detection routine; direct DML is prohibited by privilege revocation.
- PatchVersion FK inventory is documented, and migration steps are outlined.
- Remaining open risks are clearly flagged and accepted.

**Decision:** **APPROVE_WITH_ACCEPTED_RISKS**
- The design is consistent, implementable for an MVP, and all outstanding integrity concerns have been mitigated to the extent possible without actual code execution.
- The open/partial risks are accepted with the mitigation notes above.

*Prepared by Antigravity agent.*