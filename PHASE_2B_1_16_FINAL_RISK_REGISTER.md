# Phase 2B.1.16 – Final Risk Register

This document updates the risk register from Phase 2B.1.15 with the refinements introduced in Phase 2B.1.16.
All previously existing Risk IDs are retained; new or modified risks are shown with updated status, mitigation, or description.

---

| Risk ID | Description | Severity | Status | Mitigation / Note | Residual Risk | Related Claim / Document |
|--------|-------------|----------|--------|-------------------|---------------|---------------------------|
| **R‑013** | Administrator may disable triggers before a bulk `COPY`. | HIGH | OPEN | Operational policy requiring audit logs and change‑management approval before disabling triggers. | ADMIN‑LEVEL abuse possible if policy not enforced. | C‑008 |
| **R‑014** | Global advisory lock may become a bottleneck under heavy concurrent recipe updates. | MEDIUM | PARTIAL | Monitor lock contention; consider sharding locks per `patch_version` in future. | Performance degradation under load. | C‑004 |
| **R‑015** | Reviewer metadata may still be missing for system‑generated status changes. | MEDIUM | PARTIAL | `reviewer_source = 'system'` recorded; audit trails indicate automated changes. | Lack of human accountability for some changes. | C‑001 |
| **R‑016** | Historical pricing engine exists only as conceptual pseudocode. | HIGH | NOT_VERIFIABLE | No concrete SQL implementation; design approved but needs materialisation and testing. | Pricing may be incorrect or inconsistent until engine is built. | C‑003 |
| **R‑017** | Cycle detection & depth‑limit robustness – indirect cycles may be missed if depth guard stops recursion early, and depth‑limit aborts without full graph analysis. | MEDIUM | OPEN | Consider increasing `MAX_DEPTH` or implementing a full‑graph scan separate from the guard; ensure audit of depth‑limit failures. | Potential undetected cycles or aborted traversals. | C‑003, C‑009 |
| **R‑018** | Superuser can drop append‑only triggers, breaking immutability. | HIGH | PARTIAL | Operational policy forbids dropping these triggers; audit logs required for any privileged DDL. | Superuser privilege remains a residual risk. | C‑006 |
| **R‑019** | Composite FK addition may clash with existing duplicate `(patch_version, server_version)` rows. | MEDIUM | PARTIAL | Data‑quality audit required before adding `UNIQUE(patch_version, server_version)`. | Migration could fail if duplicates exist. | D‑001 |
| **R‑020** | Session setting `my.reviewer` could be mis‑used by a compromised backend component. | HIGH | OPEN | Application‑level control: only `api_user` role may set GUC; enforce strict backend authentication. | Compromise of backend leads to forged reviewer ID. | C‑001 |
| **R‑021** | Root‑item leaf price handling may be omitted if the pricing engine incorrectly skips creation of leaf `ComponentExpansion` rows. | MEDIUM | PARTIAL | Updated design explicitly requires insertion of a leaf `ComponentExpansion` when a root profile with price exists. | Incorrect `TOTAL_PURCHASE_PRICE` if leaf row missing. | B‑1 |
| **R‑022** | DAG traversal now uses `item_id` graph; existing client code that assumes `recipe_version_id` as node may produce stale paths. | LOW | OPEN | Documentation and migration guide required; versioned API endpoints must be refreshed. | Inconsistent graph views across components. | C‑003 |
| **R‑023** | `build_version` table is mandatory; removal would leave dangling FK references. | LOW | OPEN | Documentation clarifies that `build_version` is required; any future removal must be accompanied by redesign. | Future schema changes could break referential integrity. | D‑001 |

*All other risks from earlier phases (`R‑001` … `R‑012`) remain unchanged and are listed in the baseline file.*

---

*Prepared by Antigravity agent.*