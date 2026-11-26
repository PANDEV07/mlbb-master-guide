# DATABASE_SCHEMA_GOVERNANCE — Tata Kelola & Standar Skema Basis Data

**Tanggal:** `2026-11-18`  
**Fase:** `Phase 2A — Database Foundation & Schema Governance`  
**Rujukan:** [ARCHITECTURE_FOUNDATION_FREEZE.md](ARCHITECTURE_FOUNDATION_FREEZE.md), [DATABASE_SCHEMA.md](../research/DATABASE_SCHEMA.md), [SOURCE_VERIFICATION_POLICY.md](../research/SOURCE_VERIFICATION_POLICY.md)

Dokumen ini menetapkan aturan baku bagi seluruh definisi tabel Drizzle ORM (`src/lib/db/schema/`) dan migrasi PostgreSQL (`database/migrations/`) mulai Phase 2A hingga Phase 8.

---

## 1. Naming Conventions

| Elemen | Standar Baku | Contoh Benar | Contoh Dilarang |
|---|---|---|---|
| **Table Naming** | `snake_case`, jamak (*plural*), deskriptif domain | `patch_versions`, `hero_version_profiles`, `entity_evidences` | `Hero`, `patchVersion`, `tbl_items` |
| **Column Naming** | `snake_case`, jelas & tidak ambigu | `version_code`, `is_current_live`, `valid_from_patch_id` | `versionCode`, `ver`, `flag1` |
| **Primary Keys** | `id` bertipe `uuid` (`defaultRandom()`) | `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` | `heroId`, `pk_id` |
| **Foreign Keys** | `<singular_target>_id` (atau peran spesifik `<role>_<target>_id`), tipe `uuid` | `patch_version_id`, `source_id`, `subject_hero_id`, `blue_team_id` | `fk_patch`, `hero` |
| **Indexes** | `idx_<table>_<col1>_<col2>` | `idx_entity_evidences_entity_type_entity_id` | `index1`, `evidences_idx` |
| **Unique Constraints** | `uq_<table>_<col1>_<col2>` | `uq_patch_versions_version_code_server_type` | `uniq_code` |
| **Partial Unique Indexes** | `uq_<table>_<scope>_active` (atau `_current` / `_live`) | `uq_patch_versions_live_per_server` (`WHERE is_current_live = true`) | Nama tanpa konteks kondisi parsial |
| **Enum Naming** | `<domain>_<concept>_enum` di PostgreSQL, `snake_case` | `server_type_enum`, `verification_status_enum` | `StatusEnum`, `enum_1` |
| **Junction Tables** | `<entity_a>_<entity_b>` atau nama relasi taktis yang eksplisit | `hero_matchups`, `hero_counters`, `team_rosters` | `rel_1_2`, `hero_to_hero` |

---

## 2. Data Types Standards

