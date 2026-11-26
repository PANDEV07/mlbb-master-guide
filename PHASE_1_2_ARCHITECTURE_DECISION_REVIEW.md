# PHASE_1_2_ARCHITECTURE_DECISION_REVIEW — Tinjauan Keputusan Arsitektur MLBB Master Guide

**Tanggal:** `2026-11-18`  
**Fase:** `Phase 1.2 — Architecture Decision Review`  
**Status:** `SUPERSEDED_BY_PHASE_1_3_APPROVAL` *(Telah disetujui pada Phase 1.3 sebagai `APPROVED_IN_PRINCIPLE_WITH_CLARIFICATIONS`; lihat `ARCHITECTURE_DECISION_REGISTER.md` dan `docs/architecture/ARCHITECTURE_FOUNDATION_FREEZE.md`.)*  

---

## Executive Summary

Setelah pemulihan dokumentasi fondasi pada Phase 1.1, seluruh 15 dokumen riset, arsitektur, kebijakan, dan roadmap telah ditinjau secara kritis. Tujuan tinjauan ini adalah memastikan arsitektur **MLBB Master Guide** cukup kuat menopang platform *knowledge intelligence* jangka panjang tanpa terjebak pada **overengineering**, fragmentasi tabel yang berlebihan, atau layanan eksternal prematur.

**Kesimpulan Utama Tinjauan:**
1. **Arsitektur Sistem:** Tetap menggunakan **Modular Monolith** berbasis Next.js 15 App Router + TypeScript strict + **PostgreSQL 16+** standar (tanpa microservices, tanpa graph database terpisah, tanpa Elasticsearch/Redis eksternal di tahap awal).
2. **Database & ORM:** PostgreSQL dengan pemodelan relasional + `JSONB` sudah memadai dan paling tepat. Untuk ORM/query layer, diusulkan **Drizzle ORM** karena transparansi SQL, kontrol migrasi `.sql` langsung, dukungan fitur native PostgreSQL (`pg_trgm`, `GIN`, *partial unique index*), dan keamanan tipe penuh.
3. **Simplifikasi Overengineering dari Draft Phase 1.1:**
   - **Provenance:** Menyederhanakan dari 4 tabel polimorfik berat menjadi **2 lapis** (*embedded governance fields* pada tabel utama + `sources` & `entity_evidences` untuk sitasi multi-sumber), menangguhkan `verification_records` & tabel terpisah `claim_conflicts` hingga fase multi-kurator.
   - **Patch Versioning:** Menggunakan **Hybrid Approach** — *SCD Type 2* (`valid_from_patch_id`, `valid_until_patch_id`, `is_current`) hanya untuk entitas numerik/aturan inti (`hero_version_profiles`, `hero_skills`, `items`, `game_fundamentals`), sedangkan entitas analisis turunan (`builds`, `matchups`, `counters`, `insights`) cukup memakai `patch_version_id` + status `OUTDATED`.
   - **Esports:** Mempertahankan pemisahan krusial `matches` → `match_games` → `draft_actions` dan pemisahan `tournament_hero_stats` (agregat) vs urutan draft per-game; namun menggabungkan `tournament_groups` ke kolom `matches.group_label` dan menaruh `vod_url` awal di entitas turnamen/match/game.
   - **Fundamentals & Academy:** Menggabungkan `game_modes` ke `game_fundamentals`, menyatukan `gameplay_concepts` + `academy_lessons`, menaruh 4 profil statis `ranked_contexts` di kode TypeScript terstruktur, serta menangguhkan `team_compositions` dan seluruh tabel user/progression/telemetry (`ARCH-REC-10`) ke Phase 7–8.

---

## Architecture Decisions

Evaluasi objektif terhadap seluruh 10 rekomendasi Phase 1 (`ARCH-REC-01` s.d. `ARCH-REC-10`) ditambah keputusan infrastruktur inti:

### ARCH-REC-01 — Penyelesaian & Review Fondasi Sebelum DDL / Phase 2
- **Recommendation ID:** `ARCH-REC-01`
- **Current problem:** 8 dokumen fondasi sempat hilang pada Phase 1 (kini sudah dibuat pada Phase 1.1), sementara `PRODUCT_ARCHITECTURE.md` masih berupa ringkasan dan keputusan arsitektur belum disetujui formal.
- **Proposed solution:** Menahan pembuatan migrasi SQL dan pengisian data hingga keputusan arsitektur Phase 1.2 disetujui dan `PRODUCT_ARCHITECTURE.md` diselaraskan; riset sumber primer `CURRENT_GAME_RESEARCH.md` berjalan paralel dengan Phase 2A (DDL infrastruktur governance/patch) dan menjadi gerbang wajib sebelum Phase 2B (ingest Hero/Item).
- **Alternative solutions:** Langsung menulis SQL DDL sekarang tanpa approval, atau memblokir Phase 2A hingga seluruh riset Hero selesai.
- **Technical reasoning:** Phase 2A hanya membangun tabel infrastruktur (`patch_versions`, `sources`, `entity_evidences`) yang tidak bergantung pada isi angka stat Hero, namun tetap membutuhkan kepastian keputusan arsitektur & ORM.
- **Complexity:** Rendah
- **Scalability:** Netral
- **Maintainability:** Tinggi (mencegah rework migrasi berulang)
- **Development cost:** Sangat rendah (hanya waktu review)
- **Risks:** Penundaan singkat sebelum implementasi kode dimulai.
- **Dependencies:** Persetujuan user atas dokumen ini dan `ARCHITECTURE_DECISION_REGISTER.md`.
- **Decision recommendation:** **`ACCEPT_WITH_MODIFICATION`** *(Dokumen Phase 1.1 sudah ada; gate saat ini adalah approval Phase 1.2 sebelum Phase 2A, sementara verifikasi data `CURRENT_GAME_RESEARCH.md` menjadi syarat Phase 2B).*

