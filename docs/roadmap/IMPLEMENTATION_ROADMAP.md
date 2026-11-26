# IMPLEMENTATION_ROADMAP — Peta Jalan Implementasi Berbasis Ketergantungan Arsitektur

**Tanggal:** `2026-11-18`  
**Versi:** `1.0 (Phase 1.1 Recovery — Menunggu Review)`  
**Prinsip Penyusunan:** Urutan fase ditentukan ketat oleh **ketergantungan teknis dan integritas data**, bukan berdasarkan fitur yang terlihat paling menarik.

---

## 1. Peta Ketergantungan Fase (*Dependency Graph*)

```text
[Phase 0 & 0.5/0.5.1: Project & Research Recovery]
        |
        v
[Phase 1: Knowledge & Schema Validation Gate]  <-- (SAAT INI: Validasi & Review)
        |
        v
[Phase 2A: Data Integrity, Provenance, & Patch Versioning Infrastructure (DB + Core Services)]
        |
        v
[Phase 2B: Core Game Knowledge — Fundamentals, Hero Intelligence, Item Intelligence]
        |
        +-------------------------------------------+
        |                                           |
        v                                           v
[Phase 3: Tactical Graph —               [Phase 4: Competitive Esports Intelligence]
 Matchups, Counters, Synergies, Builds]   (Series -> Event -> Stage -> Match -> Game -> Obs/Insight)
        |                                           |
        +---------------------+---------------------+
                              |
                              v
[Phase 5: Gameplay Academy (Micro/Macro) & Pro-to-Ranked Adaptation (Solo/Duo/Trio/5-Man)]
                              |
                              v
[Phase 6: Unified Knowledge Search & Discovery Engine]
                              |
                              v
[Phase 7: Decision Intelligence — Draft Assistant, Situational Builder, & Meta Analytics]
                              |
                              v
[Phase 8: Player Learning Progression & Curated Community Contribution Pipeline]
```

### Mengapa Urutan Ini Dipilih (Evaluasi Ketergantungan)
1. **Data Integrity, Source/Provenance, dan Patch/Versioning** *wajib* dibangun sebelum Hero/Item karena setiap baris hero dan item di PostgreSQL memerlukan foreign key ke `patch_versions` dan `entity_evidences`.
2. **Game Fundamentals + Hero + Item** *wajib* mendahului **Matchup, Counter, Synergy, dan Build** karena build, counter, dan matchup mereferensikan `hero_id`, `item_id`, `emblem_id`, `battle_spell_id`, dan `game_mechanics`.
3. **Competitive Esports Intelligence** dapat dibangun paralel setelah **Core Infrastructure + Hero/Item** tersedia (karena `draft_actions` dan `tournament_hero_stats` mereferensikan `hero_id` dan `patch_version_id`), dan **wajib** selesai sebelum **Pro-to-Ranked Adaptation** (karena adaptasi ranked bergantung pada `competitive_insights` terverifikasi).
4. **Search** baru bermakna setelah entitas inti (`Hero`, `Item`, `Build`, `Academy`, `Esports`, `Patch`) memiliki skema dan data terindeks.
5. **Recommendation Systems (Draft/Build Assistant), Analytics, dan Player Learning Progression** ditempatkan di akhir karena seluruhnya mengonsumsi graf pengetahuan, data taktis, dan modul kurikulum dari fase-fase sebelumnya.

---

## 2. Rincian Fase, Deliverables, Kriteria Validasi, & Stop Condition

### Phase 0 & 0.5 / 0.5.1 — Project & Research Foundation *(Fondasi & Recovery)*
- **Tujuan:** Menyiapkan repositori Next.js/TypeScript/Tailwind yang tervalidasi serta menyusun seluruh dokumen arsitektur pengetahuan, skema konseptual, dan kebijakan riset.
- **Dependencies:** Tidak ada.
- **Deliverables:** `README.md`, `AGENTS.md`, `PROJECT_STATUS.md`, skeleton 10 rute bebas data palsu, `npm run typecheck/lint/build` lulus (`Phase 0.5.1`), serta 8 dokumen recovery `Phase 1.1`.
- **Validation Criteria:** Build/lint/typecheck lulus; seluruh dokumen arsitektur & riset saling konsisten tanpa URL tebakan.
- **Stop Condition:** Berhenti untuk audit dan review dokumentasi sebelum menyentuh SQL/database.

