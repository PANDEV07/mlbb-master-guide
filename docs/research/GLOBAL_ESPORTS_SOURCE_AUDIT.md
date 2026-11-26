# GLOBAL_ESPORTS_SOURCE_AUDIT — Audit Granular Sumber Data Esports MLBB (2026)

**Tanggal Audit:** `2026-11-18`  
**Prinsip Utama:** Tidak ada URL tebakan/placeholder yang dilabeli `VERIFIED`. Liquipedia diklasifikasikan sebagai `Secondary Database`, bukan sumber resmi. Pengumuman turnamen hanya membuktikan eksistensi, format, jadwal, atau kualifikasi pre-event — **bukan** ketersediaan data pasca-pertandingan (*Match Results, Draft, Statistics, VOD*).

---

## 1. Audit Klaim API & URL Tidak Valid / Karangan dari Versi Sebelumnya

### 1.1 Status Klaim API Eksternal
| Entitas yang Diklaim | Dokumentasi Publik Resmi | Endpoint Terverifikasi | Status Verifikasi | Keputusan Arsitektur |
|---|---|---|---|---|
| **Moonton Esports API / MLBB Esports API** | Tidak ditemukan | Tidak ditemukan | **`UNVERIFIED`** | **Dilarang** dijadikan *dependency* proyek. Pengumpulan data resmi mengandalkan portal web liga resmi (mis. `id-mpl.com`, `ph-mpl.com`, `my.mpl.mobilelegends.com`) atau sumber sekunder terverifikasi. |
| API Komersial Pihak Ketiga (*PandaScore*, *KashRock*) / Proyek Komunitas (*Rone Arena*) | Ada dokumentasi eksternal pihak ketiga | Tidak diverifikasi skemanya | `UNVERIFIED_EXTERNAL` | Bukan sumber resmi MOONTON; memerlukan audit kontrak/akurasi jika ingin dievaluasi di masa depan. |

### 1.2 Daftar URL Karangan / Tidak Terverifikasi dari Dokumen & Draft Sebelumnya (DITOLAK)
Seluruh URL berikut terdeteksi pada `GLOBAL_ESPORTS_COVERAGE.md` versi awal (`v1.0`) maupun draft audit model sebelumnya (`v2.0`/`v3.0`) dan **resmi dihapus** dari sumber valid:

| URL / Identifier Lama | Asal Versi | Hasil Pemeriksaan | Status Audit |
|---|---|---|---|
| `https://lpi.id`, `https://phproleague.com`, `https://mml.my`, `https://sgc.sg`, `https://thpl.co.th`, `https://vpl.vn`, `https://mmcc.mm`, `https://cps.kh`, `https://brchamp.mlbb.com`, `https://lal.mlbb.com`, `https://menal.mlbb.com`, `https://trchamp.mlbb.com`, `https://cis.mlbb.com`, `https://nal.mlbb.com`, `https://euchamp.mlbb.com` | `v1.0` | Domain karangan yang tidak sesuai dengan portal resmi MPL/MSL/MCC/MTC/MCT | `NOT_FOUND / FABRICATED` (Dihapus) |
| `https://mlbb.com/mct-sea-2026`, `https://moonton.com/m8`, `https://moonton.com/enc-2026`, `https://moonton.com/mdl-id-2026`, `https://moonton.com/mal-my-2026`, `https://moonton.com/academy` | `v1.0`–`v3.0` | URL tebakan/placeholder yang tidak ditemukan di pencarian `en.moonton.com` | `UNVERIFIED / GUESSED_URL` (Dihapus) |
| `https://esportsworldcup.com/mc-results`, `/draft`, `/stats`, `/mct-ea-shanghai/results`, `/mct-ea-shanghai/draft.pdf`, `/mct-ea-shanghai/stats`, `/mct-ea-ulaanbaatar/...`, `/qualifiers` | `v3.0` | Endpoint tebakan; tidak ditemukan pada hasil pencarian portal EWC maupun pengumuman Moonton | `UNVERIFIED / GUESSED_URL` (Dihapus) |
| Playlist YouTube fiktif: `PLMSC2026`, `PLEAAShanghai2026`, `PLEAAUlaanbaatar2026`, `PLMCTAMER2026`, `PLMDL2026`, `PLACADEMY2026` | `v3.0` | ID playlist karangan; tidak ada playlist YouTube resmi berformat tersebut | `UNVERIFIED / GUESSED_ID` (Dihapus) |
| Slug Liquipedia lama yang tidak akurat: `MPL_Indonesia/Season_17` (tanpa `/MPL/Indonesia/...`), `MCT_EA_Shanghai_2026`, `Open_Qualifiers_2026`, `Academy_2026` | `v2.0`–`v3.0` | Sebagian salah struktur path atau untuk turnamen fiktif | `INVALID_PATH / DEPRECATED` |

---

## 2. Definisi Tipe Sumber & Status Verifikasi

- **Tipe Sumber (`Source Type`):**
  1. `Official Tournament Source`: Situs/artikel resmi turnamen & pengumuman `en.moonton.com/news/...`
  2. `Official Organizer Source`: Portal resmi penyelenggara (*Esports World Cup*, *Phygital International*, *IESF*, *OCA*)
  3. `Official League Source`: Situs resmi liga regional (`id-mpl.com`, `ph-mpl.com`, `my.mpl.mobilelegends.com`, `id-mdl.com`, `mena-mpl.com`, `mplcambodia.com`)
  4. `Official Broadcast Source`: Kanal/video YouTube resmi liga & MLBB Esports
  5. `Secondary Database`: *Liquipedia Mobile Legends Wiki*
  6. `Secondary Media / Analytics`: *Esports Charts*, *PressTheGame*, *GosuGamers*, dll.
