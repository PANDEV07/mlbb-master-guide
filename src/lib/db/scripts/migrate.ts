import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createMigrationClient, inspectDatabaseWithSql } from "../client";

const PHASE_2A_TABLES = [
  "patch_versions",
  "patch_changes",
  "sources",
  "entity_evidences",
];

async function runMigrations(): Promise<void> {
  const { sql, db, config } = createMigrationClient();
  console.log(
    `[db:migrate] Target migrasi (${config.connectionMode}): ${config.maskedUrl}`
  );

  try {
    const preCheck = await inspectDatabaseWithSql(sql);
    if (!preCheck.connected) {
      throw new Error(`Koneksi pra-migrasi gagal: ${preCheck.error}`);
    }

    console.log(`[db:migrate] PostgreSQL: ${preCheck.serverVersion}`);
    console.log(
      `[db:migrate] Tabel public saat ini: ${
        preCheck.publicTables.length > 0 ? preCheck.publicTables.join(", ") : "(kosong)"
      }`
    );

    const conflictingTables = preCheck.publicTables.filter((t) =>
      PHASE_2A_TABLES.includes(t)
    );
    if (!preCheck.migrationTableExists && conflictingTables.length > 0) {
      throw new Error(
        `Ditemukan tabel existing (${conflictingTables.join(", ")}) di schema public tanpa riwayat drizzle.__drizzle_migrations. Migrasi dihentikan untuk mencegah konflik/overwrite. Lakukan inspeksi manual terlebih dahulu.`
      );
    }

    await migrate(db, { migrationsFolder: "./database/migrations" });

    const postCheck = await inspectDatabaseWithSql(sql);
    console.log(
      `[db:migrate] Migrasi SQL berhasil. Total migrasi tercatat: ${postCheck.appliedMigrationsCount ?? 0}`
    );
    console.log(
      `[db:migrate] Tabel public setelah migrasi: ${postCheck.publicTables.join(", ")}`
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

runMigrations().catch((err) => {
  console.error(
    "[db:migrate] GAGAL:",
    err instanceof Error ? err.message : String(err)
  );
  process.exit(1);
});
