# SOURCE_VERIFICATION_POLICY — Kebijakan Hirarki Sumber & Verifikasi Pengetahuan

**Tanggal:** `2026-11-18`  
**Versi:** `1.0 (Phase 1.1 Recovery — Menunggu Review)`  
**Berlaku Untuk:** Seluruh domain riset & data produksi (Game Fundamentals, Hero, Item, Build, Matchup/Counter, Gameplay/Academy, Competitive Esports, dan Patch Intelligence).

---

## 1. Hirarki Sumber (*Source Hierarchy*)

Setiap sumber informasi di dalam **MLBB Master Guide** wajib diklasifikasikan ke dalam salah satu dari tiga kategori utama berikut:

### 1.1 Primary Sources (`TIER_1_OFFICIAL`)
Sumber otoritatif langsung dari pemilik game, penyelenggara turnamen resmi, atau rekaman pertandingan asli:
1. **Official MLBB:** Klien game *Original Server* resmi (catatan angka stat in-game, deskripsi skill, deskripsi item, *Patch Notes* di dalam game) dan portal/kanal resmi *Mobile Legends: Bang Bang*.
2. **Official MOONTON:** Rilis berita resmi di `en.moonton.com/news/...`, situs resmi ekosistem (`mobilelegends.com`), dan pengumuman resmi pengembang (*dev stream* / rilis roadmap resmi).
3. **Official Tournament Organizer:** Situs dan portal penyelenggara resmi (*Esports World Cup* `esportsworldcup.com`, *Phygital International* `phygitalinternational.com` / `gofuture.games`, *IESF* `iesf.org`, *OCA*, serta situs resmi liga seperti `id-mpl.com`, `ph-mpl.com`, `my.mpl.mobilelegends.com`, `id-mdl.com`, `mena-mpl.com`, `mplcambodia.com`).
4. **Official Match Broadcast:** Siaran langsung resmi turnamen dari kanal liga/MOONTON (`@mlbbesportsofficial`, `@MPLIndonesia`, `@mplph.official`, `@mpl-malaysia`, `@MPLSingapore`, `@MPLCambodia_Official`, `@mlbbcis`, `@mobilelegendstr`, `@mslthofficial`, `@mslofficialmm`, `@mdlindonesia6344`).
5. **Official Tournament VOD:** URL video atau playlist spesifik dari siaran resmi yang dapat dibuka dan diverifikasi langsung hingga level pertandingan/game. *(Tautan kanal beranda tanpa URL video/playlist spesifik **tidak cukup** untuk memverifikasi VOD.)*

**Aturan Penggunaan Primary Sources:**
- Satu-satunya kategori sumber yang dapat menghasilkan status klaim `OFFICIAL_FACT` (selama URL kanonik/rekaman terverifikasi langsung).
- Sumber resmi **Advance Server** atau **Experimental** tetap merupakan sumber primer untuk lingkungan tersebut, tetapi **dilarang** dicampur atau dilabeli sebagai fakta `ORIGINAL_SERVER`.

### 1.2 Secondary Sources (`TIER_2_SECONDARY` & `TIER_3_ANALYTICAL`)
Sumber terkurasi atau analitis di luar penerbit resmi:
1. **Established Esports Databases (`TIER_2_SECONDARY`):** Misalnya *Liquipedia Mobile Legends Wiki*. Diakui sebagai referensi sekunder bereputasi tinggi untuk struktur turnamen, bracket, skor, dan statistik agregat (`/Statistics`), namun **tidak pernah** disamakan sebagai *Official Source* (`GLOBAL_ESPORTS_SOURCE_AUDIT.md`).
2. **Reliable Game Databases (`TIER_2_SECONDARY`):** Basis data wiki/statistik pihak ketiga yang memiliki rekam jejak verifikasi baik; hanya digunakan sebagai pelengkap atau petunjuk riset, dan angka kritis (base stats, scaling skill, stat item) wajib dikonfirmasi ulang terhadap klien resmi *Original Server* sebelum berstatus `VERIFIED`.
3. **Reputable Esports Journalism (`TIER_2_SECONDARY`):** Media berita esports kredibel untuk konfirmasi tanggal, lokasi, atau pernyataan resmi penyelenggara bila rilis asli tidak lengkap.
4. **Professional Analysis (`TIER_3_ANALYTICAL`):** Analisis dari pelatih, analis tim pro, atau mantan pemain profesional. **Aturan Penggunaan:** Tidak boleh dilabeli sebagai `OFFICIAL_FACT`; wajib diklasifikasikan sebagai `STRATEGIC_INTERPRETATION` atau `RESEARCH_BASED_ANALYSIS` disertai konteks bukti pertandingan/patch.

