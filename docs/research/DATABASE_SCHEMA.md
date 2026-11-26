# DATABASE_SCHEMA — Spesifikasi Konseptual Final Skema Basis Data MLBB Master Guide

**Tanggal:** `2026-11-18`  
**Versi:** `2.0 (Phase 1.3 Frozen Conceptual Specification — Selaras ADR-001 s.d. ADR-010)`  
**Target Engine:** PostgreSQL `16+` + Drizzle ORM (`drizzle-kit` SQL migrations)  

> [!IMPORTANT]
> Dokumen ini adalah **spesifikasi konseptual final (Foundation Freeze)** dan peta jalan skema lintas fase:
> - **Implemented (Phase 2A — Offline DDL Ready):** 4 tabel foundational tata kelola (`patch_versions`, `patch_changes`, `sources`, `entity_evidences`) beserta 7 enum telah didefinisikan di `src/lib/db/schema/` dan menghasilkan migrasi `database/migrations/0000_fearless_post.sql` *(eksekusi ke server PostgreSQL live berstatus `NOT_RUN` hingga PostgreSQL host tersedia)*.
> - **Planned (Phase 2B–5):** Seluruh tabel domain Game Fundamentals, Hero, Item, Tactical Graph, Academy, dan Esports belum diimplementasikan.
> - **Deferred (Phase 7–8):** `claim_conflicts`, `verification_records`, `patch_impact_queue`, `team_compositions`, `users`, `user_learning_progress`, `telemetry_events`.

---

## 1. Prinsip Desain Final (Hasil Review Phase 1.2 & Klarifikasi Phase 1.3)

1. **Hybrid Temporal Model (`ADR-006`):**
   - **Stable Identity vs Versioned Profile:** Identitas permanen dipisahkan dari profil berversi patch pada entitas yang dirujuk FK secara luas (`heroes` + `hero_version_profiles`; `items` + `item_version_profiles`), sehingga `heroes.id` dan `items.id` tidak pernah berubah saat balance patch rilis.
   - **SCD Type 2 (`valid_from_patch_id`, `valid_until_patch_id`, `is_current`, `server_type`):** Diterapkan pada `hero_version_profiles`, `hero_skills`, `item_version_profiles`, `item_effects`, `item_components`, dan `game_fundamentals`.
   - **Patch Reference + `OUTDATED` Flag:** Diterapkan pada *derived knowledge* (`builds`, `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`, `academy_lessons`, `competitive_insights`, `pro_to_ranked_adaptations`).
   - **Change Log:** `patch_changes` mencatat diff eksplisit; tabel workflow `patch_impact_queue` **ditunda** (tidak dibuat di MVP — query `verification_status = 'OUTDATED'` sudah mencukupi).
2. **Hybrid Knowledge Provenance 2-Lapis (`ADR-005`):**
   - **Lapis 1 (Embedded Core Governance):** Kolom `claim_classification`, `verification_status`, `confidence_level`, `patch_version_id`, `verified_at`, `verified_by` langsung pada entitas utama untuk pembacaan cepat tanpa join wajib.
   - **Lapis 2 (Granular Multi-Source):** `sources` + `entity_evidences` (mendukung multi-sumber per aspek dan pencatatan konflik saat `verification_status = 'CONFLICTING'`).
   - **Penundaan:** `claim_conflicts` dan `verification_records` sebagai tabel terpisah ditunda hingga fase multi-kurator.
3. **Competitive Intelligence 5-Layer (`ADR-007`):**
   - `competitions -> competition_events -> tournament_stages -> matches -> match_games -> draft_actions + game_player_performances` dipisahkan tegas dari `tournament_hero_stats` (agregat parsial) dan lapisan observasi/interpretasi/adaptasi.
   - `tournament_groups`, `vod_records`, dan tabel terkomputasi `meta_trends` **disederhanakan/ditunda** (kolom `group_label` pada `matches`, kolom `vod_url` & `vod_verification_status` pada `competition_events`/`matches`/`match_games`, serta agregasi SQL untuk tren meta hingga Phase 7).
4. **Fundamentals, Academy, & Ranked (`ADR-008`):**
   - `game_modes` digabung ke `game_fundamentals`; `gameplay_concepts` & `academy_lessons` disatukan; `ranked_contexts` (`SOLO`, `DUO`, `TRIO`, `5-MAN`) disimpan di TypeScript; `pro_to_ranked_adaptations` menormalisasi metadata turnamen lewat FK ke `competitive_insights`.
