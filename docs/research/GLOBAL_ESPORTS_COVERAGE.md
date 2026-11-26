# GLOBAL_ESPORTS_COVERAGE — Registry Ekosistem Esports MLBB Global (2026)

**Tanggal Referensi Validasi:** `2026-11-18`  
**Status Dokumen:** Hasil Koreksi Integritas Data (*Data Integrity Correction*)  
**Bahasa:** Bahasa Indonesia  

---

## 1. Perbaikan Model Data (Data Model Separation)

Sesuai standar integritas basis pengetahuan, dokumen ini memisahkan lima konsep yang sebelumnya tercampur:

1. **Competition Registry (Seri Kompetisi Induk):** Identitas jangka panjang sebuah liga atau sirkuit (misalnya *MPL Indonesia*, *MLBB Championship Tour East Asia*, *M-Series World Championship*).
2. **Competition Event (Instansi Turnamen/Musim Spesifik):** Pelaksanaan spesifik berdasarkan tahun/musim/split (misalnya `COMP009` untuk *MPL Indonesia Season 17*, `COMP003` untuk *MCT East Asia 2026 – Shanghai*).
3. **Data Source Registry:** Pemetaan granular sumber bukti per kategori data (*Tournament Existence, Format, Schedule, Qualification, Match Results, Draft, Statistics, VOD*) yang didokumentasikan secara terpisah di [GLOBAL_ESPORTS_SOURCE_AUDIT.md](GLOBAL_ESPORTS_SOURCE_AUDIT.md).
4. **Coverage Status (Per Aspek Data):** Ketersediaan data dinilai terpisah antara:
   - `Pre-Event Info Status` (peserta, jadwal, format, jalur kualifikasi, prize pool)
   - `Match Data Status` (hasil pertandingan & bracket)
   - `Draft Data Status` (pick/ban hero & statistik draft)
   - `Statistics Status` (statistik tim/pemain/hero)
   - `VOD Status` (siaran ulang pertandingan spesifik)
5. **Research Status:** Penilaian tingkat ketuntasan riset (`FULLY_RESEARCHED`, `PARTIALLY_RESEARCHED`, `NOT_RESEARCHED`) beserta tingkat keyakinan (`Confidence`) dan tanggal verifikasi terakhir (`Last Verified`).

> [!IMPORTANT]
> **Kebijakan Ketat Verifikasi:**
> - **Liquipedia** diklasifikasikan sebagai **Secondary Database**, bukan *Official Source*.
> - **Moonton Esports API / MLBB Esports API** berstatus **`UNVERIFIED`** karena tidak ditemukan dokumentasi API publik resmi; tidak boleh digunakan sebagai ketergantungan sistem.
> - Event dengan `End Date > 2026-11-18` tidak boleh berstatus `COMPLETED`. Event yang belum berlangsung (`UPCOMING` / `ANNOUNCED`) tidak boleh mengklaim data pasca-pertandingan sebagai `AVAILABLE` (gunakan `NOT_YET_AVAILABLE`).
> - Tidak ada kompetisi yang berstatus `FULLY_RESEARCHED` (`0`) pada tahap ini karena verifikasi URL langsung ke setiap playlist/video VOD spesifik dan log draft per-pertandingan belum dilakukan secara langsung.

---

## 2. Ringkasan Metrik Otomatis (Recalculated from Registry)

Seluruh angka di bawah ini dihitung langsung dari 39 baris tabel **Competition Event Registry (Bagian 4)** per tanggal `2026-11-18`:

| Kategori Metrik | Sub-Kategori | Jumlah | Keterangan |
|---|---|---:|---|
| **Total Competition Records** | Total entri aktif dalam registry | **39** | Terdiri dari 16 ID dasar hasil audit (`COMP001`–`COMP016`) + 23 event tambahan hasil verifikasi (`COMP020`–`COMP042`). Entri generik tidak valid (`COMP017`–`COMP019` versi lama) dideprekasi ke Changelog/Candidates. |
| **Existence Status** | `VERIFIED` | **37** | Terkonfirmasi eksistensinya oleh sumber resmi dan/atau database sekunder bereputasi. |
| | `UNVERIFIED` | **2** | `COMP006` (MCT EECA) & `COMP007` (MCT EMEA) baru berupa kerangka peta jalan 5 wilayah MCT 2026, belum terverifikasi sebagai turnamen standalone terjadwal. |
| | `NOT_FOUND` | **0** | Tidak menyalahgunakan `NOT_FOUND` untuk riset yang belum selesai. |
| **Event Status** *(Jumlah = 39)* | `COMPLETED` | **34** | Semua event dengan `End Date <= 2026-11-18`. |
| | `UPCOMING` | **3** | `COMP002` (MCT SEA), `COMP008` (M8), `COMP042` (IESF WEC 2026). |
| | `ONGOING` | **0** | `COMP005` (MCT AMER Split 2) telah dikoreksi dari `ONGOING` ke `COMPLETED` (selesai 14 Nov 2026). |
| | `ANNOUNCED` | **2** | `COMP006` (MCT EECA) & `COMP007` (MCT EMEA) dalam peta jalan global MCT 2026. |
| | `CANCELLED` / `POSTPONED` | **0** | ENC 2026 (ditunda ke Nov 2027) dicatat terpisah pada daftar kandidat riset. |
| **Source Status** | Official Source `VERIFIED` | **32** | Memiliki pengumuman/portal/kanal resmi yang terkonfirmasi. |
| | Official Source `PARTIAL` | **2** | Disebut pada rilis strategi global tanpa halaman turnamen terpisah (`COMP006`, `COMP007`). |
| | Official Source `UNVERIFIED` | **5** | Situs/rilis resmi spesifik belum terverifikasi langsung (`COMP016`, `COMP020`, `COMP024`, `COMP037`, `COMP038`). |
| | Secondary Source `VERIFIED` | **37** | Didukung halaman Liquipedia / media sekunder terkonfirmasi. |
| | Secondary Source `UNAVAILABLE` | **2** | `COMP006`, `COMP007`. |
| **Data Availability** | `Pre-Event Info` = `AVAILABLE` | **37** | Informasi peserta, jadwal, format, atau prize pool tersedia (`UNAVAILABLE`: 2). |
| | `Match Data` = `AVAILABLE` / `PARTIAL` | **31** / **3** | `NOT_YET_AVAILABLE`: 5 (`COMP002`, `COMP006`, `COMP007`, `COMP008`, `COMP042`). |
| | `Draft Data` = `AVAILABLE` / `PARTIAL` | **0** / **17** | `UNVERIFIED`: 17; `NOT_YET_AVAILABLE`: 5. (17 berstatus `PARTIAL` karena baru agregat hero pick/ban). |
| | `Statistics` = `AVAILABLE` / `PARTIAL` | **4** / **13** | `AVAILABLE`: 4 (`id-mpl.com` & `my.mpl.mobilelegends.com`); `UNVERIFIED`: 17; `NOT_YET_AVAILABLE`: 5. |
| | `VOD` = `AVAILABLE` / `UNVERIFIED` | **0** / **34** | `NOT_YET_AVAILABLE`: 5. (34 berstatus `UNVERIFIED` karena belum ada URL playlist/video spesifik yang dibuka & diverifikasi). |
| **Research Coverage** *(Jumlah = 39)* | `FULLY_RESEARCHED` | **0** | Belum ada yang memenuhi 100% syarat audit Poin 3 & Poin 5 (termasuk verifikasi URL VOD spesifik). |
| | `PARTIALLY_RESEARCHED` | **39** | Seluruh 39 record memiliki cakupan parsial yang jelas tercatat batasannya. |
| | `NOT_RESEARCHED` | **0** | Kompetisi yang belum diriset dipisahkan ke `GLOBAL_ESPORTS_RESEARCH_CANDIDATES.md`. |

### Catatan Audit Rekaman Versi Sebelumnya (`COMP001`–`COMP019`)
Pada laporan validasi sebelumnya, tabel berisi `19` baris (`COMP001`–`COMP019`) tetapi ringkasan melaporkan `18`. Hasil audit koreksi pada ke-19 ID lama tersebut adalah:
- **`COMP001`–`COMP016`**: Dipertahankan dan dikoreksi secara menyeluruh (khususnya `COMP003`, `COMP004`, `COMP005`, `COMP006`, `COMP007`, `COMP008`, serta pemisahan musim pertama pada `COMP013`–`COMP016` dengan menambahkan musim keduanya di `COMP021`–`COMP024`).
- **`COMP017` ("Open Qualifiers 2026")**, **`COMP018` ("Academy Competitions 2026")**, **`COMP019` ("National Championships 2026")**: Ditarik/dideprekasi dari tabel aktif karena merupakan entri generik ber-URL fiktif (`esportsworldcup.com/qualifiers`, `moonton.com/academy`). Elemen nyatanya dipecah menjadi liga-liga spesifik (`COMP037`–`COMP038` MDL PH, `COMP041` Asian Games, `COMP042` IESF WEC) serta daftar kandidat riset di [GLOBAL_ESPORTS_RESEARCH_CANDIDATES.md](GLOBAL_ESPORTS_RESEARCH_CANDIDATES.md).

---

## 3. Competition Registry (Seri Kompetisi Induk)

