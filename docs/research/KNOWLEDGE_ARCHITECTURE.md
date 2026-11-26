# KNOWLEDGE_ARCHITECTURE — Arsitektur Pengetahuan MLBB Master Guide

**Tanggal:** `2026-11-18`  
**Versi:** `1.0 (Phase 1.1 Recovery — Menunggu Review)`  
**Status Dokumen:** Spesifikasi Konseptual Domain Pengetahuan  

---

## 1. Tujuan & Prinsip Desain Arsitektur Pengetahuan

**MLBB Master Guide** bukan sekadar ensiklopedia statis, melainkan **platform intelijen pengetahuan** (*knowledge intelligence platform*). Setiap entitas pengetahuan di dalam sistem harus:
1. **Terstruktur & Relasional:** Hubungan sebab-akibat (counter, matchup, build situasional, adaptasi taktik) disimpan sebagai relasi terstruktur dengan konteks dan alasan mekanis, bukan sekadar teks bebas.
2. **Sadar Patch & Lingkungan Server (*Patch-Aware*):** Setiap fakta permainan terikat pada versi patch dan dibedakan secara tegas antara `ORIGINAL_SERVER`, `ADVANCE_SERVER`, dan `EXPERIMENTAL`.
3. **Terverifikasi & Dapat Dilacak (*Evidence-Backed*):** Setiap klaim dipisahkan tingkat kebenarannya (fakta resmi vs analisis riset vs interpretasi strategis vs teori komunitas) serta tertaut ke bukti dan sumber.
4. **Kontekstual terhadap Mode Bermain:** Strategi profesional tidak pernah disamakan dengan realitas Solo Queue; setiap pengetahuan taktis dievaluasi terhadap konteks `SOLO`, `DUO`, `TRIO`, dan `5-MAN`.

---

## 2. Peta Konseptual Lintas Domain

```text
+-----------------------------------------------------------------------------------+
| 10. KNOWLEDGE QUALITY & PROVENANCE (Sources, Evidences, Confidence, Conflicts)   |
+-----------------------------------------+-----------------------------------------+
                                          | mengaudit & mengikat seluruh domain
                                          v
+-----------------------------------------------------------------------------------+
| 9. PATCH INTELLIGENCE (Patch Versions, Server Type, Change Log, Temporal Snapshots)|
+---------+-------------------------------+-------------------------------+---------+
          | memicu validitas temporal     |                               |
          v                               v                               v
+-------------------+           +-------------------+           +-------------------+
| 1. GAME           |---------->| 2. HERO           |---------->| 3. HERO           |
|    FUNDAMENTALS   | mekanik   |    INTELLIGENCE   | relasi    |    RELATIONSHIPS  |
| (Map, Modes, Obj) | dasar     | (Skill, Spike)    | taktis    | (Matchup/Counter) |
+---------+---------+           +---------+---------+           +---------+---------+
          |                               |                               |
          |                               v                               |
          |                     +-------------------+                     |
          +-------------------->| 4. ITEM           |                     |
                                |    INTELLIGENCE   |                     |
                                +---------+---------+                     |
                                          |                               |
                                          v                               v
                                +-----------------------------------------+---------+
                                | 5. BUILD INTELLIGENCE                             |
                                |    (Hero + Role + Matchup + Comp + Game State)    |
                                +---------+-----------------------------------------+
                                          |
          +-------------------------------+-------------------------------+
          v                                                               v
+-----------------------------------------+           +-----------------------------+
| 6. GAMEPLAY KNOWLEDGE                   |           | 8. COMPETITIVE INTELLIGENCE |
|    (Micro Learning & Macro Learning)    |           |    (Tournament -> Match ->  |
+---------+-------------------------------+           |     Game -> Draft -> Obs -> |
          |                                           |     Insight -> Meta Trend)  |
          |                                           +--------------+--------------+
          v                                                          |
+--------------------------------------------------------------------+--------------+
| 7. RANKED KNOWLEDGE & PRO-TO-RANKED ADAPTATION (Solo / Duo / Trio / 5-Man)        |
+-----------------------------------------------------------------------------------+
```

---

## 3. Rincian Domain Utama Pengetahuan