5. **User, Auth, Progression, UGC, & Telemetry (`ADR-010`):** **Ditunda ke Phase 7–8.**

---

## 2. Evaluasi Final Entity Versioning (Hero vs Item vs Skill vs Fundamentals)

| Entitas | Model yang Dipilih | Alasan & Trade-off |
|---|---|---|
| **Hero** (`heroes` + `hero_version_profiles`) | **Identity terpisah + SCD Type 2 Version Profile** | `heroes` (`id`, `slug`, `official_name`, `title`, `release_date`) stabil permanen karena dirujuk FK oleh `builds`, `hero_matchups`, `hero_counters`, `hero_synergies`, `draft_actions`, `game_player_performances`, dan `hero_skills`. Seluruh data yang dapat berubah karena patch atau revamp (`primary_role`, `secondary_role`, `specializations`, `damage_type`, `resource_type`, `difficulty_rating`, `viable_lanes`, `base_stats_json`, `power_spikes_json`, `strengths`, `weaknesses`, `early/mid/late_game_role`, `skill_priority`) berada di `hero_version_profiles`. |
| **Item** (`items` + `item_version_profiles`) | **Identity terpisah + SCD Type 2 Version Profile** | **Menghindari ambiguitas `items` vs `item_version_profiles`:** `items` (`id`, `slug`, `official_name`) adalah identitas stabil yang dirujuk FK oleh `build_items`, `item_counters`, `item_components`, dan `game_player_performances`. Jika SCD Type 2 ditaruh langsung di `items`, maka `items.id` akan berubah setiap harga item naik/turun dan merusak FK. `item_version_profiles` menyimpan `category`, `tier`, `total_cost`, `combine_cost`, `stats_json`, `patch_version_id`, `server_type`, `valid_from_patch_id`, `valid_until_patch_id`, `is_current`; sedangkan `item_effects` & `item_components` merujuk ke `item_version_profile_id` (atau `item_id` + rentang patch). |
| **Hero Skills** (`hero_skills`) | **SCD Type 2 tunggal dengan kunci logis `(hero_id, slot_key)`** | Tidak perlu tabel `hero_skill_identities` terpisah karena tidak ada tabel eksternal yang menyimpan FK permanen ke baris skill tertentu; `hero_skills` sudah memegang FK stabil `hero_id` serta `slot_key` (`PASSIVE`, `SKILL_1`, `SKILL_2`, `ULTIMATE`, `SPECIAL`), `server_type`, `valid_from_patch_id`, `valid_until_patch_id`, `is_current`. *Trade-off:* jika suatu hari dibutuhkan relasi per-skill dari tabel lain, rujukan dapat memakai `(hero_id, slot_key)`. |
| **Game Fundamentals** (`game_fundamentals`) | **SCD Type 2 tunggal dengan kunci logis `slug`** | Tidak ada tabel anak eksternal yang memegang FK ke `game_fundamentals.id`; cukup satu tabel dengan `slug` stabil, `category` (`GAME_MODE` \| `MAP` \| `LANE` \| `JUNGLE` \| `OBJECTIVE` \| `MINION` \| `TOWER` \| `ECONOMY`), `server_type`, `valid_from_patch_id`, `valid_until_patch_id`, `is_current`. |

### Jaminan Rekonstruksi Historis (*Historical Reconstruction*)
Sistem **tidak** mengandalkan flag `OUTDATED` untuk menjawab pertanyaan historis:
- **Stats Hero/Item pada Patch $X$:** Query `hero_version_profiles` / `item_version_profiles` / `hero_skills` dengan kondisi `server_type = 'ORIGINAL_SERVER'` dan urutan patch `valid_from <= X AND (valid_until IS NULL OR valid_until > X)`.
- **Perbandingan Patch $X$ vs Patch $Y$:** Query langsung antara dua snapshot profil (`X` dan `Y`) plus daftar diff terstruktur pada `patch_changes`.
- **Build dari Patch Lama & Insight Usang:** Setiap `builds` dan `competitive_insights` selalu menyimpan `patch_version_id` tempat mereka dibuat/diverifikasi; membandingkannya terhadap `patch_versions.is_current_live` atau `verification_status = 'OUTDATED'` segera mengidentifikasi konten lama tanpa kehilangan konteks patch asalnya.
- **Konteks Patch Esports Historis:** `match_games.patch_version_id` mengikat setiap game turnamen ke patch aktual saat game itu dimainkan; UI `/esports` dapat me-join ke `hero_version_profiles` pada patch game tersebut, bukan patch live hari ini.