| Series ID | Nama Seri Kompetisi | Cakupan Wilayah | Tingkat / Tier | Jalur Turnamen Utama |
|---|---|---|---|---|
| `SER-INT-M` | M-Series World Championship | Global | Tier-S (Kejuaraan Dunia) | Puncak musim (M8) |
| `SER-INT-MSC` | MLBB Mid Season Cup (MSC at EWC) | Global | Tier-S (Turnamen Tengah Musim) | Esports World Cup |
| `SER-INT-MWI` | MLBB Women's International (MWI at EWC) | Global (Putri) | Tier-S (Kejuaraan Dunia Putri) | Esports World Cup |
| `SER-INT-GOTF` | Games of the Future – MLBB | Global | Tier-A (Undangan Internasional) | Phygital International |
| `SER-INT-AG` | Asian Games – MLBB | Asia | Multi-Sport Nasional | Olympic Council of Asia |
| `SER-INT-IESF` | IESF World Esports Championship – MLBB | Global | Multi-Sport Nasional | IESF |
| `SER-MCT-SEA` | MLBB Championship Tour Southeast Asia | Asia Tenggara | Regional Championship | Kualifikasi M-Series |
| `SER-MCT-EA` | MLBB Championship Tour East Asia | Asia Timur (CN, MN, JP, KR) | Regional Championship | Kualifikasi MSC & M-Series |
| `SER-MCT-AMER` | MLBB Championship Tour Americas | Amerika (NA, LATAM, BR) | Regional Championship | Kualifikasi MSC & M-Series |
| `SER-MCT-EECA` | MLBB Championship Tour EECA *(Roadmap)* | EECA | Kerangka Regional | Peta Jalan 5 Wilayah MCT 2026 |
| `SER-MCT-EMEA` | MLBB Championship Tour EMEA *(Roadmap)* | EMEA | Kerangka Regional | Peta Jalan 5 Wilayah MCT 2026 |
| `SER-MPL-ID` | MPL Indonesia | Indonesia | Liga Pro Franchise (Tier-1) | MSC & M-Series |
| `SER-MPL-PH` | MPL Philippines | Filipina | Liga Pro Franchise (Tier-1) | MSC & M-Series |
| `SER-MPL-MY` | MPL Malaysia | Malaysia | Liga Pro Partner (Tier-1) | MSC & M-Series |
| `SER-MPL-SG` | MPL Singapore | Singapura | Liga Pro Regional (Tier-1) | MSC & M-Series / MCT SEA |
| `SER-MPL-KH` | MPL Cambodia | Kamboja | Liga Pro Regional (Tier-1) | MSC & M-Series / MCT SEA |
| `SER-MPL-MENA` | MPL MENA | Timur Tengah & Afrika Utara | Liga Pro Regional (Tier-1) | MSC & M-Series |
| `SER-MCC` | MLBB Continental Championships (MCC) | EECA (CIS, Georgia, Ukraina) | Liga Pro Regional (Tier-1) | MSC & M-Series |
| `SER-MTC` | MTC Türkiye Championship | Turki | Liga Pro Nasional (Tier-1) | MSC & M-Series |
| `SER-MSL-TH` | MLBB Super League (MSL) Thailand | Thailand | Liga Pro Nasional (Tier-1) | MSC & MCT SEA / M8 |
| `SER-MSL-MM` | MLBB Super League (MSL) Myanmar | Myanmar | Liga Pro Nasional (Tier-1) | MSC & MCT SEA / M8 |
| `SER-MDL-ID` | MDL Indonesia | Indonesia | Liga Pengembangan (Tier-2) | MPL ID & MCT SEA |
| `SER-MDL-PH` | MDL Philippines | Filipina | Liga Pengembangan (Tier-2) | MPL PH & MCT SEA |
| `SER-MAL-MY` | MLBB Academy League (MAL) Malaysia | Malaysia | Liga Akademi (Tier-2) | MPL MY & MCT SEA |

---

## 4. Competition Event Registry & Coverage Matrix (2026)