- **Status Verifikasi (`Verification Status`):**
  - `VERIFIED`: URL literal dan konten spesifik terkonfirmasi langsung pada hasil riset sesi ini.
  - `VERIFIED_VIA_SEARCH_SUMMARY`: Fakta/artikel pada domain resmi terkonfirmasi lewat pencarian, namun path URL spesifik artikel belum terekam literal atau belum dibuka HTTP langsung.
  - `PARTIAL`: Sumber terverifikasi hanya mencakup sebagian data (misal agregat pick/ban tanpa log urutan draft tiap game, atau baru hasil juara tanpa bracket lengkap).
  - `NOT_YET_AVAILABLE`: Data belum ada karena turnamen belum berlangsung (`UPCOMING` / `ANNOUNCED`).
  - `UNVERIFIED`: URL spesifik/playlist VOD/halaman statistik resmi belum dibuka dan diverifikasi, atau belum ada bukti sumber valid.

---

## 3. Data Source Registry Granular (Per Kompetisi & Per Kategori Data)

> **Catatan Keterlacakan:** Tidak ada pengelompokan lintas kompetisi. Setiap kompetisi memiliki baris tersendiri untuk kategori `Tournament Existence`, `Tournament Format`, `Schedule`, `Qualification`, `Match Results`, `Draft`, `Statistics`, dan `VOD`.

### 3.1 Turnamen Internasional & Multi-Region Utama (`COMP001`, `COMP008`, `COMP039`–`COMP042`)

| Competition ID | Data Category | Source URL | Source Type | Official / Secondary | Verification Status | Evidence Description | Last Verified |
|---|---|---|---|---|---|---|---|
| `COMP001` | Tournament Existence | `https://esportsworldcup.com` | Official Organizer Source | Official | `VERIFIED` | Portal resmi EWC mencantumkan MSC 2026 sebagai cabang resmi di Paris (1 Jul - 1 Agt 2026). | `2026-11-18` |
| `COMP001` | Tournament Format | `https://liquipedia.net/mobilelegends/MLBB_Mid_Season_Cup/2026` | Secondary Database | Secondary | `VERIFIED` | Wild Card (10 tim) + Main Stage (16 tim; total 25 tim) dan prize pool $3,000,000. | `2026-11-18` |
| `COMP001` | Schedule | `https://liquipedia.net/mobilelegends/MLBB_Mid_Season_Cup/2026` | Secondary Database | Secondary | `VERIFIED` | Jadwal 1 Jul - 1 Agt 2026 terkonfirmasi bersama rilis EWC/Moonton. | `2026-11-18` |
| `COMP001` | Qualification | `en.moonton.com` *(domain berita resmi)* | Official Tournament Source | Official | `VERIFIED_VIA_SEARCH_SUMMARY` | Rilis Moonton menjelaskan jalur baru dari India, Thailand, Korsel, Eropa Barat, MPL, MCC, MTC, MCT. | `2026-11-18` |
| `COMP001` | Match Results | `https://esportsworldcup.com` & `en.moonton.com` | Official Organizer & Tournament | Official | `VERIFIED_VIA_SEARCH_SUMMARY` | Hasil Grand Final: Team Spirit 4-3 Yangon Galacticos (Finals MVP: Kidbomba). | `2026-11-18` |
| `COMP001` | Draft | `https://liquipedia.net/mobilelegends/MLBB_Mid_Season_Cup/2026/Statistics` | Secondary Database | Secondary | `PARTIAL` | Memuat statistik pick/ban hero & blue/red side WR; urutan pick/ban per-game belum diekstrak dari halaman match. | `2026-11-18` |
| `COMP001` | Statistics | `https://liquipedia.net/mobilelegends/MLBB_Mid_Season_Cup/2026/Statistics` | Secondary Database | Secondary | `PARTIAL` | Statistik turnamen agregat di Liquipedia; API/stats endpoint resmi EWC/Moonton berstatus `UNVERIFIED`. | `2026-11-18` |
| `COMP001` | VOD | `https://www.youtube.com/@mlbbesportsofficial` *(kanal umum)* | Official Broadcast Source | Official | `UNVERIFIED` | Kanal siaran terkonfirmasi, tetapi URL playlist/video spesifik MSC 2026 belum dibuka langsung. | `2026-11-18` |
| `COMP008` | Tournament Existence | `en.moonton.com` *(rilis resmi M8)* | Official Tournament Source | Official | `VERIFIED_VIA_SEARCH_SUMMARY` | MOONTON resmi mengumumkan M8 lintas benua (Bangkok & Istanbul). | `2026-11-18` |
| `COMP008` | Tournament Format | `en.moonton.com` & Liquipedia *(M8)* | Official & Secondary | Official + Secondary | `VERIFIED_VIA_SEARCH_SUMMARY` | Wild Card 10 tim (3 lolos), Swiss Stage 16 tim (8 lolos), Double-Elimination Knockout 8 tim; prize pool $1M. | `2026-11-18` |
| `COMP008` | Schedule | Rilis M8 & `disway.id` / Liquipedia | Official + Secondary | Official + Secondary | `VERIFIED_VIA_SEARCH_SUMMARY` | Wild Card: 17-20 Des 2026; Swiss: 3-10 Jan 2027; Knockout: 14-19 Jan 2027; Grand Final: 23 Jan 2027. | `2026-11-18` |
| `COMP008` | Qualification | `en.moonton.com` & Liquipedia | Official + Secondary | Official + Secondary | `VERIFIED_VIA_SEARCH_SUMMARY` | Distribusi slot dari MPL ID/PH/MY, MCC, MTC, MPL MENA, MCT SEA/EA/AMER, MSL TH terkonfirmasi. | `2026-11-18` |
| `COMP008` | Match Results / Draft / Statistics / VOD | `—` | `—` | `—` | `NOT_YET_AVAILABLE` | Event belum dimulai (dimulai 17 Desember 2026). | `2026-11-18` |
| `COMP039` | Tournament Existence | `https://esportsworldcup.com` & `en.moonton.com` | Official Organizer & Tournament | Official | `VERIFIED_VIA_SEARCH_SUMMARY` | MWI 2026 resmi digelar di Paris Expo Porte de Versailles (14-18 Jul 2026). | `2026-11-18` |
| `COMP039` | Tournament Format / Schedule / Qualification | Liquipedia *(MWI 2026)* & EWC | Official + Secondary | Official + Secondary | `VERIFIED_VIA_SEARCH_SUMMARY` | 16 tim putri, Group Stage 14-16 Jul, Playoffs 16-18 Jul, Prize Pool $525,000. | `2026-11-18` |
| `COMP039` | Match Results | `https://esportsworldcup.com` & `en.moonton.com` | Official Organizer & Tournament | Official | `VERIFIED_VIA_SEARCH_SUMMARY` | Team Vitality mengalahkan Natus Vincere 4-2 (Finals MVP: Vival); peringkat 3: Geltek Cyber Team. | `2026-11-18` |
| `COMP039` | Draft / Statistics / VOD | `—` | `—` | `—` | `UNVERIFIED` | Halaman `/Statistics` spesifik dan URL playlist VOD spesifik belum dibuka langsung. | `2026-11-18` |
| `COMP040` | Tournament Existence / Format / Schedule / Match Results | `phygitalinternational.com`, `gofuture.games`, Liquipedia | Official Organizer + Secondary | Official + Secondary | `VERIFIED_VIA_SEARCH_SUMMARY` | Games of the Future 2026 (6-9 Agt 2026, Astana, $900k, 16 tim); Juara: Bigetron by Vitality vs ONIC. | `2026-11-18` |
| `COMP040` | Qualification | Phygital International | Official Organizer Source | Official | `VERIFIED_VIA_SEARCH_SUMMARY` | Turnamen undangan klub internasional (non-M-Series). | `2026-11-18` |
| `COMP040` | Draft / Statistics / VOD | `—` | `—` | `—` | `UNVERIFIED` | Data draft, statistik terperinci, dan URL video spesifik belum dibuka langsung. | `2026-11-18` |
| `COMP041` | Tournament Existence / Format / Schedule / Qualification / Match Results | `en.moonton.com` & Liquipedia *(Asian Games 2026)* | Official + Secondary | Official + Secondary | `VERIFIED_VIA_SEARCH_SUMMARY` | 29 Sep - 1 Okt 2026 di Aichi Sky Expo, Jepang; cabang medali resmi tim nasional; Emas: Myanmar 4-0 Indonesia. | `2026-11-18` |
| `COMP041` | Draft / Statistics / VOD | `—` | `—` | `—` | `UNVERIFIED` | Data draft, statistik, dan URL video spesifik belum diverifikasi. | `2026-11-18` |
| `COMP042` | Tournament Existence / Format / Schedule / Qualification | `iesf.org` & Liquipedia | Official Organizer + Secondary | Official + Secondary | `VERIFIED_VIA_SEARCH_SUMMARY` | IESF WEC 2026 dijadwalkan 15-20 Des 2026 di Banten, Indonesia (kategori MLBB Men & Women). | `2026-11-18` |
| `COMP042` | Match Results / Draft / Statistics / VOD | `—` | `—` | `—` | `NOT_YET_AVAILABLE` | Event belum berlangsung per 2026-11-18. | `2026-11-18` |