---

## 3. Aturan Provenance Inheritance (`ADR-005`)

Pewarisan provenance tidak bersifat universal. Matriks aturan per relasi induk-anak:

| Parent Entity | Child Entity | Inheritance Allowed | Rule |
|---|---|---|---|
| `item_version_profiles` | `item_effects` & `item_components` | `YES` *(Structural)* | Mewarisi `verification_status`, `confidence_level`, dan `entity_evidences` dari profil item induk bila bersumber dari deskripsi/resep in-game yang sama. |
| `builds` | `build_items` | `YES` *(Structural)* | Mewarisi sumber, patch, dan status verifikasi dari `builds` induknya. |
| `match_games` | `draft_actions` & `game_player_performances` | `CONDITIONAL` | Mewarisi provenance dari `match_games` **hanya jika** sumber game tersebut membuktikan draft/boxscore game terkait; dilarang diisi dari `tournament_hero_stats`. |
| `heroes` | `hero_skills` | `NO` | Terverifikasinya identitas `heroes` tidak otomatis memverifikasi angka scaling skill; `hero_skills` wajib memiliki status & bukti independen. |
| `heroes` / `items` | `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`, `builds` | `NO` | Seluruh *Derived Analysis* wajib memiliki alasan mekanis, `patch_version_id`, `confidence_level`, dan `verification_status` sendiri. |
| `match_games` | `match_observations` | `NO` | Skor `match_games` yang `VERIFIED` tidak membuat observasi otomatis `VERIFIED`; wajib menyertakan timestamp VOD / bukti observasi spesifik. |
| `match_observations` | `competitive_insights` | `NO` | `competitive_insights` tetap membutuhkan evidence, reasoning, classification, confidence, dan verification status sendiri. |
| `competitive_insights` | `pro_to_ranked_adaptations` | `NO` | Evaluasi kelayakan Solo/Duo/Trio/5-Man dinilai independen berdasarkan 7 dimensi Ranked. |
| `competition_events` | Aspek Event (`Pre-Event`, `Match`, `Draft`, `Stats`, `VOD`) | `NO` *(Per-Aspect)* | Masing-masing aspek dilacak terpisah via `entity_evidences` (`aspect_name`). |

---

## 4. Entity Catalog Final (25 Entitas Inti MVP + Phase 2–5)

### 4.1 Tata Kelola, Sumber, & Patch (`4` Entitas)
1. **`patch_versions`**: Master versi patch (`id`, `version_code`, `version_order`, `server_type` [`ORIGINAL_SERVER` | `ADVANCE_SERVER` | `EXPERIMENTAL`], `season_label`, `release_date`, `is_current_live`, `notes_summary`).
2. **`patch_changes`**: Diff terstruktur per patch (`id`, `patch_version_id`, `target_entity_type`, `target_entity_id`, `change_type` [`BUFF` | `NERF` | `ADJUST` | `REVAMP` | `NEW` | `BUGFIX`], `attribute_name`, `previous_value`, `new_value`, `summary`).
3. **`sources`**: Registry sumber (`id`, `name`, `domain`, `base_url`, `source_tier` [`TIER_1_OFFICIAL` | `TIER_2_SECONDARY` | `TIER_3_ANALYTICAL` | `TIER_4_COMMUNITY`], `source_category`, `reliability_notes`, `is_active`).
4. **`entity_evidences`**: Bukti granular per entitas & aspek (`id`, `entity_type`, `entity_id`, `aspect_name`, `source_id`, `source_url`, `claim_classification`, `verification_status`, `confidence_level`, `stance` [`SUPPORTING` | `CONFLICTING`], `evidence_excerpt`, `conflict_notes`, `verified_by`, `verified_at`, `patch_version_id`).

