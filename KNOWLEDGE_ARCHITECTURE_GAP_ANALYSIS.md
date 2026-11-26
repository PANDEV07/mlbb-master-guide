# KNOWLEDGE_ARCHITECTURE_GAP_ANALYSIS — Analisis Kesenjangan Arsitektur Pengetahuan MLBB Master Guide

**Tanggal Audit:** `2026-11-18`  
**Fase:** `Phase 1 — Knowledge Architecture & Data Model Validation`  
**Status Validasi Keseluruhan:** **`FAILED / BLOCKED_BY_CRITICAL_GAPS`** *(8 dari 12 dokumen acuan inti Phase 0 belum dibuat di repositori, ditambah kesenjangan struktural antar-dokumen yang ada.)*

---

## 1. Executive Summary

Audit mendalam terhadap seluruh dokumentasi riset, arsitektur, basis data, dan kontrak kode TypeScript pada repositori `mlbb-master-guide` menunjukkan bahwa **fondasi arsitektur pengetahuan belum siap untuk masuk ke tahap implementasi skema database maupun pengisian data (Phase 2)**.

Meskipun riset awal ekosistem esports global (`GLOBAL_ESPORTS_*.md`) memiliki tingkat kedisiplinan bukti yang tinggi (`39` event 2026 diaudit granular beserta pemisahan *Official* vs *Secondary Source*) dan fondasi web Next.js (`Phase 0.5` + `0.5.1`) telah lulus build tanpa data palsu, **8 dari 12 dokumen inti Phase 0 tidak tersedia di repositori**:
- `KNOWLEDGE_ARCHITECTURE.md` (**MISSING**)
- `DATABASE_SCHEMA.md` (**MISSING**)
- `COMPETITIVE_MATCH_ANALYSIS_FRAMEWORK.md` (**MISSING**)
- `PRO_TO_RANKED_ADAPTATION.md` (**MISSING**)
- `SOURCE_VERIFICATION_POLICY.md` (**MISSING**)
- `PATCH_UPDATE_SYSTEM.md` (**MISSING**)
- `IMPLEMENTATION_ROADMAP.md` (**MISSING** — hanya ada placeholder `docs/roadmap/README.md`)
- `RESEARCH_STATUS.md` (**MISSING**)

Selain ketiadaan dokumen-dokumen tersebut, pemeriksaan silang atas dokumen yang ada (`CURRENT_GAME_RESEARCH.md`, `GLOBAL_ESPORTS_*.md`, `PRODUCT_ARCHITECTURE.md`, `SYSTEM_ARCHITECTURE.md`, `TECH_STACK.md`, `database/README.md`, `database/schema/README.md`, `AGENTS.md`, `src/types/knowledge.ts`, `src/features/*/index.ts`) mengungkap sejumlah **kontradiksi penamaan, kesenjangan entitas (misalnya absennya entitas `Game` di bawah `Match`), ketiadaan aturan sumber untuk riset gameplay non-esports, serta tautan dan sitasi bermasalah pada `CURRENT_GAME_RESEARCH.md`**.

---

## 2. Current Architecture Assessment

### 2.1 Dokumen & Kontrak yang Tersedia Saat Ini

