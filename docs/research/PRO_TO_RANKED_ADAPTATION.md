# PRO_TO_RANKED_ADAPTATION — Kerangka Adaptasi Strategi Pro ke Ranked

**Tanggal:** `2026-11-18`  
**Versi:** `1.0 (Phase 1.1 Recovery — Menunggu Review)`  
**Prinsip Utama:** Strategi profesional di turnamen bergantung pada komunikasi *voice comms*, *drafting* penuh 5 pemain, dan latihan tim terstruktur. Mengadopsi taktik pro ke Solo Queue tanpa adaptasi dan peringatan risiko adalah bentuk informasi yang menyesatkan (*misleading advice*).

---

## 1. Matriks Perbedaan Konteks Ranked (7 Dimensi)

Seluruh adaptasi wajib mengevaluasi kesenjangan antara permainan profesional dan 4 mode Ranked pada tujuh dimensi berikut:

| Dimensi | Pro Play (Turnamen) | 5-Man Squad | Trio Rank | Duo Rank | Solo Queue |
|---|---|---|---|---|---|
| **1. Communication** | *Voice comms* penuh, panggilan cooldown & posisi real-time | *Voice comms* penuh (kualitas bergantung disiplin tim) | *Voice comms* untuk 3 pemain; 2 rekan mengandalkan ping/chat | *Voice comms* hanya 2 pemain; 3 rekan acak | Tidak ada jaminan *voice comms*; murni minimap & ping |
| **2. Coordination** | Sinkronisasi lintas 5 role terlatih | Tinggi bila sudah rutin bermain bersama | Terpusat pada *core triad* (mis. Jungle–Mid–Roam) | Terbatas pada sinergi pasangan (mis. Gold–Roam / Jungle–Roam) | Sangat rendah; koordinasi bersifat reaktif/oportunistik |
| **3. Draft Control** | Urutan pick/ban terencana, *flex pick*, analisis lawan | Kontrol penuh komposisi & *counter-pick* tim | Kontrol 3 dari 5 pick; 2 slot berisiko tumpang tindih | Kontrol 2 dari 5 pick; sulit menjamin *win condition* tim | Kontrol hanya 1 pick; wajib memilih hero *self-sufficient* |
| **4. Decision-Making** | Dipimpin *shotcaller* dengan rencana makro jelas | Ada *shotcaller*, namun eksekusi bisa terpecah saat tertekan | 3 pemain mengarahkan tempo mid-map & objektif | 2 pemain menciptakan keunggulan lokal untuk memancing tim | Keputusan mandiri berdasarkan pembacaan minimap pribadi |
| **5. Risk Profile** | Risiko terukur dengan rencana *backup* tim | Risiko sedang-tinggi jika *over-forcing* tanpa vision | Risiko muncul bila 2 pemain acak tidak merespons rotasi | Risiko tinggi bila mengandalkan *follow-up* dari 3 rekan acak | Risiko sangat tinggi untuk strategi yang bergantung pada penyelamatan rekan |
| **6. Strategy Viability** | Taktik kompleks (lane swap, funnel, delayed freeze, cross-trade) | Hampir seluruh taktik pro dapat diadaptasi bertahap | Cocok untuk kontrol *mid-triangle*, invasi terukur, & setup Turtle | Cocok untuk memenangkan 1–2 lane & *pick-off* berpasangan | Fokus pada stabilitas *laning*, efisiensi farm, menghindari kesalahan fatal, & *solo carry impact* |
| **7. Execution** | Presisi waktu hingga hitungan detik | Membutuhkan latihan *timing* dan kejelasan tugas | Bergantung pada keselarasan 3 pemain inti | Bergantung pada komunikasi dua arah yang ringkas | Mengutamakan eksekusi sederhana, andal, dan tidak rapuh |

---

## 2. Skema Wajib Setiap Record Adaptasi (19 Field)

Setiap entri pada `pro_to_ranked_adaptations` **wajib** memuat seluruh komponen berikut sebelum dinyatakan `VERIFIED` / layak terbit:

