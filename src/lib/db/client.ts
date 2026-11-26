import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import {
  getDatabaseConfig,
  getMigrationDatabaseConfig,
  type DatabaseEnvConfig,
} from "./env";
import * as schema from "./schema";

export type DatabaseClient = PostgresJsDatabase<typeof schema>;

declare global {
  var __mlbbPgSql: Sql | undefined;
  var __mlbbDrizzleDb: DatabaseClient | undefined;
}

function buildPostgresClient(config: DatabaseEnvConfig, maxConnections = 10): Sql {
  return postgres(config.databaseUrl, {
    max: maxConnections,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: !config.isTransactionPooler,
    ssl: config.requiresSsl ? "require" : undefined,
  });
}

export function getSqlClient(): Sql {
  if (globalThis.__mlbbPgSql) {
    return globalThis.__mlbbPgSql;
  }

  const config = getDatabaseConfig();
  globalThis.__mlbbPgSql = buildPostgresClient(config, 10);

  return globalThis.__mlbbPgSql;
}

export function getDb(): DatabaseClient {
  if (globalThis.__mlbbDrizzleDb) {
    return globalThis.__mlbbDrizzleDb;
  }

  globalThis.__mlbbDrizzleDb = drizzle(getSqlClient(), { schema });

  return globalThis.__mlbbDrizzleDb;
}

export function createMigrationClient(): {
  sql: Sql;
  db: DatabaseClient;
  config: DatabaseEnvConfig;
} {
  const config = getMigrationDatabaseConfig();
  const sql = buildPostgresClient(config, 1);
  const db = drizzle(sql, { schema });
  return { sql, db, config };
}

export async function closeDatabaseConnection(): Promise<void> {
  const client = globalThis.__mlbbPgSql;
  if (client) {
    await client.end({ timeout: 5 });
    globalThis.__mlbbPgSql = undefined;
    globalThis.__mlbbDrizzleDb = undefined;
  }
}

export interface DatabaseInspectionResult {
  connected: boolean;
  latencyMs: number | null;
  serverVersion: string | null;
  schemas: string[];
  publicTables: string[];
  publicEnums: string[];
  migrationTableExists: boolean;
  appliedMigrationsCount: number | null;
  error: string | null;
}

export async function inspectDatabaseWithSql(client: Sql): Promise<DatabaseInspectionResult> {
  const startedAt = Date.now();

  try {
    const versionRows = await client<{ version: string }[]>`SELECT version() AS version`;
    const serverVersion = versionRows[0]?.version ?? null;

    const schemaRows = await client<{ schema_name: string }[]>`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT LIKE 'pg_%'
        AND schema_name <> 'information_schema'
      ORDER BY schema_name
    `;

    const tableRows = await client<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const enumRows = await client<{ typname: string }[]>`
      SELECT t.typname
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typtype = 'e'
      ORDER BY t.typname
    `;

    const regRows = await client<{ reg: string | null }[]>`
      SELECT to_regclass('drizzle.__drizzle_migrations')::text AS reg
    `;
    const migrationTableExists = Boolean(regRows[0]?.reg);

    let appliedMigrationsCount: number | null = null;
    if (migrationTableExists) {
      const countRows = await client<{ total: string }[]>`
        SELECT COUNT(*)::text AS total FROM drizzle.__drizzle_migrations
      `;
      appliedMigrationsCount = Number(countRows[0]?.total ?? 0);
    }

    return {
      connected: true,
      latencyMs: Date.now() - startedAt,
      serverVersion,
      schemas: schemaRows.map((r) => r.schema_name),
      publicTables: tableRows.map((r) => r.table_name),
      publicEnums: enumRows.map((r) => r.typname),
      migrationTableExists,
      appliedMigrationsCount,
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      latencyMs: null,
      serverVersion: null,
      schemas: [],
      publicTables: [],
      publicEnums: [],
      migrationTableExists: false,
      appliedMigrationsCount: null,
      error:
        err instanceof Error
          ? err.message
          : "Gagal terhubung ke PostgreSQL dengan error yang tidak diketahui.",
    };
  }
}

export async function checkDatabaseConnection(): Promise<DatabaseInspectionResult> {
  try {
    const client = getSqlClient();
    return await inspectDatabaseWithSql(client);
  } catch (err) {
    return {
      connected: false,
      latencyMs: null,
      serverVersion: null,
      schemas: [],
      publicTables: [],
      publicEnums: [],
      migrationTableExists: false,
      appliedMigrationsCount: null,
      error:
        err instanceof Error
          ? err.message
          : "Gagal menginisialisasi koneksi PostgreSQL.",
    };
  }
}
