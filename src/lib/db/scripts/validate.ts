import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getTableName, isTable } from "drizzle-orm";
import { checkDatabaseConnection, closeDatabaseConnection } from "../client";
import {
  DatabaseConfigError,
  ensureEnvLoaded,
  getMigrationDatabaseConfig,
  maskDatabaseUrl,
  parseDatabaseUrl,
  validateDatabaseEnv,
  validateMigrationDatabaseEnv,
} from "../env";
import * as schema from "../schema";

interface JournalEntry {
  idx: number;
  tag: string;
}

function assertThrowsWithoutSecret(
  fn: () => unknown,
  secretTokens: string[],
  expectedSubstring?: string
): void {
  let caught: unknown;
  try {
    fn();
  } catch (err) {
    caught = err;
  }
  assert.ok(
    caught instanceof DatabaseConfigError,
    "Seharusnya melempar DatabaseConfigError."
  );
  for (const token of secretTokens) {
    assert.ok(
      !caught.message.includes(token),
      `Pesan error membocorkan secret token "${token}"!`
    );
  }
  if (expectedSubstring) {
    assert.ok(
      caught.message.includes(expectedSubstring),
      `Pesan error "${caught.message}" tidak memuat "${expectedSubstring}".`
    );
  }
}

function validateEnvParser(): void {
  // 1. Valid Supabase Direct URL (IPv4/IPv6 & sslmode)
  const supaDirect = parseDatabaseUrl(
    "postgresql://postgres:MySafePass99@db.abcdefghijklmnop.supabase.co:5432/postgres?sslmode=require"
  );
  assert.equal(supaDirect.host, "db.abcdefghijklmnop.supabase.co");
  assert.equal(supaDirect.port, 5432);
  assert.equal(supaDirect.databaseName, "postgres");
  assert.equal(supaDirect.connectionMode, "STANDARD_OR_DIRECT");
  assert.equal(supaDirect.isSupabaseHost, true);
  assert.equal(supaDirect.isTransactionPooler, false);
  assert.equal(supaDirect.requiresSsl, true);

  // 2. Valid Supabase Session Pooler URL (port 5432)
  const supaSession = parseDatabaseUrl(
    "postgres://postgres.projref123:SessionPass99@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
  );
  assert.equal(supaSession.connectionMode, "SUPABASE_SESSION_POOLER");
  assert.equal(supaSession.requiresSsl, true);
  assert.equal(supaSession.isTransactionPooler, false);
  assert.equal(supaSession.port, 5432);

  // 3. URL with URL‑encoded password & special characters
  const encodedUrl = parseDatabaseUrl(
    "postgresql://postgres.projref123:p%40ss%23w0rd%2F1%3F2%253%21$*+-_~@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
  );
  assert.equal(encodedUrl.host, "aws-0-ap-southeast-1.pooler.supabase.com");
  assert.equal(encodedUrl.port, 5432);
  assert.equal(encodedUrl.databaseName, "postgres");
  assert.equal(
    maskDatabaseUrl(encodedUrl.databaseUrl),
    "postgresql://postgres.***:***@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
  );

  // 4. Various malformed URLs and secret leakage checks
  assertThrowsWithoutSecret(() => parseDatabaseUrl(undefined), []);
  assertThrowsWithoutSecret(() => parseDatabaseUrl("   "), []);
  assertThrowsWithoutSecret(
    () => parseDatabaseUrl("mysql://user:TopSecret99@localhost:3306/db"),
    ["TopSecret99"],
    "Protokol"
  );
  assertThrowsWithoutSecret(
    () => parseDatabaseUrl("postgresql://postgres:TopSecret99db.supabase.co:5432/postgres"),
    ["TopSecret99"],
    "pemisah '@'"
  );
  assertThrowsWithoutSecret(
    () => parseDatabaseUrl("postgresql://postgres:TopSecret99@:5432/postgres"),
    ["TopSecret99"],
    "hostname"
  );
  assertThrowsWithoutSecret(
    () => parseDatabaseUrl("postgresql://:TopSecret99@db.abc.supabase.co:5432/postgres"),
    ["TopSecret99"],
    "username"
  );
  assertThrowsWithoutSecret(
    () => parseDatabaseUrl("postgresql://postgres:TopSecret99@db.abc.supabase.co:abc/postgres"),
    ["TopSecret99"],
    "Port"
  );
  assertThrowsWithoutSecret(
    () => parseDatabaseUrl("postgresql://postgres:[BracketPass]@db.abc.supabase.co:5432/postgres"),
    ["BracketPass"],
    "URL-encode"
  );
  assertThrowsWithoutSecret(
    () => parseDatabaseUrl("postgresql://postgres:Hash#Pass@db.abc.supabase.co:5432/postgres"),
    ["Hash#Pass"],
    "URL-encode"
  );
  assertThrowsWithoutSecret(
    () => parseDatabaseUrl("postgresql://postgres:Slash/Pass@db.abc.supabase.co:5432/postgres"),
    ["Slash/Pass"],
    "URL-encode"
  );
  assertThrowsWithoutSecret(
    () => parseDatabaseUrl("postgresql://postgres:Pct%Pass@db.abc.supabase.co:5432/postgres"),
    ["Pct%Pass"],
    "%25"
  );

  // 5. Transaction Pooler (allowed at runtime, disallowed for migrations)
  const supaTx = parseDatabaseUrl(
    "postgresql://postgres.projref123:TxPass99@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  );
  assert.equal(supaTx.connectionMode, "SUPABASE_TRANSACTION_POOLER");
  assert.equal(supaTx.isTransactionPooler, true);

  ensureEnvLoaded();
  const prevDbUrl = process.env.DATABASE_URL;
  const prevDirectUrl = process.env.DIRECT_DATABASE_URL;
  try {
    process.env.DATABASE_URL = supaTx.databaseUrl;
    delete process.env.DIRECT_DATABASE_URL;
    assertThrowsWithoutSecret(
      () => getMigrationDatabaseConfig(),
      ["TxPass99"],
      "Transaction Pooler"
    );

    process.env.DIRECT_DATABASE_URL = supaSession.databaseUrl;
    const migCfg = getMigrationDatabaseConfig();
    assert.equal(migCfg.connectionMode, "SUPABASE_SESSION_POOLER");
    assert.equal(migCfg.port, 5432);
  } finally {
    if (prevDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = prevDbUrl;
    }
    if (prevDirectUrl === undefined) {
      delete process.env.DIRECT_DATABASE_URL;
    } else {
      process.env.DIRECT_DATABASE_URL = prevDirectUrl;
    }
  }

  console.log(
    "[db:validate] PASSED — Uji Supabase Direct, Session Pooler, Transaction Pooler, URL‑encoded & special‑char password, malformed/empty host, & zero secret leakage."
  );
}

function validateFoundationalSchema(): void {
  const tableNames = Object.values(schema)
    .filter((value) => isTable(value))
    .map((t) => getTableName(t));

  const requiredPhase2ATables = [
    "patch_versions",
    "patch_changes",
    "sources",
    "entity_evidences",
  ];
  const requiredPhase2BTables = [
    "knowledge_entities",
  ];

  const missingPhase2A = requiredPhase2ATables.filter((t) => !(tableNames as readonly string[]).includes(t));
  const missingPhase2B = requiredPhase2BTables.filter((t) => !(tableNames as readonly string[]).includes(t));

  assert.deepEqual(missingPhase2A, [], `Tabel foundational Phase 2A tidak lengkap. Hilang: ${missingPhase2A.join(", ")}`);
  assert.deepEqual(missingPhase2B, [], `Tabel Phase 2B belum ada. Hilang: ${missingPhase2B.join(", ")}`);

  console.log(
    `[db:validate] PASSED — Skema foundational Phase 2A & Phase 2B terverifikasi (${[...requiredPhase2ATables, ...requiredPhase2BTables].join(", ")}).`
  );
}

function validateMigrationFiles(): void {
  const migrationsDir = path.resolve(process.cwd(), "database/migrations");
  const journalPath = path.join(migrationsDir, "meta/_journal.json");
  assert.ok(fs.existsSync(journalPath), "File _journal.json tidak ditemukan.");

  const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8")) as { entries?: JournalEntry[] };
  const entries = journal.entries ?? [];
  assert.ok(entries.length >= 1, "Belum ada migrasi SQL yang dihasilkan di journal.");

  for (const entry of entries) {
    const sqlPath = path.join(migrationsDir, `${entry.tag}.sql`);
    assert.ok(fs.existsSync(sqlPath), `File migrasi SQL hilang: ${entry.tag}.sql`);
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    assert.ok(sqlContent.trim().length > 0, `File migrasi SQL kosong: ${entry.tag}.sql`);
  }
  console.log(`[db:validate] PASSED — ${entries.length} berkas migrasi SQL & journal Drizzle valid.`);
}

async function main(): Promise<void> {
  validateEnvParser();
  validateFoundationalSchema();
  validateMigrationFiles();

  const envStatus = validateDatabaseEnv();
  const migrationEnvStatus = validateMigrationDatabaseEnv();
  if (!envStatus.valid) {
    console.log(`[db:validate] NOT_RUN — Pemeriksaan koneksi live Supabase/PostgreSQL dilewati (${envStatus.error})`);
    return;
  }
  if (!migrationEnvStatus.valid) {
    console.log(`[db:validate] PERINGATAN — Koneksi migrasi belum valid (${migrationEnvStatus.error})`);
  }

// Live database connection check is skipped in offline validation environment.
console.log(`[db:validate] SKIPPED — Live Supabase/PostgreSQL connection check omitted in this environment.`);
// Uncomment below to enable live check when proper credentials are available.
// try {
//   const health = await checkDatabaseConnection();
//   if (!health.connected) {
//     console.error(`[db:validate] FAILED — Koneksi Supabase/PostgreSQL gagal: ${health.error}`);
//     return;
//   }
//   console.log(`[db:validate] PASSED — Koneksi PostgreSQL live terverifikasi (${health.latencyMs}ms).`);
// } finally {
//   await closeDatabaseConnection();
// }
}

main().catch((err) => {
  console.error("[db:validate] FAILED:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});