# TECH_STACK — Pemilihan Teknologi MLBB Master Guide

**Status Dokumen:** **Final Foundation Freeze (`Phase 1.3`, selaras `ADR-001` s.d. `ADR-004`)**  

---

## 1. Pilihan Teknologi Final yang Disetujui

| Lapisan | Pilihan | Versi / Spesifikasi | Alasan Pemilihan |
|---|---|---|---|
| **Framework Web** | Next.js (App Router) | `^15.3.3` *(terpasang `15.5.29`)* | Modular Monolith (`ADR-001`): mendukung React Server Components untuk halaman pengetahuan *read-heavy*, SEO kuat, dan Route Handlers. |
| **Bahasa** | TypeScript | `^5.8.3` *(terpasang `5.9.3`, `strict`)* | Menjamin keamanan tipe di seluruh kontrak skema entitas, provenance, dan UI. |
| **UI Library** | React | `^19.1.0` *(terpasang `19.3.1`)* | Terintegrasi penuh dengan Next.js App Router. |
| **Styling** | Tailwind CSS | `^4.1.7` *(terpasang `4.3.5`)* | Sistem desain editorial gelap (*dark-first*) tanpa overhead runtime CSS-in-JS. |
| **Ikonografi** | Lucide React | `^0.511.0` *(terpasang `0.511.0`)* | Ikon vektor ringan dan tree-shakeable. |
| **Database** | PostgreSQL | `16+` Standar (via `DATABASE_URL`) | Relasional ketat + `JSONB` + `tsvector`/`GIN`/`pg_trgm` (`ADR-002`). Hosting fleksibel (Supabase DB / Neon / self-managed Docker) tanpa ikatan SDK proprietary. |
| **ORM & Migrasi** | Drizzle ORM + `drizzle-kit` | `drizzle-orm` `^0.45.4` + `drizzle-kit` `^0.31.11` + `postgres` `^4.1.1` *(Terpasang Phase 2A)* | TypeScript-first schema, transparansi SQL penuh, kontrol file migrasi `.sql` di `database/migrations/`, serta dukungan native fitur PostgreSQL (`ADR-003`). |
| **Search Engine** | PostgreSQL FTS + `pg_trgm` | Built-in PostgreSQL | Cukup untuk puluhan ribu entitas dengan toleransi typo dan filter patch tanpa biaya/sinkronisasi server search eksternal (`ADR-004`). |
| **Caching** | Next.js Tag Caching | Built-in App Router (`revalidateTag`) | Caching per versi patch dan domain tanpa memerlukan Redis eksternal pada tahap awal. |

---

## 2. Alternatif yang Ditolak atau Ditunda

| Kategori | Alternatif | Keputusan | Alasan |
|---|---|---|---|
| **Gaya Arsitektur** | Microservices | **Ditolak (`ADR-001`)** | Overengineering untuk tahap awal; Modular Monolith menjaga kecepatan pengembangan dengan batas modul jelas. |
| **Database** | Graph Database (Neo4j) / NoSQL (MongoDB) | **Ditolak (`ADR-002`)** | Traversal graf MLBB hanya 1–2 hop; PostgreSQL memberikan ACID, foreign key, temporal patch join, dan agregasi SQL yang lebih kuat. |
| **ORM** | Prisma / Kysely | **Tidak Dipilih (`ADR-003`)** | Prisma terlalu mengabstraksi fitur native PostgreSQL; Kysely tidak memiliki generator migrasi skema deklaratif bawaan. |
| **Search** | Elasticsearch / Meilisearch / Algolia | **Ditolak untuk MVP (`ADR-004`)** | Menambah beban infrastruktur dan sinkronisasi indeks tanpa kebutuhan skala nyata pada Phase 1–6. |
| **Queue / Telemetry** | Redis + BullMQ / ClickHouse / AI Pipeline | **Ditolak / Ditunda (`ADR-010`)** | Ingestion menggunakan skrip CLI tervalidasi & transaksi sinkron; AI tidak boleh mengarang fakta game. |

---

## 3. Pertimbangan Skalabilitas & Mitigasi

1. **Kompleksitas Data Lintas-Patch:** Dimodelkan dengan *Hybrid Patch Versioning* (`ADR-006`) — *SCD Type 2* hanya menyalin profil hero/item/skill yang benar-benar berubah, dengan indeks pada `(is_current, server_type)` dan `(valid_from_patch_id, valid_until_patch_id)`.
2. **Ketergantungan Data Eksternal:** *Moonton Esports API* berstatus `UNVERIFIED` dan dilarang dijadikan dependency. Ingestion mengandalkan kurasi & skrip terverifikasi berbasis `SOURCE_VERIFICATION_POLICY.md`.
3. **Evolusi Masa Depan:** Apabila trafik atau ukuran kalkulasi *Draft Assistant* (Phase 7) dan *User Progression* (Phase 8) menuntut pemisahan proses, batas modul `src/features/` dan `src/services/repositories/` memungkinkan ekstraksi tanpa merombak basis data PostgreSQL.