| Sumber yang Diperiksa | Kondisi Aktual | Penilaian |
|---|---|---|
| `AGENTS.md` | Mendefinisikan aturan permanen integritas data, 5 klasifikasi klaim, 6 field metadata patch, 5 pertanyaan adaptasi pro-ke-ranked, dan standar TypeScript/UI. | Kuat sebagai pedoman kebijakan, tetapi belum diturunkan menjadi spesifikasi skema teknis. |
| `docs/architecture/TECH_STACK.md` | Menetapkan Next.js 15 App Router, TypeScript strict, Tailwind CSS v4, Lucide React, dan rencana PostgreSQL `16+` + `JSONB` + `GIN/Full-Text` + `pg_trgm`. | Memadai untuk tahap awal, namun pilihan ORM (`Drizzle` vs `Prisma` vs `Kysely`) dan strategi migrasi belum diputuskan. |
| `docs/architecture/SYSTEM_ARCHITECTURE.md` | Menjelaskan 4 lapisan arsitektur secara konseptual (Presentation, Application/Policy, Data, Ingestion/Patch Pipeline). | Terlalu abstrak; belum memiliki kontrak data, skema dependency graph patch, maupun alur penyelesaian konflik sumber. |
| `docs/architecture/PRODUCT_ARCHITECTURE.md` | Berisi **ringkasan awal 31 baris** yang memetakan 10 rute dan 3 alur pengguna. | Belum merupakan *Product Architecture* penuh; batas modul `Synergies`, `Ranked`, dan `Knowledge Sources` belum terpisah jelas. |
| `docs/research/CURRENT_GAME_RESEARCH.md` | Berisi ringkasan Patch `2.2.23` (Season 42) untuk Original Server, catatan Advance Server, Experimental, dan Rumor. | **Bermasalah pada kualitas sumber & struktur:** URL rujukan memakai redirect Google Grounding sementara, URL [7] & [8] identik untuk dua klaim berbeda, belum memakai header metadata `AGENTS.md` §2, dan belum memodelkan data hero/item terstruktur. |
| `docs/research/GLOBAL_ESPORTS_*.md` (5 dokumen + `README.md`) | Registry `24` seri kompetisi & `39` event 2026 dengan pemisahan *Series -> Event -> Data Source -> Coverage per Aspek -> Research Status*. | Model konseptual terbaik di repositori saat ini, tetapi belum mencakup level `Stage`, `Group`, `Match`, `Game`, `Roster`, `Draft Sequence`, serta masih mengandung tautan internal absolut ke direktori sesi lama (`file:///C:/Users/.../brain/74c466ec-...`). |
| `database/schema/README.md` | Hanya mendaftar 24 nama tabel konseptual dalam 4 kelompok tanpa kolom, tipe data, primary/foreign key, atau constraint. | Tidak dapat dianggap sebagai rancangan skema database yang dapat divalidasi. |
| `src/types/knowledge.ts` & `src/features/*/index.ts` | Menyediakan kontrak tipe governance dasar (`KnowledgeGovernanceMeta`, `VerificationStatus`, `ClaimClassification`) dan konstanta UI skeleton. | Masih berupa kerangka minimalis; belum mendukung multi-sumber, validitas temporal lintas patch, status `CONFLICTING`/`OUTDATED`, maupun relasi antarentitas. |

---

## 3. Missing Knowledge Domains

Evaluasi cakupan domain pengetahuan berdasarkan kebutuhan platform *knowledge intelligence*:

| Domain | Sub-Cakupan yang Hilang / Belum Dimodelkan | Status Saat Ini |
|---|---|---|
| **A. Game Fundamentals** | Tidak ada model sama sekali untuk: Game Modes (Classic, Ranked, Brawl, Tournament), Aturan Ranked (jumlah ban per tier, urutan draft pick), Geometri Peta & Lane, Mekanika Jungle (camp, buff, timer, Retribution scaling), Objectives (Turtle/Lord spawn, evolusi, buff), Minion Waves (timing, gold/XP siege/canon), Towers (plating, shield, armor, aggro), dan Mekanika Inti (jenis Crowd Control seperti *suppress* vs *airborne*, formula armor/magic defense, anti-heal, shield, death timer). | **MISSING (0% dimodelkan)** |
| **B. Hero Intelligence** | `HERO_FILTER_DIMENSIONS` hanya memiliki `roles`, `lanes`, `damageTypes`. Belum memodelkan: Hero Identity (ID resmi, alias, rilis/revamp history), Specializations (Burst, Chase, Regen, Initiator, Guard, dll.), Skills & Passive (angka scaling per level, cooldown, biaya mana/energi, hitbox/CC type, interaksi unik), Skill Upgrade Priority, Combos (urutan skill + syarat + catatan eksekusi), Power Spikes (level & item threshold), Strengths, Weaknesses, Difficulty, Playstyle, dan Perilaku per Fase (Early/Mid/Late). | **PARSIAL SANGAT MINIMAL (~10%)** |
| **C. Hero Relationships** | Belum ada definisi struktur untuk Matchup vs Counter vs Synergy vs Team Composition vs Draft Relationship vs Role Conflict vs Strategic Compatibility. `database/schema/README.md` hanya menyebut nama tabel tanpa atribut konteks, arah relasi, atau metrik/alasan mekanis. | **MISSING (Hanya label UI)** |
| **D. Item Intelligence** | `ITEM_CATEGORIES` hanya mendaftar 5 kategori toko. Belum ada model untuk: Item Identity & Tier (Basic/Advanced/Legend), Item Statistics terstruktur, Unique Passive (beserta aturan *non-stacking* nama pasif sama), Active Skill, Build Path & Components (tree resep), Gold Cost & Efficiency, Item Synergies, Counter Items (terhadap mekanik ancaman spesifik), Situational Triggers, Item Timing, dan Build Alternatives. | **PARSIAL SANGAT MINIMAL (~5%)** |
| **E. Build Intelligence** | `BUILD_SLOTS` hanya membedakan 4 label slot. Belum memodelkan konteks situasional lengkap: Hero, Role, Lane, Matchup target, Enemy Comp, Allied Comp, Game State (*ahead/even/behind*), Strategic Objective (*burst/sustain/siege/anti-heal*), Patch Version, Build Creator/Source, Reasoning per item, Alternatives per slot, dan Confidence Level. | **MISSING (Hanya 4 label slot)** |
| **F. Gameplay Knowledge (Micro & Macro)** | `src/features/academy/index.ts` bahkan **tidak mencantumkan** kerangka `Micro Academy` dan `Macro Academy` meskipun disebut di UI `/academy`. Seluruh sub-konsep Micro (Positioning, Mechanics, Skill Execution, Combos, Aim, Movement, Spacing, Trading, Laning, Mechanical Decision-Making) dan Macro (Rotation, Wave Management, Map Awareness, Objective Control, Jungle Pathing, Tempo, Resource Allocation, Vision/Information, Teamfight Planning, Target Priority, Game Closing) belum dimodelkan. | **MISSING (0% dimodelkan)** |
| **G. Ranked Knowledge** | Hanya ada 4 deskripsi singkat (`solo`, `duo`, `trio`, `five-man`) di `ACADEMY_TRACKS`. Belum ada pemodelan terstruktur lintas 7 dimensi (Communication, Coordination, Draft, Decision-Making, Risk, Strategy, Execution) maupun diferensiasi tier rank (mis. Epic–Legend vs Mythic–Immortal). | **PARSIAL SANGAT MINIMAL (~10%)** |
| **H. Knowledge Sources & Verification** | Sudah dimodelkan untuk metadata turnamen esports di `GLOBAL_ESPORTS_SOURCE_AUDIT.md`, tetapi belum ada model/kebijakan untuk sumber gameplay non-esports (patch notes resmi, uji mekanik in-game, analisis pro/kreator, komunitas). | **PARSIAL (Esports saja)** |

---

## 4. Missing Entities

### 4.1 Entitas Pengetahuan Game & Pembelajaran yang Hilang
- `game_modes`, `map_zones`, `game_objectives` (Turtle, Lord, Turret, Minion, Jungle Camp), `game_mechanics` (glosarium mekanik terstruktur: CC types, damage types, stat formulas)
- `hero_specializations`, `hero_stat_profiles` (base stats & growth per patch), `hero_power_spikes`, `hero_phase_profiles` (Early/Mid/Late)
- `item_components` (resep/build path item), `item_stats`, `item_effects` (pasif unik & aktif terstruktur; tercantum di `PRODUCT_ARCHITECTURE.md` tetapi hilang di `database/schema/README.md`)
- `emblems`, `emblem_talents`, `battle_spells` (disebut di `database/schema/README.md`, namun tidak ada model/atributnya sama sekali)
- `build_items` / `build_situational_rules` (memisahkan urutan item inti dari aturan percabangan berbasis kondisi musuh/game state)
- `team_compositions` (archetype komposisi seperti *Pick-off*, *Wombo-Combo*, *Poke/Siege*, *Sustain/Protect*)
- `gameplay_concepts` / `academy_lessons` (memisahkan `MICRO`, `MACRO`, `RANKED_SOLO`, `RANKED_DUO`, `RANKED_TRIO`, `RANKED_5MAN`)
- `pro_to_ranked_adaptations` (tercantum di `PRODUCT_ARCHITECTURE.md`, tetapi hilang di `database/schema/README.md` dan `platformModules.ts`)
- `knowledge_claims` / `conflicting_claims` (untuk merepresentasikan klaim yang bertentangan antarsumber)
- `player_learning_tracks` / `player_progress` *(untuk visi "Player learning and progression" di Phase 6+, belum muncul di `database/schema/README.md`)*

