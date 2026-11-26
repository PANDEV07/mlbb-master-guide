# GLOBAL_ESPORTS_VALIDATION_REPORT — Laporan Validasi Integritas Data Esports Global (2026)

**Tanggal Referensi Validasi:** `2026-11-18`  
**Status Keseluruhan Dokumen:** **`PARTIALLY_VERIFIED_AND_CONSISTENT`** *(Struktur registry, kronologi tanggal, event status, dan metrik otomatis kini konsisten tanpa kontradiksi internal; namun riset belum diklaim 100% tuntas/`FULLY_RESEARCHED` karena pembukaan HTTP langsung atas URL playlist VOD spesifik, log draft per-pertandingan, dan beberapa URL artikel berita resmi masih tertunda.)*

---

## 1. Ringkasan Eksekutif Jawaban Validasi (8 Pertanyaan Utama)

| No | Pertanyaan Validasi | Status | Penjelasan Ringkas & Bukti |
|---|---|---|---|
| 1 | **Apakah data kompetisi valid?** | **YA (pada level identitas, jadwal & hasil utama)** | Sebanyak **39 record** kompetisi nyata tahun 2026 telah divalidasi (`37 VERIFIED` eksistensinya; `2 UNVERIFIED` sebagai event standalone yaitu `COMP006` MCT EECA & `COMP007` MCT EMEA yang baru berupa kerangka roadmap). Seluruh entri generik ber-URL fiktif (`COMP017`–`COMP019` versi lama) telah dibersihkan dan dipisahkan ke `GLOBAL_ESPORTS_RESEARCH_CANDIDATES.md`. |
| 2 | **Apakah event status valid?** | **YA** | Diperiksa terhadap tanggal referensi `2026-11-18`: `34 COMPLETED` (semua memiliki `End Date <= 2026-11-18`), `3 UPCOMING` (`COMP002` MCT SEA `2026-12-09`, `COMP008` M8 `2026-12-17`, `COMP042` IESF WEC `2026-12-15`), `0 ONGOING`, `2 ANNOUNCED` (`COMP006`, `COMP007`). `COMP005` (MCT AMER Split 2) telah dikoreksi dari `ONGOING` menjadi **`COMPLETED`** (selesai 14 Nov 2026). |
| 3 | **Apakah timeline valid?** | **YA** | Validasi skrip (`validate_esports_registry.py`) memastikan `errors: []` — tidak ada `COMPLETED` dengan `End Date > 2026-11-18`, dan jalur kualifikasi kronologis telah diperbaiki (mis. `COMP004` MCT EA Ulaanbaatar Okt 2026 menuju **M8 World Championship**, bukan MSC 2026). |
| 4 | **Apakah coverage metrics valid?** | **YA (Dihitung Otomatis)** | Seluruh angka summary dihitung langsung oleh skrip Python dari ke-39 baris tabel: **Total = 39**; `Event Status` = `34 + 3 + 0 + 2 = 39`; `Research Coverage` = `0 + 39 + 0 = 39`. Kesalahan versi lama (`18` vs `19`) telah diselesaikan tuntas. |
| 5 | **Apakah sumber valid?** | **PARSIAL / TERKLASIFIKASI KETAT** | Semua URL karangan versi lama (`lpi.id`, `esportsworldcup.com/mc-results`, `PLMSC2026`, `moonton.com/m8`, dll.) telah dihapus. Liquipedia diturunkan sebagai `Secondary Database`. `Moonton Esports API` ditetapkan `UNVERIFIED`. URL resmi aktual tercantum jelas, sedangkan URL yang belum dibuka langsung diberi status jujur (`VERIFIED_VIA_SEARCH_SUMMARY` atau `UNVERIFIED`). |
| 6 | **Apakah match/draft/statistics/VOD benar-benar tersedia?** | **BERVARIASI PER ASPEK** | Dari 39 record: **Pre-Event Info** tersedia pada `37`; **Match Data** `31 AVAILABLE` + `3 PARTIAL` + `5 NOT_YET_AVAILABLE`; **Draft Data** `17 PARTIAL` (agregat pick/ban) + `17 UNVERIFIED` + `5 NOT_YET_AVAILABLE`; **Statistics** `4 AVAILABLE` (portal resmi `id-mpl.com` & `my.mpl.mobilelegends.com`) + `13 PARTIAL` + `17 UNVERIFIED` + `5 NOT_YET_AVAILABLE`; **VOD** `34 UNVERIFIED` (karena baru kanal YouTube umum, belum URL playlist spesifik) + `5 NOT_YET_AVAILABLE`. |
| 7 | **Kompetisi mana yang siap dimasukkan ke database?** | **32 RECORD SIAP UNTUK METADATA INTI** | **32 kompetisi** dengan `Official Source = VERIFIED` siap diimpor ke tabel master `tournaments` / `competition_events` untuk metadata (nama, tanggal, format, jalur kualifikasi, hasil pemenang utama). Namun **belum ada** yang siap untuk impor penuh tabel `match_draft_sequence` atau `vod_links` otomatis sebelum ekstraksi halaman match & playlist spesifik. |
| 8 | **Kompetisi mana yang masih memerlukan research?** | **SELURUH 39 RECORD (P1) + 12 KANDIDAT BARU (P2)** | Tidak ada record berstatus `FULLY_RESEARCHED`. Prioritas utama adalah memverifikasi link playlist VOD spesifik & log draft per-match pada turnamen Tier-S/MPL, konfirmasi sumber resmi untuk 5 record sekunder-only (`COMP016`, `COMP020`, `COMP024`, `COMP037`, `COMP038`), serta riset kandidat lokal (`CAND-001` s.d. `CAND-012`). |