### ARCH-REC-02 — Penyatuan Taksonomi Verifikasi & Multi-Source Provenance
- **Recommendation ID:** `ARCH-REC-02`
- **Current problem:** Status verifikasi berbeda antar dokumen dan `KnowledgeGovernanceMeta` di `src/types/knowledge.ts` hanya menyimpan satu `sourceLabel: string | null`, sementara draft `DATABASE_SCHEMA.md` mengusulkan 4 tabel governance berat (`sources`, `entity_evidences`, `verification_records`, `claim_conflicts`).
- **Proposed solution:** Menyatukan taksonomi (`claim_classification` 6 nilai, `verification_status` 9 nilai), menggunakan kolom governance tersemat pada entitas utama + tabel `sources` & `entity_evidences` untuk bukti multi-sumber per aspek, serta menyederhanakan konflik ke `verification_status = 'CONFLICTING'` + catatan pada `entity_evidences` tanpa tabel `claim_conflicts` maupun `verification_records` terpisah di MVP.
- **Alternative solutions:** (a) Satu kolom `source_url` teks per tabel (terlalu lemah untuk entitas multi-aspek seperti turnamen/hero); (b) Seluruh 4 tabel governance sekaligus pada Phase 2A (overengineering untuk tim kurator tunggal).
- **Technical reasoning:** Menggabungkan kolom status langsung di tabel utama menghilangkan join wajib pada setiap read query, sementara `entity_evidences` tetap mengakomodasi bukti multi-sumber di mana dibutuhkan.
- **Complexity:** Sedang
- **Scalability:** Tinggi
- **Maintainability:** Tinggi
- **Development cost:** Sedang (jauh lebih hemat dibanding 4 tabel + mekanisme audit trail penuh di awal)
- **Risks:** Riwayat siapa-mengubah-apa berkali-kali (*audit log*) belum tercatat per-event sampai `verification_records` ditambahkan di fase editorial lanjutan.
- **Dependencies:** Pembaruan kontrak `src/types/knowledge.ts` di Phase 2A.
- **Decision recommendation:** **`ACCEPT_WITH_MODIFICATION`**

### ARCH-REC-03 — Patch Temporal Versioning & Dependency Impact Graph
- **Recommendation ID:** `ARCH-REC-03`
- **Current problem:** Belum ada keputusan bagaimana sistem menyimpan histori antar patch dan menandai data usang tanpa membuat duplikasi snapshot ribuan baris setiap kali balance patch rilis.
- **Proposed solution:** Menerapkan pendekatan **Hybrid**: (1) `patch_versions` + `patch_changes`; (2) *SCD Type 2* (`valid_from_patch_id`, `valid_until_patch_id`, `is_current`) hanya untuk entitas master dinamis berangka (`hero_version_profiles`, `hero_skills`, `items`, `game_fundamentals`); (3) `patch_version_id` + `verification_status` (`OUTDATED`) untuk entitas analisis (`builds`, `matchups`, `counters`, `insights`, `adaptations`); serta (4) menunda tabel workflow `patch_impact_queue` sampai volume kurasi membutuhkannya (cukup query entitas berstatus `OUTDATED`).
- **Alternative solutions:** (a) Hanya satu `patch_version` string per record (merusak histori esports); (b) Full snapshot seluruh database tiap patch (duplikasi masif); (c) Event sourcing murni (query baca lambat/rumit).
- **Technical reasoning:** Mayoritas hero (~125+) dan item (~100+) tidak berubah pada satu patch minor; *SCD Type 2* hanya menyisipkan baris baru bagi entitas yang benar-benar berubah, sedangkan analisis turunan cukup ditandai `OUTDATED`.
- **Complexity:** Sedang
- **Scalability:** Tinggi
- **Maintainability:** Tinggi
- **Development cost:** Sedang
- **Risks:** Query membaca kondisi patch lama membutuhkan filter rentang patch (`valid_from <= P AND (valid_until IS NULL OR valid_until > P)`).
- **Dependencies:** `patch_versions` pada Phase 2A.
- **Decision recommendation:** **`ACCEPT_WITH_MODIFICATION`**

### ARCH-REC-04 — Hierarki 5-Layer Competitive Intelligence (`Match` vs `Game`)
- **Recommendation ID:** `ARCH-REC-04`
- **Current problem:** Draft `database/schema/README.md` tidak memiliki `match_games` di bawah `matches`, sedangkan draft Phase 1.1 mengusulkan 17 tabel esports termasuk `tournament_groups`, `vod_records`, dan `meta_trends`.
- **Proposed solution:** Mempertahankan pemisahan **5 lapisan analisis** dan hierarki `competitions` → `competition_events` → `tournament_stages` → `matches` → `match_games` → `draft_actions` + `game_player_performances`, plus `tournament_hero_stats` untuk statistik agregat parsial; **menyederhanakan** dengan menghapus tabel `tournament_groups` (cukup kolom `group_label` di `matches`), menyimpan `vod_url` langsung di `competition_events`/`matches`/`match_games`, dan menangguhkan tabel terkomputasi `meta_trends` hingga Phase 7.
- **Alternative solutions:** Menempelkan draft langsung ke `matches` (gagal total untuk seri Bo3/Bo5/Bo7) atau mempertahankan 17 tabel penuh sejak Phase 4.
- **Technical reasoning:** `match_games` adalah syarat mutlak akurasi draft/sisi Blue-Red per game, sedangkan `tournament_groups` dan `vod_records` terpisah tidak memberi nilai tambah signifikan di Phase 4.
- **Complexity:** Sedang
- **Scalability:** Tinggi
- **Maintainability:** Tinggi
- **Development cost:** Sedang (berkurang ~3 tabel dari draft Phase 1.1)
- **Risks:** Jika satu game punya banyak VOD mirror multi-bahasa di masa depan, kolom `vod_url` tunggal bisa diekstrak menjadi tabel anak di kemudian hari.
- **Dependencies:** Phase 2A & Phase 2B (`heroes`, `items`).
- **Decision recommendation:** **`ACCEPT_WITH_MODIFICATION`**

