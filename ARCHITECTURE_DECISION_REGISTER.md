# ARCHITECTURE_DECISION_REGISTER — Register Keputusan Arsitektur MLBB Master Guide

**Tanggal Pembuatan:** `2026-11-18`  
**Terakhir Diperbarui:** `2026-11-18` (`Phase 1.3 — Architecture Approval & Foundation Freeze`)  
**Status Keseluruhan:** `ARCHITECTURE_FROZEN_READY_FOR_PHASE_2A`

---

## Ringkasan Register

| ID | Decision | Chosen Option | Status | Date |
|---|---|---|---|---|
| `ADR-001` | Gaya Arsitektur Aplikasi | Modular Monolith (Next.js App Router + PostgreSQL) | `APPROVED` | `2026-11-18` |
| `ADR-002` | Engine Basis Data Utama | PostgreSQL 16+ Standar (Relasional + `JSONB`) via `DATABASE_URL` | `APPROVED` | `2026-11-18` |
| `ADR-003` | ORM & Manajemen Migrasi | Drizzle ORM + `drizzle-kit` SQL Migrations | `APPROVED` | `2026-11-18` |
| `ADR-004` | Teknologi Pencarian Lintas Entitas | PostgreSQL Full-Text Search (`tsvector` + `GIN`) + `pg_trgm` | `APPROVED` | `2026-11-18` |
| `ADR-005` | Arsitektur Knowledge Provenance | Hybrid 2-Lapis (Embedded Metadata + `sources` & `entity_evidences` + Aturan Inheritance Eksplisit) | `APPROVED_WITH_CLARIFICATIONS` | `2026-11-18` |
| `ADR-006` | Arsitektur Temporal & Patch Versioning | Hybrid (Stable Identity + SCD Type 2 untuk Core Entities + Patch Ref & `OUTDATED` untuk Derived + `patch_changes`) | `APPROVED_WITH_CLARIFICATIONS` | `2026-11-18` |
| `ADR-007` | Model Data Competitive Intelligence | 5-Layer Separation dengan `Competition -> Event -> Stage -> Match -> Match Game -> Draft Actions` & `tournament_hero_stats` | `APPROVED` | `2026-11-18` |
| `ADR-008` | Model Fundamentals, Academy, & Pro-to-Ranked | `game_fundamentals`, `game_mechanics`, `academy_lessons`, `pro_to_ranked_adaptations`, & 4 profil statis di TS | `APPROVED` | `2026-11-18` |
| `ADR-009` | Batas 12 Modul Produk & Shared Repositories | 12 domain logis + shared canonical repositories; navigasi UI tetap ringkas | `APPROVED` | `2026-11-18` |
| `ADR-010` | User, Auth, Learning Progression, & UGC | Ditunda hingga Phase 7–8 atau saat kebutuhan produk terbukti | `DEFERRED` | `2026-11-18` |

---

## Rincian Setiap Keputusan

### ADR-001 — Gaya Arsitektur Aplikasi
- **ID:** `ADR-001`
- **Decision:** Menetapkan arsitektur aplikasi sebagai **Modular Monolith** di dalam satu aplikasi Next.js App Router (`src/app/`, `src/features/`, `src/services/`).
- **Context:** Platform memiliki 12 domain pengetahuan yang saling terhubung namun beban awal tidak membenarkan kompleksitas microservices.
- **Alternatives:** Microservices terpisah per domain; Monolith tanpa pemisahan folder domain.
- **Chosen option:** **Modular Monolith** dengan batas folder domain dan shared canonical repository/service layer.
- **Reasoning:** Memisahkan kode secara modular tanpa overhead jaringan, deployment terpisah, atau sinkronisasi skema antar-servis.
- **Consequences:** Seluruh fitur di-deploy sebagai satu unit Next.js; disiplin boundary antar-domain dijaga ketat pada kode.
- **Status:** `APPROVED`
- **Date:** `2026-11-18`

---

