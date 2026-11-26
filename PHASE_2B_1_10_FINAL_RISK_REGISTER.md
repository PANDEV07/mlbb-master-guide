# Phase 2B.1.10 – Final Risk Register

| Risk ID | Description | Status | Mitigation / Note |
|--------|-------------|--------|-------------------|
| R‑013 | Administrator may disable triggers before a bulk `COPY`. | **MITIGATED** – policy requires superuser audit and logging of any `DISABLE TRIGGER` statements. |
| R‑014 | Global advisory lock may become a bottleneck under heavy concurrent recipe updates. | **PARTIAL** – acceptable for MVP; monitor lock contention and consider finer‑grained locks later. |
| R‑015 | Reviewer metadata may still be missing for system‑generated status changes. | **PARTIAL** – `reviewer_id` nullable; source recorded as `system` when not supplied. |
| R‑016 | Recursive historical pricing engine exists only as conceptual pseudocode; no materialised view/function yet. | **NOT_VERIFIABLE** – requires implementation and testing before it can be considered reliable. |
| R‑017 | Depth‑limited recursive CTE for cycle detection may miss very deep cycles. | **PARTIAL** – depth limit (e.g., 10) chosen conservatively; can be increased after performance testing. |
| R‑018 | Possible dead‑lock risk when many services contend for the global advisory lock simultaneously. | **PARTIAL** – use retry‑with‑backoff strategy in stored procedures that acquire the lock. |
| R‑019 | Composite FK on `patch_version` + `server_version` may introduce accidental duplicate entries if data is not cleaned before adding the UNIQUE constraint. | **PARTIAL** – a data‑quality audit should run before applying the UNIQUE constraint; migration plan documented in `PROJECT_STATUS.md`. |

All other risks identified in earlier phases remain unchanged.

*Prepared by Antigravity agent.*