| Tipe Data | Standar Penggunaan | Catatan & Aturan |
|---|---|---|
| **UUID (`uuid`)** | Primary key & Foreign key di seluruh tabel transaksional dan master | Menggunakan `uuid` (`defaultRandom()`) agar portabel, aman untuk seed lintas lingkungan, dan konsisten untuk rujukan polimorfik (`entity_evidences.entity_id`). *(Integer `serial` tidak dipakai untuk entitas utama.)* |
| **Integer (`integer`)** | Angka diskrit: `version_order`, `total_cost`, `duration_seconds`, `action_order`, `kills`, `deaths`, `assists` | Gunakan constraint `CHECK` non-negatif bila relevan pada tabel fase domain. |
| **Numeric (`numeric`)** | Angka desimal presisi eksak (`presence_rate`, `win_rate`, persentase scaling) | Hindari `float`/`real` untuk statistik dan persentase agar tidak muncul galat pembulatan. |
| **Varchar vs Text** | `varchar(n)` untuk kode/slug/enum teks terikat panjang (`version_code`, `entity_type`, `verified_by`); `text` untuk deskripsi, ringkasan, URL, excerpt | Jangan membatasi URL atau excerpt dengan `varchar(255)` yang terlalu pendek. |
| **JSONB (`jsonb`)** | **Hanya** untuk payload heterogen yang strukturnya bervariasi antar entitas dan **wajib** memiliki kontrak TypeScript/validasi | Contoh sah: `base_stats_json`, `scaling_json`, `stats_json`, `power_spikes_json`, `solo_guidance_json`, `aliases`. |
| **Timestamp (`timestamptz`)** | Seluruh kolom waktu (`created_at`, `updated_at`, `verified_at`, `scheduled_at`) | Wajib menggunakan `timestamp({ withTimezone: true })` (UTC-safe). |
| **Date (`date`)** | Tanggal kalender murni tanpa jam (`release_date`, `start_date`, `end_date`) | Gunakan `date` untuk jadwal event/rilis patch harian. |
| **Boolean (`boolean`)** | Flag biner eksplisit berawalan `is_` atau `has_` (`is_current_live`, `is_current`, `is_active`, `is_core`) | Wajib `NOT NULL` dengan `DEFAULT` eksplisit; hindari boolean nullable. |
| **Nullable Fields** | Hanya diizinkan jika *ketiadaan nilai* bermakna valid secara domain (mis. `valid_until_patch_id = NULL` berarti masih berlaku, `verified_at = NULL` berarti belum diverifikasi) | Jangan menjadikan kolom nullable untuk menutupi ketidaktahuan status (`NOT_RESEARCHED` harus memakai enum `verification_status`). |

### Kapan Menggunakan `JSONB` vs Normalisasi Relasional
- **Wajib Dinormalisasi ke Tabel/Kolom Relasional** apabila field tersebut:
  1. Menjadi target `FOREIGN KEY` (mis. `hero_id`, `item_id`, `patch_version_id`, `source_id`).
  2. Dipakai untuk filter/join inti atau agregasi SQL (mis. `server_type`, `verification_status`, `is_current`, `kills`, `picks_count`).
  3. Memiliki aturan integritas ketat (mis. `item_effects.unique_group_key`, `draft_actions.action_order`).
- **Boleh Menggunakan `JSONB`** apabila atribut bersifat heterogen per tipe entitas (mis. variasi tipe stat pada `item_version_profiles.stats_json` atau parameter scaling skill multi-level pada `hero_skills.scaling_json`) dan tidak memerlukan FK ke baris lain.

---

## 3. Temporal Data & Historical Preservation

1. **Audit Timestamps Standar:** Setiap tabel wajib memiliki `created_at` (`timestamptz NOT NULL DEFAULT now()`) dan `updated_at` (`timestamptz NOT NULL DEFAULT now()`).
2. **Patch Version Validity (Core Entities — SCD Type 2):**
   - `hero_version_profiles`, `hero_skills`, `item_version_profiles`, `item_effects`, `item_components`, `emblems`, `battle_spells`, dan `game_fundamentals` menggunakan `valid_from_patch_id`, `valid_until_patch_id` (`NULL` = aktif), `is_current`, dan `server_type`.
   - Perubahan patch **dilarang** menimpa (*overwrite*) baris versi patch lama. Baris lama ditutup (`valid_until_patch_id = P_baru`, `is_current = false`) dan baris baru disisipkan (`valid_from_patch_id = P_baru`, `is_current = true`).
3. **Derived Knowledge & Flag `OUTDATED`:**
   - Entitas analisis turunan menyimpan `patch_version_id` tempat analisis dibuat dan `verification_status`. Ketika entitas inti berubah pada patch baru, analisis terdampak ditandai `verification_status = 'OUTDATED'` tanpa menghapus `patch_version_id` asalnya.
4. **Historical Reconstruction:**
   - Rekonstruksi data Patch $X$ wajib menggunakan rentang `valid_from_patch_id` / `valid_until_patch_id` (melalui `patch_versions.version_order`) + `patch_changes`, **bukan** mengandalkan flag `OUTDATED`.
   - Fakta pertandingan historis (`match_games`, `match_observations`) bersifat *immutable* terhadap rilis patch baru (tidak pernah ditandai `OUTDATED`).

