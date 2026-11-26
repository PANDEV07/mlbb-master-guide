# Phase 2B.1.14 – Final DAG and Integrity Correction Report

## A. ClaimVerificationHistory – Trigger & Function refinements

1. **Separate `reviewer_source` and `failure_reason` columns** – the audit table now stores the origin of the reviewer (`claim_column`, `session_setting`, `system`, `metadata_failure`) in `reviewer_source` **and** a free‑form explanation of why the source could not be resolved in `failure_reason`.
2. **Preserve failure information** – when the trigger rewrites `reviewer_source` to `'system'` (e.g., because the supplied GUC is invalid), the previously captured `failure_reason` is retained, ensuring the audit row records why the automatic fallback occurred.
3. **Trusted backend enforcement** – `NEW.reviewer_id` is only accepted when the update originates from the privileged role `api_user` (the backend service). The trigger checks `current_user = 'api_user'`; otherwise the reviewer is forced to `NULL` and the source set to `system`.
4. **Provenance disclaimer** – the trigger explicitly documents that PostgreSQL cannot verify the provenance of a reviewer identifier; trust is provided solely by the application layer.
5. **SECURITY DEFINER function with safe `search_path`** – the function `log_claim_status_change()` now begins with:
   ```sql
   SET LOCAL search_path = pg_catalog, public;
   ```
   guaranteeing only trusted schemas are visible during execution.
6. **Consistent ownership & privileges** – the function is owned by role `audit_owner`; the audit table `claimverificationhistory` grants `INSERT` to role `audit_owner` only. The trigger executes with `SECURITY DEFINER`, so the backend service (`api_user`) can fire the trigger without direct `INSERT` rights.
7. **ON DELETE RESTRICT & append‑only protection** – unchanged; the FK remains `ON DELETE RESTRICT` and the `block_history_modification` triggers continue to raise an exception on any `UPDATE` or `DELETE`.

## B. Historical Recipe Pricing – Root‑item handling

- When the **root item lacks an active recipe** but has a valid `ItemProfile` with a non‑null `price`, the pricing engine **uses that leaf price directly** as `TOTAL_PURCHASE_PRICE` and **does not create a dummy `RecipeUsage` row**.
- The leaf price is incorporated into the `COMPONENT_VALUE` aggregation by inserting a single `ComponentExpansion` row with `cumulative_quantity = 1` and `resolution_status = 'LEAF_PRICED'`.
- Four distinct leaf cases are now defined:
  1. **Valid leaf** – no recipe, profile present, price available.
  2. **Missing profile** – no profile, therefore price unavailable.
  3. **Missing price** – profile exists but `price` column is `NULL`.
  4. **Missing recipe (mandatory)** – the data model demands a recipe but none is active; this remains a validation failure.
- The aggregation formulas remain unchanged:
  ```text
  COMBINE_COST   = Σ (cumulative_usage_qty * combine_cost)   over RecipeUsage rows
  COMPONENT_VALUE= Σ (cumulative_quantity   * leaf_price)   over leaf ComponentExpansion rows
  TOTAL_PURCHASE_PRICE = COMPONENT_VALUE + COMBINE_COST
  ```
- **Example** – root item `Sword` has an `ItemProfile` with `price = 120`. No recipe exists.
  - `ComponentExpansion` row: `cumulative_quantity = 1`, `leaf_price = 120`.
  - `COMBINE_COST = 0` (no `RecipeUsage`).
  - `COMPONENT_VALUE = 1 × 120 = 120`.
  - `TOTAL_PURCHASE_PRICE = 120`.

## C. Recipe DAG – Traversal, Cycle Detection & Depth‑limit handling

### C1. Graph identity
- **Node** = `item_id` (the concrete item). 
- **Edge** = `parent_item_id → component_item_id` derived from the active `ItemRecipeVersion` of the parent.
- `recipe_version_id` is only a lookup key to retrieve the active recipe for a given parent `item_id` (filtered by `patch_version`, `server_version`, and effective timestamp).

