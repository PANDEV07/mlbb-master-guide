# PHASE_2A_1_SCHEMA_AUDIT — Audit Skema Foundational, Provenance, & Patch Foundation

**Tanggal Audit:** `2026-11-18`  
**Objek Audit:** `src/lib/db/schema/enums.ts`, `conventions.ts`, `governance.ts`, `src/services/repositories/governanceRepository.ts`  

---

## 1. Audit Identity, Integrity, & Temporal Data

| Tabel | Primary Key & Unique Constraints | Foreign Keys & Delete Behavior | Temporal & Auditability | Penilaian |
|---|---|---|---|---|
| `patch_versions` | `id` (`uuid`, `gen_random_uuid()`); `uq_patch_versions_version_code_server_type`; `uq_patch_versions_version_order_server_type`; partial unique `uq_patch_versions_live_per_server` (`WHERE is_current_live = true`) | Tidak ada | `release_date`, `created_at`, `updated_at` (`timestamptz`), `version_order` untuk kueri kronologis | **BAIK** — Menjamin maksimal 1 patch live per server dan mencegah ambigu antara `ORIGINAL_SERVER`, `ADVANCE_SERVER`, dan `EXPERIMENTAL`. |
| `patch_changes` | `id` (`uuid`) | `patch_version_id` $\rightarrow$ `patch_versions.id` (`ON DELETE restrict`) | `created_at`, `updated_at` | **BAIK** — `ON DELETE restrict` mencegah penghapusan patch yang memiliki catatan perubahan; memiliki `target_entity_type`, `target_entity_id`, `target_entity_slug`. |
| `sources` | `id` (`uuid`); `uq_sources_name_domain` | Tidak ada | `is_active`, `created_at`, `updated_at` | **BAIK** — Memisahkan kredibilitas penerbit (`source_tier`, `source_category`) dari status klaim spesifik. |
| `entity_evidences` | `id` (`uuid`) | `source_id` $\rightarrow$ `sources.id` (`ON DELETE restrict`); `patch_version_id` $\rightarrow$ `patch_versions.id` (`ON DELETE set null`) | `verified_at`, `created_at`, `updated_at`, `patch_version_id` | **BAIK DENGAN CATATAN MINOR** — Lihat audit 10 poin Provenance di Bagian 2. |

*Catatan teknis `updated_at`:* `$onUpdate(() => new Date())` bekerja pada operasi Drizzle ORM. Jika di fase lanjut ada manipulasi SQL manual di luar Drizzle, disarankan menambahkan trigger PostgreSQL `SET updated_at = now()` saat migrasi domain Phase 2B+.

---

## 2. Audit 10 Pertanyaan Provenance Foundation (`STEP 9`)