### 4.2 Game Fundamentals & Mechanics (`2` Entitas)
5. **`game_fundamentals`**: Mode permainan, peta, lane, jungle, Turtle/Lord, minion, tower, ekonomi (`id`, `slug` stabil, `category` [`GAME_MODE` | `MAP` | `LANE` | `JUNGLE` | `OBJECTIVE` | `MINION` | `TOWER` | `ECONOMY`], `title`, `search_keywords` *[ID/EN/komunitas]*, `mechanics_spec_json`, `timing_rules`, `summary`, `server_type`, `valid_from_patch_id`, `valid_until_patch_id`, `is_current`, + governance metadata).
6. **`game_mechanics`**: Kamus tag mekanika baku (`id`, `code`, `name`, `search_keywords` *[istilah ID/EN/komunitas]*, `mechanic_group` [`CROWD_CONTROL` | `DAMAGE_TYPE` | `DEFENSE_MITIGATION` | `MOBILITY` | `SUSTAIN` | `UTILITY`], `definition`, `interaction_rules`, `countered_by_mechanics`, + governance metadata).

### 4.3 Hero, Item, Emblem, Spell, & Tactical Graph (`13` Entitas)
7. **`heroes`**: Identitas master hero stabil (`id`, `slug`, `official_name`, `aliases` *[array/JSONB julukan, singkatan, istilah komunitas]*, `title`, `release_date`).
8. **`hero_version_profiles`**: Profil hero berversi patch (*SCD Type 2*: `id`, `hero_id`, `patch_version_id`, `server_type`, `primary_role`, `secondary_role`, `specializations`, `damage_type`, `resource_type`, `difficulty_rating`, `playstyle_summary`, `viable_lanes`, `base_stats_json`, `power_spikes_json`, `strengths`, `weaknesses`, `early_game_role`, `mid_game_role`, `late_game_role`, `skill_priority`, `valid_from_patch_id`, `valid_until_patch_id`, `is_current`, + governance metadata).
9. **`hero_skills`**: Skill & pasif hero berversi patch (*SCD Type 2*: `id`, `hero_id`, `slot_key` [`PASSIVE` | `SKILL_1` | `SKILL_2` | `ULTIMATE` | `SPECIAL`], `patch_version_id`, `server_type`, `name`, `description`, `damage_type`, `cooldown_by_level`, `cost_by_level`, `scaling_json`, `mechanic_tags`, `valid_from_patch_id`, `valid_until_patch_id`, `is_current`, + governance metadata).
10. **`hero_combos`**: Kombo skill hero (`id`, `hero_id`, `patch_version_id`, `combo_name`, `scenario_type`, `skill_sequence`, `battle_spell_optional`, `execution_notes`, `difficulty`, + governance metadata).
11. **`items`**: Identitas master item stabil (`id`, `slug`, `official_name`, `aliases` *[singkatan & istilah komunitas ID/EN, mis. BOD, DHS, anti-heal]*).
12. **`item_version_profiles`**: Profil & harga item berversi patch (*SCD Type 2*: `id`, `item_id`, `patch_version_id`, `server_type`, `category`, `tier`, `total_cost`, `combine_cost`, `stats_json`, `valid_from_patch_id`, `valid_until_patch_id`, `is_current`, + governance metadata).
13. **`item_components`**: Resep build path item (`id`, `parent_item_version_id`, `component_item_id`, `quantity`).
14. **`item_effects`**: Efek pasif unik/aktif item (`id`, `item_version_profile_id`, `effect_type` [`UNIQUE_PASSIVE` | `PASSIVE` | `ACTIVE`], `effect_name`, `unique_group_key`, `cooldown_seconds`, `description`, `mechanic_tags`, `timing_notes`).
15. **`emblems`** & **`battle_spells`** *(2 entitas)*: Master emblem/talent dan battle spell berversi patch (`id`, `slug`, `name`, `server_type`, `effects_json`, `cooldown_seconds`, `valid_from_patch_id`, `valid_until_patch_id`, `is_current`, + governance metadata).
16. **`hero_matchups`**: Duel terarah `subject_hero_id` vs `opponent_hero_id` per `lane` (`id`, `subject_hero_id`, `opponent_hero_id`, `lane`, `advantage_early`, `advantage_mid`, `advantage_late`, `power_spike_window`, `trading_notes`, `win_conditions`, `behind_plan`, `patch_version_id`, + governance metadata).
17. **`hero_counters`**: Counter hero berarah berbasis mekanik (`id`, `counter_hero_id`, `target_hero_id`, `target_mechanic_id`, `counter_strength`, `mechanic_reason`, `effectiveness_conditions`, `limitations`, `patch_version_id`, + governance metadata).
18. **`item_counters`**: Counter item terhadap hero/mekanik (`id`, `item_id`, `target_mechanic_id`, `target_hero_id` *(opsional)*, `counter_reason`, `buy_timing`, `limitations`, `patch_version_id`, + governance metadata).
19. **`hero_synergies`**: Sinergi & konflik draft antar-hero (`id`, `hero_a_id`, `hero_b_id`, `synergy_axis`, `composition_tags`, `compatibility_type` [`SYNERGY` | `ROLE_CONFLICT`], `reasoning`, `draft_conditions`, `patch_version_id`, + governance metadata).
20. **`builds`** & **`build_items`** *(2 entitas)*: Rekomendasi build kontekstual (`builds`: `id`, `hero_id`, `role`, `lane`, `target_matchup_hero_id`, `enemy_comp_tags`, `allied_comp_tags`, `game_state`, `strategic_objective`, `emblem_id`, `talent_ids`, `battle_spell_id`, `creator_source_id`, `patch_version_id`, `reasoning_summary`, + governance metadata; `build_items`: `id`, `build_id`, `slot_number`, `item_id`, `is_core`, `trigger_condition`, `reasoning`, `alternative_item_ids`).

