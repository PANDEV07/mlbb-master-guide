# PRODUCT_ARCHITECTURE — Arsitektur Produk & Batas 12 Modul MLBB Master Guide

**Status Dokumen:** **Final Foundation Freeze (`Phase 1.3`, selaras `ADR-009`)**  
**Prinsip Utama:** Memisahkan **12 modul domain logis** (kepemilikan data & repository) dari **struktur navigasi antarmuka** (tetap ringkas dan tidak membebani pengguna dengan 12+ menu tingkat atas).

---

## 1. Batas 12 Modul Produk Logis & Kepemilikan Data

| No | Modul Logis | Rute UI / Permukaan | Kepemilikan Data Utama (Write/Master) | Shared Knowledge yang Dikonsumsi (Read-Only via Repo) |
|---|---|---|---|---|
| 1 | **Heroes** | `/heroes` | `heroes`, `hero_version_profiles`, `hero_skills`, `hero_combos` | `game_mechanics`, `patch_versions`, `entity_evidences` |
| 2 | **Items** | `/items` | `items`, `item_version_profiles`, `item_components`, `item_effects`, `emblems`, `battle_spells` | `game_mechanics`, `patch_versions`, `entity_evidences` |
| 3 | **Builds** | `/builds` | `builds`, `build_items` | `heroes`, `items`, `emblems`, `battle_spells`, `patch_versions` |
| 4 | **Matchups** | `/matchups` | `hero_matchups` | `heroes`, `items`, `patch_versions` |
| 5 | **Counters** | `/counters` | `hero_counters`, `item_counters` | `heroes`, `items`, `game_mechanics`, `patch_versions` |
| 6 | **Synergies** | `/counters` *(tab/bagian sinergi; folder domain terpisah `src/features/synergies/`)* | `hero_synergies` *(serta `team_compositions` di Phase 7)* | `heroes`, `patch_versions` |
| 7 | **Academy** | `/academy` | `game_fundamentals`, `academy_lessons` (`MICRO` & `MACRO`) | `heroes`, `items`, `patch_versions` |
| 8 | **Ranked** | `/academy` *(jalur/sub-rute `/academy/ranked` pada Phase 5; folder domain `src/features/ranked/`)* | `pro_to_ranked_adaptations` + konfigurasi TS `ranked_contexts` (`SOLO`/`DUO`/`TRIO`/`5-MAN`) | `competitive_insights`, `academy_lessons`, `patch_versions` |
| 9 | **Esports** | `/esports` | `competitions`, `competition_events`, `tournament_stages`, `teams`, `players`, `team_rosters`, `matches`, `match_games`, `draft_actions`, `game_player_performances`, `tournament_hero_stats`, `match_observations`, `competitive_insights` | `heroes`, `items`, `patch_versions`, `sources`, `entity_evidences` |
| 10 | **Patches** | `/patches` | `patch_versions`, `patch_changes` | Membaca status `OUTDATED` lintas modul via shared service (tanpa memiliki data entitas lain) |
| 11 | **Search** | `/search` | Tidak memiliki tabel konten sendiri (query index lintas domain) | Membaca entitas publik `ORIGINAL_SERVER` + metadata patch/status melalui search repository terpadu |
| 12 | **Knowledge Sources** | Lapisan governance wajib di seluruh halaman *(+ opsi `/sources` di Phase 2A/6)* | `sources`, `entity_evidences`, `game_mechanics` | Menjadi fondasi audit bukti dan status verifikasi seluruh modul |

*(Halaman `/` **Homepage / Command Hub** berfungsi sebagai gerbang ringkasan menuju modul-modul di atas dan tidak menyimpan domain data tersendiri.)*

---

## 2. Aturan Coupling, Feature Dependencies, & Larangan Duplikasi (`ADR-009`)

