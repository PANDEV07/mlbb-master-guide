# CURRENT_GAME_RESEARCH — Riset Awal Kondisi Game MLBB (Memerlukan Audit Sumber Ulang)

**Metadata Governance (`AGENTS.md` §2):**
- `patch_version`: `2.2.23` *(diklaim dari ringkasan pencarian; belum terverifikasi langsung dari patch note resmi)*
- `server_type`: `ORIGINAL_SERVER` *(bagian 2–4 memisahkan `ADVANCE_SERVER` & `EXPERIMENTAL` secara eksplisit)*
- `verified_at`: `2026-11-18`
- `source_ref`: `UNVERIFIED_REDIRECT_URLS` *(lihat Bagian 5 — Audit Kualitas Sumber)*
- `confidence_level`: `LOW`
- `verification_status`: `UNVERIFIED`

> [!WARNING]
> **Status Audit Phase 1.1 (`SOURCE_VERIFICATION_POLICY.md`):**
> Seluruh tautan rujukan `[1]`–`[8]` pada dokumen awal ini masih menggunakan **URL redirect sementara Google Grounding** (`vertexaisearch.cloud.google.com/grounding-api-redirect/...`), mencampur sumber blog sekunder/komunitas (`mlbbhub.com`, `timesaver.gg`, `boostroyal.com`, Reddit), dan tautan `[7]` serta `[8]` **identik/duplikat** untuk dua klaim yang berbeda.
> Oleh karena itu, seluruh klaim di bawah ini berstatus **`UNVERIFIED` / `RESEARCH GAP`** dan **dilarang** langsung diimpor ke database produksi sebelum URL kanonik resmi (`en.moonton.com` / patch notes in-game *Original Server*) diverifikasi langsung.

---

## 1. Original Server (Live Server — Status Klaim: `UNVERIFIED`)

| Category | Detail (Memerlukan Verifikasi Sumber Resmi) | Status Klaim & Sumber Sementara |
|---|---|---|
| **Current Game Version** | Diklaim Patch **2.2.23** (per 11 November 2026) | `UNVERIFIED` — `[1][2]` *(redirect sementara)* |
| **Current Season** | Diklaim **Season 42 – “Starward Decade”** (dimulai September 2026) | `UNVERIFIED` — `[2][5]` *(blog sekunder/komunitas)* |
| **Latest Official Patch** | Diklaim Patch **2.2.23** – rilis 11 Nov 2026 | `UNVERIFIED` — `[1][2]` *(redirect sementara)* |
| **Major Hero Changes** | • **Popol & Kupa** – diklaim revamp penuh (pasif baru, mekanik tunggangan, trap ditingkatkan)<br>• Buff: Xavier, Lunox, Freya, Aldous, Kaja, Melissa<br>• Nerf: Gloo, Masha, Atlas<br>• Adjustment: Lukas, Karrie, Kagura, Uranus | `UNVERIFIED` — `[3][4][5][6][7]` *(campuran media, Reddit, & `[7]` duplikat; angka detail skill belum ada — `RESEARCH GAP`)* |
| **Major Item Changes** | • **Antique Cuirass** – pengurangan physical damage per stack diklaim naik 6% → 8%<br>• **Chastise Pauldron** – pasif pengurangan attack speed diklaim disesuaikan (cap 80%)<br>• Tidak langsung: efek item hero diterapkan ke Popol & Kupa; damage talent Concussive Blast diklaim turun 50% | `UNVERIFIED` — `[1][2][3][4][5]` *(angka resmi in-game belum diverifikasi langsung)* |
| **Battlefield / Economy Changes** | • Reward gold siege minion diklaim naik 40% → 60% (tier tinggi)<br>• Penyesuaian tank minion EXP lane<br>• Talent **Concussive Blast** damage diklaim turun 50%<br>• Cooldown battle spell **Sprint** diklaim turun 100 s → 75 s | `UNVERIFIED` — `[2][8]` *(catatan: URL `[8]` duplikat dengan `[7]`)* |
| **Jungle Changes** | Pathing jungle tidak berubah menurut ringkasan awal; dampak tidak langsung dari ekonomi minion. | `UNVERIFIED` — `[2]` |
| **Turtle / Lord Changes** | Tidak ada perubahan tercatat pada ringkasan awal. | `UNVERIFIED` *(belum ada catatan patch resmi terverifikasi)* |
| **Emblem Changes** | Tidak ada rework emblem tercatat pada ringkasan awal. | `UNVERIFIED` *(belum ada catatan patch resmi terverifikasi)* |
| **Battle Spell Changes** | Sprint cooldown diklaim turun (100 s → 75 s). Spell lain tidak tercatat berubah. | `UNVERIFIED` — `[2]` |
| **Relevant Gameplay System Changes** | Pergeseran ekonomi Gold Lane, penyesuaian talent, interaksi item pada Popol & Kupa, pembaruan aset minor beberapa hero. | `UNVERIFIED` — `[2][3][4]` |

