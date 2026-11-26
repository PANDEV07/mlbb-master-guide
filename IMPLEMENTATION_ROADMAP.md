# IMPLEMENTATION ROADMAP – MLBB Master Guide

## Milestones

| Phase | Description | Status |
|-------|-------------|--------|
| 0 – Research Foundations | Conceptual docs, ADRs, architecture decisions | COMPLETED |
| 0.5 – Development Foundations | Build pipeline, lint, typecheck, CI setup | COMPLETED |
| 2A – Database Foundations | Supabase connection, migration, validation | COMPLETED |
| **2A.3.3 – Grants Verification & Security Sign‑Off** | Verify role usage, privileges, RLS, Data API; produce security sign‑off | **SECURITY_SIGN_OFF_APPROVED_WITH_WARNINGS** |
| 2B – Core Game Knowledge Schema | Design and ingest game knowledge tables, enable RLS, limited roles | IN_PROGRESS |

## Next Steps
- Resolve warnings: restrict privileges, enable Row‑Level Security before exposing APIs.
- Create dedicated application role with least‑privilege permissions.
- Activate Data API only after RLS and role hardening.
- Proceed to Phase 2B after approval.
