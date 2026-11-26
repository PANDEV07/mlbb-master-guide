# Database Foundation (`database/`)

**Status Saat Ini:** `PHASE_2A_FOUNDATION_IMPLEMENTED (Offline-Validated; Live DB Execution Menunggu PostgreSQL Host)`  
**Target Engine:** PostgreSQL 16+ + Drizzle ORM (`drizzle-kit`)

> [!NOTE]
> Skema foundational **Phase 2A** (`patch_versions`, `patch_changes`, `sources`, `entity_evidences`) telah diimplementasikan di `src/lib/db/schema/` beserta migrasi SQL eksplisit di `database/migrations/0000_fearless_post.sql`. **Belum ada data produksi atau data game MLBB/esports yang dimasukkan (`Zero Fake Data`).**

## Struktur & Lokasi Terkait
- `src/lib/db/` — Koneksi PostgreSQL portabel (`client.ts`), validasi environment (`env.ts`), skema Drizzle ORM (`schema/`), dan skrip CLI operasional (`scripts/`).
- `src/services/repositories/` — *Shared Canonical Repositories* (`governanceRepository.ts`).
- `database/schema/` — Dokumentasi status skema konseptual & referensi domain (definisi Drizzle berada di `src/lib/db/schema/`).
- `database/migrations/` — Berkas migrasi SQL kronologis yang dihasilkan oleh `npm run db:generate` (`0000_fearless_post.sql` + `meta/`).
- `database/seeds/` — Placeholder skrip ingest data terverifikasi (mulai Phase 2B+ setelah riset sumber resmi selesai).

## Alur Operasional Database
1. Salin `.env.example` menjadi `.env` dan isi `DATABASE_URL` PostgreSQL 16+.
2. Ubah atau tambah skema Drizzle di `src/lib/db/schema/`, lalu jalankan `npm run db:generate` untuk menghasilkan migrasi `.sql` eksplisit.
3. Audit berkas `.sql` di `database/migrations/` sesuai `docs/architecture/DATABASE_SCHEMA_GOVERNANCE.md`.
4. Jalankan `npm run db:migrate` untuk menerapkan migrasi ke PostgreSQL target.
5. Jalankan `npm run db:check` dan `npm run db:validate` untuk memverifikasi koneksi, skema, dan status migrasi.
6. Gunakan `npm run db:studio` untuk inspeksi visual Drizzle Studio saat database tersedia.
