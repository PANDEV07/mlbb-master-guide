# Phase 2B.1.8 – Updated Remaining Risks

| Risk ID | Description | Status | Mitigation / Note |
|---------|-------------|--------|-------------------|
| R‑013 | COPY FROM may bypass row‑level triggers when `DISABLE_TRIGGERS` is used. | **MITIGATED** – Documentation corrected; triggers fire by default. |
| R‑014 | Contention on `patch_version` + `server_version` composite FK may cause dead‑locks under heavy concurrent profile creation. | **PARTIAL** – Advisory lock (`FOR KEY SHARE`) provided by FK; consider application‑level retry logic. |
| R‑015 | Reviewer metadata missing for some claim verifications (null `reviewer_id`). | **PARTIAL** – Column now nullable; audit relies on session variable `my.reviewer` when not supplied. |
| R‑016 | Advisory lock key collision risk when generating lock key for DAG control (hash may overflow). | **PARTIAL** – Use 64‑bit combination of ordered UUIDs; monitor for rare collisions. |
| R‑017 | Cycle detection only checks immediate reciprocal edge; deeper indirect cycles still require application‑level validation. | **PARTIAL** – Trigger prevents direct A↔B cycles; longer cycles must be caught by business logic. |

All other previously identified risks remain unchanged.

*Prepared by Antigravity agent.*