### 3.1 Game Fundamentals
Menjadi kamus dasar dan aturan dunia permainan yang dirujuk oleh seluruh domain hero, item, gameplay, dan esports:
- **Game Modes:** Definisi aturan per mode (`Ranked`, `Classic`, `Brawl`, `Custom/Tournament`), syarat rank, dan perbedaan sistem draft.
- **Game Rules:** Urutan ban & pick per tier/mode, kondisi menang/kalah, aturan surrender, dan mekanisme ekonomi dasar (passive gold, assist gold, shutdown bounty).
- **Map & Lanes:** Topologi peta (*Land of Dawn*), pembagian 3 lane (`EXP Lane`, `Mid Lane`, `Gold Lane`), `River`, `Bush`, dan jalur rotasi (*jungle entrance*).
- **Jungle:** Lokasi camp (*Purple Buff*, *Orange Buff*, *Lithowanderer*, camp kecil), timer spawn/respawn, mekanisme *Retribution* (Ice/Flame/Bloody), dan *anti-invade shield* menit awal.
- **Objectives (Turtle & Lord):** Jendela waktu spawn, perubahan fase (*Evolved Lord*, *Enhanced Lord*), buff yang diberikan ke tim, dan nilai objektif relatif terhadap turret/kill.
- **Minions:** Jenis wave (`Melee`, `Ranged`, `Siege/Canon`, *EXP-lane tank minion*, *Gold-lane siege minion*), timing wave, nilai gold/XP, dan aturan *roam/jungle boot gold sharing*.
- **Towers:** Outer, Inner, dan Base Turret; mekanisme *Energy Shield / Gold Plating* awal game, pengurangan damage tanpa minion (*backdoor protection*), damage scaling turret, dan prioritas aggro.
- **Game Mechanics:** Definisi baku mekanika inti yang menjadi tag rujukan untuk Skill dan Counter:
  - Jenis *Crowd Control* (`Suppress`, `Airborne/Knock-up`, `Stun`, `Petrify`, `Taunt`, `Terrify`, `Freeze`, `Immobilize`, `Silence`, `Slow`, `Morph`).
  - Jenis *Damage & Mitigation* (`Physical`, `Magic`, `True Damage`, *Flat vs Percentage Penetration*, *Damage Reduction*, *Shield*, *Lifesteal/Spell Vamp*, *Anti-Heal / Healing Reduction*).
  - Status khusus (`Untargetable`, `Invulnerable`, `CC Immune`, `Camouflage`, `Conceal`, `Death Timer`).

### 3.2 Hero Intelligence
Merepresentasikan profil lengkap hero per versi patch aktif maupun historis:
- **Hero Identity:** ID kanonik, nama resmi, judul/epithet, tanggal rilis, dan riwayat revamp besar.
- **Role & Lane Assignment:** Role primer/sekunder (`Tank`, `Fighter`, `Assassin`, `Mage`, `Marksman`, `Support`) serta kelayakan lane (`EXP`, `Jungle`, `Mid`, `Gold`, `Roam`) lengkap dengan tingkat fleksibilitas (*flex pick viability*).
- **Specialization:** Spesialisasi resmi/taktis (`Burst`, `Chase`, `Regen`, `Initiator`, `Guard`, `Poke`, `Control`, `Push`, `Finisher`, `Damage`).
- **Skills & Passive:** Deskripsi terverifikasi, tipe skill (`Passive`, `Skill 1`, `Skill 2`, `Ultimate`, `Morph/Switch`), tipe damage, cooldown per level, biaya resource (Mana/Energy/Rage/Stack), jarak/area, dan *scaling* atribut.
- **Skill Mechanics:** Mekanika tersembunyi atau interaksi spesifik (mis. *reset basic attack*, *dash cancel*, *flash-skill buffer*, interaksi dengan *Suppress* atau *Purify*).
- **Combos:** Urutan aksi skill/battle spell/basic attack untuk skenario spesifik (*burst combo*, *engage combo*, *escape*), syarat kondisi, dan tingkat kesulitan eksekusi.
- **Skill Priority:** Urutan prioritas upgrade skill di level awal hingga maksimal beserta alasan mekanisnya.
- **Power Spikes:** Titik lonjakan kekuatan berdasarkan level (mis. Level 1, Level 2, Level 4 Ultimate) dan ambang batas item inti (*1-item*, *2-item*, *3-item spike*).
- **Strengths & Weaknesses:** Keunggulan dan kerentanan struktural yang terikat pada mekanik kit, bukan opini umum.
- **Difficulty & Playstyle:** Tingkat kesulitan mekanik/makro serta arketipe gaya bermain (*assassin pick-off*, *front-to-back teamfight*, *split push*, *utility enabler*).
- **Phase Profiles (Early / Mid / Late Game):** Peran, prioritas tugas, dan batas risiko hero di setiap fase permainan.

