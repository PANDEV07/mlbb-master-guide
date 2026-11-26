# SYSTEM_ARCHITECTURE — Arsitektur Sistem MLBB Master Guide

**Status Dokumen:** **Final Foundation Freeze (`Phase 1.3`, selaras `ADR-001` s.d. `ADR-010`)**  
**Gaya Arsitektur:** **Modular Monolith** (Next.js 15 App Router + TypeScript Strict + Drizzle ORM + PostgreSQL 16+)  
**Rujukan Spesifikasi Terkait:** [KNOWLEDGE_ARCHITECTURE.md](../research/KNOWLEDGE_ARCHITECTURE.md), [DATABASE_SCHEMA.md](../research/DATABASE_SCHEMA.md), [SOURCE_VERIFICATION_POLICY.md](../research/SOURCE_VERIFICATION_POLICY.md), [PATCH_UPDATE_SYSTEM.md](../research/PATCH_UPDATE_SYSTEM.md)

---

## 1. Gambaran Arsitektur Berlapis (Modular Monolith)

```text
+-------------------------------------------------------------------------+
| 1. PRESENTATION LAYER (Next.js 15 App Router + Tailwind CSS v4)         |
|    - Server Components untuk halaman pengetahuan & SEO                  |
|    - Client Components khusus interaksi (Filter, Search, Simulasi)      |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| 2. APPLICATION, POLICY & REPOSITORY LAYER (src/features/ + src/services/)|
|    - Shared Canonical Repositories (Hero, Item, Patch, Source, Esports) |
|    - Governance & Provenance Guard (Inheritance & Status Calibration)   |
|    - Cache Tagging & Revalidation berbasis patch_version                |
+------------------------------------+------------------------------------+
                                     | Drizzle ORM (via DATABASE_URL)
                                     v
+-------------------------------------------------------------------------+
| 3. DATA & PERSISTENCE LAYER (PostgreSQL 16+ Standar + JSONB + FTS)      |
|    - Governance & Patch: patch_versions, patch_changes, sources,        |
|      entity_evidences                                                   |
|    - Core (Identity + SCD Type 2): heroes/profiles, skills,             |
|      items/profiles/effects/components, game_fundamentals, mechanics    |
|    - Tactical & Academy: builds, matchups, counters, synergies,         |
|      academy_lessons, pro_to_ranked_adaptations                         |
|    - Esports (5-Layer): competitions -> events -> stages -> matches ->  |
|      match_games -> draft_actions/performances, tournament_hero_stats   |
+------------------------------------+------------------------------------+
                                     ^
                                     | Validated CLI Seed Scripts
+------------------------------------+------------------------------------+
| 4. KNOWLEDGE RESEARCH, VERIFICATION & PATCH LIFECYCLE PIPELINE          |
|    - Research -> Tier 1-4 Source Audit -> Patch Diff -> Snapshot SCD2   |
|    - Outdated Invalidation pada Derived Knowledge terkait               |
+-------------------------------------------------------------------------+
```

---

## 2. Rincian Komponen Sistem Final

### 2.1 Frontend (`src/app/` & `src/components/`)
- Menggunakan **Next.js App Router** dalam satu aplikasi **Modular Monolith** (`ADR-001`).
- Pemisahan ketat antara Server Components (perenderan ensiklopedia *read-heavy* dan metadata SEO) dan Client Components (filter, pencarian, dan alat interaktif masa depan).
- Tata letak global (`AppShell`) menyediakan navigasi konsisten desktop/mobile dan `PatchBanner` yang menampilkan status lingkungan *Original Server*.

### 2.2 Application & Repository Layer (`src/features/` & `src/services/`)
- **Shared Canonical Repositories (`ADR-009`):** Feature modules (`heroes`, `items`, `builds`, `matchups`, `counters`, `synergies`, `academy`, `ranked`, `esports`, `patches`, `search`, `sources`) tidak melakukan query lintas domain secara langsung ke database; seluruh pembacaan entitas bersama wajib melewati repository terpusat agar filter `server_type = 'ORIGINAL_SERVER'` dan `is_current = true` konsisten.
- **Knowledge Governance Guard:** Memastikan setiap entitas menampilkan `claimClassification`, `verificationStatus`, `confidenceLevel`, `patchVersion`, serta menerapkan **Aturan Provenance Inheritance** (`ADR-005`) sehingga status `VERIFIED` induk tidak otomatis mewariskan validasi pada klaim analitis anak.

### 2.3 Data Layer & Database (`src/lib/db/`, `database/` + Drizzle ORM)
- **PostgreSQL 16+ Standar (`ADR-002`, `ADR-003`):** Konfigurasi portabel via `DATABASE_URL` (`src/lib/db/env.ts`, `src/lib/db/client.ts`, `drizzle.config.ts`) menggunakan **Drizzle ORM** (`drizzle-orm/postgres-js`) dan berkas migrasi `.sql` eksplisit di `database/migrations/`.
- **Status Implementasi Saat Ini (Phase 2A):** Fondasi koneksi, skema 4 tabel governance & patch (`patch_versions`, `patch_changes`, `sources`, `entity_evidences`), *Shared Canonical Repository* awal (`src/services/repositories/governanceRepository.ts`), dan migrasi `0000_fearless_post.sql` telah diimplementasikan dan divalidasi secara offline. Tabel domain Game/Hero/Item/Esports masih berstatus `PLANNED` (Phase 2B–5).
- **Pemisahan Identitas vs Versi (`ADR-006`):** `heroes` dan `items` menyimpan identitas stabil; `hero_version_profiles`, `item_version_profiles`, `hero_skills`, dan `game_fundamentals` memakai *SCD Type 2* (`valid_from_patch_id`, `valid_until_patch_id`, `is_current`, `server_type`) pada Phase 2B.

### 2.4 Search System (`/search`)
- Menggunakan **PostgreSQL Full-Text Search (`tsvector` + indeks `GIN`) + `pg_trgm`** (`ADR-004`) untuk pencarian lintas domain dengan filter patch, status verifikasi, dan default `ORIGINAL_SERVER`.
- Cakupan pencarian wajib mendukung: nama hero, alias/julukan hero, nama/singkatan item, terminologi gameplay dwibahasa Indonesia & Inggris, istilah komunitas, toleransi *common typos* (`pg_trgm`), pencarian versi/perubahan patch, serta pencarian turnamen, tim, dan pemain pro.
- Layanan search eksternal (Elasticsearch, Meilisearch, Typesense, Algolia) ditunda/ditolak untuk MVP hingga ada bukti bottleneck skala nyata.

### 2.5 Research, Ingestion & Patch Update System
- **Ingestion:** Skrip CLI TypeScript idempotent di `database/seeds/` yang memvalidasi skema, aturan *unique passive group*, dan provenance `SOURCE_VERIFICATION_POLICY.md` sebelum menulis ke database.
- **Patch Invalidation (`ADR-006`):** Perubahan pada `patch_changes` menutup snapshot lama (`valid_until_patch_id`), membuka snapshot baru untuk *Core Entities*, dan menandai *Derived Knowledge* terdampak menjadi `verification_status = 'OUTDATED'` (tanpa tabel `patch_impact_queue` di MVP dan tanpa mengubah fakta historis `match_games`).
- **Penundaan (`ADR-010`):** Autentikasi pengguna, *learning progression*, UGC moderasi, dan *telemetry* ditunda ke Phase 7–8.
