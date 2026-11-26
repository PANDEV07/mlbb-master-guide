# Phase 2B.1.13 – Final Risk Register

This document updates the risk register from Phase 2B.1.12 with the findings and mitigations introduced in Phase 2B.1.13 (see `PHASE_2B_1_13_FINAL_CORRECTION_REPORT.md` and `PHASE_2B_1_13_FINAL_VALIDATION_MATRIX.md`).
All previously existing Risk IDs are retained; their status and mitigation have been revised where applicable. New risks identified in this phase are added with fresh IDs.

---

| Risk ID | Description | Severity | Status | Mitigation / Note | Residual Risk | Related Claim / Document |
|--------|-------------|----------|--------|-------------------|---------------|---------------------------|
| **R‑013** | Administrator may disable triggers before a bulk `COPY`. | HIGH | OPEN | Operational policy requiring audit logs and change‑management approval before disabling triggers. | ADMIN‑LEVEL abuse possible if policy not enforced. | C‑008 (COPY FROM trigger behaviour) |
| **R‑014** | Global advisory lock may become a bottleneck under heavy concurrent recipe updates. | MEDIUM | PARTIAL | Monitor lock contention; consider sharding locks per `patch_version` in future. | Performance degradation under load. | C‑004 (Recipe DAG mutation API) |
| **R‑015** | Reviewer metadata may still be missing for system‑generated status changes. | MEDIUM | PARTIAL | `reviewer_source = 'system'` recorded; audit trails indicate automated changes. | Lack of human accountability for some changes. | C‑001 (ClaimVerificationHistory – reviewer handling) |
| **R‑016** | Historical pricing engine exists only as conceptual pseudocode. | HIGH | NOT_VERIFIABLE | No concrete SQL implementation; design approved but needs materialisation and testing. | Pricing may be incorrect or inconsistent until engine is built. | C‑003 (Historical recipe pricing) |
| **R‑017** | Cycle‑detection depth limit may miss cycles deeper than the configured guard. | MEDIUM | OPEN | Depth guard (`MAX_DEPTH = 15`) is a safety measure; full exhaustive detection is expensive. | Undetected cycles beyond depth limit could corrupt DAG. | C‑009 (Cycle detection depth handling) |
| **R‑018** | Superuser can drop append‑only triggers, breaking immutability. | HIGH | PARTIAL | Operational policy forbids dropping these triggers; audit logs required for any privileged DDL. | Superuser privilege remains a residual risk. | C‑006 (Append‑only guarantee) |
| **R‑019** | Composite FK addition may clash with existing duplicate `(patch_version, server_version)` rows. | MEDIUM | PARTIAL | Data‑quality audit required before adding `UNIQUE(patch_version, server_version)`. | Migration could fail if duplicates exist. | D‑001 (PatchVersion – complete FK inventory) |
| **R‑020** | Session setting `my.reviewer` could be mis‑used by a compromised backend component. | HIGH | OPEN | Application‑level control: only `api_user` role may set GUC; enforce strict backend authentication. | Compromise of backend leads to forged reviewer ID. | A‑1 (Reviewer trust boundary) |
| **R‑021** | Depth‑limited cycle detection could abort without fully analysing the graph. | MEDIUM | OPEN | Callers must treat `INCOMPLETE` status as indication of possible hidden cycles; consider increasing `MAX_DEPTH` or implementing full graph scan in future. | Potential undetected cycles in deep DAGs. | C‑009 (Cycle detection depth handling) |

*All other risks from Phase 2B.1.12 (`R‑001` … `R‑012`) remain unchanged and are listed in the baseline file.*

---

*Prepared by Antigravity agent.*