### ARCH-REC-05 — Pemodelan Relasi Terstruktur Matchup, Counter, Synergy, & Build Context
- **Recommendation ID:** `ARCH-REC-05`
- **Current problem:** Label statis UI saat ini belum mampu menampung arah counter, konteks fase matchup, aturan *unique passive non-stacking* item, serta konteks/reasoning build.
- **Proposed solution:** Menerapkan tabel relasi berarah dan kontekstual untuk `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`, `items` + `item_effects` (`unique_group_key`) + `item_components`, dan `builds` + `build_items`; **menunda** tabel terpisah `team_compositions` hingga Phase 7 (*Draft Assistant*) dengan menggunakan tag arketipe komposisi pada `hero_synergies` & `builds` di Phase 3.
- **Alternative solutions:** Menyimpan build/counter sebagai teks markdown bebas (mustahil dipakai untuk kalkulasi/validasi), atau membangun mesin arketipe `team_compositions` sejak Phase 3.
- **Technical reasoning:** Konteks terstruktur pada build & counter adalah inti visi platform, sedangkan kalkulasi arketipe 5-man baru terpakai di *Draft Assistant* (Phase 7).
- **Complexity:** Sedang
- **Scalability:** Tinggi
- **Maintainability:** Tinggi
- **Development cost:** Sedang
- **Risks:** Pengisian data Phase 3 membutuhkan disiplin penulisan reasoning per item/counter.
- **Dependencies:** Phase 2B (`heroes`, `items`, `game_mechanics`).
- **Decision recommendation:** **`ACCEPT_WITH_MODIFICATION`**

### ARCH-REC-06 — Pemodelan Game Fundamentals, Micro/Macro, & Pro-to-Ranked 7-Dimensi
- **Recommendation ID:** `ARCH-REC-06`
- **Current problem:** Domain Game Fundamentals, Micro, Macro, dan Ranked Context belum dimodelkan, sementara draft `DATABASE_SCHEMA.md` membuat 7 tabel terpisah (`game_modes`, `game_fundamentals`, `game_mechanics`, `gameplay_concepts`, `academy_lessons`, `ranked_contexts`, `pro_to_ranked_adaptations`) dengan potensi duplikasi kolom turnamen pada adaptasi.
- **Proposed solution:**
  1. Menggabungkan `game_modes` ke dalam `game_fundamentals` (dengan kategori `GAME_MODE`).
  2. Mempertahankan `game_mechanics` sebagai kamus tag mekanik bersama.
  3. Menggabungkan `gameplay_concepts` dan `academy_lessons` menjadi satu entitas kurikulum terstruktur (`academy_lessons` dengan domain `MICRO` | `MACRO` | `RANKED`).
  4. Menyimpan 4 profil referensi `ranked_contexts` (`SOLO`, `DUO`, `TRIO`, `5-MAN`) sebagai konstanta TypeScript terstruktur daripada tabel DB 4 baris.
  5. Menormalisasi `pro_to_ranked_adaptations` agar merujuk `insight_id` melalui FK (tidak menduplikasi teks Tournament/Match/Game/Teams/Patch).
- **Alternative solutions:** Mempertahankan seluruh 7 tabel terpisah beserta duplikasi metadata match di tabel adaptasi.
- **Technical reasoning:** Menghilangkan 3 tabel kecil/duplikat sambil mempertahankan 100% syarat 19 komponen adaptasi dan pencegahan *misleading advice*.
- **Complexity:** Rendah–Sedang
- **Scalability:** Tinggi
- **Maintainability:** Tinggi
- **Development cost:** Rendah–Sedang
- **Risks:** Perubahan referensi `ranked_contexts` memerlukan redeploy kode (sangat jarang berubah karena hanya 4 ukuran party).
- **Dependencies:** Phase 2B & Phase 4 (`competitive_insights`).
- **Decision recommendation:** **`ACCEPT_WITH_MODIFICATION`**

### ARCH-REC-07 — Kebijakan Hirarki Sumber & Resolusi Konflik (`SOURCE_VERIFICATION_POLICY`)
- **Recommendation ID:** `ARCH-REC-07`
- **Current problem:** Belum ada kebijakan baku untuk memvalidasi sumber riset gameplay non-esports dan menangani konflik data.
- **Proposed solution:** Mengadopsi `SOURCE_VERIFICATION_POLICY.md` (Tier 1 Official, Tier 2/3 Secondary & Analytical, Tier 4 Community, aturan redirect URL, broken URL, dan status `CONFLICTING`) secara penuh di seluruh alur kurasi, dengan implementasi konflik DB sederhana di `entity_evidences`.
- **Alternative solutions:** Membiarkan kurator menggunakan sumber blog/komunitas secara bebas untuk angka game.
- **Technical reasoning:** Menjaga komitmen *Zero Fake Data* dan integritas data `AGENTS.md`.
- **Complexity:** Rendah (kebijakan operasional)
- **Scalability:** Tinggi
- **Maintainability:** Tinggi
- **Development cost:** Rendah
- **Risks:** Kecepatan ingest Phase 2B sedikit lebih lambat karena butuh konfirmasi klien *Original Server* resmi.
- **Dependencies:** Tidak ada (berlaku segera).
- **Decision recommendation:** **`ACCEPT`**

