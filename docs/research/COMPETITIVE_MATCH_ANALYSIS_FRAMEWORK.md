# COMPETITIVE_MATCH_ANALYSIS_FRAMEWORK — Kerangka Analisis Pertandingan Esports MLBB

**Tanggal:** `2026-11-18`  
**Versi:** `1.0 (Phase 1.1 Recovery — Menunggu Review)`  
**Prinsip Dasar:** Memisahkan secara tegas **fakta yang benar-benar terjadi di panggung turnamen**, **observasi perilaku**, **interpretasi strategis**, **generalisasi tren meta**, dan **adaptasi untuk pemain ranked**.

---

## 1. Aturan Anti-Konflasi (*Strict 5-Layer Separation*)

Dilarang mencampurkan hasil pertandingan, opini analis, klaim meta, dan saran Solo Queue ke dalam satu paragraf bebas atau satu tabel yang sama. Setiap analisis kompetitif wajib melewati lima lapisan berurutan berikut:

```text
[Layer 1: Match Facts]           (Apa skor, draft, statistik, & VOD nyatanya?)
        |
        v
[Layer 2: Observations]          (Apa pola perilaku taktis yang tampak di game?)
        |
        v
[Layer 3: Strategic Interpretation] (Mengapa itu berhasil & apa syarat/risikonya?)
        |
        v
[Layer 4: Meta Trends]           (Apakah pola ini berulang di banyak game/turnamen?)
        |
        v
[Layer 5: Pro-to-Ranked Adaptation] (Bagaimana nasibnya di Solo/Duo/Trio/5-Man?)
```

---

## 2. Definisi Setiap Lapisan Analisis

### Layer 1 — Match Facts (`VERIFIED FACT` / `OFFICIAL_FACT`)
Merupakan rekaman objektif yang **tidak boleh mengandung opini atau spekulasi**:
- **Tournament & Stage:** ID event (`COMP*`), seri (`SER*`), stage (Group/Swiss/Playoffs), format seri (Bo1/Bo3/Bo5/Bo7), dan `patch_version`.
- **Match & Teams:** Tim Blue Side vs Red Side, skor seri akhir, daftar pemain & substitusi per game.
- **Game:** Nomor game dalam seri, durasi game, pemenang game, dan status sisi (*Blue/Red Win*).
- **Draft (Pick & Ban):** Urutan fase `Ban 1 -> Pick 1 -> Ban 2 -> Pick 2` per game beserta penanda *flex pick* (jika baru terlihat di game setelah hero swap selesai).
- **Match Statistics:** Statistik objektif per pemain/tim (KDA, gold, damage dealt/taken, turtle/lord secured, turret destroyed) yang diambil langsung dari boxscore resmi atau layar pasca-game VOD resmi.
- **VOD Reference:** URL video/playlist spesifik turnamen beserta timestamp game. *(Jika hanya ada kanal umum, status VOD tetap `UNVERIFIED`.)*

### Layer 2 — Observations (`OBSERVED EVIDENCE`)
Mendeskripsikan **perilaku taktis yang dapat diverifikasi langsung dari replay/VOD**, tanpa menyimpulkan motif tersembunyi sebelum Layer 3:
- **Draft Pattern:** Misal: prioritas pengambilan *jungler utility* di fase 1, penyembunyian *last-pick EXP/Roam*, atau pembentukan *double-frontline*.
- **Lane Assignment:** Penempatan hero aktual di lane (termasuk *lane swap* menit awal yang berbeda dari kebiasaan role umum).
- **Rotation:** Jalur pergerakan Roamer dan Midlaner pada gelombang minion 1–3, waktu *gank* pertama, atau dukungan *invade*.
- **Objective Timing:** Keterlibatan tim saat *Lithowanderer*, setup area *Turtle* pertama (menit 2:00), pertukaran turret gold lane vs Turtle, dan persiapan *Lord*.
- **Teamfight Behavior:** Formasi tim saat kontes (mis. *split-flank*, *front-to-back*, *zoning jungler lawan di luar pit*).
- **Resource Allocation:** Siapa yang menerima *wave* tengah/samping pada mid game dan pembagian *buff* atau *farm jungle*.
- **Strategic Pattern:** Pola makro yang tampak berulang dalam game tersebut (mis. *cross-map turret trade* saat kalah tempo Turtle), **wajib dilengkapi timestamp VOD** (jika VOD tersedia).