1. **Larangan Query Lintas Domain Langsung:** Feature module (mis. `src/features/builds/`) **dilarang** melakukan query SQL/Drizzle langsung ke tabel milik domain lain (`heroes`, `items`, `patch_versions`). Seluruh akses lintas domain wajib memanggil **Shared Canonical Repositories** (`src/services/repositories/`).
2. **Satu Titik Sumber Kebenaran (Zero Duplication):**
   - **Heroes** dimiliki eksklusif oleh modul `Heroes` (`heroes`, `hero_version_profiles`, `hero_skills`).
   - **Items** dimiliki eksklusif oleh modul `Items` (`items`, `item_version_profiles`, `item_effects`, `item_components`).
   - **Patch versions** dimiliki eksklusif oleh modul `Patches`.
   - **Sources & Evidences** dimiliki eksklusif oleh modul `Knowledge Sources`.
   - **Tournament facts & Competitive data** dimiliki eksklusif oleh modul `Esports`.
   - Modul lain (`Builds`, `Matchups`, `Counters`, `Synergies`, `Academy`, `Ranked`, `Search`) **hanya membaca** entitas di atas secara *read-only* via repository kanonik melalui ID/FK dan **dilarang** menyalin ulang nama/stat/fakta turnamen ke tabel atau konstanta lokalnya.
3. **Matriks Ketergantungan Fitur (Feature Dependencies):**
   - `Heroes`, `Items`, `Patches`, `Knowledge Sources`, `Academy` (`game_fundamentals`) → bergantung langsung pada infrastruktur `Patches` & `Knowledge Sources`.
   - `Builds`, `Matchups`, `Counters`, `Synergies` → bergantung *read-only* pada `Heroes` + `Items` + `Knowledge Sources`.
   - `Esports` → bergantung *read-only* pada `Heroes` + `Items` + `Patches` + `Knowledge Sources`.
   - `Ranked` → bergantung *read-only* pada `Esports` (`competitive_insights`) + `Academy` + `Patches`.
   - `Search` → bergantung *read-only* lintas seluruh modul publik `ORIGINAL_SERVER` via PostgreSQL FTS (`tsvector` + `GIN`) + `pg_trgm` (mendukung nama/alias hero, item, terminologi ID/EN, istilah komunitas, common typos, patch, serta turnamen/tim/pemain).
4. **Satu Titik Filter Default (`ORIGINAL_SERVER` & `is_current`):** Repository kanonik bertanggung jawab menegakkan filter `server_type = 'ORIGINAL_SERVER'` dan `is_current = true` (untuk entitas SCD Type 2), sehingga data *Advance Server* atau versi usang tidak pernah bocor secara tidak sengaja ke modul lain.
5. **Navigasi UI Ringkas:** Jumlah menu utama sidebar dipertahankan pada 10 rute inti (dengan sub-bagian atau sub-rute bertahap seperti `/academy/ranked` atau `/sources` bila diperlukan pada fase lanjut) agar antarmuka tetap bersih.

---

## 3. Alur Keterhubungan Antarmodul

1. **Alur Pemain Ranked (Belajar & Persiapan Draft):**
   - Pemain mencari hero di `/heroes` → memeriksa duel lane di `/matchups` → memeriksa hero/item counter serta sinergi komposisi di `/counters` → menyusun build situasional di `/builds` → mempelajari eksekusi Micro/Macro & adaptasi party (`Solo`/`Duo`/`Trio`/`5-Man`) di `/academy`.
2. **Alur Patch Awareness (Perlindungan Akurasi):**
   - Perubahan tercatat di `/patches` → memicu snapshot versi baru untuk *Core Entities* dan menandai *Derived Knowledge* terkait menjadi `OUTDATED` di `/heroes`, `/items`, `/builds`, `/counters`, `/matchups`, `/academy`, dan `/esports`.
3. **Alur Pro-to-Ranked Intelligence:**
   - Pertandingan di `/esports` direkam pada level `match_games` → observasi & interpretasi strategis dievaluasi risikonya terhadap 7 dimensi Ranked → diterbitkan sebagai adaptasi aman di `/academy`.