### 3.2 Sirkuit MLBB Championship Tour (`COMP002`–`COMP007`, `COMP020`)

| Competition ID | Data Category | Source URL | Source Type | Official / Secondary | Verification Status | Evidence Description | Last Verified |
|---|---|---|---|---|---|---|---|
| `COMP002` | Tournament Existence | `https://en.moonton.com/news/362.html` | Official Tournament Source | Official | `VERIFIED` | Pengumuman peluncuran perdana MCT SEA oleh MOONTON untuk Q4 2026. | `2026-11-18` |
| `COMP002` | Tournament Format | `https://en.moonton.com/news/398.html` & Liquipedia | Official + Secondary | Official + Secondary | `VERIFIED` | 12 tim, 4 Grup (A, B, C, D) + Last Chance Qualifier + Knockout Playoffs. | `2026-11-18` |
| `COMP002` | Schedule | `https://en.moonton.com/news/398.html` & Liquipedia | Official + Secondary | Official + Secondary | `VERIFIED` | 9-13 Des 2026 (Group/LCQ: 9-10 Des; Playoffs: 11-13 Des) di ICONSIAM, Bangkok. | `2026-11-18` |
| `COMP002` | Qualification | `https://en.moonton.com/news/398.html` | Official Tournament Source | Official | `VERIFIED` | 12 kontender non-franchise dari 11 pasar SEA; Top 2 -> M8 Main Stage, #3-4 -> M8 Wild Card. | `2026-11-18` |
| `COMP002` | Match Results / Draft / Statistics / VOD | `—` | `—` | `—` | `NOT_YET_AVAILABLE` | Event belum dimulai (dimulai 9 Desember 2026). | `2026-11-18` |
| `COMP003` | Tournament Existence / Format / Schedule / Qualification | `https://en.moonton.com/news/335.html` | Official Tournament Source | Official | `VERIFIED` | Peluncuran Hero ACL × MCT East Asia di Star Ring Center, Shanghai (22-24 Mei 2026); 6 tim (CN, MN, JP, KR), 2 grup. | `2026-11-18` |
| `COMP003` | Match Results | `https://en.moonton.com/news/339.html` | Official Tournament Source | Official | `PARTIAL` | Mengonfirmasi GZG (China) juara MCT EA Shanghai & lolos MSC 2026; rincian skor semua match belum diekstrak. | `2026-11-18` |
| `COMP003` | Draft / Statistics / VOD | `—` | `—` | `—` | `UNVERIFIED` | Belum ada URL statistik/draft atau playlist VOD spesifik Shanghai yang dibuka langsung. | `2026-11-18` |
| `COMP004` | Tournament Existence / Format / Schedule | `https://en.moonton.com/news/386.html` | Official Tournament Source | Official | `VERIFIED` | Pengumuman tuan rumah Mongolia (M Bank Arena, Ulaanbaatar, 29-31 Okt 2026), 6 tim dari CN, MN, JP, KR. | `2026-11-18` |
| `COMP004` | Qualification | `https://en.moonton.com/news/386.html` & `https://en.moonton.com/news/395.html` | Official Tournament Source | Official | `VERIFIED` | Jalur langsung menuju **M8 World Championship** (1 Main Stage: The MongolZ; 2 Wild Card: DFYG & GZG). | `2026-11-18` |
| `COMP004` | Match Results | `https://en.moonton.com/news/395.html` | Official Tournament Source | Official | `PARTIAL` | Grand Final: The MongolZ 5-3 DFYG (menembus Immortality Armour); rincian seluruh match grup belum diekstrak. | `2026-11-18` |
| `COMP004` | Draft / Statistics / VOD | `—` | `—` | `—` | `UNVERIFIED` | Belum ada halaman draft/statistik atau link VOD spesifik yang dibuka langsung. | `2026-11-18` |
| `COMP005` | Tournament Existence / Qualification / Match Results | `https://en.moonton.com/news/399.html` *(pending cek HTTP langsung)* & Liquipedia | Official + Secondary | Official + Secondary | `PARTIAL` | Artikel resmi Moonton (16 Nov 2026) mengonfirmasi DREAMMAX vs LYON 4-1; DREAMMAX ke M8 Main Stage, LYON ke M8 Wild Card. | `2026-11-18` |
| `COMP005` | Tournament Format / Schedule | Liquipedia *(MCT Americas 2026 Split 2)* | Secondary Database | Secondary | `VERIFIED` | Split 2 berlangsung 11 Sep - 14 Nov 2026; format Swiss + Playoffs + Bo7 Finals di São Paulo. | `2026-11-18` |
| `COMP005` | Draft / Statistics / VOD | `—` | `—` | `—` | `UNVERIFIED` | Belum ada tabel draft/statistik atau link VOD spesifik yang dibuka langsung. | `2026-11-18` |
| `COMP006` | Tournament Existence | `en.moonton.com` *(rilis ekspansi 5 wilayah MCT)* | Official Tournament Source | Official | `PARTIAL` | Disebut sebagai bagian struktur 5 wilayah MCT 2026, namun belum ada jadwal/halaman turnamen standalone. | `2026-11-18` |
| `COMP006` | Format / Schedule / Qualification / Match / Draft / Stats / VOD | `—` | `—` | `—` | `NOT_YET_AVAILABLE` | Belum dirilis sebagai event standalone oleh MOONTON; kompetisi aktual EECA berjalan di `COMP029`–`COMP030`. | `2026-11-18` |
| `COMP007` | Tournament Existence | `en.moonton.com` *(rilis ekspansi 5 wilayah MCT)* | Official Tournament Source | Official | `PARTIAL` | Disebut sebagai bagian struktur 5 wilayah MCT 2026, namun belum ada jadwal/halaman turnamen standalone. | `2026-11-18` |
| `COMP007` | Format / Schedule / Qualification / Match / Draft / Stats / VOD | `—` | `—` | `—` | `NOT_YET_AVAILABLE` | Belum dirilis sebagai event standalone oleh MOONTON; kompetisi aktual berjalan di `COMP027`–`COMP028`, `COMP031`–`COMP032`. | `2026-11-18` |
| `COMP020` | Tournament Existence / Format / Schedule / Qualification / Match Results | Liquipedia *(MCT Americas 2026 Split 1)* | Secondary Database | Secondary | `VERIFIED` | Swiss (16 Apr-3 Mei), Playoffs (7-24 Mei), Grand Final (13 Jun 2026) menuju MSC 2026. Sumber resmi Moonton spesifik belum dibuka (`UNVERIFIED`). | `2026-11-18` |
| `COMP020` | Draft / Statistics / VOD | `—` | `—` | `—` | `UNVERIFIED` | Belum ada verifikasi sumber langsung. | `2026-11-18` |

