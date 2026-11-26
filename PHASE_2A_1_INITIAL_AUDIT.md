# PHASE_2A_1_INITIAL_AUDIT — Audit Konfigurasi & Lingkungan Supabase Awal

**Tanggal Audit:** `2026-11-18`  
**Fase:** `Phase 2A.1 — Supabase Database Foundation Audit & Verification`  

---

## 1. Existing Supabase Configuration

Hasil pemeriksaan langsung terhadap repositori dan environment host (tanpa membuka atau mencetak nilai rahasia):
- **Berkas `.env` / `.env.local`:** **Tidak ditemukan** (`Get-ChildItem -Force -Filter .env*` hanya menemukan `.env.example`).
- **Variabel Environment Aktif:** `DATABASE_URL` = tidak disetel (`False`); `DIRECT_DATABASE_URL` = tidak disetel (`False`); `NEXT_PUBLIC_SUPABASE_URL` = tidak disetel (`False`).
- **Direktori `supabase/`:** Tidak ada (`False`).
- **Dependensi SDK Supabase (`@supabase/supabase-js`):** Tidak terpasang di `package.json` — selaras dengan `ADR-002` (database diakses langsung sebagai PostgreSQL 16+ standar melalui Drizzle ORM + `postgres`).

---

## 2. Existing Connection Setup (Sebelum Perbaikan Phase 2A.1)

Pada kondisi awal Phase 2A:
- `src/lib/db/env.ts` & `src/lib/db/client.ts` sudah memakai `DATABASE_URL` dengan `postgres.js` (`drizzle-orm/postgres-js`).
- **Temuan Kritis untuk Supabase:**
  1. `client.ts` belum membedakan **Application Connection** (`DATABASE_URL`, yang dapat memakai Supabase Transaction Pooler `:6543`) dari **Migration Connection** (`DIRECT_DATABASE_URL`, yang wajib memakai Direct Connection `:5432` atau Supabase Session Pooler `:5432`).
  2. `postgres.js` belum menonaktifkan *prepared statements* (`prepare: false`) saat terhubung ke Supabase Transaction Pooler (`:6543` / `pgbouncer=true`).
  3. `postgres.js` belum otomatis mengaktifkan `ssl: "require"` untuk host `*.supabase.co` / `*.pooler.supabase.com` apabila query parameter `?sslmode=require` tertinggal.

---

## 3. PostgreSQL & Drizzle Compatibility

- **Drizzle ORM (`^0.45.4`) + `drizzle-kit` (`^0.31.11`) + `postgres` (`^4.1.1`):** 100% kompatibel dengan Supabase Managed PostgreSQL selama:
  - Migrasi (`drizzle-kit` / `db:migrate`) dijalankan lewat **Session Pooler (`:5432`)** atau **Direct Connection (`:5432`)** *(IPv6 atau IPv4 add-on)*.
  - Runtime aplikasi mendukung baik Session Pooler (`:5432`) maupun Transaction Pooler (`:6543` dengan `prepare: false`).

---

## 4. Missing Configuration

1. File `.env` lokal berisi `DATABASE_URL` (dan `DIRECT_DATABASE_URL` bila memakai port `:6543` untuk runtime) milik proyek Supabase target **belum tersedia** di ruang kerja, sehingga eksekusi live PostgreSQL belum dapat dijalankan.

---

## 5. Planned Audit & Alignment Actions

1. Memisahkan secara tegas **Migration Connection** (`DIRECT_DATABASE_URL` fallback `DATABASE_URL`, menolak port `6543`) dan **Application Connection** (`DATABASE_URL`, auto `prepare: false` pada `:6543`, auto SSL pada host Supabase) di `.env.example`, `src/lib/db/env.ts`, `src/lib/db/client.ts`, `drizzle.config.ts`, `migrate.ts`, dan `check.ts`.
2. Melakukan audit menyeluruh atas 4 tabel foundational (`patch_versions`, `patch_changes`, `sources`, `entity_evidences`) -> `PHASE_2A_1_SCHEMA_AUDIT.md`.
3. Melakukan audit baris-per-baris berkas SQL `database/migrations/0000_fearless_post.sql` -> `PHASE_2A_1_MIGRATION_AUDIT.md`.
4. Menjalankan seluruh validasi offline, security review (RLS & exposure), dan pemeriksaan kesiapan live Supabase -> `PHASE_2A_1_SUPABASE_VALIDATION.md`.
