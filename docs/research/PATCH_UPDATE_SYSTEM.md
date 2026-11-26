# PATCH_UPDATE_SYSTEM — Sistem Pengetahuan Sadar-Patch MLBB Master Guide

**Tanggal:** `2026-11-18`  
**Versi:** `2.0 (Phase 1.3 Frozen Specification — Selaras ADR-006)`  
**Tujuan:** Menjamin platform memisahkan versi patch & lingkungan server, menjaga identitas entitas tetap stabil, mendukung rekonstruksi historis secara akurat, dan menandai *derived knowledge* yang berpotensi usang (`OUTDATED`) saat patch baru rilis.

---

## 1. Pemisahan Lingkungan Server & Jenis Patch

Setiap record `patch_versions` wajib memiliki identifikasi jelas:
1. **`ORIGINAL_SERVER`:** Server live resmi tempat ranked dan turnamen utama berjalan. Menjadi satu-satunya acuan default rekomendasi pemain.
2. **`ADVANCE_SERVER`:** Server pengujian pra-rilis. Perubahan di sini **tidak boleh** memodifikasi data `ORIGINAL_SERVER` maupun masuk ke rekomendasi live.
3. **`EXPERIMENTAL`:** Konsep atau prototipe yang belum terkonfirmasi masuk ke klien live. Diisolasi penuh dari data produksi.
4. **Jenis Rilis Patch:** *Major Season Patch*, *Balance Patch*, dan *Hotfix / Emergency Adjustment*.

---

## 2. Entity Identity vs Versioned Data & Rekonstruksi Historis (`ADR-006`)

Arsitektur mengadopsi **Hybrid Temporal Model**:
1. **Stable Entity Identity:**
   - `heroes` dan `items` menyimpan identitas permanen (`id`, `slug`, `official_name`) yang tidak pernah berubah antar patch sehingga seluruh foreign key pada `builds`, `matchups`, `counters`, `synergies`, `draft_actions`, dan `game_player_performances` tetap stabil.
   - Data yang berubah antar patch atau revamp disimpan pada **`hero_version_profiles`** dan **`item_version_profiles`** menggunakan *Slowly Changing Dimension (SCD) Type 2* (`valid_from_patch_id`, `valid_until_patch_id`, `is_current`, `server_type`).
   - `hero_skills` (kunci logis stabil `hero_id + slot_key`) dan `game_fundamentals` (kunci logis stabil `slug`) memakai *SCD Type 2* langsung tanpa tabel identitas tambahan karena tidak ada tabel eksternal yang memegang FK permanen ke baris versi individu tersebut.
2. **Derived Knowledge (Patch Reference + Status `OUTDATED`):**
   - `builds`, `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`, `academy_lessons`, `competitive_insights`, dan `pro_to_ranked_adaptations` menyimpan `patch_version_id` tempat panduan tersebut dibuat/diverifikasi serta `verification_status` (`VERIFIED` / `OUTDATED` / dll.).
3. **Kemampuan Rekonstruksi Historis (Tanpa Bergantung pada Flag `OUTDATED`):**
   - **Stats Hero/Item pada Patch $X$:** Query SCD Type 2 `valid_from <= X AND (valid_until IS NULL OR valid_until > X)` pada `server_type = 'ORIGINAL_SERVER'`.
   - **Diff Patch $X$ vs Patch $Y$:** Perbandingan langsung dua snapshot profil + log terstruktur pada `patch_changes`.
   - **Deteksi Build/Analisis Patch Lama:** Membandingkan `builds.patch_version_id` terhadap `patch_versions.is_current_live` sekaligus `verification_status = 'OUTDATED'`.
   - **Akurasi Esports Historis:** `match_games.patch_version_id` mengunci versi patch aktual saat pertandingan dimainkan; fakta historis `match_games` dan `match_observations` **tidak pernah** diubah menjadi `OUTDATED` ketika patch baru rilis.

---

## 3. Lifecycle Pembaruan Pengetahuan (*7-Stage Patch Lifecycle*)