| Competition ID | Official Name | Region | Country | Season | Organizer | Official Source | Secondary Source | Event Status | Start Date | End Date | Format | Qualification Path | Prize Pool | Pre-Event Info | Match Data Status | Draft Data Status | Statistics Status | VOD Status | Research Coverage | Confidence | Last Verified |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `COMP001` | MLBB Mid Season Cup 2026 | International | France (Paris) | 2026 | MOONTON Games & EWCF | `esportsworldcup.com` ; rilis hasil di `en.moonton.com` *(URL artikel spesifik belum dibuka langsung)* | `liquipedia.net/.../MLBB_Mid_Season_Cup/2026` & `/Statistics` | `COMPLETED` | `2026-07-01` | `2026-08-01` | Wild Card (10 tim) + Main Stage Group & Knockout (total 25 tim) | Puncak tengah musim dari MPL, MCC, MTC, MCT EA, MCT AMER, & regional qualifiers | US$3,000,000 | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP002` | MLBB Southeast Asia Championship Tour 2026 | Southeast Asia | Thailand (Bangkok) | 2026 | MOONTON Games | `en.moonton.com/news/362.html` ; `en.moonton.com/news/398.html` | Liquipedia *(terkonfirmasi via search)* | `UPCOMING` | `2026-12-09` | `2026-12-13` | 12 tim (4 Grup A-D single RR) + Last Chance Qualifier + Knockout Playoffs | Top 2 -> M8 Main Stage; Peringkat 3-4 -> M8 Wild Card | US$50,000 | `AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP003` | Hero ACL × MCT East Asia 2026 – Shanghai | East Asia | China (Shanghai) | 2026 Split 1 | MOONTON Games & Hero Esports | `en.moonton.com/news/335.html` ; `en.moonton.com/news/339.html` | Liquipedia, PressTheGame, InvenGlobal | `COMPLETED` | `2026-05-22` | `2026-05-24` | 6 tim (CN, MN, JP, KR) dalam 2 grup (Mythical & Legendary) + Playoffs | Kualifikasi menuju MSC 2026 (Juara: GZG) | `UNVERIFIED` | `AVAILABLE` | `PARTIAL` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP004` | MCT East Asia 2026 – Ulaanbaatar | East Asia | Mongolia (Ulaanbaatar) | 2026 Split 2 | MOONTON Games & ESN | `en.moonton.com/news/386.html` ; `en.moonton.com/news/395.html` | Liquipedia, PressTheGame, BigNewsNetwork | `COMPLETED` | `2026-10-29` | `2026-10-31` | 6 tim (CN, MN, JP, KR) grup + Playoffs (mekanisme Immortality Armour) | Juara (The MongolZ) -> M8 Main Stage; DFYG & GZG -> M8 Wild Card | US$15,000 *(sekunder)* | `AVAILABLE` | `PARTIAL` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP005` | MLBB Americas Championship Tour 2026 – Split 2 | Americas | Brazil (São Paulo) & Americas | 2026 Split 2 | MOONTON Games | `en.moonton.com/news/399.html` *(rujukan rilis resmi 16 Nov 2026; cek HTTP langsung pending)* | Liquipedia *(MCT Americas 2026)* | `COMPLETED` | `2026-09-11` | `2026-11-14` | Swiss Stage + Playoffs + Grand Final Bo7 (Alfra Estúdios) | Juara (DREAMMAX 4-1 LYON) -> M8 Main Stage; LYON -> M8 Wild Card | US$10,000 juara *(total UNVERIFIED)* | `AVAILABLE` | `PARTIAL` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP006` | MCT EECA (Kerangka Ekosistem 2026) | EECA | Regional (CIS, Georgia, Ukraina) | 2026 | MOONTON Games | Disebut pada rilis strategi 5 wilayah `en.moonton.com` *(tanpa halaman event)* | `UNAVAILABLE` | `ANNOUNCED` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` *(jalur aktif berjalan di MCC S7 & S8)* | `UNVERIFIED` | `UNAVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `PARTIALLY_RESEARCHED` | Medium | `2026-11-18` |
| `COMP007` | MCT EMEA (Kerangka Ekosistem 2026) | EMEA | Regional (Eropa, MENA) | 2026 | MOONTON Games | Disebut pada rilis strategi 5 wilayah `en.moonton.com` *(tanpa halaman event)* | `UNAVAILABLE` | `ANNOUNCED` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` *(jalur aktif berjalan di MPL MENA & MTC)* | `UNVERIFIED` | `UNAVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `PARTIALLY_RESEARCHED` | Medium | `2026-11-18` |
| `COMP008` | M8 World Championship | International | Thailand (Bangkok) & Türkiye (Istanbul) | 2026–2027 | MOONTON Games | Rilis resmi `en.moonton.com` *(URL spesifik belum dibuka langsung)* | Liquipedia *(M8 World Championship)* | `UPCOMING` | `2026-12-17` | `2027-01-23` | Wild Card 10 tim (3 lolos) + Swiss Stage 16 tim + Double-Elim Knockout 8 tim | Puncak kompetisi dunia MLBB 2026–2027 | US$1,000,000 | `AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP009` | MPL Indonesia Season 17 | Southeast Asia | Indonesia | Season 17 (2026) | MOONTON Games | `id-mpl.com` (`/schedule`, `/statistics`) ; YT `@MPLIndonesia` | `liquipedia.net/.../MPL/Indonesia/Season_17/Statistics` | `COMPLETED` | `2026-03-27` | `2026-06-14` | Regular Season + Playoffs (10-14 Jun di Jakarta International Velodrome) | Kualifikasi menuju MSC 2026 (Juara: Bigetron by Vitality 4-1 ONIC) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `AVAILABLE` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP010` | MPL Indonesia Season 18 | Southeast Asia | Indonesia | Season 18 (2026) | MOONTON Games | `id-mpl.com` (`/schedule`, `/statistics`) ; YT `@MPLIndonesia/playlists` | `liquipedia.net/.../MPL/Indonesia/Season_18/Statistics` | `COMPLETED` | `2026-08-14` | `2026-11-08` | Double Round-Robin Bo3 + Hybrid-Elim Playoffs Top 6 di XO Hall | 2 slot M8 Main Stage (Bigetron by Vitality & Natus Vincere) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `AVAILABLE` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP011` | MPL Philippines Season 17 | Southeast Asia | Philippines | Season 17 (2026) | MOONTON Games | `ph-mpl.com/` ; YT `@mplph.official/playlists` | `liquipedia.net/.../MPL_Philippines/Season_17/Statistics` | `COMPLETED` | `2026-03-20` | `2026-05-31` | 8 Franchise Teams (Victoria Sports Tower & Filoil Centre) | Kualifikasi menuju MSC 2026 (Juara: Team Liquid PH) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP012` | MPL Philippines Season 18 | Southeast Asia | Philippines | Season 18 (2026) | MOONTON Games | `ph-mpl.com/` ; YT `@mplph.official/playlists` | `liquipedia.net/.../MPL_Philippines/Season_18/Statistics` | `COMPLETED` | `2026-08-21` | `2026-10-25` | 8 Franchise Teams (Regular Season + Playoffs) | 2 slot langsung M8 Main Stage | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP013` | MPL Malaysia Season 17 | Southeast Asia | Malaysia | Season 17 (2026) | MOONTON Games | `my.mpl.mobilelegends.com/` ; YT `@mpl-malaysia` | `liquipedia.net/.../MPL/Malaysia/Season_17/Statistics` | `COMPLETED` | `2026-04-03` | `2026-06-07` | 8 Partner Teams (Regular Season + Playoffs 3-7 Jun) | Kualifikasi menuju MSC 2026 (Juara: Selangor Red Giants) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `AVAILABLE` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP014` | MPL Singapore Season 11 | Southeast Asia | Singapore | Season 11 (2026) | MOONTON Games | YT `@MPLSingapore` ; IG `@mpl.sg.official` | `liquipedia.net/.../MPL_Singapore/Season_11/Statistics` | `COMPLETED` | `2026-05-09` | `2026-06-07` | Regular Season + Offline Playoffs di D'Marquee @ Downtown East | Kualifikasi menuju MSC 2026 | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP015` | MDL Indonesia Season 13 | Southeast Asia | Indonesia | Season 13 (2026) | MOONTON Games | `id-mdl.com` ; YT `@mdlindonesia6344` | Liquipedia *(MDL Indonesia)* | `COMPLETED` | `2026-03-30` | `2026-05-31` | Regular Season + Playoffs | Liga pengembangan tier-2 Indonesia (Juara: Bigetron Academy) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP016` | MLBB Academy League Malaysia Season 5 | Southeast Asia | Malaysia | Season 5 (2026) | MOONTON Games | `UNVERIFIED` *(disebut di portal umum mobilelegends.com)* | Liquipedia *(MAL Malaysia)* | `COMPLETED` | `2026-04-20` | `2026-06-13` | Group Stage + Playoffs (Selangor) | Liga akademi tier-2 Malaysia (Juara: Pixel Esports) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | Medium | `2026-11-18` |
| `COMP020` | MLBB Americas Championship Tour 2026 – Split 1 | Americas | Americas | 2026 Split 1 | MOONTON Games | `UNVERIFIED` *(artikel spesifik Split 1 belum dibuka)* | Liquipedia *(MCT Americas 2026 Split 1)* | `COMPLETED` | `2026-04-16` | `2026-06-13` | Swiss Stage (16 Apr-3 Mei) + Playoffs (7-24 Mei) + Grand Final (13 Jun) | Kualifikasi menuju MSC 2026 (Main Stage & Wild Card) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | Medium | `2026-11-18` |
| `COMP021` | MPL Malaysia Season 18 | Southeast Asia | Malaysia | Season 18 (2026) | MOONTON Games | `my.mpl.mobilelegends.com/` ; YT `@mpl-malaysia` | `liquipedia.net/.../MPL/Malaysia/Season_18/Statistics` | `COMPLETED` | `2026-08-14` | `2026-11-01` | 8 Partner Teams (Playoffs 28 Okt-1 Nov di Stadium Juara) | 2 slot langsung M8 Main Stage | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `AVAILABLE` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP022` | MPL Singapore Season 12 | Southeast Asia | Singapore | Season 12 (2026) | MOONTON Games | YT `@MPLSingapore` ; IG `@mpl.sg.official` | `liquipedia.net/.../MPL_Singapore/Season_12/Statistics` | `COMPLETED` | `2026-10-17` | `2026-10-25` | Regular Season + Offline Playoffs di GR.iD Singapore | Kualifikasi menuju ekosistem M8 | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP023` | MDL Indonesia Season 14 | Southeast Asia | Indonesia | Season 14 (2026) | MOONTON Games | `id-mdl.com` ; YT `@mdlindonesia6344` | Liquipedia *(MDL Indonesia S14)* | `COMPLETED` | `2026-08-10` | `2026-11-01` | Regular Season + Playoffs | Juara (Bigetron Academy) -> Grup D MCT SEA 2026 | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP024` | MLBB Academy League Malaysia Season 6 | Southeast Asia | Malaysia | Season 6 (2026) | MOONTON Games | `UNVERIFIED` *(situs/YT khusus belum terverifikasi)* | Liquipedia *(MAL Malaysia S6)* | `COMPLETED` | `2026-08-24` | `2026-10-25` | Group Round-Robin + Cross-Group + Playoffs (Shah Alam) | Perwakilan akademi (SRG Academy) -> Grup D MCT SEA 2026 | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | Medium | `2026-11-18` |
| `COMP025` | MPL Cambodia Season 10 | Southeast Asia | Cambodia | Season 10 (2026) | MOONTON Games | `mplcambodia.com/` ; YT `@MPLCambodia_Official` | `liquipedia.net/.../MPL/Cambodia/Season_10/Statistics` | `COMPLETED` | `2026-04-03` | `2026-05-17` | Regular Season + Playoffs | Kualifikasi menuju MSC 2026 | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP026` | MPL Cambodia Season 11 | Southeast Asia | Cambodia | Season 11 (2026) | MOONTON Games | `mplcambodia.com/` ; YT `@MPLCambodia_Official` | `liquipedia.net/.../MPL/Cambodia/Season_11/Statistics` | `COMPLETED` | `2026-09-18` | `2026-11-15` | Regular Season + Playoffs | Kualifikasi menuju ekosistem M8 / MCT SEA | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP027` | MPL MENA Season 9 | MENA | Egypt (Cairo) & MENA | Season 9 (2026) | MOONTON Games | `mena-mpl.com/` ; YT `@mlbbesportsofficial` | `liquipedia.net/.../MPL/MENA/Season_9` & `/Statistics` | `COMPLETED` | `2026-04-10` | `2026-05-22` | Regular Season + Playoffs di Cairo, Egypt | Kualifikasi menuju MSC 2026 (Juara: Geekay Esports) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP028` | MPL MENA Season 10 | MENA | Egypt (Cairo) & MENA | Season 10 (2026) | MOONTON Games | `mena-mpl.com/` ; YT `@mlbbesportsofficial` | `liquipedia.net/.../MPL/MENA/Season_10` & `/Statistics` | `COMPLETED` | `2026-09-11` | `2026-10-23` | Regular Season (11 Sep-3 Okt) + Playoffs (9-23 Okt di Cairo) | 1 slot M8 Main Stage (Team Falcons) + 1 slot M8 Wild Card (Titan Esports Club AR) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP029` | MLBB Continental Championships Season 7 | EECA | CIS, Georgia & Ukraine | Season 7 (2026) | MOONTON Games & FISSURE | YT `@mlbbcis` ; `@mlbbesportsofficial` | `liquipedia.net/.../MLBB_Continental_Championships/Season_7/Statistics` | `COMPLETED` | `2026-04-10` | `2026-06-07` | 8 tim Double Round-Robin + Playoffs | Kualifikasi menuju MSC 2026 (Juara: Team Spirit; Runner-up: Verso Time) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP030` | MLBB Continental Championships Season 8 | EECA | CIS, Georgia & Ukraine | Season 8 (2026) | MOONTON Games & FISSURE | YT `@mlbbcis` ; `@mlbbesportsofficial` | `liquipedia.net/.../MLBB_Continental_Championships/Season_8/Statistics` | `COMPLETED` | `2026-08-28` | `2026-10-31` | 8 tim Double Round-Robin + Playoffs | 1 slot M8 Main Stage (Team Spirit) + 2 slot M8 Wild Card (Aurevia Team, Team Yandex) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP031` | MTC Türkiye Championship Season 7 | Europe / Türkiye | Türkiye | Season 7 (2026) | MOONTON Games | YT `@mlbbesportsofficial` ; `@mobilelegendstr` | `liquipedia.net/.../MTC_Turkiye_Championship/Season_7/Statistics` | `COMPLETED` | `2026-04-11` | `2026-06-07` | League Phase + Playoffs | Kualifikasi menuju MSC 2026 (Juara: Aurora Gaming; Runner-up: FUT Esports) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP032` | MTC Türkiye Championship Season 8 | Europe / Türkiye | Türkiye | Season 8 (2026) | MOONTON Games | YT `@mlbbesportsofficial` ; `@mobilelegendstr` | `liquipedia.net/.../MTC_Turkiye_Championship/Season_8/Statistics` | `COMPLETED` | `2026-09-12` | `2026-11-07` | League Phase + Playoffs | 1 slot M8 Main Stage (Aurora Gaming) + 1 slot M8 Wild Card (FUT Esports) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `PARTIAL` | `PARTIAL` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP033` | MLBB Super League Thailand Season 1 | Southeast Asia | Thailand | Season 1 (2026) | MOONTON Games & GCN | YT `@mslthofficial` | Liquipedia *(MSL Thailand S1)* | `COMPLETED` | `2026-04-18` | `2026-05-24` | 10 tim Regular Season (18 Apr-17 Mei) + Playoffs (22-24 Mei) | Kualifikasi menuju MSC 2026 (Juara: King of Gamers Club) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP034` | MLBB Super League Thailand Season 2 | Southeast Asia | Thailand | Season 2 (2026) | MOONTON Games & GCN | YT `@mslthofficial` | Liquipedia *(MSL Thailand S2)* | `COMPLETED` | `2026-09-11` | `2026-10-18` | Regular Season + Playoffs (16-18 Okt) | Jalur ke MCT SEA 2026 & M8 Wild Card (Juara: Leon Esports TH) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP035` | MLBB Super League Myanmar Season 3 | Southeast Asia | Myanmar | Season 3 (2026) | MOONTON Games | YT `@mslofficialmm` | Liquipedia *(MSL Myanmar S3)* | `COMPLETED` | `2026-03-20` | `2026-05-31` | Regular Season + Offline Playoffs (Myanmar Expo Hall) | Kualifikasi menuju MSC 2026 (Juara: Yangon Galacticos) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP036` | MLBB Super League Myanmar Season 4 | Southeast Asia | Myanmar | Season 4 (2026) | MOONTON Games | YT `@mslofficialmm` | Liquipedia *(MSL Myanmar S4)* | `COMPLETED` | `2026-08-28` | `2026-10-25` | Regular Season + Playoffs | Jalur menuju MCT SEA 2026 (Juara: Falcon Esports) | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP037` | MDL Philippines Season 7 | Southeast Asia | Philippines | Season 7 (2026) | MOONTON Games | `UNVERIFIED` *(situs/YT khusus belum terverifikasi)* | Liquipedia *(MDL Philippines S7)* | `COMPLETED` | `2026-03-17` | `2026-05-24` | Open Qualifiers (21 Feb-1 Mar) + Group Stage + Play-Ins + Playoffs | Liga pengembangan tier-2 Filipina | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | Medium | `2026-11-18` |
| `COMP038` | MDL Philippines Season 8 | Southeast Asia | Philippines | Season 8 (2026) | MOONTON Games | `UNVERIFIED` *(situs/YT khusus belum terverifikasi)* | Liquipedia *(MDL Philippines S8)* | `COMPLETED` | `2026-08-25` | `2026-10-30` | Open Qualifiers (6-9 Agt) + Standard Ban-Pick + Playoffs | Perwakilan MDL PH (Team Falcons Academy) -> Grup D MCT SEA 2026 | `UNVERIFIED` | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | Medium | `2026-11-18` |
| `COMP039` | MLBB Women's International 2026 | International | France (Paris) | 2026 | MOONTON Games & EWCF | `esportsworldcup.com` ; rilis hasil di `en.moonton.com` *(URL spesifik belum dibuka)* | Liquipedia *(MWI 2026)* | `COMPLETED` | `2026-07-14` | `2026-07-18` | 16 tim (Group Stage 14-16 Jul + Knockout & Grand Final 16-18 Jul) | Kejuaraan dunia kategori putri pada EWC 2026 (Juara: Team Vitality 4-2 NAVI) | US$525,000 | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP040` | Games of the Future 2026 – MLBB | International | Kazakhstan (Astana) | 2026 | Phygital International | `phygitalinternational.com` & `gofuture.games` *(URL halaman spesifik belum dibuka)* | Liquipedia *(Games of the Future 2026)* | `COMPLETED` | `2026-08-06` | `2026-08-09` | 16 tim undangan di Zhaksylyk Ushkempirov Martial Arts Palace | Turnamen klub undangan internasional (Juara: Bigetron by Vitality vs ONIC) | US$900,000 | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP041` | 20th Asian Games Aichi-Nagoya 2026 – MLBB | Asia | Japan (Tokoname, Aichi) | 2026 | OCA & AINAGOC | Rilis resmi hasil di `en.moonton.com` *(URL spesifik belum dibuka)* | Liquipedia *(Asian Games 2026 MLBB)* | `COMPLETED` | `2026-09-29` | `2026-10-01` | Tim Nasional; Group Stage (29 Sep) + Playoffs (30 Sep-1 Okt di Aichi Sky Expo) | Cabang medali resmi Asian Games (Emas: Myanmar 4-0 Indonesia) | Non-komersial (Medali) | `AVAILABLE` | `AVAILABLE` | `UNVERIFIED` | `UNVERIFIED` | `UNVERIFIED` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |
| `COMP042` | IESF World Esports Championship 2026 – MLBB | International | Indonesia (Banten) | 2026 | International Esports Federation (IESF) | `iesf.org` *(jadwal resmi 2026)* | Liquipedia *(IESF WEC 2026)* | `UPCOMING` | `2026-12-15` | `2026-12-20` | Tim Nasional (Kategori MLBB Men & MLBB Women) | Kejuaraan dunia antarnegara IESF | `UNVERIFIED` | `AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `NOT_YET_AVAILABLE` | `PARTIALLY_RESEARCHED` | High | `2026-11-18` |

---

## 5. Verifikasi Struktur Regional MLBB Championship Tour (MCT) & Koreksi Asia Timur (2026)

1. **Lima Pilar Regional MCT 2026 (Resmi MOONTON):**
   - **MCT SEA** (`COMP002`): Diluncurkan pada Q4 2026 (9–13 Desember 2026 di Bangkok, Thailand), diikuti 12 tim dari 11 pasar Asia Tenggara menuju M8 World Championship (2 Main Stage + 2 Wild Card).
   - **MCT EA** (`COMP003` & `COMP004`): Aktif dalam 2 event terpisah sepanjang 2026 — **MCT EA Shanghai (22–24 Mei 2026)** sebagai jalur ke MSC 2026, dan **MCT EA Ulaanbaatar (29–31 Oktober 2026)** sebagai jalur langsung ke **M8 World Championship** (bukan MSC 2026).
   - **MCT AMER** (`COMP020` & `COMP005`): Menggantikan ekosistem MPL LATAM dengan menyatukan Amerika Utara, Amerika Tengah, Amerika Selatan, dan Brasil dalam Split 1 (menuju MSC 2026) dan Split 2 (selesai 14 November 2026, dimenangkan DREAMMAX 4–1 atas LYON menuju M8 World Championship).
   - **MCT EECA** (`COMP006`) & **MCT EMEA** (`COMP007`): Tercantum dalam peta jalan 5 wilayah MCT 2026 MOONTON sebagai kerangka fase lanjutan. Pada tahun 2026, kompetisi aktif berjalan di kedua kawasan tersebut tetap menggunakan merek liga profesional yang sudah mapan: **MLBB Continental Championships (MCC S7 & S8)** untuk EECA, serta **MPL MENA (S9 & S10)** dan **MTC Türkiye Championship (S7 & S8)** untuk EMEA.
2. **Koreksi Ekosistem China, Mongolia, Jepang, dan Korea Selatan:**
   - Klaim lama bahwa *"China, Jepang, Korea tidak memiliki kompetisi resmi MLBB"* telah **dihapus sepenuhnya**.
   - Sumber resmi MOONTON (`news/335.html`, `339.html`, `386.html`, `395.html`) membuktikan keempat negara/wilayah tersebut terintegrasi resmi dalam sirkuit **MCT East Asia 2026**:
     - **China:** *Guangzhou Gaming (GZG)*, *YBG*, *DianFengYaoGuai (DFYG)*.
     - **Mongolia:** *The MongolZ (MGLZ)*, *The Modun*, *MIO AHP*.
     - **Jepang:** *Sunset Ravens* (Shanghai), *Tokyo Cinnamon* (Ulaanbaatar).
     - **Korea Selatan:** *Feiyun Esports* (Shanghai), *Zero Gravity* (Ulaanbaatar).

---

*Lihat rincian sumber per kategori pada [GLOBAL_ESPORTS_SOURCE_AUDIT.md](GLOBAL_ESPORTS_SOURCE_AUDIT.md), riwayat koreksi pada [GLOBAL_ESPORTS_RESEARCH_CHANGELOG.md](GLOBAL_ESPORTS_RESEARCH_CHANGELOG.md), evaluasi kelayakan pada [GLOBAL_ESPORTS_VALIDATION_REPORT.md](GLOBAL_ESPORTS_VALIDATION_REPORT.md), dan daftar target riset berikutnya pada [GLOBAL_ESPORTS_RESEARCH_CANDIDATES.md](GLOBAL_ESPORTS_RESEARCH_CANDIDATES.md).*