### ARCH-REC-08 — Penyatuan Penamaan Tabel & Batas 12 Modul Produk
- **Recommendation ID:** `ARCH-REC-08`
- **Current problem:** Penamaan tabel berbeda antar dokumen dan `PRODUCT_ARCHITECTURE.md` belum memisahkan tanggung jawab logis antara `Counters` vs `Synergies`, `Academy` vs `Ranked`, serta belum memiliki modul `Knowledge Sources`.
- **Proposed solution:** Menetapkan nama tabel kanonik di `DATABASE_SCHEMA.md`, memisahkan domain logis dan *repository layer* menjadi 12 domain bersih tanpa duplikasi query, sambil menjaga navigasi utama web tetap ringkas (10 rute utama + sub-rute `/academy/ranked`, tab/section sinergi di `/counters`, dan opsi penambahan `/sources` saat Phase 2A/6).
- **Alternative solutions:** Memaksa 12 link menu tingkat atas di sidebar (membuat navigasi sesak) atau membiarkan tiap halaman melakukan query duplikat ke tabel `heroes`/`items`.
- **Technical reasoning:** Memisahkan arsitektur **domain logis/kode** dari **jumlah item navigasi UI** menghasilkan modul independen tanpa duplikasi data.
- **Complexity:** Rendah
- **Scalability:** Tinggi
- **Maintainability:** Tinggi
- **Development cost:** Rendah
- **Risks:** Perlu pembaruan `PRODUCT_ARCHITECTURE.md` agar mencerminkan batas 12 modul dan sub-rute.
- **Dependencies:** Persetujuan user atas batas modul.
- **Decision recommendation:** **`ACCEPT_WITH_MODIFICATION`**

### ARCH-REC-09 — Pembersihan Sitasi `CURRENT_GAME_RESEARCH.md` & Link Relatif
- **Recommendation ID:** `ARCH-REC-09`
- **Current problem:** Link absolut `file:///C:/Users/...` dan 8 URL redirect Google Grounding di `CURRENT_GAME_RESEARCH.md`.
- **Proposed solution:** Link absolut sudah dibersihkan di Phase 1.1; penggantian 8 URL redirect pada `CURRENT_GAME_RESEARCH.md` dijadwalkan sebagai prasyarat riset sebelum data Patch `2.2.23` masuk ke Phase 2B (tidak menghambat pembangunan infrastruktur Phase 2A).
- **Alternative solutions:** Membiarkan URL redirect masuk ke seed database (melanggar `SOURCE_VERIFICATION_POLICY.md`).
- **Technical reasoning:** Memisahkan pembersihan riset konten dari pembangunan skema teknis agar pekerjaan tetap paralel dan aman.
- **Complexity:** Rendah
- **Scalability:** Netral
- **Maintainability:** Tinggi
- **Development cost:** Rendah
- **Risks:** Jika sumber resmi Patch `2.2.23` tidak ditemukan saat riset langsung, angka lama tetap ditahan `UNVERIFIED`.
- **Dependencies:** Akses riset web / klien game saat tahap riset Phase 2B.
- **Decision recommendation:** **`ACCEPT`**

### ARCH-REC-10 — Entitas User Learning Progression, UGC, & Telemetry
- **Recommendation ID:** `ARCH-REC-10`
- **Current problem:** Draft Phase 1 menyarankan perancangan awal `users`, `curator_profiles`, `user_learning_progress`, `knowledge_submissions`, `draft_analysis_sessions`, dan `telemetry_events`.
- **Proposed solution:** **Menangguhkan** seluruh desain tabel user, autentikasi, progres belajar pengguna, kontribusi komunitas, dan telemetri hingga Phase 7–8. Pada Phase 2A–6, kolom `verified_by` cukup bertipe `varchar` sederhana tanpa FK ke tabel `users`.
- **Alternative solutions:** Membangun sistem autentikasi, peran kurator, dan progress tracking sejak Phase 2A.
- **Technical reasoning:** Platform publik belum membutuhkan akun pengguna untuk memberikan nilai utama pada Phase 2–6; membangun auth & UGC terlalu dini akan menggandakan beban pengembangan sebelum basis pengetahuan ada.
- **Complexity:** Tinggi jika dibangun dini / Nol jika ditunda
- **Scalability:** Dapat ditambahkan bersih di Phase 8
- **Maintainability:** Jauh lebih tinggi karena fokus pada domain pengetahuan inti dulu
- **Development cost:** Menghemat biaya pengembangan Phase 2–6 secara signifikan
- **Risks:** Memerlukan migrasi penambahan tabel `users` dan konversi/pemetaan `verified_by` pada Phase 8 (risiko migrasi sangat kecil).
- **Dependencies:** Penyelesaian Phase 2–5 terlebih dahulu.
- **Decision recommendation:** **`DEFER`**

---

## Database Recommendation

### Evaluasi Kritis: PostgreSQL Relasional vs Graph Database

**Keputusan: Gunakan PostgreSQL 16+ (Relasional + `JSONB` + `Full-Text Search / pg_trgm`). TOLAK Graph Database (Neo4j / sejenisnya).**

Alasan teknis mendalam:
1. **Skala Graf Tidak Membutuhkan Traversal Mendalam Tak Terbatas:** MLBB memiliki sekitar ~125–150 hero, ~100 item, dan ribuan relasi counter/matchup/synergy. Traversal *draft* paling jauh hanya 1–2 lompatan (*1-hop* / *2-hop*: Hero ↔ Counter ↔ Item ↔ Mechanic), yang dieksekusi PostgreSQL dalam hitungan **< 5 milidetik** menggunakan indeks B-Tree/komposit standar.
2. **Integritas Relasional, Temporal, & ACID:** Platform ini sangat bergantung pada `FOREIGN KEY`, constraint unik parsial (`WHERE is_current = true`), join multi-kondisi terhadap `patch_versions` & `server_type`, dan agregasi statistik esports (`SUM`, `COUNT`, `AVG` win rate). Graph database murni lemah dan rumit untuk integritas temporal per patch serta agregasi statistik tabular.
3. **Fleksibilitas `JSONB`:** Parameter skill per level, stat item heterogen, dan struktur adaptasi 4 mode ranked sangat cocok disimpan sebagai `JSONB` tervalidasi TypeScript/Zod tanpa meledakkan jumlah tabel atau kolom `NULL`.
4. **Search & Analytics Terpadu:** PostgreSQL menyediakan `tsvector` + indeks `GIN` + ekstensi `pg_trgm` untuk pencarian teks & toleransi typo, serta *Window Functions* / *Materialized Views* untuk analitik meta dan rekomendasi draft awal.
5. **Kapan Graph Database Benar-Benar Diperlukan?** Hanya jika platform melakukan *real-time multi-hop traversal* kedalaman ≥ 4–5 lompatan pada jutaan node yang terus berubah tiap detik (mis. deteksi fraud jejaring sosial skala puluhan juta entitas). MLBB Master Guide **tidak** berada pada skenario tersebut.