---

## 2. Klasifikasi Kebenaran Data Berdasarkan Jenis Sumber (Poin 13)

### 2.1 Data yang Telah Diverifikasi oleh Official Sources (`32` Record)
Data tingkat **Tournament Existence, Jadwal, Format, Peserta, Jalur Kualifikasi, dan/atau Juara Utama** yang didukung langsung oleh rilis/portal/kanal resmi (`en.moonton.com`, `esportsworldcup.com`, `id-mpl.com`, `ph-mpl.com`, `my.mpl.mobilelegends.com`, `id-mdl.com`, `mena-mpl.com`, `mplcambodia.com`, kanal YouTube resmi):
- **Turnamen Utama & MCT:** `COMP001` (MSC 2026), `COMP002` (MCT SEA 2026 — via `362.html` & `398.html`), `COMP003` (MCT EA Shanghai — via `335.html` & `339.html`), `COMP004` (MCT EA Ulaanbaatar — via `386.html` & `395.html`), `COMP005` (MCT AMER Split 2 — via rilis 16 Nov 2026 / `399.html`), `COMP008` (M8 World Championship).
- **Turnamen Internasional Lain:** `COMP039` (MWI 2026), `COMP040` (Games of the Future 2026), `COMP041` (20th Asian Games Aichi-Nagoya 2026), `COMP042` (IESF WEC 2026).
- **Liga Profesional & Akademi Terverifikasi:** `COMP009`–`COMP010` (MPL ID S17–S18, termasuk `id-mpl.com/statistics`), `COMP011`–`COMP012` (MPL PH S17–S18), `COMP013` & `COMP021` (MPL MY S17–S18, termasuk statistik di `my.mpl.mobilelegends.com`), `COMP014` & `COMP022` (MPL SG S11–S12 via kanal resmi `@MPLSingapore`), `COMP015` & `COMP023` (MDL ID S13–S14 via `id-mdl.com`), `COMP025`–`COMP026` (MPL Cambodia S10–S11), `COMP027`–`COMP028` (MPL MENA S9–S10), `COMP029`–`COMP030` (MCC S7–S8 via `@mlbbcis`), `COMP031`–`COMP032` (MTC Türkiye S7–S8 via `@mobilelegendstr`), `COMP033`–`COMP034` (MSL TH S1–S2 via `@mslthofficial`), `COMP035`–`COMP036` (MSL MM S3–S4 via `@mslofficialmm`).

### 2.2 Data yang Baru Didukung oleh Secondary Sources (`5` Record Penuh + Aspek Statistik/Draft)
- **Kompetisi yang seluruh bukti tanggal, format, dan hasilnya sementara hanya dari Liquipedia (`Official Source = UNVERIFIED`):**
  - `COMP016` (MAL Malaysia Season 5)
  - `COMP020` (MCT AMER 2026 Split 1)
  - `COMP024` (MAL Malaysia Season 6)
  - `COMP037` (MDL Philippines Season 7)
  - `COMP038` (MDL Philippines Season 8)
- **Aspek data yang bergantung pada sumber sekunder (`Liquipedia /Statistics`):**
  - Agregat pick/ban rate & blue/red side win rate untuk `COMP001` (MSC 2026), `COMP009`–`COMP014`, `COMP021`–`COMP022`, `COMP025`–`COMP032`.
  - Angka prize pool spesifik untuk `COMP004` ($15,000), `COMP039` ($525,000), `COMP040` ($900,000 — juga terkonfirmasi media phygital).

