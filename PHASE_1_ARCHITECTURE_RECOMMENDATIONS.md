# PHASE_1_ARCHITECTURE_RECOMMENDATIONS — Rekomendasi Keputusan Arsitektur Phase 1

**Tanggal:** `2026-11-18`  
**Fase:** `Phase 1 — Knowledge Architecture & Data Model Validation`  
**Catatan Penting:** Dokumen ini berisi **usulan keputusan arsitektur** untuk ditinjau dan disetujui. Tidak ada perubahan skema database, migrasi, atau implementasi fitur yang dilakukan sebelum persetujuan.

---

## Ringkasan Daftar Rekomendasi

| ID | Judul Rekomendasi | Prioritas | Perlu Approval? |
|---|---|---|---|
| `ARCH-REC-01` | Lengkapi 8 Dokumen Inti Phase 0 Sebelum DDL/Phase 2 | `P0` | Ya |
| `ARCH-REC-02` | Penyatuan Taksonomi Verifikasi, Klaim, & Multi-Source Provenance | `P0` | Ya |
| `ARCH-REC-03` | Patch Temporal Versioning & Dependency Impact Graph | `P0` | Ya |
| `ARCH-REC-04` | Hierarki 5-Layer Competitive Intelligence (`Match` vs `Game` & `Fact` vs `Insight`) | `P0` | Ya |
| `ARCH-REC-05` | Pemodelan Relasi Terstruktur untuk Matchup, Counter, Synergy, & Build Context | `P1` | Ya |
| `ARCH-REC-06` | Pemodelan Domain Game Fundamentals, Micro/Macro, & Pro-to-Ranked 7-Dimensi | `P1` | Ya |
| `ARCH-REC-07` | Kebijakan Hirarki Sumber & Resolusi Konflik Informasi (`SOURCE_VERIFICATION_POLICY`) | `P1` | Ya |
| `ARCH-REC-08` | Penyatuan Penamaan Tabel & Batas 12 Modul pada `PRODUCT_ARCHITECTURE.md` | `P1` | Ya |
| `ARCH-REC-09` | Pembersihan Kualitas Sitasi `CURRENT_GAME_RESEARCH.md` & Link Relatif `docs/research/` | `P2` | Ya (Ringan) |
| `ARCH-REC-10` | Titik Ekstensi untuk Player Progression, User Contributions, & Analytics | `P3` | Ya |

---

## ARCH-REC-01 — Lengkapi 8 Dokumen Inti Phase 0 Sebelum DDL / Phase 2