### 3.3 Liga Profesional & Akademi Indonesia, Filipina, Malaysia, Singapura (`COMP009`–`COMP016`, `COMP021`–`COMP024`, `COMP037`–`COMP038`)

| Competition ID | Data Category | Source URL | Source Type | Official / Secondary | Verification Status | Evidence Description | Last Verified |
|---|---|---|---|---|---|---|---|
| `COMP009` | Tournament Existence / Schedule / Match Results | `https://id-mpl.com/schedule` & Liquipedia | Official League + Secondary | Official + Secondary | `VERIFIED` | Regular Season 27 Mar-24 Mei, Playoffs 10-14 Jun 2026 (Bigetron by Vitality 4-1 ONIC). | `2026-11-18` |
| `COMP009` | Tournament Format / Qualification | `https://id-mpl.com` & Liquipedia | Official League + Secondary | Official + Secondary | `VERIFIED` | Format Double RR + Top 6 Playoffs di Jakarta International Velodrome menuju MSC 2026. | `2026-11-18` |
| `COMP009` | Statistics | `https://id-mpl.com/statistics` | Official League Source | Official | `VERIFIED` | Statistik tim (kills, gold, damage, Lord, turret), statistik pemain (KDA, Top 5), & MVP standings. | `2026-11-18` |
| `COMP009` | Draft | `https://liquipedia.net/mobilelegends/MPL/Indonesia/Season_17/Statistics` & `id-mpl.com/statistics` | Secondary & Official | Secondary + Official | `PARTIAL` | Statistik agregat hero pick/ban & win rate terverifikasi; urutan pick/ban per-game belum diverifikasi langsung. | `2026-11-18` |
| `COMP009` | VOD | `https://www.youtube.com/@MPLIndonesia` | Official Broadcast Source | Official | `UNVERIFIED` | Kanal resmi terkonfirmasi, namun URL playlist/video spesifik Season 17 belum dibuka langsung. | `2026-11-18` |
| `COMP010` | Tournament Existence / Schedule / Match Results | `https://id-mpl.com/schedule` & Liquipedia | Official League + Secondary | Official + Secondary | `VERIFIED` | 14 Agt - 8 Nov 2026 (Playoffs 4-8 Nov di XO Hall); Juara: Bigetron by Vitality vs NAVI. | `2026-11-18` |
| `COMP010` | Tournament Format / Qualification | `https://id-mpl.com` & Liquipedia | Official League + Secondary | Official + Secondary | `VERIFIED` | Double RR Bo3 + Hybrid-Elim Playoffs; 2 slot M8 Main Stage (BTR & NAVI). | `2026-11-18` |
| `COMP010` | Statistics | `https://id-mpl.com/statistics` | Official League Source | Official | `VERIFIED` | Statistik tim, pemain, hero, & MVP Season 18 tersedia di portal resmi `id-mpl.com/statistics`. | `2026-11-18` |
| `COMP010` | Draft | `https://liquipedia.net/mobilelegends/MPL/Indonesia/Season_18/Statistics` | Secondary Database | Secondary | `PARTIAL` | Agregat pick, ban, presence %T, dan blue/red side WR; draft log per-game belum dibuka. | `2026-11-18` |
| `COMP010` | VOD | `https://www.youtube.com/@MPLIndonesia/playlists` | Official Broadcast Source | Official | `UNVERIFIED` | Terkonfirmasi ada playlist S18 di tab Playlists, tetapi URL playlist ID spesifik belum diverifikasi langsung. | `2026-11-18` |
| `COMP011` | Tournament Existence / Format / Schedule / Qualification / Match Results | `https://ph-mpl.com/` & Liquipedia | Official League + Secondary | Official + Secondary | `VERIFIED` | 20 Mar - 31 Mei 2026, 8 tim franchise; Juara Team Liquid PH menuju MSC 2026. | `2026-11-18` |
| `COMP011` | Draft / Statistics | `https://liquipedia.net/mobilelegends/MPL_Philippines/Season_17/Statistics` | Secondary Database | Secondary | `PARTIAL` | Statistik hero pick/ban, win rate & kemunculan pemain; halaman statistik spesifik `ph-mpl.com` belum dibuka langsung. | `2026-11-18` |
| `COMP011` | VOD | `https://www.youtube.com/@mplph.official/playlists` | Official Broadcast Source | Official | `UNVERIFIED` | Kanal resmi terkonfirmasi; URL playlist spesifik Season 17 belum dibuka langsung. | `2026-11-18` |
| `COMP012` | Tournament Existence / Format / Schedule / Qualification / Match Results | `https://ph-mpl.com/` & Liquipedia | Official League + Secondary | Official + Secondary | `VERIFIED` | 21 Agt - 25 Okt 2026, 8 tim franchise, jalur kualifikasi 2 slot M8 Main Stage. | `2026-11-18` |
| `COMP012` | Draft / Statistics | `https://liquipedia.net/mobilelegends/MPL_Philippines/Season_18/Statistics` | Secondary Database | Secondary | `PARTIAL` | Agregat blue/red WR, draft presence, & hero stats; detail per-game belum diverifikasi. | `2026-11-18` |
| `COMP012` | VOD | `https://www.youtube.com/@mplph.official/playlists` | Official Broadcast Source | Official | `UNVERIFIED` | URL playlist spesifik Season 18 belum dibuka langsung. | `2026-11-18` |
| `COMP013` | Tournament Existence / Format / Schedule / Qualification / Match Results / Statistics | `https://my.mpl.mobilelegends.com/` & Liquipedia | Official League + Secondary | Official + Secondary | `VERIFIED` | 3 Apr - 7 Jun 2026, 8 tim partner, juara Selangor Red Giants; `my.mpl.mobilelegends.com` memuat jadwal & statistik tim/pemain. | `2026-11-18` |
| `COMP013` | Draft | `https://liquipedia.net/mobilelegends/MPL/Malaysia/Season_17/Statistics` | Secondary Database | Secondary | `PARTIAL` | Agregat hero pick/ban Season 17 tersedia di Liquipedia; draft log per-match belum diverifikasi. | `2026-11-18` |
| `COMP013` | VOD | `https://www.youtube.com/@mpl-malaysia` | Official Broadcast Source | Official | `UNVERIFIED` | Kanal resmi terkonfirmasi; URL playlist spesifik Season 17 belum dibuka langsung. | `2026-11-18` |
| `COMP021` | Tournament Existence / Format / Schedule / Qualification / Match Results / Statistics | `https://my.mpl.mobilelegends.com/` & Liquipedia | Official League + Secondary | Official + Secondary | `VERIFIED` | 14 Agt - 1 Nov 2026 (Playoffs Stadium Juara); portal resmi menyediakan jadwal, klasemen, & statistik tim/pemain. | `2026-11-18` |
| `COMP021` | Draft | `https://liquipedia.net/mobilelegends/MPL/Malaysia/Season_18/Statistics` | Secondary Database | Secondary | `PARTIAL` | Agregat hero stats Season 18 tersedia di Liquipedia. | `2026-11-18` |
| `COMP021` | VOD | `https://www.youtube.com/@mpl-malaysia` | Official Broadcast Source | Official | `UNVERIFIED` | URL playlist spesifik Season 18 belum dibuka langsung. | `2026-11-18` |
| `COMP014` | Tournament Existence / Format / Schedule / Qualification / Match Results | `https://www.youtube.com/@MPLSingapore` & Liquipedia | Official Broadcast + Secondary | Official + Secondary | `VERIFIED` | 9 Mei - 7 Jun 2026 di D'Marquee @ Downtown East. | `2026-11-18` |
| `COMP014` | Draft / Statistics | `https://liquipedia.net/mobilelegends/MPL_Singapore/Season_11/Statistics` | Secondary Database | Secondary | `PARTIAL` | Statistik hero/draft agregat di Liquipedia; situs resmi khusus liga tidak ditemukan (`sg-mpl.com` tidak terkonfirmasi). | `2026-11-18` |
| `COMP014` | VOD | `https://www.youtube.com/@MPLSingapore` | Official Broadcast Source | Official | `UNVERIFIED` | Kanal resmi terkonfirmasi; URL playlist spesifik Season 11 belum dibuka langsung. | `2026-11-18` |
| `COMP022` | Tournament Existence / Format / Schedule / Qualification / Match Results | `https://www.youtube.com/@MPLSingapore` & Liquipedia | Official Broadcast + Secondary | Official + Secondary | `VERIFIED` | 17 - 25 Okt 2026 di GR.iD Singapore. | `2026-11-18` |
| `COMP022` | Draft / Statistics | `https://liquipedia.net/mobilelegends/MPL_Singapore/Season_12/Statistics` | Secondary Database | Secondary | `PARTIAL` | Statistik hero/draft agregat di Liquipedia. | `2026-11-18` |
| `COMP022` | VOD | `https://www.youtube.com/@MPLSingapore` | Official Broadcast Source | Official | `UNVERIFIED` | URL playlist spesifik Season 12 belum dibuka langsung. | `2026-11-18` |
| `COMP015` | Tournament Existence / Format / Schedule / Match Results | `https://id-mdl.com` & Liquipedia | Official League + Secondary | Official + Secondary | `VERIFIED` | 30 Mar - 31 Mei 2026; Juara: Bigetron Academy. | `2026-11-18` |
| `COMP015` | Draft / Statistics / VOD | `https://www.youtube.com/@mdlindonesia6344` *(kanal VOD)* | Official Broadcast & Secondary | Official + Secondary | `UNVERIFIED` | Halaman statistik spesifik & URL playlist VOD S13 belum dibuka langsung. | `2026-11-18` |
| `COMP023` | Tournament Existence / Format / Schedule / Qualification / Match Results | `https://id-mdl.com` & Liquipedia | Official League + Secondary | Official + Secondary | `VERIFIED` | 10 Agt - 1 Nov 2026; Juara Bigetron Academy lolos ke Grup D MCT SEA 2026. | `2026-11-18` |
| `COMP023` | Draft / Statistics / VOD | `https://www.youtube.com/@mdlindonesia6344` *(kanal VOD)* | Official Broadcast & Secondary | Official + Secondary | `UNVERIFIED` | Halaman statistik spesifik & URL playlist VOD S14 belum dibuka langsung. | `2026-11-18` |
| `COMP016` | Tournament Existence / Format / Schedule / Match Results | Liquipedia *(MAL Malaysia S5)* | Secondary Database | Secondary | `VERIFIED` | 20 Apr - 13 Jun 2026; Juara Pixel Esports. Sumber resmi khusus liga belum terverifikasi (`UNVERIFIED`). | `2026-11-18` |
| `COMP016` | Draft / Statistics / VOD | `—` | `—` | `—` | `UNVERIFIED` | Belum ditemukan tautan resmi khusus atau statistik terperinci. | `2026-11-18` |
| `COMP024` | Tournament Existence / Format / Schedule / Qualification / Match Results | Liquipedia *(MAL Malaysia S6)* | Secondary Database | Secondary | `VERIFIED` | 24 Agt - 25 Okt 2026; Juara SRG Academy (lolos ke Grup D MCT SEA 2026). Sumber resmi khusus belum terverifikasi (`UNVERIFIED`). | `2026-11-18` |
| `COMP024` | Draft / Statistics / VOD | `—` | `—` | `—` | `UNVERIFIED` | Belum diverifikasi. | `2026-11-18` |
| `COMP037` | Tournament Existence / Format / Schedule / Match Results | Liquipedia *(MDL Philippines S7)* | Secondary Database | Secondary | `VERIFIED` | 17 Mar - 24 Mei 2026 (Open Qualifiers 21 Feb - 1 Mar). Sumber resmi spesifik belum terverifikasi (`UNVERIFIED`). | `2026-11-18` |
| `COMP037` | Draft / Statistics / VOD | `—` | `—` | `—` | `UNVERIFIED` | Belum diverifikasi. | `2026-11-18` |
| `COMP038` | Tournament Existence / Format / Schedule / Qualification / Match Results | Liquipedia *(MDL Philippines S8)* | Secondary Database | Secondary | `VERIFIED` | 25 Agt - 30 Okt 2026 (Open Qualifiers 6-9 Agt); adopsi Standard Ban-Pick; wakil Team Falcons Academy ke MCT SEA. | `2026-11-18` |
| `COMP038` | Draft / Statistics / VOD | `—` | `—` | `—` | `UNVERIFIED` | Belum diverifikasi. | `2026-11-18` |