---

## Provenance Recommendation

Evaluasi kebutuhan provenance berdasarkan 4 kelas pengetahuan (*tanpa membuat sistem terlalu rumit*):

| Jenis Pengetahuan | Contoh | Kebutuhan Provenance | Model yang Direkomendasikan |
|---|---|---|---|
| **1. Direct Facts** | Deskripsi & scaling skill hero, harga item, hasil pertandingan, urutan draft | **Wajib Ketat** (`TIER_1_OFFICIAL` atau `TIER_2_SECONDARY` tercatat eksplisit) | Kolom governance inti pada tabel entitas + wajib minimal 1 baris di `entity_evidences` (untuk parent entity: `hero`, `item`, `competition_event`, `match_game`). |
| **2. Derived Analysis** | Keunggulan matchup lane, rekomendasi build, tren meta | **Wajib Sedang–Tinggi** (harus tertaut ke patch, alasan mekanis, dan bukti sumber/sampel) | Kolom governance tersemat (`claim_classification`, `verification_status`, `confidence_level`, `patch_version_id`) + opsional `entity_evidences` ke sumber analisis/VOD/sampel. |
| **3. Strategic Knowledge** | Prinsip rotasi, teamfight positioning, konsep macro/micro | **Kontekstual** (tidak selalu punya 1 URL berita tunggal; bertumpu pada prinsip mekanik & patch berlaku) | Kolom governance tersemat (`STRATEGIC_INTERPRETATION` / `RESEARCH_BASED_ANALYSIS`, `patch_version_id`, `verification_status`) + `entity_evidences` opsional jika merujuk analisis pelatih/VOD. |
| **4. Competitive Insights** | Observasi match pro, interpretasi strategi, adaptasi ranked | **Wajib Ketat Terantai** (tidak boleh yatim piatu dari pertandingan nyata) | Wajib relasi FK ke `match_games` / `match_observations` + timestamp VOD (jika ada) + `confidence_level` & `verification_status` tersemat. |

**Rekomendasi Desain Provenance (2-Lapis Sederhana):**
- **Lapis 1 (Embedded Core Metadata):** Setiap entitas pengetahuan tingkat atas membawa `claim_classification`, `verification_status`, `confidence_level`, `patch_version_id`, `verified_at`, `verified_by`. Entitas anak struktural (`item_components`, `build_items`, `draft_actions`, `game_player_performances`) **mewarisi** provenance dari entitas induknya agar tidak memproduksi jutaan baris bukti duplikat.
- **Lapis 2 (Multi-Source `sources` + `entity_evidences`):** Dipakai ketika satu entitas memerlukan sitasi per aspek (mis. `COMP001` memiliki sumber berbeda untuk Jadwal, Statistik, dan VOD) atau ketika dua sumber bertentangan (`verification_status = 'CONFLICTING'` dengan 2 baris `entity_evidences` yang mencatat perbedaan keduanya).
- **Penundaan (`DEFER`):** Tabel terpisah `claim_conflicts` dan `verification_records` (log audit multi-editor) **ditunda** sampai platform memiliki alur kerja multi-kurator.

---

## Patch Versioning Recommendation

### Perbandingan 6 Pendekatan Temporal & Patch

| Pendekatan | Kelebihan | Kekurangan | Penilaian |
|---|---|---|---|
| **1. Simple Patch Reference** (`patch_version_id` saja) | Sangat sederhana | Menimpa angka historis saat patch baru terbit; merusak analisis turnamen lama | Tidak cukup untuk Hero/Item; **cukup untuk Derived Analysis** |
| **2. Valid-From / Valid-Until** | Rentang berlaku jelas | Query memerlukan pengecekan rentang; tetap butuh baris versi terpisah | Baik jika dipasangkan dengan *versioned records* |
| **3. Historical Snapshots** (salin semua entitas tiap patch) | Query patch apa pun tinggal `WHERE patch_id = X` | Duplikasi data masif (menyalin 125+ hero meski hanya 8 hero berubah) | **Overengineering & boros penyimpanan** |
| **4. Versioned Records** (*SCD Type 2*: baris baru hanya saat berubah) | Tanpa duplikasi berlebih, histori utuh, mempermudah *patch diff* | Skema memisahkan master identity vs versioned profile | **Ideal untuk entitas numerik inti** |
| **5. Change Events** (`patch_changes` log saja) | Bagus untuk halaman Patch Notes | Sulit & lambat merekonstruksi stat lengkap hero pada patch $T$ | Harus dikombinasikan, bukan berdiri sendiri |
| **6. Hybrid Approach** | Mengambil keunggulan tiap pola sesuai sifat entitas | Sedikit dua pola di DB (perlu dokumentasi jelas di repository layer) | **TERBAIK & PALING PRAKTIS** |