| No | Pertanyaan Evaluasi | Jawaban & Bukti Audit |
|---|---|---|
| 1 | **Mendukung seluruh 12 logical domains?** | **YA.** `entity_evidences.entity_type` (`varchar(64)`) + `entity_id` (`uuid`) mendukung `Heroes`, `Items`, `Builds`, `Matchups`, `Counters`, `Synergies`, `Academy`, `Ranked`, `Esports`, `Patches`, `Search` (via entitas terindeks), dan `Knowledge Sources`. |
| 2 | **Entity references cukup extensible?** | **YA.** Pola `(entity_type, entity_id)` dengan index B-Tree `idx_entity_evidences_entity` dapat mengaitkan tabel domain apa pun di Phase 2B–5 tanpa mengubah skema `entity_evidences`. |
| 3 | **Verification status per evidence tersimpan?** | **YA.** `entity_evidences.verification_status` memakai `verification_status_enum` 9 nilai. |
| 4 | **Multiple sources dapat mendukung claim?** | **YA.** Banyak baris `entity_evidences` dapat merujuk ke `(entity_type, entity_id, aspect_name)` yang sama dengan `source_id` berbeda. |
| 5 | **Claim conflict dapat direpresentasikan?** | **YA.** `stance` (`SUPPORTING` \| `CONFLICTING`), `verification_status = 'CONFLICTING'`, dan `conflict_notes` menampung pertentangan antarsumber tanpa tabel terpisah `claim_conflicts` (`ADR-005`). |
| 6 | **Source retrieval date dapat disimpan?** | **GAP MINOR (`NON-BLOCKER`):** Saat ini hanya terdapat `verified_at` (tanggal verifikasi) dan `created_at` (tanggal insert ke DB), belum ada kolom terpisah `retrieved_at` (*source accessed date* saat riset awal sebelum verifikasi). |
| 7 | **Source type & credibility dipisahkan?** | **YA.** `sources.source_tier` + `sources.source_category` berada di `sources`, terpisah dari `entity_evidences.verification_status`, `claim_classification`, dan `confidence_level`. |
| 8 | **Historical patch validity dapat direpresentasikan?** | **YA.** `entity_evidences.patch_version_id` mencatat pada patch mana bukti tersebut diperiksa; bukti lama tidak terhapus ketika patch baru masuk. |
| 9 | **Evidence inheritance rules jelas?** | **YA.** Ditetapkan eksplisit di `SOURCE_VERIFICATION_POLICY.md` §4, `DATABASE_SCHEMA.md` §3, dan `PROVENANCE_INHERITANCE_MATRIX` di `governanceRepository.ts`. |
| 10 | **Risiko saat domain tables mulai dibuat?** | **ADA (Terkendali):** Referensi polimorfik `(entity_type, entity_id)` di `entity_evidences` dan `(target_entity_type, target_entity_id)` di `patch_changes` **tidak dapat** memiliki PostgreSQL native `FOREIGN KEY` constraint; integritasnya wajib dijaga di repository & seed validator (serta standarisasi konstanta `entity_type` di TypeScript pada Phase 2B). Selain itu, belum ada unique index pencegah duplikasi identik `(entity_type, entity_id, aspect_name, source_id, source_url)`. |

### Dokumentasi Temuan Minor (`entity_evidences.retrieved_at`) — Sesuai Instruksi Step 9
- **Issue:** `entity_evidences` belum membedakan tanggal akses/penemuan sumber (`retrieved_at`) dari tanggal verifikasi final (`verified_at`) atau tanggal pembuatan record (`created_at`).
- **Evidence:** Kolom pada `src/lib/db/schema/governance.ts` baris 99–116 hanya memiliki `verifiedAt`, `createdAt`, `updatedAt`.
- **Proposed solution:** Menambahkan kolom opsional `retrieved_at` (`timestamptz`) dan optional unique/dedup index pada migrasi aditif kecil di awal Phase 2B *(atau sebelum seed pertama)* tanpa merombak migrasi `0000_fearless_post.sql`.
- **Impact:** Meningkatkan ketelitian audit riset ketika URL diakses sebelum diverifikasi.
- **Migration requirements:** 1 migrasi aditif `ALTER TABLE entity_evidences ADD COLUMN retrieved_at timestamptz;` (non-destruktif).
- **Whether it blocks Phase 2B:** **Tidak memblokir (`NON-BLOCKER`)** — dapat ditambahkan bersama migrasi awal Phase 2B sebelum ingest data.

---

## 3. Audit Patch Foundation (`STEP 10`)

- `patch_versions` + `patch_changes` mendukung kronologi numerik (`version_order`), pemisahan server (`server_type`), tanggal rilis, identifikasi unik `(version_code, server_type)`, isolasi `ORIGINAL_SERVER` vs `ADVANCE_SERVER` vs `EXPERIMENTAL`, pencatatan perubahan per entitas, dan invalidasi *derived knowledge* menjadi `OUTDATED` tanpa menghapus sejarah dan tanpa membuat `patch_impact_queue`.
- **Catatan:** Bukti sumber untuk catatan rilis patch (`patch_versions` / `patch_changes`) ditautkan melalui `entity_evidences` (`entity_type = 'PATCH_VERSION' | 'PATCH_CHANGE'`) sesuai pola Lapis 2 agar tidak menduplikasi kolom URL di `patch_versions`.
