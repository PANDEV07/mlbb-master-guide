# PHASE_2A_1_SUPABASE_VALIDATION — Audit Koneksi, Keamanan, & Validasi Supabase

**Tanggal:** `2026-11-18`  
**Status Live Connection:** `BLOCKED / NOT_RUN` *(Belum terdapat `.env` maupun `DATABASE_URL` Supabase yang dikonfigurasi di environment)*  

---

## 1. Strategi Koneksi Supabase + Drizzle ORM (`STEP 2`)

| Jenis Koneksi | Port & Host Supabase | Digunakan Untuk | Kompatibilitas Drizzle | Konfigurasi Proyek |
|---|---|---|---|---|
| **Direct PostgreSQL Connection** | `db.<ref>.supabase.co:5432` *(catatan: IPv6-first kecuali IPv4 add-on aktif)* | **Migration Connection** & Admin | Penuh (`drizzle-kit`, `migrate()`, `studio`) | `DIRECT_DATABASE_URL` *(opsional bila `DATABASE_URL` sudah memakai `:5432`)* |
| **Supabase Session Pooler** | `aws-0-<region>.pooler.supabase.com:5432` *(IPv4 + IPv6)* | **Migration Connection** maupun **Application Connection** | Penuh (`drizzle-kit`, `migrate()`, prepared statements, `studio`) | Direkomendasikan untuk `DIRECT_DATABASE_URL` di jaringan IPv4 (Windows/CI) |
| **Supabase Transaction Pooler (Supavisor)** | `aws-0-<region>.pooler.supabase.com:6543` *(IPv4 + IPv6)* | **Application Runtime Only** | Memerlukan `prepare: false` pada `postgres.js`; **tidak kompatibel** untuk `drizzle-kit` / migrasi | Didukung otomatis oleh `src/lib/db/client.ts` (`prepare: !config.isTransactionPooler`) dan ditolak eksplisit pada `getMigrationDatabaseConfig()` |

---

## 2. Audit Keamanan & Row Level Security (`STEP 8`)

### Keamanan Kredensial & Client Bundle
- **Exposure ke Browser:** Terverifikasi melalui pencarian lintas `src/` — tidak ada file `"use client"` yang mengimpor `@/lib/db` maupun mengakses `DATABASE_URL` / `DIRECT_DATABASE_URL`. Tidak ada variabel `NEXT_PUBLIC_` untuk database.
- **Kebocoran Secret:** `.env` dan `.env*.local` masuk `.gitignore`; `.env.example` hanya berisi placeholder; `maskDatabaseUrl()` menyamarkan password dan project-ref username pooler sebelum dicetak di log CLI.
- **Supabase Auth:** Tidak diimplementasikan (ditunda hingga Phase 7–8 per `ADR-010`).

### Analisis Row Level Security (RLS) pada Supabase
1. **RLS Current Status:** RLS **belum diaktifkan** pada migrasi `0000_fearless_post.sql` (dan aplikasi mengakses PostgreSQL sepenuhnya dari sisi server via Drizzle ORM dengan koneksi `postgres`).
2. **Apakah RLS diperlukan pada arsitektur MVP saat ini?**
   - Untuk eksekusi query aplikasi melalui server-side Drizzle ORM: **Tidak wajib** (role pemilik `postgres` melewati RLS secara default).
   - **Namun pada platform Supabase**, schema `public` diekspos otomatis ke Data API PostgREST (`anon` / `authenticated` keys) secara default! Karena itu, saat database Supabase live disiapkan, pemilik proyek disarankan **salah satu dari**:
     - *(Opsi A — Disarankan)* Menonaktifkan eksposur schema `public` pada **Supabase Dashboard → API Settings → Exposed schemas**, **atau**
     - *(Opsi B)* Mengaktifkan `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` tanpa policy `anon` (deny-all untuk PostgREST publik) — yang **tidak** mengganggu query server-side Drizzle selama koneksi memakai role `postgres`.
3. **RLS Requirements untuk Fase Mendatang (`ADR-010` Phase 7–8):**
   - Jika autentikasi pengguna atau akses klien langsung diperkenalkan nanti, tabel yang wajib dilindungi RLS per-user/per-role mencakup: `users`, `curator_profiles`, `user_learning_progress`, `knowledge_submissions`, `community_notes`, `telemetry_events`, serta pembatasan tulis berbasis role kurator pada `patch_versions`, `patch_changes`, `sources`, dan `entity_evidences`.

---

## 3. Hasil Eksekusi Validasi (`STEP 11`)

| Validasi | Status | Rincian Aktual |
|---|---|---|
| **TypeScript (`npm run typecheck`)** | `PASSED` | Exit code `0`, 0 error (`strict: true`). |
| **ESLint (`npm run lint`)** | `PASSED` | Exit code `0`, 0 error/warning. |
| **Production Build (`npm run build`)** | `PASSED` | Exit code `0`, kompilasi `2.3s`, `13/13` halaman statis berhasil di-prerender. |
| **Drizzle Schema & Offline Validation (`npm run db:validate`)** | `PASSED` *(Offline)* / `NOT_RUN` *(Live)* | Validasi & deteksi Supabase Session/Transaction Pooler, masking URL, 4 tabel foundational, serta berkas SQL & journal lulus; cek live dilewati karena `DATABASE_URL` belum disetel. |
| **Live Supabase Check (`npm run db:check`)** | `BLOCKED` | Exit code `1`: skema & journal terbaca, diblokir karena `DATABASE_URL` belum dikonfigurasi. |
| **Migration Execution (`npm run db:migrate`)** | `NOT_RUN` | Tidak dijalankan karena belum ada koneksi PostgreSQL Supabase yang tersedia. |
| **Post-Migration Schema Inspection** | `NOT_RUN` | Menunggu eksekusi `npm run db:migrate` terhadap proyek Supabase live. |
| **Markdown Link Validation** | `PASSED` | Terverifikasi `BROKEN_COUNT: 0` di seluruh repositori. |