**Rekomendasi Akhir — Hybrid Patch Architecture:**
1. **`patch_versions`:** Membedakan tegas `server_type` (`ORIGINAL_SERVER` | `ADVANCE_SERVER` | `EXPERIMENTAL`) dan menandai 1 versi `is_current_live`. Query aplikasi default **selalu** memfilter `server_type = 'ORIGINAL_SERVER'`.
2. **SCD Type 2 (`valid_from_patch_id`, `valid_until_patch_id`, `is_current`) untuk Core Game Entities:** Diterapkan pada `hero_version_profiles`, `hero_skills`, `items`, dan `game_fundamentals` sehingga perbandingan antar patch (*Patch Comparison*) dan rekonstruksi stat turnamen historis berjalan akurat tanpa duplikasi.
3. **Simple Patch Reference + `OUTDATED` Flag untuk Derived Knowledge:** Diterapkan pada `builds`, `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`, `academy_lessons`, `competitive_insights`, `pro_to_ranked_adaptations`.
4. **`patch_changes` Event Log + Outdated Detection:** Saat `patch_changes` mencatat perubahan pada `hero_id` atau `item_id` (atau aturan fundamental), skrip/layanan update menandai entitas turunan yang merujuknya menjadi `verification_status = 'OUTDATED'` tanpa memerlukan tabel antrean terpisah `patch_impact_queue` di tahap awal.

---

## Competitive Intelligence Recommendation

### Evaluasi Struktur & Alur Entitas
Struktur `Tournament (competition_events) → Stage (tournament_stages) → Match (matches) → Game (match_games) → Draft Action (draft_actions) + Team + Player + Hero` sudah tepat dengan penyesuaian berikut:
1. **Match vs Game Distinction (WAJIB):** Seri Best-of (`Bo1`, `Bo3`, `Bo5`, `Bo7`) berada di `matches`, sementara setiap game individual berada di `match_games`. Draft, pick/ban order, sisi Blue/Red, pemenang game, durasi, substitusi pemain, dan performa pemain **wajib menempel pada `match_games`**, bukan `matches`.
2. **Pemisahan Draft Sequence vs Aggregated Tournament Statistics:** `draft_actions` (1–20 aksi berurutan per `match_game`) dipisahkan total dari `tournament_hero_stats` (agregat seperti Liquipedia `/Statistics`) agar data parsial `17` event saat ini tidak pernah memalsukan urutan pick/ban per-game.
3. **Simplifikasi yang Direkomendasikan:**
   - Hapus tabel terpisah `tournament_groups`; cukup kolom `group_label` pada `matches` (dan tipe stage pada `tournament_stages`).
   - Hapus tabel terpisah `vod_records` di Phase 4; simpan `vod_url` & `vod_verification_status` pada `competition_events` (playlist turnamen), `matches` (VOD seri), dan `match_games` (VOD game spesifik), serta `vod_timestamp_start/end` pada `match_observations`.
4. **Evaluasi 5 Lapisan Analisis Kompetitif:**
   - **Layer 1 (`Match/Game Facts`), Layer 2 (`Observations`), Layer 3 (`Strategic Interpretation`), Layer 4 (`Meta Trends`), Layer 5 (`Pro-to-Ranked Adaptation`)** sudah **tepat dan tidak perlu diubah konsepnya**.
   - **Modifikasi Operasional:** Pada Phase 4, fokuskan implementasi pada **Layer 1–3** dan **Layer 5** terlebih dahulu; **Layer 4 (`meta_trends`)** dimulai sebagai query agregasi SQL langsung atas `tournament_hero_stats` / `draft_actions` dengan catatan ukuran sampel, sedangkan tabel/mesin `meta_trends` penuh ditangguhkan ke Phase 7.

---

## Product Module Boundaries

Pemetaan 12 modul logis dengan batas kepemilikan data yang bersih (mencegah *tight coupling* dan duplikasi data):

| Modul | Kepemilikan Data Utama (Write/Master) | Shared Knowledge yang Dibaca (Read-Only via Service/Repo) | Route / UI Boundary |
|---|---|---|---|
| **1. Heroes** | `heroes`, `hero_version_profiles`, `hero_skills`, `hero_combos` | `game_mechanics`, `patch_versions`, `entity_evidences` | `/heroes` |
| **2. Items** | `items`, `item_components`, `item_effects`, `emblems`, `battle_spells` | `game_mechanics`, `patch_versions`, `entity_evidences` | `/items` |
| **3. Builds** | `builds`, `build_items` | `heroes`, `items`, `emblems`, `battle_spells`, `patch_versions` | `/builds` |
| **4. Matchups** | `hero_matchups` | `heroes`, `items`, `patch_versions` | `/matchups` |
| **5. Counters** | `hero_counters`, `item_counters` | `heroes`, `items`, `game_mechanics`, `patch_versions` | `/counters` |
| **6. Synergies** | `hero_synergies` *(dan `team_compositions` di Phase 7)* | `heroes`, `patch_versions` | Fitur terpisah di `src/features/synergies/`, tampil bersama di `/counters` (tab/bagian) agar navigasi ringkas |
| **7. Academy** | `game_fundamentals`, `academy_lessons` (`MICRO`/`MACRO`) | `heroes`, `items`, `patch_versions` | `/academy` |
| **8. Ranked** | `pro_to_ranked_adaptations` + config `ranked_contexts` | `competitive_insights`, `academy_lessons`, `patch_versions` | Fitur/domain terpisah (`src/features/ranked/`), sub-rute `/academy/ranked` atau tab terintegrasi di `/academy` |
| **9. Esports** | `competitions`, `competition_events`, `tournament_stages`, `matches`, `match_games`, `draft_actions`, `game_player_performances`, `tournament_hero_stats`, `match_observations`, `competitive_insights` | `heroes`, `items`, `patch_versions`, `sources`, `entity_evidences` | `/esports` |
| **10. Patches** | `patch_versions`, `patch_changes` | Membaca status `OUTDATED` lintas entitas (tanpa memiliki data entitas lain) | `/patches` |
| **11. Search** | Indeks query / RPC pencarian terpadu (tanpa tabel konten sendiri) | Read-only lintas seluruh tabel publik `ORIGINAL_SERVER` + metadata status/patch | `/search` |
| **12. Knowledge Sources** | `sources`, `entity_evidences`, `game_mechanics` *(atau shared governance)* | Dirujuk oleh seluruh modul di atas melalui `KnowledgeGovernanceService` | Lapisan layanan wajib + opsi halaman transparansi `/sources` |