### 4.2 Entitas Competitive Esports Intelligence yang Hilang
`database/schema/README.md` saat ini langsung melompat dari `competition_events` ke `matches` dan `match_drafts`. Entitas penting yang hilang:
- `tournament_stages` (Wild Card, Group Stage, Swiss Stage, Play-Ins, Knockout/Playoffs — sangat penting karena `COMP001`, `COMP002`, `COMP008` punya multi-stage!)
- `tournament_groups` & `tournament_standings`
- `match_games` (**KRITIS:** satu `Match` Bo3/Bo5/Bo7 terdiri dari beberapa `Game`; setiap `Game` memiliki pemenang, durasi, patch versi bermain, sisi Blue/Red, draft, statistik pemain, dan VOD sendiri!)
- `game_player_performances` (performa pemain per-game: hero yang dipakai, role/lane, KDA, gold, damage, emblem/spell/build yang tercatat)
- `draft_actions` (urutan pick/ban per fase & sisi pada sebuah `Game`, terpisah dari tabel `tournament_hero_stats` untuk statistik agregat seperti `Liquipedia /Statistics`)
- `vod_records` / `vod_timestamps` (tautan playlist, URL video per-game, timestamp draft/momen kunci)
- `match_observations` (fakta teramati per fase Draft/Early/Mid/Late pada pertandingan nyata) vs `competitive_insights` (interpretasi strategis) vs `meta_trends` (generalisasi tren meta per turnamen/patch)

---

## 5. Missing Relationships

1. **Arah & Konteks pada Relasi Hero (`hero_matchups`, `hero_counters`, `hero_synergies`):**
   - Belum ada definisi apakah `hero_counters` berarah (`subject_hero_id` meng-counter `target_hero_id`), apakah `hero_matchups` spesifik per `lane` dan `game_phase` (Early vs Late), serta bagaimana `item_counters` mengaitkan `item_id` dengan *mekanik/ancaman spesifik* (mis. `Antique Cuirass` vs `physical_skill_burst`, bukan sekadar hero secara keseluruhan).
2. **Pemetaan Komposisi & Konflik Draft:**
   - Belum ada relasi antara `heroes` <-> `team_compositions` (fit dalam archetype tim) maupun `hero_role_conflicts` (mis. dua hero sama-sama butuh resource/farm tinggi atau tidak memiliki *frontline/wave clear*).
3. **Hierarki Relasi Kompetitif Lengkap:**
   - Rantai relasi saat ini terputus di `matches -> match_drafts`. Seharusnya:
     `competitions (Series)` -> `competition_events (Season/Tournament)` -> `tournament_stages` -> `tournament_groups` -> `matches` -> `match_games` -> `draft_actions` + `game_player_performances` + `vod_records` -> `match_observations` -> `competitive_insights` -> `meta_trends` -> `pro_to_ranked_adaptations`.
4. **Relasi Patch Impact & Dependency Graph:**
   - Belum ada definisi graf ketergantungan formal antara `patch_changes` dengan entitas terdampak (`heroes`, `hero_skills`, `items`, `builds`, `hero_matchups`, `hero_counters`, `strategies`, `competitive_insights`) untuk memicu status `STALE` / `OUTDATED` secara otomatis.
5. **Relasi Many-to-Many Provenance (`entity_sources` / `claim_evidences`):**
   - Satu entitas (contoh: `COMP001` di `GLOBAL_ESPORTS_SOURCE_AUDIT.md`) memiliki banyak sumber untuk aspek berbeda (`Existence`, `Format`, `Results`, `Draft`, `Stats`, `VOD`). Model `sourceLabel: string | null` tunggal pada `src/types/knowledge.ts` tidak mampu merepresentasikan relasi ini.

---

## 6. Data Integrity Risks

1. **Ketiadaan `SOURCE_VERIFICATION_POLICY.md` Memicu Kebocoran Sumber Lemah:**
   - Terbukti pada `docs/research/CURRENT_GAME_RESEARCH.md` yang mencampur blog sekunder/komunitas (`mlbbhub.com`, `timesaver.gg`, `boostroyal.com`, `suaramerdeka.com`, Reddit) sebagai rujukan fakta Patch `2.2.23`, menggunakan tautan redirect sementara `vertexaisearch.cloud.google.com`, dan bahkan memiliki **URL redirect duplikat untuk dua sumber berbeda (nomor [7] dan [8])**.