```text
[1. Research] -> [2. Verification] -> [3. Knowledge Update] -> [4. Patch Association]
      -> [5. Historical Preservation] -> [6. Review (OUTDATED Detection)] -> [7. Publication]
```

1. **Research:** Pengumpulan catatan perubahan dari klien *Original Server* dan pengumuman resmi MOONTON (`en.moonton.com` / patch notes in-game).
2. **Verification:** Validasi sesuai `SOURCE_VERIFICATION_POLICY.md` (`TIER_1_OFFICIAL` untuk stat/skill/item). Perubahan Advance Server diisolasi.
3. **Knowledge Update:** Pencatatan diff ke `patch_changes` (`target_entity_type`, `target_entity_id`, `change_type`, `attribute_name`, `previous_value`, `new_value`).
4. **Patch Association:** Penautan perubahan dan snapshot versi baru ke `patch_version_id` baru.
5. **Historical Preservation:** Penutupan `valid_until_patch_id` (`is_current = false`) pada versi profil lama tanpa menghapus data atau mengubah `match_games` historis.
6. **Review (*Patch Dependency & Invalidation*):**
   - Pada MVP, **tidak** dibuat tabel workflow `patch_impact_queue` (`ADR-006`).
   - Dalam transaksi update patch, entitas *derived knowledge* yang bergantung pada entitas berubah ditandai `verification_status = 'OUTDATED'` tanpa menghapus `patch_version_id` asalnya.
7. **Publication:** Kurator memfilter entitas `verification_status = 'OUTDATED'` di PostgreSQL, mengaudit ulang terhadap patch terbaru, memperbarui `patch_version_id`, dan memulihkan status menjadi `VERIFIED` sebelum revalidate cache UI.

---

## 4. Matriks Dependensi & Invalidation (`OUTDATED`)

| Perubahan di `patch_changes` | Entitas Core (SCD Type 2) | Derived Knowledge yang Otomatis Ditandai `OUTDATED` |
|---|---|---|
| **Hero Stat / Skill / Revamp** (`hero_id`) | Tutup versi lama & buat baris baru di `hero_version_profiles` / `hero_skills` | `builds` milik hero tsb; `hero_matchups` (sebagai subject maupun opponent); `hero_counters` (sebagai counter maupun target); `hero_synergies` yang melibatkan hero tsb; `competitive_insights` & `pro_to_ranked_adaptations` terkait strategi hero tsb. *(Fakta `match_games` & `match_observations` historis tetap utuh.)* |
| **Item Stat / Passive / Cost / Recipe** (`item_id`) | Tutup versi lama & buat baris baru di `item_version_profiles` (`+ item_effects / item_components`) | `builds` yang memuat `item_id` tsb pada `build_items` (core maupun alternatif); `item_counters` untuk `item_id` tsb; `hero_matchups` yang menyebut item timing terkait; `competitive_insights` & `pro_to_ranked_adaptations` yang bergantung pada item tsb. |
| **Emblem / Talent / Battle Spell** | Tutup versi lama & buat baris baru di `emblems` / `battle_spells` | Seluruh `builds` yang memakai emblem/spell tsb serta `hero_matchups` terkait. |
| **Map / Minion / Jungle / Turtle / Lord / Tower** | Tutup versi lama & buat baris baru di `game_fundamentals` | `academy_lessons` (terutama Macro: *Jungle Pathing*, *Wave Management*, *Objective Control*, *Tempo*) serta `competitive_insights` / `pro_to_ranked_adaptations` yang bergantung pada aturan lama. |

---

## 5. Perlindungan Tampilan Pengguna (*Anti-Stale UI Policy*)

1. Setiap detail hero, item, build, matchup, counter, dan strategi menampilkan badge `patch_version` terakhir diverifikasi.
2. Konten dengan `verification_status = 'OUTDATED'` wajib menampilkan peringatan eksplisit bahwa panduan disusun untuk patch sebelumnya.
3. Query default aplikasi selalu menyaring `server_type = 'ORIGINAL_SERVER'` dan `is_current = true` (kecuali saat pengguna membuka arsip patch historis atau studi turnamen lama).
