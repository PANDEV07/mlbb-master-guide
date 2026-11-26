# ARCHITECTURE_FOUNDATION_FREEZE — Referensi Utama Arsitektur MLBB Master Guide (Phase 2–8)

**Tanggal Freeze:** `2026-11-18`  
**Fase Penetapan:** `Phase 1.3 — Architecture Approval & Foundation Freeze`  
**Status:** **`FROZEN_BASELINE`** *(Mengacu pada `ARCHITECTURE_DECISION_REGISTER.md`: `ADR-001` s.d. `ADR-009` `APPROVED`, `ADR-010` `DEFERRED`)*

Dokumen ini merupakan **single source of truth** arsitektur teknis untuk seluruh implementasi mulai **Phase 2A hingga Phase 8**. Perubahan terhadap keputusan yang telah dibekukan di bawah ini dilarang dilakukan secara diam-diam dan wajib melewati proses *Architecture Decision Proposal*.

---

## 1. System Architecture

- **Gaya Arsitektur (`ADR-001`):** **Modular Monolith** di dalam satu aplikasi **Next.js 15 App Router** dengan **TypeScript (`strict: true`)** dan Tailwind CSS v4. Microservices ditolak pada tahap awal.
- **Database & Driver (`ADR-002`):** **PostgreSQL 16+ standar** terhubung melalui `DATABASE_URL` portabel (hosting fleksibel; dilarang mengikat logika bisnis pada SDK proprietary cloud provider).
- **ORM & Migrasi (`ADR-003`):** **Drizzle ORM** dan **`drizzle-kit`** dengan berkas migrasi `.sql` eksplisit yang dapat diaudit di `database/migrations/`.
- **Arsitektur Repository & Service (`ADR-009`):**
  - Seluruh akses data lintas-domain wajib melewati **Shared Canonical Repositories** (`src/services/repositories/`).
  - Feature modules (`src/features/*`) dan komponen halaman (`src/app/*`) **dilarang** melakukan query SQL/Drizzle langsung ke tabel milik domain lain.
  - Repository kanonik menegakkan filter default `server_type = 'ORIGINAL_SERVER'` dan `is_current = true`.

---

## 2. Database Principles

- **Relational First:** Seluruh relasi entitas inti (Hero, Skill, Item, Build, Counter, Matchup, Synergy, Competition, Match, Game, Draft, Source) dimodelkan dengan tabel relasional ketat dan `FOREIGN KEY`. Graph database (Neo4j) ditolak (`ADR-002`).
- **Penggunaan `JSONB` Terbatas:** `JSONB` hanya dipakai untuk payload heterogen atau fleksibel yang tervalidasi tipe TypeScript (`base_stats_json`, `scaling_json`, `stats_json`, `effects_json`, `power_spikes_json`, `solo/duo/trio/five_man_guidance_json`, `aliases`).
- **Explicit Constraints:** Unik `slug`, check constraint nilai enum status/tier/server, indeks parsial pada `is_current = true`, dan pencegahan duplikasi `unique_group_key` pasif item pada validasi build.
- **Stable Entity Identity vs Temporal Versioning (`ADR-006`):**
  - `heroes` dan `items` menyimpan identitas stabil permanen (`id`, `slug`, `official_name`, `aliases`).
  - Data patch-sensitive memakai **SCD Type 2** (`valid_from_patch_id`, `valid_until_patch_id`, `is_current`, `server_type`) pada `hero_version_profiles`, `hero_skills`, `item_version_profiles`, `item_effects`, `item_components`, `emblems`, `battle_spells`, dan `game_fundamentals`.
  - *Derived knowledge* (`builds`, `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`, `academy_lessons`, `competitive_insights`, `pro_to_ranked_adaptations`) menyimpan `patch_version_id` asal + status `OUTDATED` tanpa menghapus konteks patch asalnya.
  - Rekonstruksi historis Patch $X$ maupun perbandingan Patch $X$ vs $Y$ dilakukan lewat rentang `valid_from_patch_id`/`valid_until_patch_id` dan `patch_changes` (bukan bergantung pada flag `OUTDATED`), tanpa `patch_impact_queue` di MVP.
- **Audit-Ready SQL Migrations:** Tidak ada perubahan skema ad-hoc langsung ke database tanpa berkas migrasi `.sql` di `database/migrations/`.