### 3.3 Hero Relationships
Seluruh hubungan antar-hero wajib dimodelkan secara terstruktur dengan **arah**, **konteks**, **alasan mekanis**, dan **validitas patch**:
- **Matchups (`Hero A vs Hero B`):** Evaluasi duel langsung pada lane tertentu (`1v1` atau `2v2`) melintasi fase *Early*, *Mid*, dan *Late*, mencakup siapa pemegang *lane priority*, jendela trade, dan cara bertahan saat tertinggal.
- **Counters (`Hero Counter -> Target Hero`):** Relasi berarah yang menjelaskan mekanik spesifik yang menghentikan target (mis. *Suppress* memutus mobilitas tinggi, *Anti-dash* menghentikan *blink*, *Long-range poke* menghukum *low-mobility*). Wajib menyertakan syarat efektivitas dan batasannya.
- **Synergies (`Hero A + Hero B`):** Relasi komplementer berdasarkan sumbu sinergi (*Initiation + Follow-Up*, *Peel & Protect*, *Split Damage Physical/Magic*, *Objective/Siege Combo*).
- **Team Compositions:** Arketipe komposisi 5 hero (*Wombo-Combo Teamfight*, *Pick-off/Burst*, *Poke/Siege*, *Protect the Hyper/Marksman*, *Split-Push/Macro*), kebutuhan *frontline*, *wave clear*, dan *win condition*.
- **Draft Relationships:** Hubungan fase draft seperti *flex pick priority*, *ban bait*, *blind-pick safety*, dan *last-pick punishment*.
- **Strategic Compatibility & Role Conflicts:** Penanda konflik internal komposisi (mis. *double resource-hungry carry*, kurangnya *magic damage*, atau absennya *hard CC* dan *frontliner*).

### 3.4 Item Intelligence
- **Item Identity:** ID kanonik, nama, kategori (`Attack`, `Magic`, `Defense`, `Movement`, `Jungling & Roaming`), dan tier (`Basic`, `Advanced`, `Legend`).
- **Statistics:** Daftar atribut numerik terstruktur (*Physical Attack*, *Magic Power*, *HP*, *Physical/Magic Defense*, *Attack Speed*, *CD Reduction*, *Movement Speed*, *Penetration*, dll.).
- **Passives & Actives:** Pemisahan tegas antara **Unique Passive** (termasuk grup nama pasif agar sistem mencegah stack ganda pasif bernama sama), **Passive Stacking**, dan **Active Skill** beserta *cooldown* dan durasi efek.
- **Components, Cost, & Build Path:** Harga beli total, komponen resep (*tier-1 -> tier-2 -> tier-3*), harga kombinasi, dan efisiensi statistik dasar.
- **Counter Items:** Pemetaan `Item -> Ancaman Mekanik Target` (mis. serangan berbasis *Attack Speed*, *Burst Magic*, *Sustained Magic DPS*, *HP Regen/Shield*, *Physical Skill Burst*) beserta kondisi pemicunya.
- **Situational Items & Item Timing:** Kapan item dibeli (*first item*, *mid-game pivot*, *late-game insurance*), serta alternatif pertukaran item pada late game (mis. *Immortality* <-> *Winter Crown* / *Rose Gold Meteor* saat cooldown).

### 3.5 Build Intelligence
Build bukanlah sekadar daftar 6 gambar item, melainkan **keputusan taktis kontekstual** yang wajib mendukung atribut:
- **Identitas Konteks:** `hero_id`, `role`, `lane`, serta target `matchup` (opsional).
- **Komposisi & Keadaan Match:** `enemy_composition_profile` (ancaman utama lawan), `allied_composition_profile`, `game_state` (`AHEAD`, `EVEN`, `BEHIND`), dan `strategic_objective` (`BURST_PRIORITY`, `SURVIVABILITY`, `OBJECTIVE_SPEED`, `ANTI_SUSTAIN`, `SIEGE`).
- **Kelengkapan Komponen:** Slot *Core Items (1–3)*, *Situational Branches (Slot 4–6)*, *Emblem & Talent* (3 slot talent), dan *Battle Spell*.
- **Transparansi & Bukti:** `patch_version_id`, `build_source/creator`, **reasoning** (alasan teknis setiap pilihan inti & cabang situasional), **alternatives** per slot, serta `confidence_level` dan `verification_status`.

