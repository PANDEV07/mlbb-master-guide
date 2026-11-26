import fs from "node:fs";
import path from "node:path";
import { checkDatabaseConnection, closeDatabaseConnection } from "../client";
import { validateDatabaseEnv, validateMigrationDatabaseEnv } from "../env";
import * as schema from "../schema";

interface JournalEntry {
  idx: number;
  tag: string;
}

async function runDatabaseCheck(): Promise<void> {
  const exportedTablesAndEnums = Object.keys(schema);
  console.log(
    `[db:check] Schema Drizzle termuat (${exportedTablesAndEnums.length} ekspor): ${exportedTablesAndEnums.join(", ")}`
  );

  const journalPath = path.resolve(
    process.cwd(),
    "database/migrations/meta/_journal.json"
  );
  if (!fs.existsSync(journalPath)) {
    console.error(
      "[db:check] GAGAL: Journal migrasi belum ditemukan di database/migrations/meta/_journal.json. Jalankan `npm run db:generate` terlebih dahulu."
    );
    process.exit(1);
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8")) as {
    entries?: JournalEntry[];
  };
  const entries = journal.entries ?? [];
  console.log(`[db:check] Terdaftar ${entries.length} migrasi pada journal Drizzle.`);

  const appEnvResult = validateDatabaseEnv();
  const migrationEnvResult = validateMigrationDatabaseEnv();

  if (!appEnvResult.valid || !appEnvResult.config) {
    console.error(`[db:check] BLOCKED: ${appEnvResult.error}`);
    console.error(
      "[db:check] Langkah perbaikan: Salin `.env.example` menjadi `.env`, isi DATABASE_URL Supabase/PostgreSQL (dan DIRECT_DATABASE_URL jika memakai Transaction Pooler :6543), lalu jalankan ulang `npm run db:check`."
    );
    process.exit(1);
  }

  console.log(
    `[db:check] Runtime connection (${appEnvResult.config.connectionMode}, SSL=${appEnvResult.config.requiresSsl}): ${appEnvResult.config.maskedUrl}`
  );
  if (migrationEnvResult.valid && migrationEnvResult.config) {
    console.log(
      `[db:check] Migration connection (${migrationEnvResult.config.connectionMode}): ${migrationEnvResult.config.maskedUrl}`
    );
  } else {
    console.warn(`[db:check] PERINGATAN Migrasi: ${migrationEnvResult.error}`);
  }

  try {
    const health = await checkDatabaseConnection();
    if (!health.connected) {
      console.error(`[db:check] GAGAL KONEKSI: ${health.error}`);
      process.exit(1);
    }

    console.log(`[db:check] Koneksi PostgreSQL BERHASIL (${health.latencyMs}ms).`);
    console.log(`[db:check] Versi server: ${health.serverVersion}`);
    console.log(`[db:check] Schemas: ${health.schemas.join(", ") || "(tidak ada)"}`);
    console.log(
      `[db:check] Tabel public: ${health.publicTables.join(", ") || "(kosong)"}`
    );
    console.log(
      `[db:check] Enum public: ${health.publicEnums.join(", ") || "(kosong)"}`
    );
    console.log(
      `[db:check] Tabel migrasi Drizzle: ${
        health.migrationTableExists
          ? `TERSEDIA (${health.appliedMigrationsCount ?? 0} migrasi tercatat)`
          : "BELUM ADA (jalankan `npm run db:migrate`)"
      }`
    );
  } finally {
    await closeDatabaseConnection();
  }
}

runDatabaseCheck().catch((err) => {
  console.error(
    "[db:check] ERROR:",
    err instanceof Error ? err.message : String(err)
  );
  process.exit(1);
});