---

## 3. Knowledge Governance

- **Source Verification Policy (`ADR-005`, `SOURCE_VERIFICATION_POLICY.md`):**
  - Hierarki 4 tier: `TIER_1_OFFICIAL` (klien/rilis resmi MLBB, MOONTON, penyelenggara/liga/VOD resmi), `TIER_2_SECONDARY` (Liquipedia, media/database bereputasi), `TIER_3_ANALYTICAL` (analisis profesional), `TIER_4_COMMUNITY` (forum, Reddit, kreator, blog).
  - URL redirect sementara (seperti Google Grounding) dan tautan kanal umum tanpa playlist/video spesifik berstatus `UNVERIFIED`.
- **Hybrid 2-Layer Evidence Model (`ADR-005`):**
  - Lapis 1: Metadata governance tersemat di entitas utama (`claim_classification`, `verification_status`, `confidence_level`, `patch_version_id`, `verified_at`, `verified_by`).
  - Lapis 2: `sources` + `entity_evidences` (mendukung multi-sumber per aspek dan `stance = 'CONFLICTING'` + `conflict_notes`).
  - *Provenance Inheritance:* Tidak universal; hanya diizinkan untuk anak struktural atomik dari bukti yang sama (`item_components`/`item_effects`, `build_items`, dan kondisional `draft_actions`/`game_player_performances` dari `match_games`). Klaim analitis (`hero_skills`, `matchups`, `counters`, `builds`, `match_observations`, `competitive_insights`, `pro_to_ranked_adaptations`) wajib berstatus independen.
- **Taksonomi Final:**
  - `claim_classification`: `OFFICIAL_FACT`, `SECONDARY_SOURCE`, `RESEARCH_BASED_ANALYSIS`, `STRATEGIC_INTERPRETATION`, `COMMUNITY_THEORY`, `UNKNOWN`.
  - `verification_status`: `VERIFIED`, `PARTIALLY_VERIFIED`, `UNVERIFIED`, `OUTDATED`, `CONFLICTING`, `UNKNOWN`, `NOT_RESEARCHED`, `NOT_YET_AVAILABLE`, `NOT_FOUND`.
  - `confidence_level`: `HIGH`, `MEDIUM`, `LOW`.
- **Patch Awareness & Server Default:** `ORIGINAL_SERVER` selalu menjadi default tampilan publik; `ADVANCE_SERVER` dan `EXPERIMENTAL` diisolasi penuh.

---

## 4. Product Boundaries (`ADR-009`)

12 modul logis dengan pemisahan kepemilikan data tunggal (*zero duplication*) diuraikan penuh di [PRODUCT_ARCHITECTURE.md](PRODUCT_ARCHITECTURE.md):
1. **Heroes** (`/heroes`) — `heroes`, `hero_version_profiles`, `hero_skills`, `hero_combos`
2. **Items** (`/items`) — `items`, `item_version_profiles`, `item_components`, `item_effects`, `emblems`, `battle_spells`
3. **Builds** (`/builds`) — `builds`, `build_items`
4. **Matchups** (`/matchups`) — `hero_matchups`
5. **Counters** (`/counters`) — `hero_counters`, `item_counters`
6. **Synergies** (`/counters` + `src/features/synergies/`) — `hero_synergies`
7. **Academy** (`/academy`) — `game_fundamentals`, `academy_lessons` (`MICRO` & `MACRO`)
8. **Ranked** (`/academy` / sub-rute `/academy/ranked` + `src/features/ranked/`) — `pro_to_ranked_adaptations` + `ranked_contexts` (TS)
9. **Esports** (`/esports`) — `competitions`, `competition_events`, `tournament_stages`, `teams`, `players`, `team_rosters`, `matches`, `match_games`, `draft_actions`, `game_player_performances`, `tournament_hero_stats`, `match_observations`, `competitive_insights`
10. **Patches** (`/patches`) — `patch_versions`, `patch_changes`
11. **Search** (`/search`) — query repository lintas entitas (tanpa tabel konten sendiri)
12. **Knowledge Sources** (lapisan lintas halaman + opsi `/sources`) — `sources`, `entity_evidences`, `game_mechanics`