### 3.6 Gameplay Knowledge (Micro & Macro)
Terstruktur menjadi kurikulum pembelajaran terpisah:
- **Micro Learning:**
  1. *Positioning* (jarak aman carry, sudut flank assassin, jarak zoning roamer)
  2. *Mechanics* (eksekusi kit spesifik, *animation cancel*, *buffer skill*)
  3. *Skill Execution* (timing, urutan prioritas, manajemen cooldown)
  4. *Combos* (eksekusi rantai skill di bawah tekanan)
  5. *Aim* (prediksi arah gerak lawan untuk *skillshot*)
  6. *Movement* (efisiensi gerak antar serangan/*kiting*, *orb-walking*)
  7. *Spacing* (menjaga jarak efektif di batas jangkauan lawan)
  8. *Trading* (memenangkan pertukaran HP/resource berdasarkan cooldown lawan)
  9. *Laning* (*wave freeze*, *slow push*, *fast clear*, penguasaan *bush*)
  10. *Mechanical Decision-Making* (keputusan mikro sepersekian detik saat duel/skirmish)
- **Macro Learning:**
  1. *Rotation* (timing rotasi antar lane dan sinkronisasi dengan *wave*)
  2. *Wave Management* (menciptakan tekanan lane sebelum objektif muncul)
  3. *Map Awareness* (membaca posisi lawan yang hilang dari minimap)
  4. *Objective Control* (setup area dan pertukaran Turtle/Lord/Turret)
  5. *Jungle Pathing* (rute farm level 4, prioritas buff, respons *invade*)
  6. *Tempo* (mempertahankan atau memperlambat ritme keunggulan tim)
  7. *Resource Allocation* (pembagian gold/XP wave dan jungle kepada core yang tepat)
  8. *Vision and Information* (penguasaan *bush*, pengecekan aman, pembacaan informasi minimap)
  9. *Teamfight* (inisiasi, *flank*, *front-to-back*, *peeling*, *disengage*)
  10. *Target Priority* (siapa yang wajib dikunci vs diabaikan)
  11. *Game Closing* (eksekusi *high-ground siege* bersama Lord tanpa melempar keunggulan)

### 3.7 Ranked Knowledge
Memodelkan perbedaan konteks permainan di luar skema tim pro berdasarkan ukuran party (`SOLO`, `DUO`, `TRIO`, `5-MAN`) melintasi **7 dimensi analisis**:
1. **Communication:** Ketiadaan *voice comms* reliabel di Solo vs komunikasi parsial di Duo/Trio vs komunikasi penuh terstruktur di 5-Man.
2. **Coordination:** Ketergantungan eksekusi pada sinkronisasi banyak pemain (mis. *chain CC*, *cross-map trade*, *level-1 invade*).
3. **Draft:** Fleksibilitas urutan pick, ketersediaan counter pick, dan toleransi terhadap komposisi sub-optimal di Solo Queue.
4. **Decision-Making:** Kebutuhan kemandirian keputusan individu (*Solo*) vs kesepakatan panggilan tembakan (*shotcalling* di 5-Man).
5. **Risk:** Risiko *overcommit* apabila rekan acak tidak mengikuti inisiasi atau *rotate* terlambat.
6. **Strategy:** Pemilihan strategi (*snowball pick-off* vs *scaling teamfight* vs *split pressure*) sesuai keandalan rekan satu tim.
7. **Execution:** Kompleksitas eksekusi yang realistis per mode (mis. strategi *funnel* atau *synchronized 4-man dive* berbahaya untuk Solo tanpa ping/komunikasi yang dipahami tim).

### 3.8 Competitive Intelligence
Menghubungkan data historis turnamen nyata dengan pembelajaran taktis melalui 5 lapisan terpisah *(dirinci penuh di `COMPETITIVE_MATCH_ANALYSIS_FRAMEWORK.md`)*:
- **Struktur Turnamen & Pertandingan:** `Competition (Series)` -> `Tournament Event (Season)` -> `Stage` -> `Match` -> `Game` -> `Team`, `Player`, `Roster`, `Draft (Pick/Ban)`, `Match Statistics`, dan `VOD`.
- **Lapisan Analitis:** `Observation` (fakta teramati dalam game) -> `Strategic Interpretation` (prinsip dan alasan keberhasilan) -> `Meta Trend` (pola agregat lintas banyak game/turnamen) -> `Competitive Insight` -> `Pro-to-Ranked Adaptation`.

### 3.9 Patch Intelligence
- Mengikat seluruh pengetahuan dinamis pada `Patch` dan `Version` (`ORIGINAL_SERVER`, `ADVANCE_SERVER`, `EXPERIMENTAL`), memisahkan identitas stabil (`heroes`, `items`) dari profil berversi (`hero_version_profiles`, `item_version_profiles`).
- Menyimpan catatan resmi *Patch Notes*, rincian `Change` per entitas/atribut, status verifikasi perubahan, dan memelihara *Historical Knowledge* sehingga studi meta turnamen di patch sebelumnya tetap akurat secara historis.

### 3.10 Knowledge Quality & Provenance
- Mengelola rantai keterlacakan: `Source` -> `Evidence` -> `Knowledge Claim` (dengan kolom governance tersemat di entitas utama serta `entity_evidences` untuk sitasi multi-sumber dan aturan *Provenance Inheritance* pada `SOURCE_VERIFICATION_POLICY.md`).
- Menyimpan `Claim Classification`, `Verification Status`, `Confidence Level`, `Verified By`, `Verified At`, `Historical Validity` (`valid_from_patch_id`, `valid_until_patch_id`), serta penanganan konflik melalui status `CONFLICTING` dan `entity_evidences` (`ADR-005`).

### 3.11 Search & Terminology Discovery
Mendukung penemuan pengetahuan lintas domain melalui indeks PostgreSQL (`tsvector` + `GIN` + `pg_trgm`, `ADR-004`) untuk cakupan:
- **Hero Names & Hero Aliases** (nama resmi, singkatan, julukan)
- **Item Names** (nama resmi, singkatan populer, nama pasif unik)
- **Gameplay Terminology (Indonesia & Inggris)** serta **Community Terminology** (istilah teknis seperti *freeze lane*, *zoning*, *peel*, *anti-heal*, *split push*)
- **Common Typos** (pencocokan trigram `pg_trgm`)
- **Patch Search** (versi patch & perubahan spesifik)
- **Tournament / Team / Player Search** (seri, event turnamen, nama/tag tim, dan IGN pemain)

---

## 4. Definisi Relasi Konseptual Antar-Domain

| Relasi Lintas-Domain | Mekanisme Keterhubungan |
|---|---|
| `Game Fundamentals` -> `Hero / Item / Gameplay` | Hero skills dan item passives merujuk ke tag mekanik baku (`mechanics_glossary`) sehingga pencarian "semua counter anti-heal" atau "semua CC suppress" dapat dilakukan secara terstruktur. |
| `Hero Intelligence` + `Item Intelligence` -> `Build Intelligence` | Setiap entri build memvalidasi kompatibilitas role/lane hero, memisahkan core vs situasional, serta memeriksa aturan *non-stacking* pasif unik item. |
| `Hero Relationships` + `Game Fundamentals` -> `Draft & Matchups` | Matchup dan counter merujuk ke mekanik spesifik dan fase permainan (`Early/Mid/Late`) untuk memberi penjelasan *mengapa* suatu hero unggul. |
| `Competitive Intelligence` -> `Ranked Knowledge` | Observasi pada pertandingan pro tidak pernah langsung masuk ke saran Solo Queue; seluruhnya wajib melewati gerbang `Pro-to-Ranked Adaptation` dan evaluasi 7 dimensi Ranked. |
| `Patch Intelligence` -> `Semua Domain Dinamis` | Perubahan pada satu hero, item, atau mekanik peta memicu penandaan `OUTDATED`/`STALE` pada seluruh skill, build, matchup, counter, dan strategi yang bergantung padanya. |
| `Knowledge Quality` -> `Seluruh Entitas` | Tidak ada klaim pengetahuan yang tampil sebagai `OFFICIAL_FACT` tanpa bukti (`Evidence`) yang terhubung ke `Source` terverifikasi. |