### ADR-002 — Engine Basis Data Utama
- **ID:** `ADR-002`
- **Decision:** Menggunakan **PostgreSQL 16+ standar** (relasional + `JSONB`) melalui `DATABASE_URL` portabel; hosting bersifat fleksibel tanpa mengikat aplikasi pada SDK proprietary provider tertentu.
- **Context:** Platform membutuhkan integritas referensial ketat, temporal patch joins, agregasi statistik, dan fleksibilitas atribut.
- **Alternatives:** Graph Database (Neo4j); Document DB (MongoDB); ketergantungan SDK proprietary Supabase.
- **Chosen option:** **PostgreSQL 16+ standar** via `DATABASE_URL`.
- **Reasoning:** Skala relasi MLBB (1–2 hop) sangat cepat di PostgreSQL sekaligus menjamin ACID, foreign keys, dan agregasi SQL.
- **Consequences:** Relasi dimodelkan dengan tabel penghubung eksplisit; `JSONB` dipakai terbatas untuk payload tervalidasi TypeScript.
- **Status:** `APPROVED`
- **Date:** `2026-11-18`

---

### ADR-003 — ORM & Manajemen Migrasi
- **ID:** `ADR-003`
- **Decision:** Menggunakan **Drizzle ORM** dan **`drizzle-kit`** dengan file migrasi SQL eksplisit yang dapat diaudit di `database/migrations/`.
- **Context:** Proyek membutuhkan type safety TypeScript strict sekaligus kontrol penuh atas DDL PostgreSQL.
- **Alternatives:** Prisma ORM; Kysely + raw SQL manual penuh.
- **Chosen option:** **Drizzle ORM + `drizzle-kit` SQL migrations**.
- **Reasoning:** Memberikan transparansi SQL penuh, migrasi `.sql` yang dapat diaudit, serta dukungan native untuk `tsvector`, `GIN`, `pg_trgm`, dan *partial unique index*.
- **Consequences:** Seluruh perubahan skema wajib melalui migrasi SQL eksplisit yang diaudit di `database/migrations/`.
- **Status:** `APPROVED`
- **Date:** `2026-11-18`

---

### ADR-004 — Teknologi Pencarian Lintas Entitas
- **ID:** `ADR-004`
- **Decision:** Menggunakan **PostgreSQL Full-Text Search (`tsvector` + `GIN`) + `pg_trgm`** untuk pencarian terpadu pada `/search`; search engine eksternal ditunda hingga terdapat bukti kebutuhan skala nyata.
- **Context:** Skala dataset ensiklopedia berada di kisaran ribuan hingga puluhan ribu entitas.
- **Alternatives:** Elasticsearch / OpenSearch; Meilisearch / Typesense.
- **Chosen option:** **PostgreSQL FTS (`tsvector` + `GIN`) + `pg_trgm`**.
- **Reasoning:** Menghilangkan infrastruktur eksternal dan sinkronisasi indeks sambil tetap mendukung toleransi typo dan filter patch/status.
- **Consequences:** Perlu aktivasi ekstensi `pg_trgm` dan indeks `GIN` pada fase implementasi pencarian (Phase 6).
- **Status:** `APPROVED`
- **Date:** `2026-11-18`

---

### ADR-005 — Arsitektur Knowledge Provenance *(Approved with Clarifications)*
- **ID:** `ADR-005`
- **Decision:** Menggunakan **Hybrid Provenance 2-Lapis** (*embedded governance metadata* pada entitas utama + tabel `sources` & `entity_evidences`), menunda tabel terpisah `claim_conflicts` dan `verification_records`, dengan **klarifikasi wajib**:
  1. Tetap membedakan 4 kelas pengetahuan (*Direct Facts*, *Derived Analysis*, *Strategic Knowledge*, *Competitive Insights*) dan seluruh taksonomi status di `SOURCE_VERIFICATION_POLICY.md` (`VERIFIED`, `PARTIALLY_VERIFIED`, `UNVERIFIED`, `OUTDATED`, `CONFLICTING`, `UNKNOWN`, `NOT_RESEARCHED`, `NOT_YET_AVAILABLE`, `NOT_FOUND`).
  2. Menerapkan **Aturan Provenance Inheritance Eksplisit**: status `VERIFIED` pada parent **tidak** otomatis membuat semua child `VERIFIED`; inheritance hanya berlaku untuk komponen struktural murni dari bukti yang sama (`item_components`/`item_effects` dari `item_version_profiles`, `build_items` dari `builds`, `draft_actions`/`game_player_performances` dari `match_games`), sedangkan `hero_skills`, `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`, `match_observations`, `competitive_insights`, dan `pro_to_ranked_adaptations` wajib memiliki status verifikasi dan sumber/bukti independen.