**Aturan Batas Modul:**
- Tidak ada modul UI yang boleh melakukan query langsung lintas tabel tanpa melewati repository/service domain pemilik data (mencegah duplikasi logika filter `is_current` dan `ORIGINAL_SERVER`).
- Halaman `/academy` dan `/esports` tidak boleh meng-copy statistik hero/item secara manual; keduanya wajib me-reference `hero_id` / `item_id` kanonik.

---

## Technology Stack Recommendation

| Area | Pilihan & Evaluasi Objektif | Rekomendasi |
|---|---|---|
| **Web Framework & Bahasa** | **Next.js 15 (App Router) + TypeScript Strict + Tailwind CSS v4** — Sudah terpasang dan terverifikasi (`Phase 0.5.1`). Server Components ideal untuk halaman ensiklopedia *read-heavy* dan SEO. | **PERTAHANKAN (`ACCEPT`)** |
| **Database & Hosting** | **PostgreSQL 16+** standar. Bisa di-host di **Supabase PostgreSQL**, Neon, atau Docker PostgreSQL self-managed, **asalkan koneksi melalui driver PostgreSQL standar (`DATABASE_URL`)** dan **bukan** bergantung pada SDK proprietary Supabase (`supabase-js`) untuk logika aplikasi. | **PostgreSQL 16+ Standar (Host fleksibel: Supabase DB / Self-Managed via `DATABASE_URL`)** |
| **ORM / Query Layer** | Perbandingan objektif:<br>• **Drizzle ORM:** TypeScript-first schema, menghasilkan migrasi `.sql` transparan (`drizzle-kit`), SQL-like query builder tanpa magic overhead, dukungan penuh `pg_trgm`/`tsvector`/partial index via `sql` helper, kompatibel 100% dengan PostgreSQL standar.<br>• **Prisma:** DX bagus, tetapi query engine berat, abstraksi menyulitkan *partial index* / `pg_trgm` / CTE kompleks, dan migrasi kurang transparan untuk tuning PostgreSQL lanjut.<br>• **Kysely:** SQL transparency dan type safety sangat baik, namun tidak memiliki generator skema/migrasi deklaratif bawaan sehingga butuh pengelolaan DDL terpisah. | **Drizzle ORM** *(Alternatif cadangan: Kysely + raw SQL migrations jika diinginkan kontrol DDL 100% manual)* |
| **Search Technology** | **PostgreSQL Built-in Full-Text Search (`tsvector` + `GIN`) + `pg_trgm` (trigram fuzzy matching).** Jumlah record ensiklopedia MLBB (<50.000 entitas pada Phase 2–6) sangat ringan bagi PostgreSQL. Elasticsearch / Meilisearch menambah beban sinkronisasi dan biaya infrastruktur tanpa manfaat sepadan di tahap awal. | **PostgreSQL FTS + `pg_trgm`** *(Tolak Elasticsearch/Meilisearch untuk MVP)* |
| **Data Ingestion** | Skrip CLI TypeScript tervalidasi (`database/seeds/`) yang memvalidasi schema, patch version, unique passive, dan provenance sebelum `INSERT`/`UPSERT` idempotent ke PostgreSQL. | **Validated CLI Seed & Audit Scripts** |
| **Background Processing** | Tidak diperlukan queue worker terpisah (BullMQ/Redis) saat ini. Deteksi `OUTDATED` dijalankan langsung sebagai bagian transaksi impor patch baru, dan cek link/cache dijalankan lewat CLI/cron terjadwal sederhana. | **Synchronous Patch Transaction + Scheduled CLI Checks** |
| **Caching** | Next.js `revalidateTag` / `revalidatePath` berbasis `patch_version` dan domain (`heroes`, `items`, `esports`) untuk konten yang 99% read-only. Tanpa Redis eksternal. | **Next.js Built-in Tag Caching** |
| **Analytics** | Query agregasi SQL / *Materialized View* PostgreSQL untuk statistik turnamen dan draft. Tidak perlu warehouse terpisah (ClickHouse/BigQuery). | **PostgreSQL SQL Aggregation / Views** |

---

## Overengineering Audit

Audit terhadap potensi pemborosan kompleksitas pada spesifikasi Phase 1.1:

| Potensi Overengineering yang Teridentifikasi | Keputusan Audit |
|---|---|
| **1. `claim_conflicts` & `verification_records` sebagai tabel terpisah di Phase 2A** | **DISIMPLIFIKASI / DITUNDA:** Gunakan `verification_status = 'CONFLICTING'` + baris bukti berlawanan di `entity_evidences` terlebih dahulu; tunda tabel log audit multi-editor ke fase lanjut. |
| **2. `patch_impact_queue` sebagai engine antrean workflow terpisah di Phase 2A** | **DITUNDA:** Cukup tandai entitas terdampak dengan `verification_status = 'OUTDATED'` dan filter di `/patches`; antrean penugasan kurator baru perlu saat tim editor membesar. |
| **3. `tournament_groups` & `vod_records` sebagai tabel terpisah di Phase 4** | **DISIMPLIFIKASI:** Gunakan `matches.group_label` dan kolom `vod_url`/`vod_verification_status` langsung pada `competition_events`, `matches`, dan `match_games`. |
| **4. `game_modes`, `gameplay_concepts` vs `academy_lessons`, & `ranked_contexts` sebagai 5+ tabel terpisah** | **DISIMPLIFIKASI:** Gabung `game_modes` ke `game_fundamentals`; gabung `gameplay_concepts` & `academy_lessons`; simpan `ranked_contexts` (4 ukuran party) sebagai konstanta TypeScript. |
| **5. `team_compositions` & `meta_trends` sebagai tabel wajib di Phase 3–4** | **DITUNDA:** Mulai dengan tag komposisi & query agregasi SQL; wujudkan sebagai entitas analitik penuh saat membangun *Draft Assistant* (Phase 7). |
| **6. Entitas User, Auth, UGC Moderation, & Telemetry (`ARCH-REC-10`) di Phase 1–6** | **DITUNDA ke Phase 8:** Fokus membangun basis pengetahuan terverifikasi yang solid terlebih dahulu. |
| **7. Microservices, Graph DB (Neo4j), Elasticsearch, Redis/BullMQ, & AI Knowledge Pipeline** | **DITOLAK:** Gunakan **Modular Monolith** Next.js + PostgreSQL 16+ hingga ada bukti bottleneck skala nyata. |