---

## 2. Advance Server (`server_type = ADVANCE_SERVER` — `UNVERIFIED`)

*Belum ada catatan patch resmi Advance Server yang terverifikasi pada audit tanggal `2026-11-18`. Data Advance Server dilarang dicampur dengan data Original Server.*

---

## 3. Experimental Features (`server_type = EXPERIMENTAL` — `UNKNOWN / UNVERIFIED`)

- **AI-Assisted Draft Assistant** — disebut sebagai prototipe sistem rekomendasi draft (*source claim: Moonton dev-blog; `verification_status = UNVERIFIED`*).
- **Dynamic Weather System** — disebut sebagai prototipe efek arena (*source claim: Moonton dev-update; `verification_status = UNVERIFIED`*).

---

## 4. Upcoming Changes / Rumors (`COMMUNITY_THEORY` — `UNVERIFIED`)

> [!CAUTION]
> Item di bawah ini berstatus rumor/spekulasi komunitas dan **bukan** fakta *Original Server*.

- **Hero Revamp “Benedetta”** — rumor roadmap Q4 (`verification_status = UNVERIFIED`, `claim_classification = COMMUNITY_THEORY`).
- **Item “Divine Shield”** — rumor Season 43 dari kebocoran komunitas (`verification_status = UNVERIFIED`, `claim_classification = COMMUNITY_THEORY`).

---

## 5. Audit Kualitas Sumber & Jejak Rujukan Sementara (`Source Audit Log`)

Seluruh tautan di bawah ini dipertahankan **hanya sebagai jejak audit** (tidak dihapus agar tidak menghilangkan riwayat riset), namun seluruhnya berstatus **`UNVERIFIED_REDIRECT_URL`** dan **wajib diganti dengan URL kanonik resmi yang dibuka langsung** pada tindak lanjut riset:

| Ref | Label Awal | URL Tercatat (Redirect Sementara) | Tier Sumber | Masalah Audit | Status |
|---|---|---|---|---|---|
| `[1]` | `mlbbhub.com` – Patch 2.2.23 overview | `https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEi6D_B-Wzx_gxz03Lo3AemRoV3yxuY5-emhCrCSTC4EYWlg4w2opxCuCb9y9lL0clbQfLazvnZJRDa0yIZK1g0hvimkw1y454d2xEXP9tGJHaj_umF` | `TIER_4_COMMUNITY` *(blog agregator)* | URL redirect sementara; bukan sumber primer resmi MOONTON. | `UNVERIFIED` |
| `[2]` | `timesaver.gg` – Patch 2.2.23 notes | `https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFsP1-qTRGZSCiVdxLLGOfslksdjGg6HhnkaCNlWkXIzOC0bgXlgtaNJl17DHlkzgK6-PFGzwW_Bn0_UGhBmq3SOQCZBsQaTlNCPkvrQGls5e1e3sZg2h-OXXJoVygfAfo=` | `TIER_4_COMMUNITY` *(blog agregator)* | URL redirect sementara; bukan sumber primer resmi MOONTON. | `UNVERIFIED` |
| `[3]` | `suaramerdeka.com` – Popol & Kupa revamp | `https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEYNY179PWKxtUpyzqPlA_1fNEshVpys-EVtTOqvHi4bQknQVxt3PTQD_NidAhaVXnXYPlb8YqXJ7_I8Z8u0e_9jVpoUyfAxoxRKMsJL6neAxLoyPiaNTN74de6GULQ0-O-6Z0JXRbp-zikzpNKUzDOWFT-3XC4MYALzmsGzNvsOzcOwqdyFzEHAMCQyzTYlT1ISQZaJPm3iHUmRt2qyuxxXqqVkpYukXVDoSxWtXZ5pboYpaZAAPTrcl0UfdiBvP6DK_56OTA_vPaYr26c_-Tl-Kg=` | `TIER_2_SECONDARY` / Media umum | URL redirect sementara; perlu konfirmasi patch notes resmi. | `UNVERIFIED` |
| `[4]` | YouTube – Xavier & Lunox Buffs (official dev stream) | `https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG6HfkFK7Zq15jk43f2EWt2rexpNRDIMh11JIDCXI3QjSEmd3jqqRSWoH1q6RZTTKtMbnizOgulQ9ceqvVuaxbWkaKURFEayi9DO89Mq8UEv_S5X79wjeQux4q9eYMulA==` | `TIER_1_OFFICIAL` *(klaim dev stream)* | URL redirect sementara; URL video YouTube kanonik & timestamp belum diverifikasi langsung. | `UNVERIFIED` |
| `[5]` | `boostroyal.com` – Season 42 announcement | `https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFS2pVEmJbx9x-gPaSrtAAHkryz2k4LKXu_2yfvK-K7ERFoO9LYW9bVZE4Izkum1jHextIBStOMV9nps0gkW56iwsX1B3ag6FES0ZzVUj7c2hZuaOR4OHY3` | `TIER_4_COMMUNITY` *(blog komersial)* | URL redirect sementara; bukan sumber resmi Season 42. | `UNVERIFIED` |
| `[6]` | Reddit – Popol & Kupa detailed guide | `https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQF7h1niHIn5IyBZyLYdg5fTSlf25uXwirEliz4Q1Gc6PHWmS6PKnjzIBmfyPj5K1x6rpQJ6rOnYCXXm-Thd-jd8Z59TjsS6N71RJxpB6MVx5fqjkaPXWSoIgVmOnh2BGkxqR0OUOVO6OzAGnypCqKY2xgSCCsMEGMVKPI9C-vg6vxHHsHDcI7SrSyXzWrJm` | `TIER_4_COMMUNITY` *(Reddit)* | Tidak sah sebagai bukti fakta mekanik resmi menurut `SOURCE_VERIFICATION_POLICY.md`. | `UNVERIFIED` |
| `[7]` | Liquipedia – Gloo/Masha nerfs | `https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG4JejOha9RdpScAscIfqpGEkVNIsZ6lXHhMkQ1M8dwMbHl5n8df8TV0zIIpzCsKpE547AQwxFnAxwfdqt1lrTIxffPLXFbLd5rDs3noWf4-RcY5vV-bqMAk2qTnU2S-Io=` | `TIER_2_SECONDARY` | URL redirect sementara **DAN duplikat identik dengan `[8]`**. | `UNVERIFIED` *(Invalid/Duplicate URL)* |
| `[8]` | `timesaver.gg` – Battlefield & Talent changes | `https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG4JejOha9RdpScAscIfqpGEkVNIsZ6lXHhMkQ1M8dwMbHl5n8df8TV0zIIpzCsKpE547AQwxFnAxwfdqt1lrTIxffPLXFbLd5rDs3noWf4-RcY5vV-bqMAk2qTnU2S-Io=` | `TIER_4_COMMUNITY` | URL redirect sementara **DAN duplikat identik dengan `[7]`**. | `UNVERIFIED` *(Invalid/Duplicate URL)* |