### Phase 1 — Knowledge Architecture & Data Model Validation *(Gate Review — `APPROVED` di Phase 1.3)*
- **Tujuan:** Memvalidasi penuh kesesuaian `KNOWLEDGE_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `SOURCE_VERIFICATION_POLICY.md`, `PATCH_UPDATE_SYSTEM.md`, `COMPETITIVE_MATCH_ANALYSIS_FRAMEWORK.md`, `PRO_TO_RANKED_ADAPTATION.md`, dan `PRODUCT_ARCHITECTURE.md`, serta menetapkan Architecture Decision Register (`ADR-001` s.d. `ADR-010`).
- **Dependencies:** Dokumen lengkap dari Phase 0 / 1.1.
- **Deliverables:** `PHASE_1_2_ARCHITECTURE_DECISION_REVIEW.md`, `ARCHITECTURE_DECISION_REGISTER.md`, dan `PHASE_1_3_ARCHITECTURE_FREEZE.md`.
- **Validation Criteria:** Tidak ada *critical gap* P0 terbuka pada model entitas, relasi, provenance inheritance, maupun temporal patch.
- **Stop Condition:** Foundation Freeze ditetapkan sebelum menulis migrasi SQL di Phase 2A.

### Phase 2A — Database, Data Integrity, Provenance, & Patch Infrastructure *(Implemented Offline; Live DB Execution Pending Host)*
- **Tujuan:** Mengimplementasikan fondasi PostgreSQL (`src/lib/db/` & `database/migrations/`) menggunakan **Drizzle ORM + `drizzle-kit`** untuk tata kelola inti: `patch_versions`, `patch_changes`, `sources`, `entity_evidences` *(sesuai `ADR-005` & `ADR-006`, tanpa `claim_conflicts`, `verification_records`, maupun `patch_impact_queue` di MVP)*, serta membangun **Shared Canonical Repositories** dan memperbarui kontrak TypeScript di `src/types/knowledge.ts` dan `src/services/`.
- **Dependencies:** Persetujuan Phase 1.3 Foundation Freeze; penyiapan `DATABASE_URL` PostgreSQL `16+` untuk eksekusi migrasi live.
- **Deliverables:** Skema Drizzle & migrasi `.sql` awal (`0000_fearless_post.sql`), dokumen `DATABASE_SCHEMA_GOVERNANCE.md`, aturan *Provenance Inheritance* pada `governanceRepository.ts`, kontrak TypeScript strict, serta skrip validasi `db:generate`, `db:migrate`, `db:check`, `db:validate`, `db:studio`.
- **Validation Criteria:** `typecheck`, `lint`, `build`, dan validasi skema/migrasi offline lulus; eksekusi `npm run db:migrate` dan `npm run db:check` lulus terhadap PostgreSQL live saat host tersedia.
- **Stop Condition:** Verifikasi fondasi database selesai sebelum mengimpor entitas game di Phase 2B.

### Phase 2B — Core Knowledge Modules (Game Fundamentals, Hero Intelligence, Item Intelligence)
- **Tujuan:** Memodelkan, meriset terverifikasi dari klien *Original Server* resmi, dan mengimpor data **Game Fundamentals**, **Hero Intelligence** (profil berversi, skill, scaling, combo, spike, aliases), **Item Intelligence** (profil berversi, stat, komponen/resep, pasif unik, aktif, aliases), **Emblems**, dan **Battle Spells** ke database serta menampilkannya di `/heroes`, `/items`, dan `/patches`.
- **Dependencies:** Phase 2A; **wajib** penutupan gap riset primer (`CURRENT_GAME_RESEARCH.md` yang saat ini berstatus `UNVERIFIED` tetap menjadi **hard blocker** untuk ingest fakta game — statusnya tidak boleh diubah menjadi `VERIFIED` sebelum verifikasi sumber resmi *Original Server* selesai).
- **Deliverables:** Migrasi tabel inti hero/item/fundamentals, skrip ingest terverifikasi di `database/seeds/`, halaman `/heroes` & `/items` terhubung ke DB nyata, serta halaman `/patches` menampilkan histori patch resmi.
- **Validation Criteria:** 0 data karangan; setiap stat hero/item memiliki `entity_evidences` `TIER_1_OFFICIAL` dan `patch_version_id`; aturan *unique passive group* teruji.
- **Stop Condition:** Audit sampel acak 100% akurat terhadap klien game sebelum masuk ke relasi taktis.

### Phase 3 — Tactical Graph (Matchups, Counters, Synergies, & Build Intelligence)
- **Tujuan:** Mengimplementasikan relasi berarah dan kontekstual untuk `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`, `team_compositions`, dan `builds` (lengkap dengan kondisi game state, reasoning, dan alternatif) pada `/matchups`, `/counters`, dan `/builds`.
- **Dependencies:** Phase 2B (Hero, Skill, Item, Mechanics tag sudah tersedia).
- **Deliverables:** Skema & API relasi taktis, validator otomatis *non-stacking passive* pada build, halaman interaktif `/matchups`, `/counters`, `/builds`, dan pengujian propagasi `OUTDATED` saat simulasi perubahan patch.
- **Validation Criteria:** Setiap relasi counter/matchup wajib mencantumkan alasan mekanis dan konteks; setiap build memuat reasoning & provenance.
- **Stop Condition:** Review akurasi logika taktis dan pengujian dampak patch selesai.

### Phase 4 — Competitive Esports Intelligence
- **Tujuan:** Mengimplementasikan hierarki penuh esports (`competitions` -> `competition_events` -> `tournament_stages` -> `matches` -> `match_games` -> `draft_actions` / `game_player_performances` / `tournament_hero_stats` dengan kolom `vod_url` terverifikasi -> `match_observations` -> `competitive_insights`, serta agregasi SQL *Meta Trends* per `ADR-007`) pada modul `/esports`.
- **Dependencies:** Phase 2B (`heroes`, `items`, `patch_versions`) dan penyelesaian tindak lanjut riset P0/P1 pada `GLOBAL_ESPORTS_VALIDATION_REPORT.md`.
- **Deliverables:** Impor bertahap 32 record metadata turnamen `Tier A` (ditambah `Tier B` bertanda sekunder), UI `/esports` yang memisahkan data agregat (`PARTIAL`) vs log game penuh, dan modul *Pro Play Lab* berbasis 5-layer framework.
- **Validation Criteria:** Tidak ada URL VOD fiktif; data parsial tidak ditampilkan sebagai draft sequence penuh; setiap `meta_trend` mencantumkan `sample_size_games`.
- **Stop Condition:** Verifikasi integritas data turnamen & keterlacakan VOD lulus.

### Phase 5 — Gameplay Academy (Micro/Macro) & Ranked Adaptation (`Solo/Duo/Trio/5-Man`)
- **Tujuan:** Membangun kurikulum **Micro Learning**, **Macro Learning**, **Ranked Contexts**, dan **Pro-to-Ranked Adaptation** (19 field wajib) pada `/academy` (serta sub-jalur Ranked).
- **Dependencies:** Phase 2B (Fundamentals/Hero/Item), Phase 3 (Tactical Graph), dan Phase 4 (`competitive_insights` terverifikasi).
- **Deliverables:** Modul kurikulum Micro & Macro terstruktur, halaman adaptasi terpisah untuk Solo, Duo, Trio, dan 5-Man dengan rating kelayakan & peringatan risiko.
- **Validation Criteria:** Seluruh strategi pro melewati cek koordinasi 7-dimensi; tidak ada saran *blind copy* untuk Solo Queue.
- **Stop Condition:** Review editorial kualitas materi dan gerbang risiko koordinasi selesai.

### Phase 6 — Unified Knowledge Search & Sources Transparency Hub
- **Tujuan:** Menghubungkan `/search` ke mesin pencarian lintas entitas berbasis PostgreSQL *Full-Text Search + `pg_trgm`* (atau search engine khusus bila skala menuntut) lengkap dengan filter status verifikasi, patch, dan server; serta menghadirkan halaman transparansi sumber & metodologi (`/sources` jika disetujui).
- **Dependencies:** Phase 2B, 3, 4, dan 5 (seluruh entitas inti tersedia untuk diindeks).
- **Deliverables:** Indeks pencarian terpadu, filter patch-aware, dan uji relevansi query lintas bahasa/istilah MLBB.
- **Validation Criteria:** Pencarian mengembalikan badge patch & status verifikasi akurat; hasil `OUTDATED` ditandai jelas.
- **Stop Condition:** Pengujian performa dan relevansi pencarian lulus.

### Phase 7 — Decision Intelligence & Analytics (Draft Assistant, Situational Builder, Meta Analytics)
- **Tujuan:** Membangun alat bantu interaktif tingkat lanjut: *Draft Assistant* (evaluasi keseimbangan damage, frontline, CC, role conflict, sinergi, counter) dan *Situational Build Calculator*, serta dasbor *Meta Analytics* berbasis sampel terverifikasi.
- **Dependencies:** Phase 3, 4, dan 6.
- **Deliverables:** Mesin kalkulasi draft & rekomendasi berbasis data terstruktur, UI simulasi responsif, dan metrik evaluasi akurasi aturan.
- **Validation Criteria:** Seluruh rekomendasi menampilkan alasan mekanis dan tingkat keyakinan (*confidence*) yang transparan.
- **Stop Condition:** Audit kasus uji draft & verifikasi tidak ada saran pasif ganda/ilegal.

### Phase 8 — Player Learning Progression & Curated Community Contribution *(Deferred per `ADR-010`)*
- **Tujuan:** Menambahkan autentikasi pengguna/kurator, pelacakan progres belajar pemain pada Academy (*Player Learning Progression*), dan jalur pengajuan koreksi/kontribusi komunitas yang terisolasi di antrean review sebelum dapat memengaruhi data produksi, serta tabel audit lanjutan (`users`, `verification_records`, `claim_conflicts`, `patch_impact_queue`) bila skala editorial menuntut.
- **Dependencies:** Phase 5 dan Phase 7; penetapan kebijakan keamanan, autentikasi, dan moderasi.
- **Deliverables:** Modul progres pembelajaran pengguna, antarmuka review kurator untuk `patch_impact_queue` & `claim_conflicts`.
- **Validation Criteria:** Kontribusi komunitas selalu terisolasi sebagai `COMMUNITY_THEORY` / `UNVERIFIED` hingga disetujui kurator.
- **Stop Condition:** Audit keamanan, otorisasi, dan integritas data lulus.