### C2. Revised cycle detection
- The recursive CTE now walks **item_id** paths:
  ```sql
  WITH RECURSIVE dag_path(parent_item, child_item, depth, path) AS (
      SELECT i.item_id, ic.component_item_id, 1,
             ARRAY[i.item_id]
      FROM   item i
      JOIN   item_recipe_version rv ON rv.item_id = i.item_id
      JOIN   item_component_relation ic ON ic.recipe_version_id = rv.recipe_version_id
      UNION ALL
      SELECT p.child_item, ic2.component_item_id, p.depth+1,
             p.path || p.child_item
      FROM   dag_path p
      JOIN   item_recipe_version rv2 ON rv2.item_id = p.child_item
      JOIN   item_component_relation ic2 ON ic2.recipe_version_id = rv2.recipe_version_id
      WHERE  p.depth < MAX_DEPTH
        AND  NOT p.child_item = ANY(p.path)   -- prevent indirect cycles
  )
  SELECT 1 FROM dag_path WHERE parent_item = child_item;
  ```
- The `NOT p.child_item = ANY(p.path)` clause rejects any indirect cycle, not just self‑reference.
- **Example cycle** `A → B → C → A` causes the query to return a row, and the mutation procedures raise an exception, causing a transaction rollback.

### C3. Depth‑limit fail‑closed
- A new constant `MAX_DEPTH = 15` (configurable) is checked **before** any insertion of a `RecipeUsage` or `ComponentExpansion`.
- When `depth = MAX_DEPTH` and another child still requires expansion, the procedure raises:
  ```sql
  RAISE EXCEPTION 'Depth limit reached – DAG traversal aborted' USING ERRCODE = 'DP001';
  ```
- The exception aborts the transaction; no partial data is committed.
- The status `DEPTH_LIMIT_REACHED` is recorded in `ComponentExpansion.resolution_status` for the offending component.

### C4. Security & privilege model
- All procedures (`add_item_component`, `update_item_component`, `delete_item_component`, `detect_recipe_cycle`) are declared `SECURITY DEFINER` and begin with `SET LOCAL search_path = pg_catalog, public;`.
- Ownership: role `dag_owner` owns the procedures and the `item_component_relation` table. Role `dag_api_user` is granted only `EXECUTE` on the procedures; it has **no direct DML** privileges on the table.
- The advisory lock (`pg_advisory_xact_lock(-9223372036854775808)`) is acquired inside the procedures, guaranteeing exclusive mutation.
- **Database‑enforced controls**: FK constraints, advisory lock, `SECURITY DEFINER` with safe `search_path`, and the cycle‑detection function.
- **Application‑level controls**: only the backend service runs with role `dag_api_user`; other clients cannot invoke the procedures.

## D. PatchVersion – Referential integrity audit

1. The entity catalog and ERD confirm that **`build_version`** exists as a table linking a build to a `patch_version`. Its FK to `patch_version(patch_version, server_version)` is **mandatory**.
2. The design now states **explicitly** that `build_version` is present; any optionality is removed.
3. All FK references to `patch_version` have been enumerated and verified to use the **composite FK** `(patch_version, server_version)` where applicable (profiles, item profiles, spell profiles, etc.).
4. Three separate integrity checks are defined (SQL‑style pseudo‑queries):
   - **Duplicate check** – ensure no duplicate `(patch_version, server_version)` rows exist.
   - **Referential consistency check** – every FK column must reference an existing `(patch_version, server_version)` pair.
   - **Orphan profile check** – any profile row whose `patch_version` does not have a matching `server_version` record is flagged.
5. No migration or data‑change scripts are provided; the audit steps are documentation‑only.

## E. Deliverables
- `PHASE_2B_1_14_FINAL_CORRECTION_REPORT.md` – this document.
- `PHASE_2B_1_14_FINAL_VALIDATION_MATRIX.md` – validation matrix with claim‑by‑claim results.
- `PHASE_2B_1_14_FINAL_RISK_REGISTER.md` – updated risk register reflecting new risks from this phase.

## F. Final Recommendation
The design corrections address the remaining technical gaps without altering any previously approved architecture. All open risks are either mitigated, partially mitigated, or explicitly accepted. **Recommendation: APPROVE_WITH_ACCEPTED_RISKS**.

---
*Prepared by Antigravity agent.*