# Schema Reference Folder (`database/schema/`)

Definisi skema Drizzle ORM berada pada `src/lib/db/schema/` dan menghasilkan berkas migrasi `.sql` eksplisit di `database/migrations/` (`drizzle.config.ts`). Rujukan desain lengkap terdapat di `docs/research/DATABASE_SCHEMA.md` dan `docs/architecture/DATABASE_SCHEMA_GOVERNANCE.md`.

## Status Implementasi Skema per Fase
- **`IMPLEMENTED` (Phase 2A — Foundational Governance & Patch):**
  - Enums (`src/lib/db/schema/enums.ts`): `server_type_enum`, `patch_change_type_enum`, `source_tier_enum`, `claim_classification_enum`, `verification_status_enum`, `confidence_level_enum`, `evidence_stance_enum`
  - Tabel (`src/lib/db/schema/governance.ts`): `patch_versions`, `patch_changes`, `sources`, `entity_evidences` *(migrasi SQL: `database/migrations/0000_fearless_post.sql`; belum dieksekusi ke host live)*
- **`PLANNED` (Phase 2B — Game Fundamentals, Hero, & Item):**
  - `game_fundamentals`, `game_mechanics`, `heroes`, `hero_version_profiles`, `hero_skills`, `hero_combos`, `items`, `item_version_profiles`, `item_components`, `item_effects`, `emblems`, `battle_spells`
- **`PLANNED` (Phase 3 — Tactical Graph):**
  - `builds`, `build_items`, `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`
- **`PLANNED` (Phase 4–5 — Esports Intelligence, Academy, & Pro-to-Ranked):**
  - `competitions`, `competition_events`, `tournament_stages`, `teams`, `players`, `team_rosters`, `matches`, `match_games`, `draft_actions`, `game_player_performances`, `tournament_hero_stats`, `match_observations`, `competitive_insights`, `academy_lessons`, `pro_to_ranked_adaptations`
- **`DEFERRED` (Phase 7–8 per `ADR-005`/`ADR-006`/`ADR-010`):**
  - `claim_conflicts`, `verification_records`, `patch_impact_queue`, `team_compositions`, `meta_trends` (materialized), `users`, `user_learning_progress`, `knowledge_submissions`, `telemetry_events`