2. **Taksonomi Status Data Tidak Konsisten & Tidak Membedakan `UNKNOWN`, `NOT_RESEARCHED`, `CONFLICTING`, `OUTDATED`:**
   - `AGENTS.md`, `SYSTEM_ARCHITECTURE.md`, `GLOBAL_ESPORTS_COVERAGE.md`, `GLOBAL_ESPORTS_SOURCE_AUDIT.md`, dan `src/types/knowledge.ts` menggunakan set status yang berbeda-beda.
   - `src/types/knowledge.ts` menyamakan `UNKNOWN` dan `UNVERIFIED` dalam `UNKNOWN_UNVERIFIED`, belum memiliki status `CONFLICTING`, `OUTDATED`, atau `NOT_RESEARCHED` pada `VerificationStatus`, serta belum membedakan `NOT_FOUND` (terkonfirmasi memang tidak ada) dengan `NOT_RESEARCHED` (belum diperiksa).
3. **Risiko Pencampuran Fakta vs Opini dalam Satu Entitas:**
   - Tanpa pemisahan tabel `match_observations` vs `competitive_insights` vs `pro_to_ranked_adaptations`, ringkasan analisis tim pro dapat tersimpan sebagai teks bebas yang mencampurkan skor nyata, interpretasi analis, dan saran ranked.
4. **Ketidakseragaman Kontrak Governance (`AGENTS.md` vs `src/types/knowledge.ts` vs `SYSTEM_ARCHITECTURE.md`):**
   - Nama field dan kardinalitas berbeda (`server_type` vs `serverEnvironment`; `verified_at` vs `lastVerified`; `source_ref` vs `sourceLabel` vs `sourceRefs`), dan `verified_by` serta `evidence` belum ada di kontrak TypeScript.

---

## 7. Patch Awareness Risks

1. **Ketiadaan `PATCH_UPDATE_SYSTEM.md`:** Belum ada aturan teknis tentang bagaimana perubahan patch baru menginvalidasi atau menandai (`STALE`/`OUTDATED`) data turunan (`builds`, `matchups`, `counters`, `competitive_insights`).
2. **Tidak Ada Model Temporal Validity (`valid_from_patch_id`, `valid_until_patch_id`, `historical_snapshots`):**
   - Jika data hero/item hanya menyimpan satu baris *current state* dengan satu `patch_version` string, maka analisis pertandingan esports dari patch lama (mis. MSC 2026 di Patch pertengahan tahun vs M8 di Patch akhir tahun) tidak dapat direkonstruksi terhadap stat hero/item pada saat turnamen berlangsung.
3. **Risiko Pencampuran Server:**
   - `CURRENT_GAME_RESEARCH.md` sudah memisahkan bagian *Original Server*, *Advance Server*, *Experimental Features*, dan *Upcoming/Rumored*, tetapi belum ada constraint database maupun enum/policy di `src/` yang mencegah fitur Advance Server/Experimental masuk ke rekomendasi Build atau Counter Live Server.
4. **Shadow/Hotfix & Sub-Patch:**
   - Belum ada mekanisme penanganan hotfix patch atau perubahan parsial yang hanya memengaruhi satu mekanik tanpa mengubah nomor season.

---

## 8. Competitive Intelligence Risks

1. **Kehilangan Granularitas Tingkat `Game`:**
   - Hanya memiliki `matches` tanpa `match_games` membuat sistem tidak bisa menyimpan urutan draft per-game dalam seri Bo3/Bo5/Bo7, perbedaan sisi Blue/Red tiap game, maupun perubahan komposisi pemain (*substitution*).
2. **Pencampuran Statistik Agregat Turnamen dengan Log Draft Per-Game:**
   - `GLOBAL_ESPORTS_VALIDATION_REPORT.md` menunjukkan 17 turnamen baru memiliki statistik agregat Liquipedia (`/Statistics`), sedangkan `0` turnamen memiliki log urutan draft per-game. Jika tidak dipisahkan antara `tournament_hero_stats` (agregat) dan `draft_actions` (urutan per-game), data parsial berisiko dianggap lengkap.
3. **Ketiadaan `COMPETITIVE_MATCH_ANALYSIS_FRAMEWORK.md`:**
   - Tidak ada skema standar terstruktur untuk mencatat 4 fase analisis (`Draft`, `Early`, `Mid`, `Late`), bukti VOD (`vod_timestamp`), dan pembedaan antara *Observed Fact* vs *Strategic Interpretation* vs *Meta Trend*.

---

## 9. Ranked Adaptation Risks