### 4.4 Academy, Esports Intelligence, & Pro-to-Ranked (`12` Entitas)
21. **`academy_lessons`**: Kurikulum terstruktur Micro, Macro, dan strategi Ranked (`id`, `slug`, `domain` [`MICRO` | `MACRO` | `RANKED`], `topic_category`, `order_index`, `title`, `search_keywords` *[istilah ID/EN & komunitas]*, `learning_objectives`, `core_principle`, `execution_steps`, `common_mistakes`, `applicable_roles`, `patch_version_id`, + governance metadata). *(Catatan: 4 profil `ranked_contexts` (`SOLO`, `DUO`, `TRIO`, `5-MAN`) disimpan di konfigurasi TypeScript terstruktur per `ADR-008`.)*
22. **`competitions`**: Seri kompetisi induk (`id`, `name`, `region`, `tier`, `organizer_default`, `description`).
23. **`competition_events`**: Instansi turnamen per tahun/musim (`id`, `competition_id`, `official_name`, `season_label`, `event_status`, `existence_status`, `start_date`, `end_date`, `format_summary`, `qualification_path`, `prize_pool_text`, `vod_url`, `vod_verification_status`, `research_coverage`, + governance metadata).
24. **`tournament_stages`**: Tahapan event (`id`, `event_id`, `name`, `stage_type`, `format`, `start_date`, `end_date`).
25. **`teams`**, **`players`**, & **`team_rosters`** *(3 entitas)*: Organisasi tim (`name`, `short_tag`, `aliases`), profil pemain pro (`ign`, `aliases`, `real_name`, `primary_role`), dan roster per `competition_event_id`.
26. **`matches`**: Seri pertemuan antar dua tim (`id`, `stage_id`, `group_label`, `team_a_id`, `team_b_id`, `best_of`, `score_a`, `score_b`, `winner_team_id`, `scheduled_at`, `match_status`, `vod_url`, `vod_verification_status`, + governance metadata).
27. **`match_games`**: Game individual dalam satu `match` (`id`, `match_id`, `game_number`, `patch_version_id`, `blue_team_id`, `red_team_id`, `winner_team_id`, `duration_seconds`, `first_pick_team_id`, `vod_url`, `vod_verification_status`, + governance metadata).
28. **`draft_actions`**: Urutan Ban & Pick per `match_game` (`id`, `match_game_id`, `action_order`, `phase`, `action_type` [`BAN` | `PICK`], `team_side` [`BLUE` | `RED`], `team_id`, `hero_id`, `is_flex_pick`).
29. **`game_player_performances`**: Performa 10 pemain dalam satu `match_game` (`id`, `match_game_id`, `player_id`, `team_id`, `hero_id`, `assigned_lane`, `kills`, `deaths`, `assists`, `gold_earned`, `damage_dealt`, `emblem_id`, `battle_spell_id`, `final_item_ids`).
30. **`tournament_hero_stats`**: Statistik agregat hero per event/stage (`id`, `event_id`, `stage_id`, `hero_id`, `picks_count`, `bans_count`, `wins_count`, `blue_side_wins`, `red_side_wins`, `presence_rate`, + governance metadata).
31. **`match_observations`** & **`competitive_insights`** *(2 entitas)*: Layer 2 observasi terikat `match_game_id` & timestamp VOD; Layer 3 interpretasi strategis terikat `patch_version_id`. *(Layer 4 `Meta Trends` dilayani via query SQL agregasi terukur hingga Phase 7.)*
32. **`pro_to_ranked_adaptations`**: Layer 5 penerjemahan `competitive_insights` (`id`, `insight_id` FK, `patch_version_id`, `coordination_requirements`, `risk_analysis`, `solo_guidance_json`, `duo_guidance_json`, `trio_guidance_json`, `five_man_guidance_json`, `limitations`, + governance metadata). *(Tournament, Match, Game, Patch, Teams, Heroes diturunkan melalui FK `insight_id -> match_observations -> match_games -> matches -> competition_events` tanpa duplikasi kolom.)*