| No | Field / Komponen | Keterangan & Persyaratan Validasi |
|---|---|---|
| 1 | **Competitive Evidence** | Tautan ke record `match_observations` dan `entity_evidences` (VOD/statistik resmi). |
| 2 | **Tournament** | Nama resmi & ID event (`COMP*`) tempat strategi diamati. |
| 3 | **Match** | Identitas pertandingan (`Tim A vs Tim B`, stage, skor seri). |
| 4 | **Game** | Nomor game spesifik (`Game 1..N`) yang menjadi bukti utama. |
| 5 | **Patch** | Versi patch aktual saat pertandingan tersebut dimainkan. |
| 6 | **Teams** | Tim pelaksana dan tim lawan pada game tersebut. |
| 7 | **Heroes** | Daftar hero kunci yang terlibat dalam eksekusi strategi (terutama pada peran inti). |
| 8 | **Observed Strategy** | Deskripsi faktual apa yang dilakukan tim pro di dalam game (Layer 2). |
| 9 | **Strategic Principle** | Inti prinsip taktis yang dapat digeneralisasi terlepas dari nama timnya (mis. *pengorbanan Turtle pertama untuk menghancurkan plating Gold Lane dan memaksa power spike Marksman lebih cepat*). |
| 10 | **Why It Worked** | Penjelasan mekanis dan makro mengapa prinsip tersebut menghasilkan keunggulan pada game bukti (Layer 3). |
| 11 | **Required Conditions** | Kondisi draft, lane priority, item timing, dan komposisi yang mutlak harus ada agar strategi masuk akal. |
| 12 | **Coordination Requirements** | Tingkat sinkronisasi minimum yang diperlukan (`LOW` / `MEDIUM` / `HIGH` / `PRO_LEVEL_VOICE_REQUIRED`). |
| 13 | **Risks** | Apa yang terjadi jika syarat tidak terpenuhi atau eksekusi gagal (konsekuensi snowball terbalik). |
| 14 | **Solo Adaptation** | Rating kelayakan (`RECOMMENDED` \| `CONDITIONAL` \| `HIGH_RISK` \| `NOT_RECOMMENDED`) + cara penyederhanaan realistis untuk 1 pemain tanpa voice comms (atau alasan mengapa **jangan** ditiru di Solo). |
| 15 | **Duo Adaptation** | Rating kelayakan + pembagian tugas antara 2 pemain dalam komunikasi suara. |
| 16 | **Trio Adaptation** | Rating kelayakan + peran inti 3 pemain (mis. *Jungle–Mid–Roam*) dan cara mengantisipasi 2 rekan acak. |
| 17 | **5-Man Adaptation** | Rating kelayakan + checklist persiapan draft, shotcalling, dan latihan eksekusi 5 pemain. |
| 18 | **Confidence** | Tingkat keyakinan efektivitas adaptasi (`HIGH` / `MEDIUM` / `LOW`), dikalibrasi per mode. |
| 19 | **Limitations** | Batasan penerapan (mis. perbedaan patch saat ini vs patch turnamen, ketergantungan pada hero tertentu yang sering di-ban di tier Mythic/Glory, atau sensitivitas terhadap tier rank). |

---

## 3. Aturan Pencegahan Nasihat Menyesatkan (*Anti-Misleading Guardrails*)

1. **Penolakan *Blind Copy* untuk Solo Queue:** Apabila sebuah strategi memiliki `coordination_requirements = PRO_LEVEL_VOICE_REQUIRED` atau membutuhkan sinkronisasi 4–5 pemain (contoh: *level-1 multi-man invade terkoordinasi* atau *cross-map Lord bait* dengan *4-1 split*), maka **`solo_adaptation` wajib berstatus `NOT_RECOMMENDED` atau `HIGH_RISK`** beserta penjelasan alternatif aman.
2. **Pemisahan Fakta Turnamen vs Efektivitas Ranked:** Hero dengan *win rate* atau prioritas tinggi di M-Series/MPL belum tentu optimal di Solo Rank jika kekuatannya bergantung pada *peeling* teratur atau komunikasi tim (mis. hero *utility support* tanpa damage mandiri atau *draft combo* 2–3 hero).
3. **Peringatan Usia Patch:** Jika patch live saat ini telah mengubah stat hero, item, atau ekonomi lane yang menjadi fondasi strategi pro tersebut, adaptasi wajib ditandai `OUTDATED` sampai dievaluasi ulang pada patch terbaru.
4. **Konteks Tier Rank:** Setiap panduan adaptasi dianjurkan mencatat apakah prinsip tersebut sensitif terhadap perilaku pemain per tier (mis. *Epic–Legend* cenderung bermain lebih lambat/terpencar dibanding *Mythical Glory/Immortal*).
