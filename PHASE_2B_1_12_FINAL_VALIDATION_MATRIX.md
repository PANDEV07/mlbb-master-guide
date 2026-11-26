# Phase 2B.1.12 – Final Validation Matrix

| Claim ID | Aspect | Review result | Evidence / Comment |
|----------|--------|----------------|--------------------|
| **C‑001** | PatchVersion primary‑key stability & composite foreign‑key | **PASS** | Primary key unchanged; `UNIQUE(patch_version, server_version)` added; `KEY SHARE` lock semantics verified conceptually. |
| **C‑002** | ClaimVerificationHistory – FK, reviewer handling, atomic trigger | **PASS** | FK now `ON DELETE RESTRICT`; trigger uses `IS DISTINCT FROM`, handles missing reviewer, records `reviewer_source` and optional `failure_reason`. |
| **C‑003** | Historical recipe pricing – no double‑counting of combine cost | **PARTIAL** | Algorithm uses `combine_cost * usage_quantity` per usage; distinct‑sum removed. Not yet materialised as a view/function, therefore **PARTIAL**. |
| **C‑004** | Recipe DAG mutation with global advisory lock | **PASS** | Explicit stored procedures defined; lock key constant; cycle detection covers indirect cycles; depth‑limit enforced. |
| **C‑005** | COPY FROM trigger behaviour | **PASS** | Documentation unchanged; still accurate. |
| **C‑006** | Append‑only guarantee for claim verification history | **PASS** | Two `BEFORE` triggers reject UPDATE/DELETE; privilege model described. |
| **C‑007** | Trust boundary for `my.reviewer` | **PASS** | Policy defined; only trusted backend may set the variable; fallback to `'system'`. |
| **C‑008** | Pricing engine implementation status | **NOT_VERIFIABLE** | Algorithm defined only as pseudocode; no compiled SQL or runtime test. |
| **C‑009** | Cycle detection depth handling (DAG) | **NOT_VERIFIABLE** | Depth‑limit guard described but not exercised against a live DB. |

**Classification legend**
- **PASS** – design reviewed and logically sound; no open contradictions.
- **PARTIAL** – conceptually complete but not yet materialised or fully tested.
- **NOT_VERIFIABLE** – cannot be confirmed without actual execution.

*Prepared by Antigravity agent.*