1. **Ketiadaan `PRO_TO_RANKED_ADAPTATION.md`:**
   - Belum ada struktur data atau rubrik evaluasi yang memaksa setiap adaptasi menjelaskan kondisi prasyarat (*voice comms*, kontrol lane, komposisi draft) serta risiko spesifik untuk **Solo, Duo, Trio, dan 5-Man**.
2. **Risiko *Naive Pro Mimicry*:**
   - Tanpa pemodelan terpisah untuk faktor komunikasi, koordinasi, toleransi risiko, dan ketidakpastian draft di Solo Queue, pengguna dapat menganggap hero/strategi *high-priority* di MPL/M-Series otomatis optimal di Solo Rank.
3. **Cakupan Academy Belum Lengkap:**
   - `ACADEMY_TRACKS` baru mencakup 4 ukuran party tanpa modul terstruktur untuk **Macro**, **Micro**, maupun **Rank Tier Context**.

---

## 10. Research Gaps

### 10.1 Dokumen Phase 0 yang Belum Dibuat (Blocker Arsitektur)
1. `KNOWLEDGE_ARCHITECTURE.md`
2. `DATABASE_SCHEMA.md`
3. `COMPETITIVE_MATCH_ANALYSIS_FRAMEWORK.md`
4. `PRO_TO_RANKED_ADAPTATION.md`
5. `SOURCE_VERIFICATION_POLICY.md`
6. `PATCH_UPDATE_SYSTEM.md`
7. `IMPLEMENTATION_ROADMAP.md` (penuh)
8. `RESEARCH_STATUS.md`
9. `PRODUCT_ARCHITECTURE.md` (versi penuh; saat ini hanya ringkasan 31 baris)

### 10.2 Kesenjangan Data Riset Aktual
- **Game & Item Data:** Belum ada riset terverifikasi untuk daftar lengkap hero, base stats, scaling skill, daftar lengkap item, emblem, dan battle spell pada Patch `2.2.23` (`CURRENT_GAME_RESEARCH.md` baru mencatat highlight patch dan menggunakan URL redirect Google Grounding).
- **Esports Coverage (`GLOBAL_ESPORTS_VALIDATION_REPORT.md`):**
  - `0 / 39` kompetisi berstatus `FULLY_RESEARCHED`.
  - `34 / 39` kompetisi selesai berstatus `VOD = UNVERIFIED` (belum ada URL playlist/video spesifik yang dibuka langsung).
  - `34 / 39` kompetisi selesai belum memiliki urutan draft per-game (`17 PARTIAL` agregat, `17 UNVERIFIED`).
  - `5` kompetisi (`COMP016`, `COMP020`, `COMP024`, `COMP037`, `COMP038`) belum memiliki sumber resmi terverifikasi (`Official Source = UNVERIFIED`).
  - Verifikasi HTTP langsung `https://en.moonton.com/news/399.html` dan exact URL artikel `en.moonton.com` untuk MSC 2026, MWI 2026, M8, dan Asian Games 2026 masih tertunda.
  - `12` kandidat riset (`CAND-001` s.d. `CAND-012`) belum diriset.

---

## 11. Architecture Contradictions

1. **Penamaan Tabel Tidak Konsisten Antar Dokumen:**
   - `tournaments` (`PRODUCT_ARCHITECTURE.md`) vs `competitions` + `competition_events` (`database/schema/README.md`, `platformModules.ts`) vs `tournaments / competition_events` (`GLOBAL_ESPORTS_VALIDATION_REPORT.md`).
   - `match_drafts` (`PRODUCT_ARCHITECTURE.md`, `database/schema/README.md`) vs `match_draft_sequence` (`GLOBAL_ESPORTS_VALIDATION_REPORT.md`).
   - `items + item_effects` (`PRODUCT_ARCHITECTURE.md`, `src/app/items/page.tsx`) vs hanya `items` (`database/schema/README.md`, `platformModules.ts`).
   - `pro_to_ranked_adaptations` ada di `PRODUCT_ARCHITECTURE.md`, tetapi hilang di `database/schema/README.md` dan `platformModules.ts`.
   - `sources` (`database/schema/README.md`) vs `source_references` (`GLOBAL_ESPORTS_VALIDATION_REPORT.md`).
   - `patch_impact_queue` (`database/schema/README.md`) vs `verification_records` (`PRODUCT_ARCHITECTURE.md`, `platformModules.ts`).