- **Context:** Simplifikasi struktur tabel MVP tidak boleh menurunkan integritas pengetahuan atau mengaburkan sumber klaim anak.
- **Alternatives:** 4 tabel governance terpisah sejak MVP; satu kolom `sourceLabel` teks tunggal.
- **Chosen option:** **Hybrid 2-Lapis + Aturan Provenance Inheritance Eksplisit**.
- **Reasoning:** Menjaga performa baca dan kesederhanaan skema tanpa kehilangan ketertelusuran multi-sumber per aspek maupun penanganan status `CONFLICTING`.
- **Consequences:** Repository layer wajib menerapkan aturan inheritance per jenis relasi secara eksplisit (terdokumentasi di `SOURCE_VERIFICATION_POLICY.md` dan `DATABASE_SCHEMA.md`).
- **Status:** `APPROVED_WITH_CLARIFICATIONS`
- **Date:** `2026-11-18`

---

### ADR-006 — Arsitektur Temporal & Patch Versioning *(Approved with Clarifications)*
- **ID:** `ADR-006`
- **Decision:** Menggunakan **Hybrid Temporal Model** (*SCD Type 2* untuk core game data, `patch_version_id` + `OUTDATED` untuk derived knowledge, `patch_changes` sebagai change log, tanpa `patch_impact_queue` pada MVP), dengan **klarifikasi wajib**:
  1. **Pemisahan Entity Identity vs Versioned Data:** Identitas entitas tetap stabil lintas patch (`heroes` vs `hero_version_profiles`; `items` vs `item_version_profiles`), sedangkan `hero_skills` dan `game_fundamentals` memakai SCD Type 2 berbasis kunci logis stabil (`hero_id + slot_key` dan `slug`) tanpa tabel identitas tambahan karena tidak ada tabel lain yang memegang FK permanen ke baris versi skill/fundamental.
  2. **Historical Reconstruction Lengkap:** Rekonstruksi stat Hero/Item pada Patch $X$, perbandingan Patch $X$ vs Patch $Y$, deteksi build usang, dan konteks patch pertandingan esports historis dilakukan melalui query rentang `valid_from_patch_id` / `valid_until_patch_id` + `patch_changes` (bukan bergantung pada flag `OUTDATED` semata).
  3. **Patch Dependency & Invalidation:** Perubahan `patch_changes` memicu transisi status `OUTDATED` pada derived knowledge terdampak tanpa menghapus `patch_version_id` asalnya dan tanpa menandai fakta historis `match_games` menjadi `OUTDATED`.
- **Context:** Kebutuhan akurasi lintas patch dan sejarah esports tidak boleh menyebabkan duplikasi snapshot masif maupun hilangnya identitas stabil Hero/Item.
- **Alternatives:** Single `patch_version` overwrite; full snapshot seluruh DB setiap patch; `patch_impact_queue` workflow table di MVP.
- **Chosen option:** **Hybrid Temporal Model dengan pemisahan Identity vs Version Profile (`heroes`/`hero_version_profiles` & `items`/`item_version_profiles`)**.
- **Reasoning:** Menjamin FK stabil pada `builds`, `item_counters`, `game_player_performances`, dan `draft_actions`, sekaligus menyediakan rekonstruksi historis presisi per patch dan deteksi `OUTDATED` yang bersih.
- **Consequences:** Seluruh query live wajib memfilter `server_type = 'ORIGINAL_SERVER'` dan `is_current = true` (atau rentang patch historis untuk studi turnamen lama).
- **Status:** `APPROVED_WITH_CLARIFICATIONS`
- **Date:** `2026-11-18`

---