### 3.4 Liga Regional Lainnya: Kamboja, MENA, EECA, Turki, Thailand, Myanmar (`COMP025`–`COMP036`)

| Competition ID | Data Category | Source URL | Source Type | Official / Secondary | Verification Status | Evidence Description | Last Verified |
|---|---|---|---|---|---|---|---|
| `COMP025` | Existence / Format / Schedule / Qualification / Match Results | `https://mplcambodia.com/` & Liquipedia | Official League + Secondary | Official + Secondary | `VERIFIED` | MPL Cambodia S10: 3 Apr - 17 Mei 2026. | `2026-11-18` |
| `COMP025` | Draft / Statistics | `https://liquipedia.net/mobilelegends/MPL/Cambodia/Season_10/Statistics` | Secondary Database | Secondary | `PARTIAL` | Statistik hero picks, bans, win rate, dan side-selection tersedia di Liquipedia. | `2026-11-18` |
| `COMP025` | VOD | `https://www.youtube.com/@MPLCambodia_Official` | Official Broadcast Source | Official | `UNVERIFIED` | Kanal resmi terkonfirmasi; URL playlist spesifik S10 belum dibuka langsung. | `2026-11-18` |
| `COMP026` | Existence / Format / Schedule / Qualification / Match Results | `https://mplcambodia.com/` & Liquipedia | Official League + Secondary | Official + Secondary | `VERIFIED` | MPL Cambodia S11: 18 Sep - 15 Nov 2026. | `2026-11-18` |
| `COMP026` | Draft / Statistics | `https://liquipedia.net/mobilelegends/MPL/Cambodia/Season_11/Statistics` | Secondary Database | Secondary | `PARTIAL` | Statistik hero/side agregat tersedia di Liquipedia. | `2026-11-18` |
| `COMP026` | VOD | `https://www.youtube.com/@MPLCambodia_Official` | Official Broadcast Source | Official | `UNVERIFIED` | URL playlist spesifik S11 belum dibuka langsung. | `2026-11-18` |
| `COMP027` | Existence / Format / Schedule / Qualification / Match Results | `https://mena-mpl.com/` & `https://liquipedia.net/mobilelegends/MPL/MENA/Season_9` | Official League + Secondary | Official + Secondary | `VERIFIED` | 10 Apr - 22 Mei 2026 di Cairo, Egypt; Juara: Geekay Esports. | `2026-11-18` |
| `COMP027` | Draft / Statistics | `https://liquipedia.net/mobilelegends/MPL/MENA/Season_9/Statistics` | Secondary Database | Secondary | `PARTIAL` | Halaman statistik turnamen tersedia di Liquipedia. | `2026-11-18` |
| `COMP027` | VOD | `https://www.youtube.com/@mlbbesportsofficial` *(kanal umum)* | Official Broadcast Source | Official | `UNVERIFIED` | URL playlist spesifik MPL MENA S9 belum dibuka langsung. | `2026-11-18` |
| `COMP028` | Existence / Format / Schedule / Qualification / Match Results | `https://mena-mpl.com/` & `https://liquipedia.net/mobilelegends/MPL/MENA/Season_10` | Official League + Secondary | Official + Secondary | `VERIFIED` | 11 Sep - 23 Okt 2026 di Cairo; Juara: Team Falcons (M8 Main Stage), Titan Esports Club AR (M8 Wild Card). | `2026-11-18` |
| `COMP028` | Draft / Statistics | `https://liquipedia.net/mobilelegends/MPL/MENA/Season_10/Statistics` | Secondary Database | Secondary | `PARTIAL` | Halaman statistik turnamen tersedia di Liquipedia. | `2026-11-18` |
| `COMP028` | VOD | `https://www.youtube.com/@mlbbesportsofficial` *(kanal umum)* | Official Broadcast Source | Official | `UNVERIFIED` | URL playlist spesifik MPL MENA S10 belum dibuka langsung. | `2026-11-18` |
| `COMP029` | Existence / Format / Schedule / Qualification / Match Results | `https://www.youtube.com/@mlbbcis` & Liquipedia | Official Broadcast + Secondary | Official + Secondary | `VERIFIED` | MCC S7 (10 Apr - 7 Jun 2026); 8 tim EECA; Juara: Team Spirit, Runner-up: Verso Time. | `2026-11-18` |
| `COMP029` | Draft / Statistics | `https://liquipedia.net/mobilelegends/MLBB_Continental_Championships/Season_7/Statistics` & `/Playoffs/Statistics` | Secondary Database | Secondary | `PARTIAL` | Statistik overall & playoffs hero tersedia di Liquipedia. | `2026-11-18` |
| `COMP029` | VOD | `https://www.youtube.com/@mlbbcis` | Official Broadcast Source | Official | `UNVERIFIED` | Kanal resmi terkonfirmasi; URL playlist spesifik S7 belum dibuka langsung. | `2026-11-18` |
| `COMP030` | Existence / Format / Schedule / Qualification / Match Results | `https://www.youtube.com/@mlbbcis` & Liquipedia | Official Broadcast + Secondary | Official + Secondary | `VERIFIED` | MCC S8 (28 Agt - 31 Okt 2026); Juara: Team Spirit (M8 Main), Aurevia Team & Team Yandex (M8 Wild Card). | `2026-11-18` |
| `COMP030` | Draft / Statistics | `https://liquipedia.net/mobilelegends/MLBB_Continental_Championships/Season_8/Statistics` & `/Playoffs/Statistics` | Secondary Database | Secondary | `PARTIAL` | Statistik overall & playoffs tersedia di Liquipedia. | `2026-11-18` |
| `COMP030` | VOD | `https://www.youtube.com/@mlbbcis` | Official Broadcast Source | Official | `UNVERIFIED` | URL playlist spesifik S8 belum dibuka langsung. | `2026-11-18` |
| `COMP031` | Existence / Format / Schedule / Qualification / Match Results | `https://www.youtube.com/@mobilelegendstr` & Liquipedia | Official Broadcast + Secondary | Official + Secondary | `VERIFIED` | MTC Türkiye S7 (11 Apr - 7 Jun 2026); Juara: Aurora Gaming, Runner-up: FUT Esports. | `2026-11-18` |
| `COMP031` | Draft / Statistics | `https://liquipedia.net/mobilelegends/MTC_Turkiye_Championship/Season_7/Statistics` | Secondary Database | Secondary | `PARTIAL` | Statistik agregat tersedia di Liquipedia. | `2026-11-18` |
| `COMP031` | VOD | `https://www.youtube.com/@mlbbesportsofficial` | Official Broadcast Source | Official | `UNVERIFIED` | URL playlist spesifik MTC S7 belum dibuka langsung. | `2026-11-18` |
| `COMP032` | Existence / Format / Schedule / Qualification / Match Results | `https://www.youtube.com/@mobilelegendstr` & Liquipedia | Official Broadcast + Secondary | Official + Secondary | `VERIFIED` | MTC Türkiye S8 (12 Sep - 7 Nov 2026); Juara: Aurora Gaming (M8 Main), Runner-up: FUT Esports (M8 Wild Card). | `2026-11-18` |
| `COMP032` | Draft / Statistics | `https://liquipedia.net/mobilelegends/MTC_Turkiye_Championship/Season_8/Statistics` | Secondary Database | Secondary | `PARTIAL` | Statistik agregat tersedia di Liquipedia. | `2026-11-18` |
| `COMP032` | VOD | `https://www.youtube.com/@mlbbesportsofficial` | Official Broadcast Source | Official | `UNVERIFIED` | URL playlist spesifik MTC S8 belum dibuka langsung. | `2026-11-18` |
| `COMP033` | Existence / Format / Schedule / Qualification / Match Results | `https://www.youtube.com/@mslthofficial` & Liquipedia | Official Broadcast + Secondary | Official + Secondary | `VERIFIED` | MSL Thailand S1 (18 Apr - 24 Mei 2026), 10 tim; Juara: King of Gamers Club. | `2026-11-18` |
| `COMP033` | Draft / Statistics / VOD | `https://www.youtube.com/@mslthofficial` *(kanal VOD)* | Official Broadcast Source | Official | `UNVERIFIED` | Halaman statistik detail & link playlist spesifik S1 belum dibuka langsung. | `2026-11-18` |
| `COMP034` | Existence / Format / Schedule / Qualification / Match Results | `https://www.youtube.com/@mslthofficial` & Liquipedia | Official Broadcast + Secondary | Official + Secondary | `VERIFIED` | MSL Thailand S2 (11 Sep - 18 Okt 2026); Juara: Leon Esports TH (M8 Wild Card). | `2026-11-18` |
| `COMP034` | Draft / Statistics / VOD | `https://www.youtube.com/@mslthofficial` *(kanal VOD)* | Official Broadcast Source | Official | `UNVERIFIED` | Halaman statistik detail & link playlist spesifik S2 belum dibuka langsung. | `2026-11-18` |
| `COMP035` | Existence / Format / Schedule / Qualification / Match Results | `https://www.youtube.com/@mslofficialmm` & Liquipedia | Official Broadcast + Secondary | Official + Secondary | `VERIFIED` | MSL Myanmar S3 (20 Mar - 31 Mei 2026); Juara: Yangon Galacticos. | `2026-11-18` |
| `COMP035` | Draft / Statistics / VOD | `https://www.youtube.com/@mslofficialmm` *(kanal VOD)* | Official Broadcast Source | Official | `UNVERIFIED` | Halaman statistik detail & link playlist spesifik S3 belum dibuka langsung. | `2026-11-18` |
| `COMP036` | Existence / Format / Schedule / Qualification / Match Results | `https://www.youtube.com/@mslofficialmm` & Liquipedia | Official Broadcast + Secondary | Official + Secondary | `VERIFIED` | MSL Myanmar S4 (28 Agt - 25 Okt 2026); Juara: Falcon Esports. | `2026-11-18` |
| `COMP036` | Draft / Statistics / VOD | `https://www.youtube.com/@mslofficialmm` *(kanal VOD)* | Official Broadcast Source | Official | `UNVERIFIED` | Halaman statistik detail & link playlist spesifik S4 belum dibuka langsung. | `2026-11-18` |
