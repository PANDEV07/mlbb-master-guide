# PHASE 2B — READINESS & PLANNING

## Scope & Priorities
The Phase 2B effort will focus on extending the knowledge base for Mobile Legends: Bang Bang (MLBB) while keeping the database secure.  Priorities are ordered from core to optional:
1. **Core game fundamentals** – basic entities such as heroes, roles, and core attributes.
2. **Hero knowledge schema** – detailed hero profiles, stats, and progression.
3. **Hero skills & mechanics** – skill definitions, cooldowns, scaling formulas.
4. **Items & components** – item catalog, component relationships, build paths.
5. **Emblems & battle spells** – supplemental gameplay modifiers.
6. **Patch‑aware historical data** – versioned records of changes per game patch.
7. **Source provenance & evidence** – tracking original data sources, verification tiers, and evidence links.
8. **Verified ingestion workflow** – design of server‑side pipelines that validate and store data before it becomes part of the public knowledge set.

## Design Requirements for the Schema
The upcoming schema must support:
- **Stable entity identity** – each entity (hero, item, etc.) has a permanent UUID.
- **Versioned entity profiles** – ability to store multiple versions of an entity tied to a specific `patch_version`.
- **Patch history linkage** – `patch_versions` table (already present) will be referenced by all versioned records.
- **Source attribution** – foreign‑key to `sources` and `entity_evidences` for every factual claim.
- **Verification status** – fields for `verification_status` and `confidence_level` per record.
- **Historical reconstruction** – queries must be able to reconstruct the knowledge state for any past patch.
- **Relationships** – many‑to‑many links (e.g., hero ↔ item builds, skill ↔ hero, emblem ↔ hero) modelled via join tables.

## Non‑Functional Constraints
- **No database changes** will be made until the security hardening checklist is completed (RLS, grant reduction, custom app role).
- **No public API** exposure until the above security measures are in place.
- All **ingestion** will be performed by server‑side workflows using the administrative `postgres` credential or a future least‑privilege application role.
- Documentation must retain all historical findings from Phase 2A; no removal of prior audit notes.

## Deliverables (Planning Phase)
- Updated **ER diagram** (Mermaid) outlining the extended schema.
- Draft **ingestion pipeline specification** (data sources, validation steps, transformation rules).
- **Security hardening checklist** for Phase 2B (RLS policies, grant reduction, custom role creation).
- Timeline and task breakdown for implementation (to be added later via `/schedule` or roadmap). 

*No database objects are created at this stage; this file only defines the plan.*