2. **Batas Modul Produk vs Struktur `src/features/`:**
   - `src/features/` memisahkan `counters` dan `synergies`, sedangkan `PRODUCT_ARCHITECTURE.md` menggabungkannya di `/counters`.
   - Domain `Ranked` (terpisah dari `Academy` umum dalam visi Phase 1) dan `Knowledge Sources` belum memiliki definisi modul/batas yang jelas di `PRODUCT_ARCHITECTURE.md`.
   - `PLATFORM_MODULES` di `src/data/platformModules.ts` memasukkan `search` lalu harus memfilternya manual di `src/app/page.tsx`.
3. **Tautan Internal Rusak pada Dokumen Riset:**
   - Dokumen di `docs/research/GLOBAL_ESPORTS_*.md` masih menautkan path absolut lokal sesi lama (`file:///C:/Users/rangg/.gemini/antigravity/brain/74c466ec-...`) alih-alih tautan relatif di dalam `docs/research/`.

---

## 12. Recommended Changes & Priority Classification

| ID | Ringkasan Perubahan yang Direkomendasikan | Prioritas |
|---|---|---|
| `REC-01` | Susun 6 dokumen arsitektur & kebijakan Phase 0 yang hilang (`KNOWLEDGE_ARCHITECTURE.md`, `SOURCE_VERIFICATION_POLICY.md`, `PATCH_UPDATE_SYSTEM.md`, `COMPETITIVE_MATCH_ANALYSIS_FRAMEWORK.md`, `PRO_TO_RANKED_ADAPTATION.md`, `DATABASE_SCHEMA.md`) sebelum DDL/migrasi apa pun dibuat. | **P0 — Critical** |
| `REC-02` | Satukan taksonomi status verifikasi (`VERIFIED`, `PARTIALLY_VERIFIED`, `UNVERIFIED`, `OUTDATED`/`STALE`, `CONFLICTING`, `UNKNOWN`, `NOT_RESEARCHED`, `NOT_YET_AVAILABLE`, `NOT_FOUND`) dan kontrak metadata provenance multi-sumber di `AGENTS.md`, `src/types/knowledge.ts`, dan skema DB. | **P0 — Critical** |
| `REC-03` | Desain skema database dengan *Patch Temporal Versioning* (`patch_versions`, `valid_from_patch_id`, `valid_until_patch_id`, snapshot historis, `patch_impact_queue`) dan pemisahan tegas `server_type`. | **P0 — Critical** |
| `REC-04` | Lengkapi hierarki entitas Esports (`Series -> Event -> Stage -> Group -> Match -> Game -> Draft Actions & Player Performances -> VOD -> Observation -> Insight -> Meta Trend`) serta pisahkan statistik agregat dari log draft per-game. | **P0 — Critical** |
| `REC-05` | Audit ulang `CURRENT_GAME_RESEARCH.md` (ganti URL redirect Google Grounding dengan URL kanonik terverifikasi, pisahkan sumber resmi vs sekunder/komunitas, perbaiki URL duplikat [7]/[8] dan format tabel). | **P1 — High** |
| `REC-06` | Modelkan relasi Hero/Item/Build secara terstruktur (arah, konteks lane/fase, komposisi tim, komponen/resep item, aturan non-stacking pasif, kondisi situasional & reasoning build). | **P1 — High** |
| `REC-07` | Modelkan domain `Game Fundamentals`, `Micro/Macro Learning`, dan `Pro-to-Ranked Adaptation` (matriks Solo/Duo/Trio/5-Man 7 dimensi + 17 field wajib). | **P1 — High** |
| `REC-08` | Standarkan penamaan tabel, selesaikan versi penuh `PRODUCT_ARCHITECTURE.md` (termasuk batas modul `Ranked`, `Synergies`, dan `Knowledge Sources`) serta `IMPLEMENTATION_ROADMAP.md` & `RESEARCH_STATUS.md`. | **P1 — High** |
| `REC-09` | Perbaiki tautan internal absolut lama pada `docs/research/GLOBAL_ESPORTS_*.md` menjadi tautan relatif repositori. | **P2 — Medium** |
| `REC-10` | Siapkan entitas ekstensi masa depan untuk `player_learning_tracks`, `player_progress`, serta alur kurasi/rekomendasi analitik di `DATABASE_SCHEMA.md`. | **P3 — Low / Future** |