---

## Accepted Recommendations
- **`ARCH-REC-07`:** Kebijakan hirarki sumber Tier 1–4 & status verifikasi terpadu (`SOURCE_VERIFICATION_POLICY.md`).
- **`ARCH-REC-09`:** Pembersihan link relatif (selesai) dan audit sumber primer `CURRENT_GAME_RESEARCH.md` sebelum Phase 2B.

## Modified Recommendations
- **`ARCH-REC-01`:** Gerbang approval difokuskan pada keputusan Phase 1.2 + `PRODUCT_ARCHITECTURE.md` sebelum Phase 2A; riset `CURRENT_GAME_RESEARCH.md` memblokir Phase 2B (bukan Phase 2A).
- **`ARCH-REC-02`:** Provenance disederhanakan menjadi 2 lapis (*embedded governance* + `sources`/`entity_evidences`), menunda `claim_conflicts` & `verification_records`.
- **`ARCH-REC-03`:** Patch versioning memakai pendekatan *Hybrid* (SCD Type 2 untuk core game entities + simple patch ref & `OUTDATED` flag untuk analisis turunan), menunda `patch_impact_queue`.
- **`ARCH-REC-04`:** Esports mempertahankan `match_games` & pemisahan agregat vs urutan draft, namun menghapus `tournament_groups` & `vod_records` terpisah serta menunda tabel `meta_trends` ke Phase 7.
- **`ARCH-REC-05`:** Menerima struktur Build/Counter/Matchup/Synergy, menunda tabel `team_compositions` ke Phase 7.
- **`ARCH-REC-06`:** Menggabungkan `game_modes` ke `game_fundamentals`, menyatukan kurikulum Micro/Macro/Academy, menaruh `ranked_contexts` di kode TS, dan menormalisasi FK `pro_to_ranked_adaptations`.
- **`ARCH-REC-08`:** Menyatukan penamaan tabel kanonik dan memisahkan batas kode/repository 12 domain tanpa memaksakan 12 rute sidebar baru saat ini.

## Deferred Recommendations
- **`ARCH-REC-10`:** Tabel `users`, `curator_profiles`, `user_learning_progress`, `knowledge_submissions`, `community_notes`, `telemetry_events` ditunda ke Phase 7–8.
- **Tabel Pendukung Skala Lanjut:** `verification_records`, `claim_conflicts`, `patch_impact_queue`, `team_compositions`, dan tabel materialized `meta_trends` ditunda hingga fase editorial/Draft Assistant membutuhkannya.

## Rejected Recommendations
- **Penggunaan Graph Database (Neo4j)** untuk relasi hero/item/counter.
- **Penggunaan Search Engine Eksternal (Elasticsearch / Meilisearch / Algolia)** untuk MVP/Phase 1–6.
- **Arsitektur Microservices** dan **Message Broker (Redis/BullMQ)** pada fase awal.
- **Ketergantungan SDK Proprietary Supabase** sebagai pengikat arsitektur akses data (harus tetap memakai PostgreSQL standar via `DATABASE_URL`).
- **Penggunaan AI/LLM otomatis untuk mengisi fakta game atau meta** tanpa verifikasi sumber.

---

## Decisions Requiring User Approval

Seluruh poin pada `ARCHITECTURE_DECISION_REGISTER.md` berstatus `PROPOSED` / `DEFERRED` dan membutuhkan persetujuan Anda sebelum masuk ke implementasi skema (`Phase 2A`):
1. **`ADR-001`:** Pilihan **Modular Monolith** (Next.js App Router + PostgreSQL) dan penolakan Microservices.
2. **`ADR-002`:** Pilihan **PostgreSQL 16+ Standar** (relasional + `JSONB`) dan penolakan Graph DB.
3. **`ADR-003`:** Pemilihan **Drizzle ORM** sebagai ORM/Query & Migration layer *(alternatif: Kysely + raw SQL)*.
4. **`ADR-004`:** Pemilihan **PostgreSQL FTS (`tsvector` + `GIN`) + `pg_trgm`** untuk Search (menolak Elasticsearch/Meilisearch pada MVP).
5. **`ADR-005`:** Desain **Hybrid Provenance 2-Lapis** (*embedded metadata* + `sources` & `entity_evidences`) dengan penundaan `claim_conflicts` & `verification_records`.
6. **`ADR-006`:** Desain **Hybrid Patch Versioning** (*SCD Type 2* untuk core entities + `OUTDATED` flag untuk derived entities), menunda `patch_impact_queue`.
7. **`ADR-007`:** Struktur Esports **5-Layer** dengan `match_games`, pemisahan `draft_actions` vs `tournament_hero_stats`, dan simplifikasi `tournament_groups`/`vod_records`.
8. **`ADR-008`:** Simplifikasi **Fundamentals, Academy, & Pro-to-Ranked** (penggabungan `game_modes`, penyatuan kurikulum, `ranked_contexts` di TS, FK-normalized `pro_to_ranked_adaptations`).
9. **`ADR-009`:** Batas **12 Modul Logis** dengan repository bersama & navigasi ringkas (10 rute utama + sub-rute terarah saat fase implementasi).
10. **`ADR-010`:** Penundaan **User, Auth, Progression, UGC, & Telemetry** hingga Phase 7–8.