### 2.3 URL yang Tidak Dapat Diverifikasi atau Ditolak
1. **URL Fiktif/Karangan dari Versi Sebelumnya (Dihapus Total):** `lpi.id`, `phproleague.com`, `mml.my`, `sgc.sg`, `thpl.co.th`, `vpl.vn`, `mmcc.mm`, `cps.kh`, `brchamp.mlbb.com`, `lal.mlbb.com`, `menal.mlbb.com`, `trchamp.mlbb.com`, `cis.mlbb.com`, `nal.mlbb.com`, `euchamp.mlbb.com`, `mlbb.com/mct-sea-2026`, `moonton.com/m8`, `moonton.com/enc-2026`, `moonton.com/mdl-id-2026`, `moonton.com/mal-my-2026`, `moonton.com/academy`, `esportsworldcup.com/qualifiers`, seluruh sub-endpoint karangan `esportsworldcup.com/mc-results|draft|stats|mct-ea-shanghai/...`, serta seluruh playlist ID karangan (`PLMSC2026`, `PLEAAShanghai2026`, dll.).
2. **Domain / Klaim yang Belum Terkonfirmasi:** `sg-mpl.com`, `kh-mpl.com`, `ph-mdl.com`, dan **Moonton Esports API / MLBB Esports API** (`UNVERIFIED`).
3. **URL yang Terkonfirmasi Kontennya Lewat Pencarian Namun Belum Dibuka HTTP Langsung:**
   - `https://en.moonton.com/news/399.html` (konten berita DREAMMAX vs LYON 4-1 terverifikasi di pencarian `en.moonton.com` & dirujuk user, tetapi query URL literal tidak menampilkan teks spesifik sehingga perlu cek HTTP langsung).
   - Artikel spesifik berita `en.moonton.com` untuk MSC 2026, MWI 2026, M8 World Championship, Asian Games 2026 (terkonfirmasi ada lewat grounding search, tetapi slug `/news/xxx.html` spesifik belum terekam).
   - Seluruh **URL playlist/video YouTube spesifik per turnamen/musim** (`VOD Status = UNVERIFIED` untuk 34 event selesai).

### 2.4 Record dengan Bukti Belum Memadai (*Insufficient Evidence*)
- **`COMP006` (MCT EECA) & `COMP007` (MCT EMEA):** Tidak ada bukti turnamen standalone tahun 2026 (baru disebut pada kerangka peta jalan 5 wilayah MCT).
- **`COMP016`, `COMP020`, `COMP024`, `COMP037`, `COMP038`:** Kekurangan sumber resmi langsung (hanya bersandar pada Liquipedia).
- **`COMP003`, `COMP004`, `COMP005`:** Hasil pertandingan baru terverifikasi pada laga puncak/juara (`Match Data = PARTIAL`); skor lengkap seluruh fase grup & statistik belum diekstrak.
- **Seluruh 34 Event `COMPLETED` untuk Aspek VOD & Draft Urutan Pick/Ban:** Belum memenuhi syarat bukti URL spesifik per playlist/match.

### 2.5 Kesiapan Impor Database vs Kandidat Riset
- **Siap untuk Impor Database Tahap Awal (Tabel `competitions`, `competition_events`, `source_references`):**
  - **Tier A (Prioritas Impor Segera — `32` Record dengan `Official Source = VERIFIED`):** `COMP001`–`COMP005`, `COMP008`–`COMP015`, `COMP021`–`COMP023`, `COMP025`–`COMP036`, `COMP039`–`COMP042`. Catatan: kolom statistik penuh hanya tersedia langsung untuk `COMP009`, `COMP010`, `COMP013`, `COMP021`; selebihnya diimpor untuk metadata event & pemenang dulu.
  - **Tier B (Impor Metadata Bertanda `SECONDARY_VERIFIED_ONLY` — `5` Record):** `COMP016`, `COMP020`, `COMP024`, `COMP037`, `COMP038`.
  - **Belum Siap Diimpor sebagai Event Turnamen (`2` Record):** `COMP006` & `COMP007` (simpan hanya sebagai metadata roadmap / status `ANNOUNCED`).
- **Tetap Sebagai Research Candidates:**
  - Seluruh 12 item pada [GLOBAL_ESPORTS_RESEARCH_CANDIDATES.md](GLOBAL_ESPORTS_RESEARCH_CANDIDATES.md) (`CAND-001` ENC 2027, `CAND-002`/`003` MCT EECA/EMEA standalone, serta `CAND-004`–`CAND-012` untuk kualifikasi lokal Vietnam/Laos/Brunei/Timor-Leste/India/Eropa Barat/China, kompetisi wanita regional, kejuaraan nasional, dan collegiate).

---

## 3. Daftar Research Gaps Berdasarkan Prioritas (Poin 8)

