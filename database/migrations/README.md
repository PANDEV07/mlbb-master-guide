# Migrations Folder (`database/migrations/`)

Folder ini menyimpan berkas migrasi SQL PostgreSQL kronologis yang dihasilkan secara eksplisit oleh `drizzle-kit generate` (`npm run db:generate`).

- `0000_fearless_post.sql` — Migrasi foundational **Phase 2A** untuk 7 enum tata kelola & 4 tabel inti (`patch_versions`, `patch_changes`, `sources`, `entity_evidences`).
- **Aturan Ketat (`DATABASE_SCHEMA_GOVERNANCE.md`):** Jangan mengubah skema produksi menggunakan `drizzle-kit push` atau mengedit riwayat migrasi yang sudah diterapkan.