### 1.3 Community Sources (`TIER_4_COMMUNITY`)
Sumber berbasis opini pemain, diskusi terbuka, atau eksperimen tidak terstandar:
1. **Community Discussion & Social Media:** Forum (*Discord*, grup komunitas, komentar media sosial, X/Twitter non-resmi).
2. **Reddit:** Diskusi taktik, laporan bug, atau ringkasan komunitas (seperti yang ditemukan pada sitasi sementara `CURRENT_GAME_RESEARCH.md`).
3. **Player-Generated Content & Unofficial Analysis:** Video YouTube kreator konten, blog agregator game (mis. *mlbbhub*, *timesaver*, *boostroyal*), tier list populer, dan build komunitas.

**Aturan Penggunaan Community Sources:**
- **Dilarang keras** digunakan sebagai bukti tunggal untuk angka statistik hero, scaling skill, stat item, hasil turnamen, jadwal resmi, atau API claims.
- Hanya boleh dicatat sebagai `COMMUNITY_THEORY` (atau petunjuk awal yang berstatus `UNVERIFIED` sampai dikonfirmasi oleh *Primary Source* atau pengujian terukur).
- Bocoran (*leaks*) atau rumor komunitas wajib dipisahkan tegas dan tidak pernah disajikan sebagai fakta *Original Server*.

---

## 2. Taksonomi Standar Klasifikasi & Status Verifikasi

Untuk menyatukan perbedaan antar-dokumen (`AGENTS.md`, `SYSTEM_ARCHITECTURE.md`, `GLOBAL_ESPORTS_*.md`, dan `src/types/knowledge.ts`), seluruh platform mengacu pada taksonomi kanonik berikut:

### 2.1 Klasifikasi Sifat Klaim (`claim_classification`)
1. `OFFICIAL_FACT` *(padanan `VERIFIED FACT` di `AGENTS.md`)* — Fakta terverifikasi langsung dari sumber primer resmi atau data pertandingan nyata.
2. `SECONDARY_SOURCE` — Fakta historis/statistik yang baru didukung oleh database sekunder terpercaya (mis. Liquipedia) dan belum dikonfirmasi sumber primer resmi.
3. `RESEARCH_BASED_ANALYSIS` — Kesimpulan terukur dari agregasi sampel data terverifikasi dan metodologi yang jelas.
4. `STRATEGIC_INTERPRETATION` — Pembacaan taktis/strategis terhadap perilaku gameplay atau pertandingan pro.
5. `COMMUNITY_THEORY` — Hipotesis, opini kreator, atau eksperimen komunitas yang belum teruji menyeluruh.
6. `UNKNOWN` — Klaim atau angka belum dapat dipastikan kebenarannya.

### 2.2 Status Verifikasi Data (`verification_status`)
1. `VERIFIED` — Terkonfirmasi langsung dari URL/sumber kanonik yang valid pada patch/konteks yang relevan.
2. `PARTIALLY_VERIFIED` *(padanan `PARTIAL`)* — Sebagian aspek terverifikasi atau baru terkonfirmasi lewat ringkasan pencarian (*search summary*), sementara aspek/halaman literal penuh belum dibuka langsung.
3. `UNVERIFIED` — Klaim sudah tercatat dari temuan awal atau sumber sekunder/komunitas, tetapi belum diverifikasi langsung terhadap sumber resmi yang sah.
4. `OUTDATED` *(padanan `STALE` pada UI/sistem)* — Pernah terverifikasi pada patch lama, tetapi terdampak perubahan patch baru dan belum diaudit ulang.
5. `CONFLICTING` — Terdapat dua atau lebih sumber bereputasi yang memberikan angka/fakta saling bertentangan (mis. patch note vs hasil uji in-game).
6. `UNKNOWN` — Sudah dicari/diperiksa pada sumber terkait, tetapi kepastian nilainya masih belum diketahui atau ambigu.
7. `NOT_RESEARCHED` — Belum pernah diteliti atau diaudit sama sekali (dipisahkan dari `NOT_FOUND`).
8. `NOT_YET_AVAILABLE` — Data memang belum ada karena turnamen atau patch belum berlangsung (`UPCOMING` / `ANNOUNCED`).
9. `NOT_FOUND` — Hanya digunakan jika setelah penelusuran memadai pada sumber resmi terbukti entitas/informasi tersebut memang tidak ada (bukan untuk menutupi riset yang belum selesai).

---

## 3. Aturan Operasional Audit Sumber

1. **Source Reliability:** Keandalan sumber dinilai dari hierarki tier dan riwayat akurasi. URL yang terlihat meyakinkan (mis. domain mirip situs resmi seperti `moonton.com/m8` atau `lpi.id`) **dilarang** dianggap valid sebelum dibuka/dikonfirmasi eksistensi serta isinya.
2. **Source Conflicts (`CONFLICTING`):**
   - Jika sumber Tier 1 bertentangan dengan Tier 2/4 -> Tier 1 menang, namun catatan konflik dapat didokumentasikan jika ada indikasi *bug* di klien live.
   - Jika dua sumber dalam Tier yang sama bertentangan (mis. *Patch Notes* resmi menulis angka X, namun uji in-game/VOD resmi menunjukkan Y) -> tandai status `CONFLICTING`, buat dua baris bukti pada `entity_evidences` (`stance = 'SUPPORTING'` dan `stance = 'CONFLICTING'` disertai `conflict_notes`), dan tahan dari status `OFFICIAL_FACT` hingga terkonfirmasi. *(Tabel terpisah `claim_conflicts` ditunda sesuai `ADR-005`.)*