- **Problem:** 8 dari 12 dokumen fondasi yang dijadwalkan untuk validasi Phase 1 (`KNOWLEDGE_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `COMPETITIVE_MATCH_ANALYSIS_FRAMEWORK.md`, `PRO_TO_RANKED_ADAPTATION.md`, `SOURCE_VERIFICATION_POLICY.md`, `PATCH_UPDATE_SYSTEM.md`, `IMPLEMENTATION_ROADMAP.md`, `RESEARCH_STATUS.md`, ditambah versi penuh `PRODUCT_ARCHITECTURE.md`) belum dibuat.
- **Current approach:** Skema database baru berupa daftar nama 24 tabel di `database/schema/README.md`, sedangkan kebijakan riset dan arsitektur pengetahuan tersebar secara parsial di `AGENTS.md` dan `SYSTEM_ARCHITECTURE.md`.
- **Proposed approach:** Menahan seluruh pembuatan DDL SQL, migrasi PostgreSQL, dan ingest data hingga ke-8 dokumen fondasi tersebut disusun berdasarkan rekomendasi Phase 1 ini dan disetujui melalui review formal.
- **Reasoning:** Membangun tabel PostgreSQL dan fitur UI tanpa `KNOWLEDGE_ARCHITECTURE.md` dan `DATABASE_SCHEMA.md` berisiko menghasilkan skema datar yang harus dirombak besar-besaran saat masuk ke fitur Build Context, Pro-to-Ranked, dan Patch History.
- **Benefits:** Mencegah *schema rework*, menjaga keterlacakan antara riset dan implementasi, serta menyelaraskan kontrak tipe TypeScript dengan DDL PostgreSQL sejak awal.
- **Trade-offs:** Menambah waktu dokumentasi sebelum pengisian data hero/item dapat dimulai.
- **Impact on database:** Menunda pembuatan file di `database/schema/` dan `database/migrations/` hingga `DATABASE_SCHEMA.md` disetujui.
- **Impact on frontend:** Halaman skeleton tetap menggunakan `EmptyKnowledgeState` sesuai aturan *Zero Fake Data*.
- **Impact on future modules:** Seluruh modul Phase 2–6 memperoleh kontrak entitas dan relasi yang seragam.
- **Priority:** `P0`
- **Whether approval is required:** **Ya**

---

## ARCH-REC-02 — Penyatuan Taksonomi Verifikasi, Klaim, & Multi-Source Provenance

- **Problem:** Terdapat 4 versi status berbeda antar dokumen (`AGENTS.md`, `SYSTEM_ARCHITECTURE.md`, `GLOBAL_ESPORTS_COVERAGE.md`, `src/types/knowledge.ts`). Selain itu, `KnowledgeGovernanceMeta` di `src/types/knowledge.ts` hanya menyimpan satu `sourceLabel: string | null`, dan belum membedakan `UNKNOWN`, `NOT_RESEARCHED`, `CONFLICTING`, `OUTDATED`, dan `NOT_FOUND`.
- **Current approach:** Status kualitas dan metadata sumber ditulis sebagai satu struktur flat per record (`sourceLabel`, `verificationStatus` 5 nilai).
- **Proposed approach:** Memisahkan secara tegas 4 dimensi tata kelola pada level tipe dan skema DB:
  1. `claim_classification`: `OFFICIAL_FACT` *(atau `VERIFIED_FACT`)*, `SECONDARY_SOURCE`, `RESEARCH_BASED_ANALYSIS`, `STRATEGIC_INTERPRETATION`, `COMMUNITY_THEORY`, `UNKNOWN`.
  2. `verification_status`: `VERIFIED`, `PARTIALLY_VERIFIED`, `UNVERIFIED`, `OUTDATED` *(atau `STALE`)*, `CONFLICTING`, `UNKNOWN`, `NOT_RESEARCHED`, `NOT_YET_AVAILABLE`, `NOT_FOUND`.
  3. `confidence_level`: `HIGH`, `MEDIUM`, `LOW`.
  4. Tabel relasional `sources` + tabel penghubung `entity_evidences` (`entity_type`, `entity_id`, `aspect_name`, `source_id`, `source_url`, `evidence_excerpt`, `verified_at`, `verified_by`).
- **Reasoning:** Satu entitas (misalnya hero atau turnamen) sering memiliki bukti dari sumber berbeda untuk aspek berbeda (contoh nyata pada `GLOBAL_ESPORTS_SOURCE_AUDIT.md` untuk `COMP001`). Memisahkan `UNKNOWN` dari `NOT_RESEARCHED` dan `NOT_FOUND` mencegah klaim palsu.
- **Benefits:** Audit granular per aspek data, bebas dari ambiguitas status, dan siap menampung konflik antarsumber.
- **Trade-offs:** Menambah satu tabel join (`entity_evidences`) dan membutuhkan komponen UI badge status yang lebih kaya.
- **Impact on database:** Menambahkan tabel `sources`, `entity_evidences`, dan `claim_conflicts`; mengganti kolom `source_ref` tunggal menjadi relasional.
- **Impact on frontend:** `src/types/knowledge.ts` dan `src/services/knowledgePolicy.ts` perlu diperluas untuk mendukung array bukti (`evidences`) serta status `CONFLICTING` dan `NOT_RESEARCHED`.
- **Impact on future modules:** Modul Search, Patch Center, Heroes, Items, dan Esports dapat menampilkan sitasi per-aspek dan peringatan konflik secara konsisten.
- **Priority:** `P0`
- **Whether approval is required:** **Ya**

---

## ARCH-REC-03 — Patch Temporal Versioning & Dependency Impact Graph

- **Problem:** `PATCH_UPDATE_SYSTEM.md` belum ada, dan belum ada desain bagaimana data hero, skill, item, build, maupun analisis esports menyimpan sejarah antar patch tanpa tertimpa pembaruan patch terbaru.
- **Current approach:** `KnowledgeGovernanceMeta` hanya menyimpan satu string `patchVersion` dan `serverEnvironment`.
- **Proposed approach:** Menerapkan model temporal berbasis patch:
  1. Tabel master `patch_versions` (`id`, `version_code`, `server_type` [`ORIGINAL_SERVER` | `ADVANCE_SERVER` | `EXPERIMENTAL`], `release_date`, `season_label`, `is_current_live`).
  2. Tabel log `patch_changes` (entitas terdampak, jenis perubahan `BUFF`/`NERF`/`ADJUST`/`REVAMP`/`NEW`, ringkasan nilai lama vs baru, sumber resmi).
  3. Kolom validitas temporal pada entitas/versi record: `valid_from_patch_id`, `valid_until_patch_id` (`NULL` = masih aktif pada patch live), `is_current`, plus tabel snapshot historis untuk stats hero/item per patch.
  4. Tabel `patch_impact_queue` yang dipetakan melalui dependency graph (mis. perubahan `hero_id` otomatis menandai `hero_skills`, `builds`, `hero_matchups`, `hero_counters`, dan `strategies` terkait sebagai `OUTDATED` / `STALE` untuk ditinjau ulang).
- **Reasoning:** Tanpa `valid_from`/`valid_until` dan snapshot, data turnamen patch lama akan terbaca seolah-olah memakai stat patch saat ini, atau data patch lama terhapus saat patch baru masuk.
- **Benefits:** Menjamin konsistensi historis untuk analisis esports, mencegah panduan usang tampil sebagai meta aktif, dan memungkinkan fitur *Patch Diff Explorer* di masa depan.
- **Trade-offs:** Query baca perlu filter `is_current = true` atau rentang patch; kompleksitas ingest sedikit meningkat.
- **Impact on database:** Seluruh tabel entitas gameplay dan relasi taktis wajib memiliki referensi ke `patch_versions` atau tabel versi terpisah.
- **Impact on frontend:** `PatchBanner` dan setiap halaman detail perlu menampilkan indikator *Outdated/Stale* bila `valid_until_patch_id` tertinggal dari patch live aktif.
- **Impact on future modules:** Menggerakkan `/patches` (*Review Queue*), `/heroes`, `/items`, `/builds`, `/counters`, `/matchups`, dan konteks patch di `/esports`.
- **Priority:** `P0`
- **Whether approval is required:** **Ya**

---

## ARCH-REC-04 — Hierarki 5-Layer Competitive Intelligence (`Match` vs `Game` & `Fact` vs `Insight`)

- **Problem:** `database/schema/README.md` langsung melompat dari `matches` ke `match_drafts` tanpa entitas `tournament_stages`, `tournament_groups`, `match_games`, maupun pemisahan antara fakta pertandingan, observasi, interpretasi strategis, tren meta, dan adaptasi ranked.
- **Current approach:** Struktur konseptual baru mencakup `competitions`, `competition_events`, `teams`, `players`, `team_rosters`, `matches`, `match_drafts`, `match_statistics`, `competitive_insights`.
- **Proposed approach:** Menetapkan pemisahan tegas 5 lapisan:
  - **Layer 1 (Struktur Turnamen & Hasil Nyata):** `competitions` (Series) -> `competition_events` (Season/Tournament) -> `tournament_stages` -> `tournament_groups` -> `matches` (seri Bo1/Bo3/Bo5/Bo7) -> `match_games` (game ke-1, ke-2, dst.) -> `draft_actions` (urutan pick/ban per game) + `game_player_performances` + `vod_records` + `tournament_hero_stats` (khusus agregat statistik turnamen seperti Liquipedia `/Statistics`).
  - **Layer 2 (Observasi Pertandingan):** `match_observations` (terikat ke `match_id`/`game_id`, fase `DRAFT`/`EARLY`/`MID`/`LATE`, dan `vod_timestamp`).
  - **Layer 3 (Interpretasi Strategis):** `competitive_insights` (menjelaskan *mengapa* suatu eksekusi berhasil + *required conditions*).
  - **Layer 4 (Generalisasi Meta):** `meta_trends` (agregasi lintas sampel turnamen terverifikasi pada rentang patch tertentu).
  - **Layer 5 (Adaptasi Ranked):** `pro_to_ranked_adaptations` (lihat `ARCH-REC-06`).
- **Reasoning:** Satu seri Bo5 memiliki hingga 5 draft dan 5 komposisi berbeda. Menempelkan draft langsung ke `match_id` tidak mampu merepresentasikan data per-game dan mencampur agregat turnamen dengan log draft aktual.
- **Benefits:** Memisahkan fakta pertandingan yang objektif dari interpretasi analis dan statistik agregat parsial.
- **Trade-offs:** Jumlah tabel esports bertambah, namun jauh lebih bersih dan sesuai dengan fakta `GLOBAL_ESPORTS_VALIDATION_REPORT.md`.
- **Impact on database:** Menambah `tournament_stages`, `tournament_groups`, `match_games`, `draft_actions`, `game_player_performances`, `tournament_hero_stats`, `vod_records`, `match_observations`, `meta_trends`, dan `pro_to_ranked_adaptations`.
- **Impact on frontend:** Halaman `/esports` dapat menampilkan statistik agregat (`PARTIAL`) dengan jujur tanpa memalsukan urutan draft per-game.
- **Impact on future modules:** Memberi fondasi kuat bagi *Pro Play Lab* (`/esports`) dan *Pro-to-Ranked* (`/academy`).
- **Priority:** `P0`
- **Whether approval is required:** **Ya**

---

## ARCH-REC-05 — Pemodelan Relasi Terstruktur untuk Matchup, Counter, Synergy, & Build Context

- **Problem:** Kontrak fitur saat ini (`heroes`, `items`, `builds`, `matchups`, `counters`, `synergies`) masih berupa daftar label statis; tidak ada definisi arah, konteks fase/lane, aturan *non-stacking* pasif item, maupun struktur reasoning/alternatif pada build.
- **Current approach:** Nama tabel di `database/schema/README.md` (`builds`, `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`) tanpa atribut konteks.
- **Proposed approach:**
  1. **`hero_matchups`:** Memiliki `subject_hero_id`, `opponent_hero_id`, `lane`, `advantage_early`, `advantage_mid`, `advantage_late`, `power_spike_window`, `win_conditions`, `playing_from_behind_plan`, `patch_version_id`.
  2. **`hero_counters` & `item_counters`:** Relasi berarah (`counter_entity` -> `target_hero_id` atau `target_mechanic_tag` seperti `high_dash`, `hp_regen`, `burst_magic`), dilengkapi `mechanic_reason`, `effectiveness_conditions`, dan `limitation_notes`.
  3. **`hero_synergies` & `team_compositions`:** Mendefinisikan pasangan/grup sinergi, `synergy_axis`, `role_conflicts`, serta kecocokan dengan `team_composition_archetypes`.
  4. **`builds` + `build_slots` + `build_conditionals`:** Memisahkan `core_items` (slot 1–3) dari `situational_branches` (kondisi musuh/allied/game state -> item rekomendasi + `reasoning` + `alternatives` + `item_timing`), lengkap dengan `emblem_id`, `talent_ids`, `battle_spell_id`, `creator_source_id`, dan `confidence_level`.
  5. **`items` + `item_stats` + `item_effects` + `item_recipes`:** Memisahkan stat dasar, pasif unik (dengan `unique_passive_group` untuk mencegah saran stack ganda ilegal), efek aktif, serta komponen build path.
- **Reasoning:** Rekomendasi build dan counter tanpa konteks situasi/alasan mekanis hanya menghasilkan daftar item statis yang mudah menyesatkan pemain.
- **Benefits:** Memungkinkan *Draft Assistant* dan *Situational Builder* di Phase 6 melakukan kalkulasi nyata di atas data terstruktur, bukan teks bebas.
- **Trade-offs:** Memerlukan kurasi riset yang lebih rinci per entri di Phase 2–3.
- **Impact on database:** Memperkaya skema Phase 2–3 (`items`, `item_effects`, `item_recipes`, `builds`, `build_conditionals`, `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`, `team_compositions`).
- **Impact on frontend:** Halaman `/items`, `/builds`, `/matchups`, dan `/counters` siap merender percabangan situasional dan alasan mekanis.
- **Impact on future modules:** Mendukung langsung mesin rekomendasi draft dan build simulator.
- **Priority:** `P1`
- **Whether approval is required:** **Ya**

---

## ARCH-REC-06 — Pemodelan Domain Game Fundamentals, Micro/Macro, & Pro-to-Ranked 7-Dimensi

- **Problem:** Domain *Game Fundamentals*, *Micro Learning* (10 topik), *Macro Learning* (11 topik), serta *Ranked Context* 7-dimensi (`Communication`, `Coordination`, `Draft`, `Decision-Making`, `Risk`, `Strategy`, `Execution`) untuk Solo/Duo/Trio/5-Man belum dimodelkan.
- **Current approach:** `src/features/academy/index.ts` hanya memiliki 4 objek ringkas (`solo`, `duo`, `trio`, `five-man`) tanpa entitas Macro/Micro maupun struktur adaptasi pro-to-ranked.
- **Proposed approach:**
  1. Menambahkan entitas **Game Fundamentals** (`game_modes`, `map_lanes_objectives`, `mechanics_glossary`) sebagai fondasi rujukan istilah mekanik seluruh platform.
  2. Memodelkan **Gameplay Curriculum** (`learning_modules` & `learning_concepts`) dengan taksonomi eksplisit `MICRO`, `MACRO`, dan `RANKED_STRATEGY`.
  3. Menetapkan **Skema Wajib `pro_to_ranked_adaptations`** yang memuat ke-17 field terstruktur: `source_id`, `competition_event_id`, `match_id`/`game_id`, `teams_involved`, `patch_version_id`, `observed_execution`, `strategic_principle`, `why_it_worked`, `required_conditions`, `coordination_requirements`, `risk_profile`, adaptasi terpisah (`solo_adaptation`, `duo_adaptation`, `trio_adaptation`, `five_man_adaptation`) masing-masing beserta rating kelayakan (*Recommended* / *Conditional* / *Not Recommended*), `confidence_level`, dan `evidence_refs`.
- **Reasoning:** Mengubah observasi turnamen menjadi saran Solo Queue tanpa gerbang evaluasi komunikasi dan risiko akan menghasilkan saran yang menyesatkan pemain ranked.
- **Benefits:** Memastikan setiap artikel Academy dan adaptasi Pro-to-Ranked memiliki struktur seragam, aman untuk Solo Queue, dan tertaut ke bukti nyata.
- **Trade-offs:** Proses penulisan konten Phase 5 menjadi lebih ketat karena setiap strategi harus mengisi keempat konteks party.
- **Impact on database:** Menambah tabel `game_fundamentals` (atau tabel terpecah), `learning_concepts`, dan `pro_to_ranked_adaptations`.
- **Impact on frontend:** Memungkinkan `/academy` memisahkan tab/jalur *Micro*, *Macro*, dan *Solo/Duo/Trio/5-Man* secara jelas.
- **Impact on future modules:** Mendukung jalur belajar pengguna (*Player Learning & Progression*).
- **Priority:** `P1`
- **Whether approval is required:** **Ya**

---

## ARCH-REC-07 — Kebijakan Hirarki Sumber & Resolusi Konflik Informasi (`SOURCE_VERIFICATION_POLICY`)

- **Problem:** Belum ada aturan resmi lintas-domain tentang sumber mana yang boleh menjadi acuan fakta gameplay (hero/item/mekanik) dan bagaimana sistem menangani konflik antarsumber.
- **Current approach:** Kebijakan sumber baru tertulis spesifik untuk ekosistem esports di `GLOBAL_ESPORTS_SOURCE_AUDIT.md`.
- **Proposed approach:** Menyusun `SOURCE_VERIFICATION_POLICY.md` dengan hierarki 4 tingkat yang berlaku untuk **seluruh domain** (Game + Esports + Strategi):
  - **Tier 1 (Official Primary):** Patch notes resmi MOONTON (`en.moonton.com` / patch notes in-game resmi), data langsung klien *Original Server*, pengumuman/portal liga resmi & penyelenggara turnamen resmi, serta rekaman siaran VOD resmi.
  - **Tier 2 (Verified Secondary):** Database esports terkurasi (`Liquipedia`), situs statistik liga/turnamen mitra resmi, atau hasil uji mekanik terukur yang terdokumentasi metode dan patch-nya.
  - **Tier 3 (Analytical / Commentary):** Analisis pelatih/pemain pro/analis terkemuka (wajib diklasifikasikan sebagai `STRATEGIC_INTERPRETATION`, bukan `OFFICIAL_FACT`).
  - **Tier 4 (Community / Unverified):** Forum (Reddit), blog agregator pihak ketiga, bocoran Advance Server/leaker (hanya boleh masuk sebagai `COMMUNITY_THEORY` atau ditolak untuk klaim angka live server).
  - **Aturan Resolusi Konflik:** Jika dua sumber bereputasi berbeda pendapat (mis. angka patch notes vs pengujian in-game aktual akibat *bug* atau *shadow change*), record ditandai `CONFLICTING` dengan kedua bukti dicatat di `claim_conflicts` hingga diverifikasi ulang.
- **Reasoning:** Tanpa hirarki sumber dan mekanisme konflik, data dari blog pihak ketiga atau rumor dapat tercampur dengan angka resmi in-game.
- **Benefits:** Konsistensi penjaminan mutu di seluruh fase ingest (Phase 2–5).
- **Trade-offs:** Riset angka hero/item di Phase 2 membutuhkan bukti Tier 1/pengujian terverifikasi yang lebih ketat.
- **Impact on database:** Memerlukan enum `source_tier` pada `sources` dan tabel `claim_conflicts`.
- **Impact on frontend:** UI dapat menampilkan label sumber dan badge peringatan bila suatu catatan berstatus `CONFLICTING`.
- **Impact on future modules:** Mengatur seluruh alur kurasi dan audit konten.
- **Priority:** `P1`
- **Whether approval is required:** **Ya**

---

## ARCH-REC-08 — Penyatuan Penamaan Tabel & Batas 12 Modul pada `PRODUCT_ARCHITECTURE.md`

- **Problem:** Penamaan tabel tidak seragam antar dokumen (`tournaments` vs `competitions`, `match_drafts` vs `match_draft_sequence`, `sources` vs `source_references`), dan `PRODUCT_ARCHITECTURE.md` masih berupa ringkasan 31 baris yang belum memisahkan batas modul `Synergies`, `Ranked`, serta `Knowledge Sources`.
- **Current approach:** 10 rute di `PRODUCT_ARCHITECTURE.md` menggabungkan Counter + Synergy di `/counters`, Academy + Ranked di `/academy`, dan belum memiliki modul/rute transparansi sumber pengetahuan.
- **Proposed approach:**
  1. Menetapkan konvensi penamaan entitas tunggal di `DATABASE_SCHEMA.md` dan memperbarui `database/schema/README.md` serta `src/data/platformModules.ts` agar sinkron.
  2. Memperluas `PRODUCT_ARCHITECTURE.md` agar mendefinisikan batas tanggung jawab **12 domain/modul logis** (Heroes, Items, Builds, Matchups, Counters, Synergies, Academy [Macro/Micro], Ranked [Solo/Duo/Trio/5-Man], Esports, Patches, Search, dan Knowledge Sources / Verification Hub), sekaligus menetapkan apakah rute publik tetap 10–11 rute dengan sub-view atau dipisah (mis. `/sources` untuk transparansi sumber & metodologi).
  3. Memisahkan `PLATFORM_MODULES` dari entri non-katalog (`/search`) secara lebih bersih di `src/data/platformModules.ts`.
- **Reasoning:** Penamaan dan batas domain yang sinkron mencegah mismatch antara tim riset, skema PostgreSQL, dan modul `src/features/`.
- **Benefits:** Komunikasi lintas dokumen bersih dan mempermudah modularisasi fitur Phase 2–6.
- **Trade-offs:** Memerlukan pembaruan beberapa referensi string di `src/data/platformModules.ts` dan halaman skeleton pada tahap implementasi berikutnya.
- **Impact on database:** Menyeragamkan seluruh nama tabel dan relasi acuan.
- **Impact on frontend:** Opsi penambahan halaman `/sources` atau sub-rute `/academy/ranked` pada fase UI berikutnya (setelah approval).
- **Impact on future modules:** Setiap folder di `src/features/` memiliki kepemilikan domain yang jelas dan tidak tumpang tindih.
- **Priority:** `P1`
- **Whether approval is required:** **Ya**

---

## ARCH-REC-09 — Pembersihan Kualitas Sitasi `CURRENT_GAME_RESEARCH.md` & Link Relatif `docs/research/`

- **Problem:** `CURRENT_GAME_RESEARCH.md` memakai 8 URL redirect Google Grounding (`vertexaisearch.cloud.google.com/grounding-api-redirect/...`), memiliki URL duplikat untuk sumber [7] dan [8], memakai escape literal `\n` di tabel, serta belum memiliki metadata header 6-field (`AGENTS.md` §2). Selain itu, `docs/research/GLOBAL_ESPORTS_*.md` masih memakai link absolut ke direktori sesi lama (`file:///C:/Users/.../brain/74c466ec-...`).
- **Current approach:** Dokumen hasil Phase 0 awal disalin apa adanya ke `docs/research/`.
- **Proposed approach:**
  1. Memverifikasi URL sumber kanonik asli untuk Patch `2.2.23` dan Season 42 (khususnya memisahkan rilis resmi dari blog komunitas, serta memperbaiki duplikasi sumber [7] dan [8]).
  2. Menambahkan blok metadata governance (`patch_version`, `server_type`, `verified_at`, `source_ref`, `confidence_level`, `verification_status`) pada `CURRENT_GAME_RESEARCH.md`.
  3. Mengubah seluruh tautan internal antar-dokumen di `docs/research/GLOBAL_ESPORTS_*.md` menjadi tautan relatif repositori (`GLOBAL_ESPORTS_SOURCE_AUDIT.md`, dll.).
- **Reasoning:** Tautan redirect AI sementara dapat kedaluwarsa dan tidak memenuhi standar keterlacakan sumber permanen di `AGENTS.md`.
- **Benefits:** Menjadikan seluruh berkas di `docs/research/` portabel, dapat diaudit, dan bebas broken link lintas lingkungan.
- **Trade-offs:** Membutuhkan sedikit waktu verifikasi ulang sumber Patch `2.2.23`.
- **Impact on database:** Tidak langsung; meningkatkan kualitas data awal yang kelak menjadi seed Patch `2.2.23`.
- **Impact on frontend:** Tidak ada.
- **Impact on future modules:** Menghindari kegagalan audit saat data patch awal masuk ke `/patches`.
- **Priority:** `P2`
- **Whether approval is required:** **Ya (Ringan)**

---

## ARCH-REC-10 — Titik Ekstensi untuk Player Progression, User Contributions, & Analytics

- **Problem:** Visi proyek mencakup *Player learning and progression*, sistem rekomendasi, dan potensi fitur analitik/kontribusi di masa depan, namun belum ada titik ekstensi di skema awal.
- **Current approach:** Belum ada entitas pengguna, progres pembelajaran, maupun log kurasi di `database/schema/README.md`.
- **Proposed approach:** Menyiapkan desain *namespace* entitas ekstensi pada `DATABASE_SCHEMA.md` (untuk diimplementasikan pada Phase 5–6+, bukan Phase 1–2):
  - `users` / `curator_profiles` (untuk *audit trail* `verified_by` dan kurasi editorial)
  - `user_learning_progress` (pelacakan modul Micro/Macro/Ranked yang dipelajari)
  - `knowledge_submissions` / `community_notes` (berstatus default `COMMUNITY_THEORY` / `UNVERIFIED`, terisolasi penuh dari tabel `VERIFIED` utama sebelum review)
  - `draft_analysis_sessions` / `telemetry_events` (untuk analitik penggunaan Draft Assistant tanpa mencemari fakta game).
- **Reasoning:** Memisahkan tabel pengetahuan terkurasi (*core knowledge*) dari tabel aktivitas pengguna/komunitas menjamin data komunitas tidak pernah mencemari basis fakta resmi.
- **Benefits:** Arsitektur siap berkembang tanpa merombak tabel inti di Phase 6+.
- **Trade-offs:** Tidak perlu dibuat tabel fisiknya pada migrasi Phase 1, cukup didefinisikan batas integrasinya di `DATABASE_SCHEMA.md`.
- **Impact on database:** Menambah seksi *Future Extensions* pada `DATABASE_SCHEMA.md`.
- **Impact on frontend:** Tidak ada dampak pada Phase 1–2.
- **Impact on future modules:** Memfasilitasi modul *Rank Academy Progress* dan *Draft Assistant* di Phase 5–6.
- **Priority:** `P3`
- **Whether approval is required:** **Ya**
