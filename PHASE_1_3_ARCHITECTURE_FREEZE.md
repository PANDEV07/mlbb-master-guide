# PHASE_1_3_ARCHITECTURE_FREEZE — Ringkasan Penetapan Foundation Freeze

**Tanggal:** `2026-11-18`  
**Fase:** `Phase 1.3 — Architecture Approval & Foundation Freeze`  
**Status:** **`ARCHITECTURE_FROZEN_READY_FOR_PHASE_2A`**  
**Dokumen Acuan Utama:** [docs/architecture/ARCHITECTURE_FOUNDATION_FREEZE.md](docs/architecture/ARCHITECTURE_FOUNDATION_FREEZE.md)  

---

## 1. Ringkasan Persetujuan & Penyelarasan

Berdasarkan persetujuan pemilik proyek atas `PHASE_1_2_ARCHITECTURE_DECISION_REVIEW.md` dengan klarifikasi wajib pada `ADR-005` dan `ADR-006`, seluruh dokumen arsitektur dan riset fondasi telah diselaraskan dan dikunci (*frozen*) sebagai acuan resmi pembangunan **Phase 2A**.

### Status Keputusan Arsitektur (`ARCHITECTURE_DECISION_REGISTER.md`)
- **`APPROVED` (`7`):** `ADR-001` (Modular Monolith), `ADR-002` (PostgreSQL 16+ via `DATABASE_URL`), `ADR-003` (Drizzle ORM + `drizzle-kit` SQL migrations), `ADR-004` (PostgreSQL FTS `tsvector`/`GIN` + `pg_trgm`), `ADR-007` (5-Layer Esports + `match_games` + pemisahan `draft_actions` vs `tournament_hero_stats`), `ADR-008` (Model disederhanakan `game_fundamentals`, `game_mechanics`, `academy_lessons`, `pro_to_ranked_adaptations`, & 4 profil TS `ranked_contexts`), `ADR-009` (12 Modul Produk Logis + Shared Canonical Repositories + UI ringkas).
- **`APPROVED` dengan Klarifikasi Terdokumentasi (`2`):**
  - `ADR-005`: Hybrid Provenance 2-Lapis + **Aturan Provenance Inheritance Eksplisit** (status `VERIFIED` parent tidak otomatis mewariskan ke klaim independen anak seperti `hero_skills`, `matchups`, `counters`, `builds`, `match_observations`).
  - `ADR-006`: Hybrid Patch Versioning + **Pemisahan Entity Identity vs Versioned Profile** (`heroes` + `hero_version_profiles`; `items` + `item_version_profiles`; `hero_skills` & `game_fundamentals` via kunci logis stabil SCD Type 2) + **Rekonstruksi Historis** independen dari flag `OUTDATED` + **Matriks Invalidation** tanpa `patch_impact_queue` di MVP.
- **`DEFERRED` (`1`):** `ADR-010` (Users, Authentication, Learning Progression, UGC, Moderation, Telemetry ditunda hingga Phase 7–8).

---

## 2. Daftar Dokumen yang Diselaraskan dalam Foundation Freeze

1. `ARCHITECTURE_DECISION_REGISTER.md` — Diperbarui menjadi `APPROVED` / `DEFERRED` sesuai keputusan Phase 1.3.
2. `docs/research/DATABASE_SCHEMA.md` (v2.0) — Disesuaikan 100% dengan `ADR-002` s.d. `ADR-010`, menambahkan `item_version_profiles`, memindahkan atribut dinamis Hero ke `hero_version_profiles`, merinci aturan *Provenance Inheritance*, serta merampingkan katalog ke 25+ entitas inti terstruktur tanpa tabel prematur.
3. `docs/research/SOURCE_VERIFICATION_POLICY.md` — Menambahkan Bagian 4 (*Aturan Provenance Inheritance*) dan menyelaraskan penanganan konflik lewat `entity_evidences` (`stance = 'CONFLICTING'`).
4. `docs/research/PATCH_UPDATE_SYSTEM.md` (v2.0) — Menyelaraskan *Entity Identity vs Versioned Data*, *Historical Reconstruction*, serta *Patch Dependency & Invalidation* tanpa `patch_impact_queue`.
5. `docs/architecture/PRODUCT_ARCHITECTURE.md` — Menetapkan batas 12 modul produk logis, aturan larangan query lintas domain langsung, serta kontrak *Shared Canonical Repositories*.
6. `docs/architecture/SYSTEM_ARCHITECTURE.md` & `docs/architecture/TECH_STACK.md` — Diselaraskan dengan Drizzle ORM, PostgreSQL FTS + `pg_trgm`, Modular Monolith, dan model provenance/patch final.
7. `docs/research/KNOWLEDGE_ARCHITECTURE.md`, `docs/research/RESEARCH_STATUS.md`, `docs/roadmap/IMPLEMENTATION_ROADMAP.md`, dan `database/schema/README.md` — Seluruh kontradiksi penamaan tabel dan rujukan usang telah dihilangkan.

---

## 3. Batasan & Kesiapan Memasuki Phase 2A

- **Tidak ada implementasi teknis yang dijalankan pada Phase 1.3:** Belum ada file `.sql`, migrasi Drizzle, data MLBB, atau fitur baru pada `src/`.
- **Siap untuk Phase 2A (`Infrastructure & Governance Schema`):**
  - Instalasi dan konfigurasi `drizzle-orm` + `drizzle-kit` + driver PostgreSQL standar (`DATABASE_URL`).
  - Pembuatan skema Drizzle & migrasi SQL untuk infrastruktur tata kelola (`patch_versions`, `patch_changes`, `sources`, `entity_evidences`) serta pembaruan kontrak `src/types/knowledge.ts` & *Shared Canonical Repositories* (`src/services/repositories/`).
- **Syarat Sebelum Phase 2B (`Ingest Data Hero & Item`):**
  - Riset sumber primer *Original Server* resmi untuk mengganti rujukan sementara `UNVERIFIED` pada `docs/research/CURRENT_GAME_RESEARCH.md` serta pengumpulan data terverifikasi Hero, Skill, Item, dan Game Fundamentals.