### Prioritas P0 (Kesalahan Faktual, Status Event, Jalur Kualifikasi, Sumber Tidak Valid — Status Penanganan)
- ✅ **SELESAI DIKOREKSI DI VERSI INI:**
  - Kesalahan hitung 18 vs 19 record -> diperbaiki & diverifikasi skrip (Total = 39).
  - Status `COMP005` (MCT AMER Split 2) `ONGOING` -> `COMPLETED`.
  - Jalur kualifikasi `COMP004` (MCT EA Ulaanbaatar) `MSC 2026` -> `M8 World Championship`.
  - Penghapusan klaim salah soal China/Jepang/Korea serta penghapusan tanggal/prize karangan `COMP006`/`COMP007`.
  - Penghapusan seluruh URL fiktif & penetapan `Moonton Esports API = UNVERIFIED`.
- ⚠️ **TINDAK LANJUT P0 TERSISA (Verifikasi Teknis):**
  - Verifikasi HTTP langsung terhadap URL `https://en.moonton.com/news/399.html` serta pencatatan exact `/news/xxx.html` untuk MSC 2026, MWI 2026, M8 World Championship, dan Asian Games 2026.

### Prioritas P1 (Data Pertandingan, Draft, Statistik, dan VOD yang Hilang/Parsial)
1. **Verifikasi URL Playlist/Video VOD Spesifik** untuk seluruh 34 turnamen berstatus `COMPLETED` (terutama `COMP001` MSC 2026, `COMP009`–`COMP014` MPL ID/PH/MY/SG, `COMP029`–`COMP032` MCC/MTC, `COMP003`–`COMP005` MCT EA/AMER).
2. **Ekstraksi Log Draft & Match Bracket Lengkap** untuk `COMP003`, `COMP004`, `COMP005` (saat ini baru `PARTIAL`), serta penentuan apakah urutan pick/ban per game tersedia di replay VOD atau portal liga resmi.
3. **Verifikasi Sumber Resmi Langsung** untuk 5 kompetisi yang saat ini hanya bersandar pada Liquipedia (`COMP016`, `COMP020`, `COMP024`, `COMP037`, `COMP038`), termasuk pencarian prize pool terverifikasi bagi liga-liga MPL/MCC/MTC/MSL.
4. **Pemantauan Event `UPCOMING`:** Menjadwalkan pengambilan data pasca-event untuk `COMP002` (MCT SEA: 9–13 Des 2026), `COMP042` (IESF WEC: 15–20 Des 2026), dan `COMP008` (M8: 17 Des 2026 – 23 Jan 2027), serta memantau rilis jadwal resmi `COMP006` (MCT EECA) & `COMP007` (MCT EMEA).

### Prioritas P2 (Ekspansi Wilayah & Ekosistem Tambahan)
1. Kualifikasi lokal pengumpan MCT SEA & MSC (`CAND-004`, `CAND-005`: Vietnam, Laos, Brunei, Timor-Leste, India, Eropa Barat).
2. Ekosistem domestik China (`CAND-006`) serta sub-kualifikasi Amerika Utara & Amerika Latin (`CAND-007`).
3. Liga pengembangan/akademi di wilayah selain ID/PH/MY (`CAND-009`), kualifikasi putri regional (`CAND-010`), seleksi nasional Asian Games/IESF (`CAND-011`), dan liga kampus/collegiate (`CAND-012`).
4. Pelacakan jangka panjang **Esports Nations Cup (ENC)** yang dijadwalkan ulang ke November 2027 (`CAND-001`).

---

## 4. Kesimpulan & Kesiapan Review

Seluruh perbaikan integritas data untuk **Global Esports Coverage** telah diterapkan secara konsisten ke lima dokumen:
1. [GLOBAL_ESPORTS_COVERAGE.md](GLOBAL_ESPORTS_COVERAGE.md)
2. [GLOBAL_ESPORTS_SOURCE_AUDIT.md](GLOBAL_ESPORTS_SOURCE_AUDIT.md)
3. [GLOBAL_ESPORTS_RESEARCH_CHANGELOG.md](GLOBAL_ESPORTS_RESEARCH_CHANGELOG.md)
4. [GLOBAL_ESPORTS_VALIDATION_REPORT.md](GLOBAL_ESPORTS_VALIDATION_REPORT.md)
5. [GLOBAL_ESPORTS_RESEARCH_CANDIDATES.md](GLOBAL_ESPORTS_RESEARCH_CANDIDATES.md)

*Sesuai instruksi, seluruh tugas Phase 0 lainnya belum dilanjutkan dan pekerjaan dihentikan di sini untuk menunggu tinjauan (review) Anda.*