*(Catatan Scope Phase 2A: Tabel domain SCD Type 2 seperti `hero_version_profiles` dan `item_version_profiles` belum diimplementasikan pada Phase 2A dan akan dibuat bertahap pada Phase 2B.)*

---

## 4. Provenance Governance

Mengacu penuh pada [SOURCE_VERIFICATION_POLICY.md](../research/SOURCE_VERIFICATION_POLICY.md) dan `ADR-005`:
1. **Model 2-Lapis:**
   - **Lapis 1 (Embedded Columns):** Kolom `claim_classification`, `verification_status`, `confidence_level`, `patch_version_id`, `verified_at`, dan `verified_by` pada entitas utama.
   - **Lapis 2 (Multi-Source & Conflict Evidence):** Tabel `sources` dan `entity_evidences` mencatat rujukan sumber per aspek (`aspect_name`), kutipan bukti (`evidence_excerpt`), dan pertentangan antarsumber (`stance = 'CONFLICTING'` + `conflict_notes`).
2. **Aturan Provenance Inheritance & Independensi:**
   - Pewarisan provenance **tidak universal**. Status `VERIFIED` pada parent tidak otomatis menjadikan child `VERIFIED`.
   - Pewarisan struktural hanya diizinkan pada `item_components`/`item_effects` $\leftarrow$ `item_version_profiles`, `build_items` $\leftarrow$ `builds`, dan kondisional `draft_actions`/`game_player_performances` $\leftarrow$ `match_games`.
   - Klaim independen (`hero_skills`, `hero_matchups`, `hero_counters`, `item_counters`, `hero_synergies`, `builds`, `match_observations`, `competitive_insights`, `pro_to_ranked_adaptations`, serta aspek terpisah pada `competition_events`) wajib menyimpan dan mengevaluasi status verifikasi serta buktinya masing-masing.
3. **Integritas URL Sumber:** URL redirect sementara atau kanal umum tanpa tautan spesifik wajib berstatus `UNVERIFIED`.

---

## 5. Migration Governance

Seluruh perubahan skema PostgreSQL wajib mematuhi aturan berikut:
1. **Explicit Migrations Only:** Setiap perubahan DDL harus dihasilkan atau dicatat sebagai berkas migrasi `.sql` kronologis di `database/migrations/` melalui `npm run db:generate` (`drizzle-kit generate`).
2. **No Silent Schema Alteration:** **Dilarang** menggunakan `drizzle-kit push` atau menjalankan `ALTER TABLE` manual di environment produksi/staging karena melewati jejak audit `database/migrations/`.
3. **No Undocumented Destructive Migration:** Operasi destruktif (`DROP TABLE`, `DROP COLUMN`, pemotongan tipe data) dilarang tanpa dokumentasi alasan, rencana backup/migrasi data, dan persetujuan eksplisit.
4. **No Silent Deletion of Historical Data:** Data patch lama, catatan perubahan, maupun fakta pertandingan historis tidak boleh dihapus saat patch baru dirilis.
5. **Mandatory Change Justification & Validation:** Setiap berkas migrasi baru wajib disertai:
   - Alasan perubahan dan rujukan fase/ADR terkait.
   - Hasil review isi file `.sql` yang dihasilkan sebelum dieksekusi.
   - Strategi validasi (`npm run db:validate`, `npm run db:migrate`, dan `npm run db:check` terhadap database target).
6. **Supabase Connection & Security Policy:**
   - Migrasi wajib dijalankan melalui `DIRECT_DATABASE_URL` atau `DATABASE_URL` pada mode Direct/Session Pooler (`:5432`), dilarang melalui Transaction Pooler (`:6543`).
   - Aplikasi runtime menggunakan Drizzle ORM dari sisi server saja; pada Supabase live, schema `public` tidak boleh dibiarkan terbuka ke Data API PostgREST `anon` tanpa proteksi (nonaktifkan eksposur `public` di API Settings atau aktifkan RLS *deny-by-default* untuk `anon`).
