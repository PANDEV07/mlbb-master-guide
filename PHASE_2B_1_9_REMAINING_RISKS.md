# Phase 2B.1.9 – Remaining Risks

| Risk ID | Description | Status | Mitigation / Note |
|--------|-------------|--------|-------------------|
| R‑013 | Administrator may deliberately disable triggers before a bulk `COPY`. | **MITIGATED** – Policy added; requires superuser audit and logging of any `DISABLE TRIGGER` statements. |
| R‑014 | Global advisory lock may become a bottleneck under heavy concurrent recipe updates. | **PARTIAL** – Acceptable for MVP; monitor lock contention and consider finer‑grained locks in a later release. |
| R‑015 | Reviewer metadata may still be missing for system‑generated status changes. | **PARTIAL** – `reviewer_id` is nullable; source recorded as `system` when no reviewer is supplied. |
| R‑016 | Recursive historical recipe‑pricing engine exists only as conceptual pseudocode; no materialised view or function is deployed. | **NOT_VERIFIABLE** – Requires implementation and testing before it can be considered reliable. |
| R‑017 | Depth‑limited recursive CTE for cycle detection may miss cycles deeper than the configured limit. | **PARTIAL** – Depth limit (e.g., 10) chosen conservatively; can be increased after performance testing. |
| R‑018 | Potential dead‑lock risk when multiple services attempt to acquire the global advisory lock simultaneously. | **PARTIAL** – Use a retry‑with‑backoff strategy in the stored procedures that acquire the lock. |

All other risks identified in earlier phases remain unchanged.

*Prepared by Antigravity agent.*