3. **Verification & Evidence:** Setiap record terverifikasi wajib menyimpan `source_id`, `source_url`, `evidence_excerpt` (kutipan ringkas fakta yang dibuktikan), `verified_by`, dan `verified_at` (format ISO `YYYY-MM-DD`).
4. **Confidence Calibration:**
   - `HIGH`: Didukung langsung oleh minimal 1 `TIER_1_OFFICIAL` yang telah dibuka/diverifikasi literal, tanpa konflik.
   - `MEDIUM`: Didukung oleh `TIER_2_SECONDARY` bereputasi atau *search summary* domain resmi yang belum dibuka HTTP literal penuh.
   - `LOW`: Hanya didukung oleh `TIER_3`/`TIER_4`, sampel sangat kecil, atau memiliki catatan keterbatasan.
5. **Citation & Redirect / Temporary URLs:**
   - Dilarang menjadikan URL redirect sementara (seperti `vertexaisearch.cloud.google.com/grounding-api-redirect/...`) sebagai sumber `VERIFIED`.
   - Dokumen yang hanya memiliki URL redirect sementara wajib ditandai `UNVERIFIED` hingga URL kanonik asli dibuka, diperiksa, dan dicatat.
   - Apabila satu URL redirect dipakai ganda untuk dua klaim berbeda (seperti temuan pada `CURRENT_GAME_RESEARCH.md` [7] & [8]), sitasi tersebut wajib ditandai invalid/duplikat untuk audit ulang.
6. **Source Availability & Broken URLs:**
   - Jika suatu URL rujukan mengalami `404` / *broken link* / domain mati pada pemeriksaan berkala, status bukti diturunkan dari `VERIFIED` menjadi `UNVERIFIED` (atau `OUTDATED` jika arsip masih ada tetapi perlu sumber pengganti), dan **dilarang** mengganti URL mati dengan URL hasil tebakan.
7. **Unverified Claims:** Klaim tanpa bukti valid tidak boleh ditampilkan sebagai fakta di aplikasi produksi; pada tahap riset, klaim tersebut wajib ditandai eksplisit sebagai `UNVERIFIED` atau `RESEARCH GAP`.

---

## 4. Aturan Provenance Inheritance (`ADR-005` — Foundation Freeze)

Simplifikasi provenance 2-lapis **tidak** menggunakan inheritance secara universal. Status `VERIFIED` pada entitas induk **tidak otomatis** membuat seluruh entitas anak berstatus `VERIFIED`. Aturan eksplisit per relasi:

| Parent Entity | Child Entity | Inheritance Allowed | Rule |
|---|---|---|---|
| `item_version_profiles` | `item_effects` & `item_components` | `YES` *(Structural)* | Mewarisi `verification_status`, `confidence_level`, dan bukti apabila berasal dari deskripsi/resep item in-game yang sama. |
| `builds` | `build_items` | `YES` *(Structural)* | Mewarisi sumber, patch, dan status verifikasi dari record `builds` induknya. |
| `match_games` | `draft_actions` & `game_player_performances` | `CONDITIONAL` | Evidence dari `match_games` dapat menjadi parent evidence **hanya jika** sumbernya membuktikan draft/boxscore game tersebut; dilarang diisi dari tabel agregat `tournament_hero_stats`. |
| `heroes` | `hero_skills` | `NO` | Terverifikasinya identitas hero tidak menjamin angka scaling skill; tiap `hero_skills` memiliki `verification_status`, `confidence_level`, dan bukti independen. |
| `heroes` / `items` | `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`, `builds` | `NO` | Merupakan *Derived Analysis*. Wajib memiliki alasan mekanis, `patch_version_id`, `confidence_level`, `verification_status`, dan bukti sendiri. |
| `match_games` | `match_observations` | `NO` | Skor/pemenang `match_games` yang `VERIFIED` tidak membuat observasi perilaku otomatis `VERIFIED`; wajib menyertakan timestamp VOD / bukti observasi spesifik. |
| `match_observations` | `competitive_insights` | `NO` | Interpretasi strategis tidak otomatis `VERIFIED` hanya karena observasi/match `VERIFIED`; tetap membutuhkan evidence, reasoning, classification, confidence, dan verification status sendiri. |
| `competitive_insights` | `pro_to_ranked_adaptations` | `NO` | Penilaian kelayakan Solo/Duo/Trio/5-Man dievaluasi terpisah terhadap 7 dimensi Ranked dan batasan koordinasi. |
| `competition_events` | Aspek Event (`Pre-Event`, `Match`, `Draft`, `Stats`, `VOD`) | `NO` *(Per-Aspect)* | Masing-masing aspek dilacak terpisah melalui `entity_evidences` (`aspect_name`) agar `Match = AVAILABLE` tidak diklaim otomatis sebagai `VOD = VERIFIED`. |