---

## 5. Ringkasan Relationship Catalog Final

| Relationship | Direction & Cardinality | Temporal & Provenance Rules |
|---|---|---|
| `heroes -> hero_version_profiles` | `1 : N` | `heroes.id` stabil; `hero_version_profiles` SCD Type 2 (`valid_from`..`valid_until`, `is_current`). |
| `heroes -> hero_skills` | `1 : N` | SCD Type 2 per `(hero_id, slot_key)`; status verifikasi independen dari `heroes`. |
| `items -> item_version_profiles` | `1 : N` | `items.id` stabil; `item_version_profiles` SCD Type 2; `item_effects` & `item_components` mewarisi provenance dari `item_version_profiles`. |
| `heroes -> builds -> build_items -> items` | `1 : N : M` | `builds` merujuk `patch_version_id` & `OUTDATED` flag; `build_items` mewarisi provenance `builds` dan memvalidasi `unique_group_key` item. |
| `heroes -> hero_matchups / hero_counters / hero_synergies` | `N : M` (berarah/kontekstual) | Tidak mewarisi status `VERIFIED` dari `heroes`; wajib punya status, alasan mekanis, dan `patch_version_id` sendiri. |
| `competitions -> competition_events -> tournament_stages -> matches -> match_games` | `1 : N` berjenjang | `match_games.patch_version_id` mengunci versi game historis (tidak pernah ditandai `OUTDATED` saat patch baru rilis). |
| `match_games -> draft_actions` & `game_player_performances` | `1 : N` | Mewarisi provenance dari `match_games` hanya bila sumber membuktikan level game; dilarang diisi dari tabel agregat `tournament_hero_stats`. |
| `match_games -> match_observations -> competitive_insights -> pro_to_ranked_adaptations` | `1 : N` / `N : M` | Setiap lapisan wajib dievaluasi status verifikasi & confidence-nya secara independen; perubahan patch menandai `competitive_insights` & `pro_to_ranked_adaptations` terkait menjadi `OUTDATED`. |
| `sources -> entity_evidences -> [Primary Entities]` | `1 : N : M` | Mendukung multi-sumber per aspek dan pencatatan `stance = 'CONFLICTING'` ketika sumber bertentangan. |

---

## 6. Dukungan Search Engine PostgreSQL (`ADR-004`)

Seluruh kebutuhan pencarian pada MVP dilayani oleh **PostgreSQL Full-Text Search (`tsvector` + indeks `GIN`) + `pg_trgm`** tanpa layanan search eksternal:
- **Entitas & Field yang Diindeks:**
  - `heroes.official_name` + `heroes.aliases` (nama hero, alias, singkatan, julukan komunitas)
  - `items.official_name` + `items.aliases` + `item_effects.effect_name` (nama item, singkatan umum, istilah efek seperti anti-heal/immortal)
  - `game_fundamentals.title` + `game_mechanics.name` + `academy_lessons.title` + `search_keywords` (terminologi gameplay dwibahasa Indonesia & Inggris serta istilah komunitas seperti *freeze lane*, *cutting*, *retri*, *roam*, *peeling*)
  - `patch_versions.version_code` + `patch_changes.summary` (pencarian patch & perubahan)
  - `competitions.name`, `competition_events.official_name`, `teams.name`/`short_tag`/`aliases`, `players.ign`/`aliases` (pencarian turnamen, tim, dan pemain pro)
- **Toleransi Typo:** Indeks trigram `pg_trgm` (`GIN`/`GiST`) pada kolom nama utama dan alias menangani salah ketik umum (*common typos*).
- **Filter Governance:** Query pencarian di Search Repository wajib memfilter `server_type = 'ORIGINAL_SERVER'` secara default serta mengembalikan `verification_status` & `patch_version` pada setiap hasil.
