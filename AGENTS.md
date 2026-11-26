# AGENTS.md — Pedoman Permanen untuk AI Coding Agents

Dokumen ini berisi aturan permanen yang **wajib** dipatuhi oleh seluruh AI coding agents saat meneliti, memodifikasi, atau mengembangkan **MLBB Master Guide**. Seluruh dokumentasi dan antarmuka proyek ini menggunakan **Bahasa Indonesia** kecuali untuk istilah teknis baku atau nama entitas resmi.

---

## 1. Integritas Data (*Data Integrity*)

1. **Dilarang Mengarang Fakta MLBB:** Jangan pernah memalsukan atau menebak angka statistik hero, scaling skill, stat item, win rate, tanggal turnamen, atau hasil pertandingan.
2. **Ketertelusuran Sumber:** Setiap klaim faktual mengenai game dan esports pada akhirnya harus memiliki rujukan sumber yang jelas dan dapat diverifikasi.
3. **Klasifikasi Status Pengetahuan:** Setiap informasi pengetahuan harus dibedakan secara tegas ke dalam salah satu kategori berikut *(detail hirarki sumber & padanan enum lihat `docs/research/SOURCE_VERIFICATION_POLICY.md`)*:
   - `VERIFIED FACT` (`OFFICIAL_FACT`) — Fakta terverifikasi langsung dari sumber resmi atau data pertandingan nyata.
   - `SECONDARY_SOURCE` — Fakta historis yang baru didukung database sekunder terpercaya dan belum dikonfirmasi sumber primer resmi.
   - `RESEARCH-BASED ANALYSIS` — Analisis berbasis sampel data terverifikasi dan metode terukur.
   - `STRATEGIC INTERPRETATION` — Interpretasi taktis/strategis dari pengamatan gameplay.
   - `COMMUNITY THEORY` — Teori, opini, atau eksperimen komunitas yang belum teruji menyeluruh.
   - `UNKNOWN / UNVERIFIED` — Informasi belum tersedia, belum diverifikasi, atau bertentangan.
4. **Dilarang Menyamarkan Spekulasi:** Jangan pernah menyajikan bocoran, rumor, atau konten *Advance Server* / *Experimental* sebagai fakta *Original Server*.

---

## 2. Kesadaran Patch (*Patch Awareness*)

MLBB terus mengalami pembaruan keseimbangan dan sistem. Oleh karena itu, setiap record pengetahuan game wajib mendukung metadata:
- `patch_version` (versi patch saat diverifikasi, contoh `2.2.23`)
- `server_type` (`ORIGINAL_SERVER`, `ADVANCE_SERVER`, atau `EXPERIMENTAL`)
- `verified_at` (tanggal verifikasi terakhir)
- `source_ref` (tautan atau ID sumber rujukan)
- `confidence_level` (`HIGH`, `MEDIUM`, `LOW`)
- `verification_status` (`VERIFIED`, `PARTIAL` / `PARTIALLY_VERIFIED`, `UNVERIFIED`, `STALE` / `OUTDATED`, `CONFLICTING`, `UNKNOWN`, `NOT_RESEARCHED`, `NOT_YET_AVAILABLE`, `NOT_FOUND` — lihat aturan rinci di `docs/research/SOURCE_VERIFICATION_POLICY.md` dan `docs/research/PATCH_UPDATE_SYSTEM.md`)

Jangan pernah memperlakukan panduan atau analisis dari patch lama seolah-olah masih berlaku pada patch terbaru tanpa pemeriksaan ulang.

---

## 3. Integritas Riset (*Research Integrity*)

**Dilarang Keras Memalsukan atau Menebak:**
- Statistik hero (*win rate, pick rate, ban rate, base stats*)
- Statistik atau efek item
- Mekanika skill atau interaksi pasif
- Hasil turnamen, jadwal, atau prize pool
- Data draft pertandingan (*pick/ban order*)
- Statistik pemain profesional
- Informasi roster atau organisasi tim
- URL sumber (termasuk URL berita atau endpoint yang tidak pernah dibuka/dikonfirmasi)
- Endpoint API (termasuk mengklaim keberadaan API publik resmi yang tidak terdokumentasi)
- Link video atau ID playlist VOD YouTube

Apabila suatu informasi belum ditemukan atau belum diverifikasi langsung, tandai secara eksplisit sebagai `UNVERIFIED`, `NOT_YET_AVAILABLE`, atau `UNAVAILABLE`.

---

## 4. Analisis Kompetitif (*Competitive Analysis*)

Setiap wawasan kompetitif dari ranah esports profesional harus dapat dilacak ke pertandingan, turnamen, draft, atau sumber kredibel yang nyata.

Saat menerjemahkan strategi profesional ke panduan pemain, wajib memisahkan 5 pertanyaan inti:
1. **Apa yang benar-benar dilakukan tim profesional?** (*Observed Evidence*)
2. **Mengapa strategi tersebut berhasil?** (*Strategic Interpretation*)
3. **Kondisi apa yang memungkinkan strategi itu berjalan?** (*Required Conditions*, mis. komunikasi suara, komposisi draft, *lane priority*)
4. **Apakah realistis diterapkan di Ranked?** (*Adaptation Check*)
5. **Apa risikonya bila diterapkan pada Solo, Duo, Trio, dan 5-Man?** (*Mode-Specific Risk*)

Jangan pernah mendorong pengguna untuk meniru strategi tim pro secara mentah tanpa konteks koordinasi.

---

## 5. Standar Pengembangan (*Development Standards*)

- **Gunakan TypeScript (`strict: true`):** Hindari `any` sebisa mungkin; definisikan kontrak tipe di `src/types/`.
- **Arsitektur Modular:** Pisahkan komponen UI generik (`src/components/ui`), komponen bersama (`src/components/shared`), tata letak (`src/components/layout`), dan logika domain (`src/features/`).
- **Hindari Komponen Terlalu Besar:** Pecah halaman atau panel kompleks menjadi sub-komponen kecil dengan tanggung jawab tunggal yang dapat digunakan ulang.
- **Desain Responsif & Aksesibilitas:** Pastikan seluruh antarmuka berfungsi baik di desktop maupun mobile, menggunakan kontras tema gelap yang nyaman, navigasi keyboard yang baik, dan elemen semantik HTML (`nav`, `main`, `header`, `footer`, `aria-label`).
- **Hindari Duplikasi & Hardcode:** Sentralisasikan konfigurasi navigasi, metadata modul, dan definisi status agar tidak tersebar.
- **Jangan Buat Data Produksi Palsu:** Dilarang mengisi database, file JSON, atau komponen UI dengan hero, item, atau skor pertandingan karangan demi mengisi tampilan halaman. Gunakan *meaningful empty state* selama fase riset masih berlangsung.
- **Jaga Dokumentasi Tetap Mutakhir:** Setiap perubahan arsitektur, dependensi, atau status fase wajib dicatat di `PROJECT_STATUS.md` dan `docs/`.
