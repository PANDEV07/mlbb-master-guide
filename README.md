# MLBB Master Guide

Platform intelijen pengetahuan, strategi ranked, dan analisis esports **Mobile Legends: Bang Bang** yang terstruktur, berbasis sumber terverifikasi, serta sadar terhadap perubahan patch (*patch-aware*).

---

## Visi Proyek

Membangun platform pengetahuan *Mobile Legends: Bang Bang* yang komprehensif, tepercaya, dan sadar-patch untuk membantu pemain memahami mekanika permainan secara mendalam, mengambil keputusan draft dan build yang tepat, meningkatkan performa ranked (Solo, Duo, Trio, 5-Man), serta belajar dari pertandingan esports profesional tanpa meniru strategi pro secara membabi buta.

---

## Tujuan Utama

1. **Menyediakan Basis Pengetahuan Terverifikasi:** Setiap fakta permainan (hero, skill, item, emblem, battle spell, patch) terhubung ke sumber yang dapat dilacak, tingkat keyakinan, dan status verifikasi.
2. **Menjaga Kesadaran Patch (*Patch-Awareness*):** Mendeteksi pengetahuan, build, counter, maupun analisis pertandingan yang berpotensi usang ketika patch baru dirilis.
3. **Menjembatani Pro Play ke Ranked:** Mengadaptasi strategi turnamen profesional menjadi panduan realistis yang memperhitungkan kondisi komunikasi dan koordinasi pada Solo, Duo, Trio, serta Full Squad (5-Man).
4. **Arsitektur Modular & Skalabel:** Memisahkan lapisan riset terverifikasi dari lapisan aplikasi web sehingga sistem tetap bersih dan dapat dikembangkan bertahap.

---

## Fitur yang Direncanakan

- **Hero & Skill Intelligence:** Database hero, mekanika skill mendalam, combo, role, dan lane assignment.
- **Item, Build, & Counter System:** Database item, rekomendasi build situasional, hero counter, item counter, matchup, dan sinergi tim.
- **Draft Assistant & Smart Recommendations:** Analisis komposisi draft, balance damage, crowd control, frontline, dan kondisi menang.
- **Ranked & Gameplay Academy:** Kurikulum terpisah untuk Solo Rank, Duo Rank, Trio Rank, 5-Man Squad, Macro Academy, dan Micro Academy.
- **Patch & Meta Intelligence:** Patch center, riwayat perubahan antar versi (Original vs Advance Server), dan penanda konten terdampak patch.
- **Global Esports Intelligence:** Cakupan turnamen global/regional, analisis pertandingan profesional terstandar, dan *Pro Play Lab*.
- **Search & Knowledge Discovery:** Pencarian terstruktur lintas entitas pengetahuan.

---

## Technology Stack

| Lapisan | Teknologi | Catatan |
|---|---|---|
| Framework | **Next.js (App Router)** | Mendukung SSR/SSG, routing modular, dan optimasi performa web. |
| Bahasa | **TypeScript (Strict)** | Menjamin keamanan tipe di seluruh skema data pengetahuan dan UI. |
| Styling | **Tailwind CSS v4** | Sistem desain tema gelap (*dark-first*), responsif, dan konsisten. |
| Ikon | **Lucide React** | Set ikon ringan untuk navigasi dan indikator status. |
| Database *(Rencana)* | **PostgreSQL** | Skema relasional + JSONB untuk data historis dan patch versioning *(belum difinalisasi pada Phase 0.5)*. |

Lihat penjelasan rinci pemilihan teknologi di [docs/architecture/TECH_STACK.md](docs/architecture/TECH_STACK.md).

---

## Struktur Proyek

```text
mlbb-master-guide/
├── README.md
├── AGENTS.md
├── PROJECT_STATUS.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── docs/
│   ├── research/          # Dokumen riset Phase 0 (game & esports coverage)
│   ├── architecture/      # Tech stack, system architecture, product architecture
│   └── roadmap/           # Dokumentasi rencana fase implementasi
├── database/
│   ├── schema/            # Kerangka skema PostgreSQL (menunggu review Phase 0)
│   ├── migrations/        # Placeholder migrasi database
│   └── seeds/             # Placeholder seed (dilarang mengisi data palsu)
├── public/
│   ├── images/
│   ├── heroes/
│   ├── items/
│   └── icons/
├── src/
│   ├── app/               # Halaman Next.js App Router (/, /heroes, /items, dll.)
│   ├── components/        # Komponen layout, navigasi, UI primitif, dan shared
│   ├── features/          # Modul fitur per domain pengetahuan
│   ├── lib/               # Utilitas bersama & metadata halaman
│   ├── services/          # Kontrak kebijakan pengetahuan & verifikasi
│   ├── types/             # Definisi tipe TypeScript lintas domain
│   └── data/              # Metadata struktural platform (tanpa data game palsu)
└── tests/                 # Folder pengujian terstruktur
```

---

## Instalasi & Perintah Pengembangan

### Prasyarat
- Node.js v20+ (teruji pada v24.11.0)
- npm v10+

### Instalasi
```bash
npm install
```

### Perintah Pengembangan
```bash
# Menjalankan server development lokal
npm run dev

# Memeriksa tipe TypeScript
npm run typecheck

# Menjalankan ESLint
npm run lint

# Membuat build produksi
npm run build

# Menjalankan hasil build produksi
npm run start
```

---

## Status Pengembangan Saat Ini

**Fase Aktif:** `Phase 0.5 — Project Initialization`

- Fondasi proyek web Next.js + TypeScript + Tailwind CSS telah diinisialisasi beserta kerangka halaman utama (`/`, `/heroes`, `/items`, `/builds`, `/matchups`, `/counters`, `/esports`, `/academy`, `/patches`, `/search`).
- Jalur **Research Foundation (Phase 0)** masih berjalan paralel. Seluruh halaman website saat ini menampilkan *structural empty states* dan **tidak** memuat data game atau turnamen buatan/fiktif.
- Lihat status rinci di [PROJECT_STATUS.md](PROJECT_STATUS.md).
