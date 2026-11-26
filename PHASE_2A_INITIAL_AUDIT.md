# PHASE_2A_INITIAL_AUDIT — Audit Kondisi Awal Proyek Sebelum Implementasi Database Foundation

**Tanggal Audit:** `2026-11-18`  
**Fase:** `Phase 2A — Database Foundation & Schema Governance`  
**Rujukan Utama:** [ARCHITECTURE_FOUNDATION_FREEZE.md](docs/architecture/ARCHITECTURE_FOUNDATION_FREEZE.md)  

---

## 1. Existing Infrastructure

- **Aplikasi Web:** Next.js `15.5.29` (App Router), React `19.3.1`, TypeScript `5.9.3` (`strict: true`), Tailwind CSS `4.3.5`, Lucide React `0.511.0`. Seluruh validasi (`npm run typecheck`, `npm run lint`, `npm run build`) telah lulus pada Phase 0.5.1.
- **Direktori Database (`database/`):** Baru berisi folder dan berkas dokumentasi placeholder (`README.md`, `schema/README.md`, `migrations/README.md`, `seeds/README.md`). Belum terdapat berkas skema Drizzle, berkas `.sql`, maupun skrip seed.
- **Direktori Aplikasi (`src/`):**
  - `src/lib/` baru berisi `cn.ts` dan `metadata.ts`.
  - `src/types/knowledge.ts` berisi kontrak tipe governance awal Phase 0.5 (`VerificationStatus` 5 nilai, `ClaimClassification` 5 nilai, `KnowledgeGovernanceMeta` dengan `sourceLabel: string | null`).
  - `src/services/knowledgePolicy.ts` berisi `PROJECT_TRACK_STATUS`, `CLAIM_CLASSIFICATION_LABELS`, dan `createPendingGovernanceMeta()`.
- **Ketersediaan Database Host:** PostgreSQL (`psql`, `pg_isready`, `docker`, maupun direktori `C:\Program Files\PostgreSQL`) **tidak tersedia** di environment eksekusi saat ini, dan variabel environment `DATABASE_URL` belum ditetapkan.

---

## 2. Existing Database-Related Dependencies

Hasil inspeksi `package.json`:
- **Dependencies:** `lucide-react`, `next`, `react`, `react-dom` — **belum ada** paket database/ORM (`drizzle-orm`, driver PostgreSQL `postgres`/`pg`, maupun `drizzle-kit`).
- **DevDependencies:** `@eslint/eslintrc`, `@tailwindcss/postcss`, `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next`, `tailwindcss`, `typescript` — belum ada `tsx` atau `dotenv` untuk menjalankan skrip CLI database TypeScript.

---

## 3. Existing Configuration

- `tsconfig.json`: `strict: true`, path alias `@/* -> ./src/*`, `moduleResolution: "bundler"`, `noEmit: true`.
- `eslint.config.mjs`: Flat config ESLint 9 (`next/core-web-vitals`, `next/typescript`) dengan `ignores` untuk `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.
- `.gitignore`: Sudah mengabaikan `/node_modules`, `/.next/`, `.env`, `.env*.local`, `*.tsbuildinfo`, `next-env.d.ts`.
- **Tidak ada** `drizzle.config.ts` maupun `.env.example`.
- **Skrip `package.json` saat ini:** Hanya `dev`, `build`, `start`, `lint`, `typecheck` — belum ada skrip `db:*`.

---

## 4. Existing Files That Can Be Reused

1. `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`, `.gitignore` — tetap dipertahankan.
2. `database/` struktur folder (`schema/`, `migrations/`, `seeds/`) — digunakan sebagai lokasi migrasi SQL (`database/migrations/`) dan dokumentasi skema tanpa mengubah struktur utama.
3. `src/types/knowledge.ts` & `src/services/knowledgePolicy.ts` — tipe & konstanta UI yang ada tetap dipertahankan kompatibilitasnya agar halaman skeleton tidak rusak, sambil diperluas dengan tipe governance kanonik sesuai `SOURCE_VERIFICATION_POLICY.md`.
4. `src/app/*`, `src/components/*`, `src/features/*`, `src/data/platformModules.ts` — tidak disentuh dalam Phase 2A.

---

## 5. Conflicts with Architecture Foundation Freeze

1. **Ketidaksinkronan `src/types/knowledge.ts`:** `VerificationStatus` hanya memiliki 5 nilai (belum mencakup `PARTIALLY_VERIFIED`, `OUTDATED`, `CONFLICTING`, `UNKNOWN`, `NOT_RESEARCHED`, `NOT_FOUND`) dan `ClaimClassification` belum memiliki `SECONDARY_SOURCE`. Selain itu, `KnowledgeGovernanceMeta` masih memakai `sourceLabel` tunggal, bukan model provenance 2-lapis (`ADR-005`).
2. **Ketiadaan Drizzle ORM & PostgreSQL Driver (`ADR-002`, `ADR-003`):** Belum ada paket maupun konfigurasi untuk migrasi SQL eksplisit.

---

## 6. Missing Infrastructure

1. Paket `drizzle-orm`, driver PostgreSQL (`postgres`), `drizzle-kit`, `tsx`, dan `dotenv`.
2. Konfigurasi `drizzle.config.ts` & templat `.env.example`.
3. Lapisan database (`src/lib/db/env.ts`, `client.ts`, `index.ts`, `schema/`, `scripts/`) serta repository foundation governance (`src/services/repositories/`).
4. Dokumen tata kelola skema `docs/architecture/DATABASE_SCHEMA_GOVERNANCE.md`.
5. Skema Drizzle foundational (`patch_versions`, `patch_changes`, `sources`, `entity_evidences`) beserta migrasi SQL awal di `database/migrations/`.
6. Skrip validasi database & migrasi (`db:generate`, `db:migrate`, `db:check`, `db:studio`, `db:validate`).

---

## 7. Planned Changes (Strict Phase 2A Scope)

1. Memasang `drizzle-orm`, `postgres`, `dotenv` (dependencies) serta `drizzle-kit`, `tsx` (devDependencies) tanpa mengubah versi Next.js/React/Tailwind/TypeScript yang sudah ada.
2. Membuat `.env.example` dan validasi environment `DATABASE_URL` portabel di `src/lib/db/env.ts`.
3. Membuat `drizzle.config.ts`, `src/lib/db/client.ts`, dan `src/lib/db/index.ts`.
4. Menyusun `docs/architecture/DATABASE_SCHEMA_GOVERNANCE.md` sebagai aturan baku skema Phase 2A–8.
5. Mengimplementasikan **hanya** foundational schema governance & patch (`enums.ts`, `conventions.ts`, `governance.ts`: `patch_versions`, `patch_changes`, `sources`, `entity_evidences`) di `src/lib/db/schema/` — **tanpa** tabel hero, item, build, matchup, counter, esports, atau user.
6. Membuat `src/services/repositories/` fondasi (*read-only* governance & patch lookup) + menyelaraskan tipe kanonik di `src/types/knowledge.ts`.
7. Menghasilkan migrasi SQL eksplisit pertama di `database/migrations/` melalui `npm run db:generate` dan menambahkan skrip validasi `db:check`, `db:migrate`, `db:validate`.
8. Menjalankan seluruh quality check yang tersedia di environment (dan mencatat status `NOT_RUN` / `BLOCKED` secara jujur untuk eksekusi live PostgreSQL karena PostgreSQL tidak tersedia di host).