### Layer 3 — Strategic Interpretation (`STRATEGIC_INTERPRETATION`)
Menjelaskan logika di balik observasi Layer 2 secara terstruktur:
- **Why Strategy Worked (atau Gagal):** Hubungan mekanis antara draft, timing power spike, dan eksekusi makro yang menghasilkan keunggulan.
- **Strategic Advantages:** Keunggulan yang dicapai (mis. kontrol ruang river, paksaan rotasi lawan, atau pengamanan kondisi menang late game).
- **Conditions Required:** Prasyarat agar eksekusi tersebut mungkin dilakukan (mis. *Mid priority level 1*, komposisi anti-engage, atau keunggulan komunikasi *voice comms*).
- **Trade-offs:** Apa yang sengaja dikorbankan oleh tim (mis. melepas Turtle pertama demi plating Gold Lane).
- **Risks:** Titik kegagalan apabila lawan merespons berbeda (mis. rentan *counter-engage* bila *skill* kunci inisiator meleset).

### Layer 4 — Meta Trends (`RESEARCH_BASED_ANALYSIS`)
Mengagregasi pola dari **banyak game dan banyak pertandingan** pada rentang patch yang relevan:
- **Syarat Sampel Minimum:** Meta trend **dilarang** diklaim hanya dari satu game atau satu match. Setiap record tren meta wajib mencantumkan `sample_size_games`, `sample_event_ids`, dan `patch_range`.
- **Penandaan Keterbatasan (*Sample Limitation Rule*):** Apabila pengamatan berasal dari sampel terbatas (mis. hanya 1 turnamen regional atau 1 tim tertentu yang mempopulerkannya), tren tersebut **wajib** diberi label keterbatasan (mis. *"Regional / Single-Team Pocket Strategy — belum terkonfirmasi sebagai tren global"*) dan `confidence_level = LOW/MEDIUM`.
- **Pembedaan Metrik Agregat vs Urutan Draft:** Data seperti persentase *pick/ban* dari `Liquipedia /Statistics` (`PARTIAL`) dapat mendukung indikasi prioritas hero, tetapi **tidak boleh** dipakai untuk mengklaim urutan pick spesifik tanpa bukti Layer 1 per-game.

### Layer 5 — Pro-to-Ranked Adaptation
Menjembatani hasil Layer 3/4 ke realitas pemain ranked (`SOLO`, `DUO`, `TRIO`, `5-MAN`) mengikuti kerangka lengkap pada `PRO_TO_RANKED_ADAPTATION.md`:
- **Evidence Requirement:** Setiap adaptasi wajib tertaut ke minimal 1 `competitive_insight` terverifikasi (Layer 3) dan minimal 1 `match_observation` nyata (Layer 2).
- **Confidence Calibration:** Tingkat keyakinan adaptasi untuk *Ranked* dinilai terpisah dari keyakinan fakta turnamen. Strategi pro berstatus `HIGH` pada bukti faktanya tetap dapat memiliki kelayakan `NOT_RECOMMENDED` atau `HIGH_RISK` di Solo Queue.

---

## 3. Gerbang Mutu Sebelum Publikasi Analisis

Sebuah analisis pertandingan **tidak boleh dipublikasikan** ke modul `/esports` atau `/academy` apabila:
1. Tidak mencantumkan `competition_event_id` dan `patch_version` aktual pertandingan.
2. Mencantumkan tautan VOD atau statistik fiktif/tebakan.
3. Mengklaim urutan pick/ban per-game padahal sumbernya baru berupa tabel agregat turnamen.
4. Mengklaim tren meta global hanya dari 1 pertandingan tanpa catatan keterbatasan sampel.
5. Mengubah observasi tim pro menjadi rekomendasi Solo Rank tanpa melewati matriks 7-dimensi `PRO_TO_RANKED_ADAPTATION.md`.
