# PROJECT_STATUS — Status Proyek MLBB Master Guide

**Terakhir Diperbarui:** `2026-11-26`
**Fase Aktif:** `Production Live — Live Draft Simulator MPL/Ranked, Tren Meta Mingguan, Shareable URL & SEO`
**Status Arsitektur:** `FROZEN_BASELINE (ADR-001 s.d. ADR-009 APPROVED; ADR-010 DEFERRED)`
**Status Basis Data Pengetahuan:** **LIVE PRODUCTION (Supabase + Vercel Auto-Deploy)**

---

## 1. Status Jalur Paralel

| Jalur | Status | Keterangan |
|---|---|---|
| **Track 1: Research Foundation (Phase 0 & 1.1)** | `COMPLETED` | Semua dokumen konseptual selesai dan divalidasi. |
| **Track 2: Development Foundation (Phase 0.5 & 0.5.1)** | `COMPLETED` | Build, lint, typecheck lulus; dependensi bersih. |
| **Track 3: Database Foundation (Phase 2A)** | `COMPLETED` | Supabase connection live, migration executed, schema verified. |

---

## 2. Status Verifikasi Foundation Saat Ini

| Komponen / Gerbang Validasi | Status | Keterangan Aktual |
|---|---|---|
| **Project Structure** | `COMPLETED` | Struktur modular Next.js lengkap. |
| **Documentation (Architecture & Policy Specs)** | `COMPLETED` | Foundation freeze selesai. |
| **Dependency Installation** | `COMPLETED` | `node_modules` dibangun bersih. |
| **TypeScript Validation (`npm run typecheck`)** | `COMPLETED` | Lulus tanpa error. |
| **Lint Validation (`npm run lint`)** | `COMPLETED` | Lint bersih. |
| **Production Build (`npm run build`)** | `COMPLETED` | Build sukses. |
| **PostgreSQL Schema & Migration Foundation** | `COMPLETED` | Live migration berhasil, semua tabel & enum hadir, journal tercatat. |
| **Automated Test Suite (`tests/`)** | `NOT_VERIFIED` | Belum ada tes unit. |

---

## 3. Daftar Tugas

### Selesai (`COMPLETED`)
- Semua tugas Phase 0‑1.3 selesai (lihat laporan masing‑masing).
- **Phase 2A.2 – First Supabase Migration Execution** selesai (artefak: `PHASE_2A_2_MIGRATION_EXECUTION.md`, `PHASE_2A_2_POST_MIGRATION_VALIDATION.md`, `PHASE_2A_2_COMPLETION_REPORT.md`).

### Sedang Berjalan (`IN_PROGRESS`)
- Persiapan Phase 2B — Core Game Knowledge Schema & data ingestion (menunggu persetujuan). 

---

## 4. Keputusan Teknis yang Telah Diambil
(unchanged, refer to previous version)

---

## 5. Tonggak Berikutnya (*Next Milestones*)
1. Pembaruan rutin snapshot statistik Moonton GMS (`npm run meta:sync`), deskripsi skill Bahasa Indonesia (`npm run hero-skills:sync-id`), dan skin premium (`npm run hero-skins:sync`) pada setiap patch baru.
2. Pemantauan performa dan analitik produksi di Vercel.

---

## 6. Log Rilis Terbaru (`2026-11-26`)
- **Live Draft Simulator (Ban/Pick Turnamen MPL & Ranked 10-Ban) (`/draft`):**
  - Engine Ban/Pick deterministik 20 langkah untuk format **Turnamen MPL (2 Fase Ban/Pick)** dan **Ranked Mythic 10-Ban** (`src/features/draft/engine/draft-simulator-engine.ts`), lengkap dengan Undo, Reset, Timer opsional (Off/30d/45d auto-lock), serta serialisasi URL bagikan (`?format=...&seq=...`).
  - **Asisten Draft Real-Time + Mode Lawan AI Drafter (Blue/Red):** rekomendasi Ban/Pick berbasis data resmi Moonton GMS Glory+, cakupan 5 lane, keseimbangan Physical/Magic Damage, Hard CC, dan Frontline, serta integrasi 1-klik ke Audit 5v5 Matchup Hub & Counter Analyzer.
- **Riwayat Snapshot Meta & Auto-Sync Mingguan:**
  - Pencatatan snapshot otomatis ke `src/data/imports/hero-meta-history.json` oleh `npm run meta:sync` (baseline nyata `2026-11-25`), engine tren `meta-trend-engine.ts`, kartu tren `HeroMetaTrendCard` di Detail Hero, indikator naik/turun tier `▲`/`▼` di Tier List, serta GitHub Actions terjadwal `.github/workflows/sync-meta-weekly.yml`.
- **Shareable URL & SEO Teknis Lengkap:**
  - Tombol salin tautan (`ShareLinkButton`) dan sinkronisasi query URL pada Detail Hero, Counter (`?enemies=`), Matchup 1v1 (`?mode=1v1&a=&b=`), Draft 5v5 (`?mode=5v5&ally=&enemy=`), Build (`?items=`), dan Live Draft (`/draft?format=&seq=`).
  - Kartu OpenGraph dinamis `1200×630` (`src/app/opengraph-image.tsx` dan `src/app/heroes/[slug]/opengraph-image.tsx`), metadata SEO dinamis per hero (`generateMetadata`), `src/app/sitemap.ts` (370+ URL), dan `src/app/robots.ts`.
- **Optimasi Kecepatan & Caching Produksi:**
  - Konversi seluruh **133 portrait hero** (`public/heroes/*.webp`) via `sharp` dari **22,98 MB → 1,17 MB** (**hemat 94,9%**), ditambah CDN resize WebP untuk splash art skin premium (`scale-to-width-down/1200` & `640`).
  - Migrasi seluruh halaman pengetahuan dari `force-dynamic` ke **ISR Edge Caching (`revalidate = 3600`)** + deduplikasi query DB per-request dengan `React.cache()`, serta `Cache-Control: public, max-age=31536000, immutable` pada `/fonts/*` dan `/heroes/*`.
  - Pemangkasan payload RSC & DOM Beranda: lazy-load bracket rank via `/api/meta` ter-cache edge, eliminasi duplikasi DOM Desktop/Mobile pada Tier List, pemisahan `hero-skin-utils.ts` (0 KB JSON skin di client bundle), `content-visibility: auto`, `useDeferredValue`, font `<link rel="preload">`, dan `optimizePackageImports: ["lucide-react"]`.
- **Tema Cyber-Gold Navy (Land of Dawn):** Seluruh aplikasi diperbarui ke palet `#0A0E1A` / `#101830` dengan aksen emas `#F5B83D` dan cyan `#22D3EE`, sudut kartu *chamfered*, font lokal SIL OFL (`Rajdhani` + `Inter` di `public/fonts/`), Top 5 Meta Bars, Tier List S–D desktop miring & akordeon mobile + bottom bar mobile.
- **Backdrop Splash Art Skin Premium (133/133 Hero):** Sinkronisasi otomatis (`npm run hero-skins:sync`) ke `src/data/imports/hero-premium-skins.json` berdasarkan hirarki resmi Collection Tier MLBB untuk banner Detail Hero dan sorotan #1 Meta di Beranda.
- **Lokalisasi Penuh Bahasa Indonesia & Produksi:** 590 deskripsi skill resmi Moonton (`x-lang: id`), modul Matchup 1v1 & Draft 5v5, Counter Pick 1–5 musuh, dan Meta Dashboard aktif di GitHub (`PANDEV07/mlbb-master-guide`) & Vercel (`https://mlbb-master-guide.vercel.app/`).