Navigasi antarmuka utama dipertahankan ringkas (10 rute inti di sidebar) meskipun arsitektur kode memisahkan 12 domain logis.

---

## 5. Competitive Intelligence (`ADR-007`)

- **Hierarki Wajib:** `competitions` $\rightarrow$ `competition_events` $\rightarrow$ `tournament_stages` $\rightarrow$ `matches` (`group_label`) $\rightarrow$ `match_games` $\rightarrow$ `draft_actions` + `game_player_performances`.
- **Pemisahan Fakta vs Agregat:** `draft_actions` (urutan Ban/Pick per game) dipisahkan total dari `tournament_hero_stats` (agregat turnamen parsial). Dilarang merekonstruksi urutan draft per-game dari data agregat.
- **5-Layer Separation:** (1) *Match/Game Facts* $\rightarrow$ (2) *Observations* $\rightarrow$ (3) *Strategic Interpretation* $\rightarrow$ (4) *Meta Trends* (agregasi SQL lintas banyak game di MVP) $\rightarrow$ (5) *Pro-to-Ranked Adaptation* (19 komponen wajib & evaluasi 7 dimensi `SOLO`/`DUO`/`TRIO`/`5-MAN`).
- Fakta historis `match_games` dan `match_observations` tidak ditandai `OUTDATED` saat patch baru terbit.

---

## 6. Search (`ADR-004`)

- **Engine MVP:** **PostgreSQL Full-Text Search (`tsvector` + `GIN`) + `pg_trgm`**.
- **Cakupan Wajib:**
  - Nama & alias hero (`heroes.official_name`, `heroes.aliases`)
  - Nama & singkatan item (`items.official_name`, `items.aliases`, `item_effects.effect_name`)
  - Terminologi gameplay dwibahasa Indonesia & Inggris serta istilah komunitas (`search_keywords`)
  - Toleransi kesalahan ketik umum (*common typos* via `pg_trgm`)
  - Pencarian patch & perubahan (`patch_versions`, `patch_changes`)
  - Pencarian turnamen, tim, dan pemain (`competitions`, `competition_events`, `teams`, `players`)

---

## 7. Deferred Decisions

Komponen berikut **dilarang** dibangun pada Phase 2A–6 dan ditunda hingga Phase 7–8 atau terbukti secara teknis (`ADR-004`, `ADR-005`, `ADR-006`, `ADR-010`):
- Authentication & manajemen akun (`users`, `curator_profiles`)
- User learning progression (`user_learning_progress`)
- User-generated content & moderasi komunitas (`knowledge_submissions`, `community_notes`)
- Telemetry & behavioral analytics (`telemetry_events`)
- Tabel terpisah `claim_conflicts`, `verification_records`, `patch_impact_queue`, `tournament_groups`, `vod_records`, `team_compositions`, dan materialized `meta_trends`
- Graph database (`Neo4j`) & external search engine (`Elasticsearch`, `Meilisearch`, `Typesense`, `Algolia`)
- Microservices, message broker (`Redis/BullMQ`), automated AI fact ingestion, dan infrastruktur analytics terpisah (`ClickHouse`/`BigQuery`).

---

## 8. Implementation Constraints

1. Seluruh implementasi Phase 2A–8 wajib mematuhi **Foundation Freeze** ini dan aturan *Zero Fake Data* di [AGENTS.md](../../AGENTS.md).
2. `CURRENT_GAME_RESEARCH.md` yang saat ini berstatus `UNVERIFIED` tetap menjadi blocker untuk Phase 2B (*Game Data Ingestion*), namun **Phase 2A** (*Governance, Patch Versioning, & Drizzle Infrastructure*) dapat dimulai setelah Phase 1.3 disetujui.
3. Apabila di tengah implementasi ditemukan kebutuhan baru yang bertentangan dengan keputusan dalam dokumen ini:
   - **Langkah 1:** Dokumentasikan masalah secara eksplisit (*Problem*).
   - **Langkah 2:** Evaluasi alternatif teknis (*Alternatives & Trade-offs*).
   - **Langkah 3:** Ajukan *Architecture Decision Proposal* baru untuk disetujui pemilik proyek.
   - **Larangan:** Dilarang mengubah fondasi arsitektur, mengganti stack, atau menambah tabel di luar freeze secara diam-diam.