### ADR-007 — Model Data Competitive Intelligence
- **ID:** `ADR-007`
- **Decision:** Mempertahankan hierarki `Competition -> Event -> Stage -> Match -> Match Game -> Draft Actions`, memisahkan `draft_actions` dari `tournament_hero_stats`, mempertahankan 5 lapisan analisis kompetitif, dan tidak mengimplementasikan tabel `meta_trends` terkomputasi maupun `tournament_groups`/`vod_records` terpisah pada MVP.
- **Context:** Fakta pertandingan, seri Best-of, draft per game, dan statistik agregat tidak boleh tercampur dengan interpretasi analis.
- **Alternatives:** Menempelkan draft pada `matches`; 17 tabel esports penuh sejak awal.
- **Chosen option:** Hierarki 5-Layer ramping berbasis `match_games`.
- **Reasoning:** Menjaga akurasi granularitas game dan mencegah klaim draft sequence palsu dari statistik agregat parsial.
- **Consequences:** `meta_trends` pada Phase 4–6 dilayani lewat agregasi SQL terukur disertai ukuran sampel.
- **Status:** `APPROVED`
- **Date:** `2026-11-18`

---

### ADR-008 — Model Fundamentals, Academy, & Pro-to-Ranked
- **ID:** `ADR-008`
- **Decision:** Menggunakan model domain yang disederhanakan: `game_fundamentals` (termasuk kategori mode), `game_mechanics`, `academy_lessons` (Micro/Macro/Ranked), dan `pro_to_ranked_adaptations` (FK ke `competitive_insights`), dengan 4 profil statis `SOLO`, `DUO`, `TRIO`, `5-MAN` disimpan sebagai konfigurasi TypeScript terstruktur.
- **Context:** Menghindari proliferasi tabel statis kecil dan duplikasi kolom metadata turnamen pada tabel adaptasi.
- **Alternatives:** 7 tabel terpisah termasuk tabel `ranked_contexts` 4 baris di DB.
- **Chosen option:** 4 entitas DB terstruktur + konfigurasi TypeScript terketik untuk `ranked_contexts`.
- **Reasoning:** Cukup kuat menegakkan 7 dimensi Ranked dan 19 komponen Pro-to-Ranked tanpa kompleksitas berlebih.
- **Consequences:** Bila di masa depan profil `ranked_contexts` perlu dikelola admin lewat CMS, ia dapat dipromosikan ke DB tanpa mengubah kontrak UI.
- **Status:** `APPROVED`
- **Date:** `2026-11-18`

---

### ADR-009 — Batas 12 Modul Produk & Shared Repositories
- **ID:** `ADR-009`
- **Decision:** Mempertahankan 12 domain logis (`Heroes`, `Items`, `Builds`, `Matchups`, `Counters`, `Synergies`, `Academy`, `Ranked`, `Esports`, `Patches`, `Search`, `Knowledge Sources`) dengan shared canonical repositories; navigasi UI tetap ringkas dan modul fitur dilarang mengakses DB secara bebas lintas domain.
- **Context:** Mencegah *tight coupling* dan duplikasi query `heroes`/`items`/`patches`/`sources` di berbagai halaman.
- **Alternatives:** 12 menu navigasi tingkat atas terpisah; akses DB langsung dari setiap halaman/fitur.
- **Chosen option:** 12 domain logis + shared canonical repositories + navigasi UI ringkas.
- **Reasoning:** Menjamin konsistensi filter `ORIGINAL_SERVER`, `is_current`, dan provenance di satu titik repository per domain pemilik data.
- **Consequences:** Seluruh akses lintas domain pada Phase 2A+ wajib melalui service/repository layer yang ditetapkan di `PRODUCT_ARCHITECTURE.md`.
- **Status:** `APPROVED`
- **Date:** `2026-11-18`

---

### ADR-010 — Penundaan User, Auth, Learning Progression, & UGC
- **ID:** `ADR-010`
- **Decision:** Menunda seluruh tabel dan implementasi `users`, autentikasi, *learning progression*, *user-generated content*, moderasi komunitas, dan *telemetry* hingga Phase 7–8 atau ketika kebutuhan produk telah terbukti.
- **Context:** Fokus Phase 2A–6 adalah membangun basis pengetahuan terverifikasi yang andal terlebih dahulu.
- **Alternatives:** Membangun sistem user/auth dan UGC sejak Phase 2A.
- **Chosen option:** **Ditunda (`DEFERRED`)** ke Phase 7–8.
- **Reasoning:** Menghindari beban kompleksitas auth dan moderasi sebelum basis data inti tersedia.
- **Consequences:** `verified_by` disimpan sebagai identifier teks sederhana pada Phase 2A–6.
- **Status:** `DEFERRED`
- **Date:** `2026-11-18`
