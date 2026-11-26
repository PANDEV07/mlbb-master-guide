import { config as loadDotenv } from "dotenv";

export class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigError";
  }
}

export type SupabaseConnectionMode =
  | "STANDARD_OR_DIRECT"
  | "SUPABASE_SESSION_POOLER"
  | "SUPABASE_TRANSACTION_POOLER";

export interface DatabaseEnvConfig {
  databaseUrl: string;
  maskedUrl: string;
  host: string;
  port: number;
  databaseName: string;
  sslMode: string | null;
  requiresSsl: boolean;
  isSupabaseHost: boolean;
  isTransactionPooler: boolean;
  connectionMode: SupabaseConnectionMode;
}

export interface DatabaseEnvValidationResult {
  valid: boolean;
  configured: boolean;
  config: DatabaseEnvConfig | null;
  error: string | null;
}

let envLoaded = false;

export function ensureEnvLoaded(): void {
  if (envLoaded) {
    return;
  }
  loadDotenv({ quiet: true });
  envLoaded = true;
}

export function maskDatabaseUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = "***";
    }
    if (parsed.username && parsed.username.includes(".")) {
      const [prefix] = parsed.username.split(".");
      parsed.username = `${prefix}.***`;
    }
    return parsed.toString();
  } catch {
    return "<invalid-database-url>";
  }
}

function stripOuterQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function validateAuthorityAndCredentials(
  afterScheme: string,
  envVarName: string
): {
  hostPart: string;
} {
  if (/\s/.test(afterScheme)) {
    throw new DatabaseConfigError(
      `${envVarName} mengandung spasi atau baris baru. Pastikan connection string ditulis dalam satu baris dan karakter spasi pada password sudah di-URL-encode (%20).`
    );
  }

  const lastAtIndex = afterScheme.lastIndexOf("@");
  if (lastAtIndex === -1) {
    throw new DatabaseConfigError(
      `Format ${envVarName} tidak memiliki pemisah '@' antara kredensial (<username>:<password>) dan host (<host>:<port>/<database>). Contoh Supabase: postgresql://postgres.<project-ref>:<url-encoded-password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require`
    );
  }

  const userInfo = afterScheme.slice(0, lastAtIndex);
  const hostAndRest = afterScheme.slice(lastAtIndex + 1);

  if (!userInfo) {
    throw new DatabaseConfigError(
      `${envVarName} tidak memiliki username database sebelum tanda '@'.`
    );
  }

  const firstColonIndex = userInfo.indexOf(":");
  const usernamePart =
    firstColonIndex === -1 ? userInfo : userInfo.slice(0, firstColonIndex);
  const passwordPart =
    firstColonIndex === -1 ? "" : userInfo.slice(firstColonIndex + 1);

  if (!usernamePart.trim()) {
    throw new DatabaseConfigError(
      `${envVarName} tidak memiliki username yang valid sebelum tanda ':'.`
    );
  }

  if (passwordPart) {
    if (/[#/?[\]<>{}|\\^]/.test(passwordPart)) {
      throw new DatabaseConfigError(
        `Password pada ${envVarName} mengandung karakter khusus URI yang belum di-URL-encode (#, /, ?, [, ], <, >, {, }, |, \\, atau ^). Gunakan URL-encoding pada bagian password saja (mis. '#' -> '%23', '/' -> '%2F', '?' -> '%3F', '@' -> '%40') dan jangan sertakan tanda kurung siku '[...]' dari placeholder.`
      );
    }

    if (/%(?![0-9a-fA-F]{2})/.test(passwordPart)) {
      throw new DatabaseConfigError(
        `Password pada ${envVarName} mengandung karakter '%' yang tidak diikuti dua digit heksadesimal valid. Encode tanda '%' pada password menjadi '%25'.`
      );
    }
  }

  const hostPart = hostAndRest.split(/[/?#]/, 1)[0] ?? "";
  if (!hostPart) {
    throw new DatabaseConfigError(`${envVarName} tidak memiliki hostname database.`);
  }

  const hostOnly = hostPart.startsWith("[")
    ? hostPart
    : hostPart.slice(0, hostPart.lastIndexOf(":") !== -1 ? hostPart.lastIndexOf(":") : hostPart.length);

  if (!hostOnly) {
    throw new DatabaseConfigError(`${envVarName} tidak memiliki hostname database yang valid.`);
  }

  return { hostPart };
}

function isValidHostname(hostname: string): boolean {
  if (!hostname || hostname.length > 253) {
    return false;
  }
  if (hostname.includes("%")) {
    return false;
  }
  // IPv6 bracketed literal, e.g. [::1] or [2001:db8::1]
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.length > 2 && /^[0-9a-fA-F:]+$/.test(hostname.slice(1, -1));
  }
  // Hostname / FQDN / IPv4
  return /^[a-zA-Z0-9.-]+$/.test(hostname) && !hostname.startsWith(".") && !hostname.endsWith(".");
}

export function parseDatabaseUrl(
  rawUrl: string | undefined,
  envVarName = "DATABASE_URL"
): DatabaseEnvConfig {
  const cleaned = rawUrl ? stripOuterQuotes(rawUrl) : "";
  if (!cleaned) {
    throw new DatabaseConfigError(
      `${envVarName} belum diatur. Salin \`.env.example\` menjadi \`.env\` dan isi ${envVarName} dengan URI PostgreSQL 16+ / Supabase yang valid.`
    );
  }

  const schemeMatch = cleaned.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
  if (!schemeMatch) {
    throw new DatabaseConfigError(
      `Format ${envVarName} tidak memiliki protokol URI. Gunakan awalan postgresql:// atau postgres://.`
    );
  }

  const scheme = schemeMatch[1].toLowerCase();
  if (scheme !== "postgresql" && scheme !== "postgres") {
    throw new DatabaseConfigError(
      `Protokol ${envVarName} tidak didukung ("${scheme}://"). Gunakan postgresql:// atau postgres://.`
    );
  }

  const afterScheme = cleaned.slice(schemeMatch[0].length);
  const { hostPart } = validateAuthorityAndCredentials(afterScheme, envVarName);

  // Validasi port eksplisit pada hostPart sebelum `new URL(...)` agar pesan error spesifik
  if (!hostPart.startsWith("[")) {
    const portColonIdx = hostPart.lastIndexOf(":");
    if (portColonIdx !== -1) {
      const rawPort = hostPart.slice(portColonIdx + 1);
      if (!/^\d+$/.test(rawPort)) {
        throw new DatabaseConfigError(
          `Port pada ${envVarName} harus berupa angka 1–65535.`
        );
      }
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    throw new DatabaseConfigError(
      `Format ${envVarName} tidak valid. Pastikan struktur URI mengikuti postgresql://<user>:<url-encoded-password>@<host>:<port>/<database>.`
    );
  }

  if (!parsed.username) {
    throw new DatabaseConfigError(
      `${envVarName} tidak memiliki username database.`
    );
  }

  if (!isValidHostname(parsed.hostname)) {
    throw new DatabaseConfigError(
      `${envVarName} tidak memiliki hostname database yang valid.`
    );
  }

  const databaseName = parsed.pathname.replace(/^\/+/, "");
  if (!databaseName) {
    throw new DatabaseConfigError(
      `${envVarName} tidak mencantumkan nama database pada path URL (mis. /postgres atau /mlbb_master_guide).`
    );
  }

  const parsedPort = parsed.port ? Number(parsed.port) : 5432;
  if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
    throw new DatabaseConfigError(`Port ${envVarName} tidak valid (harus 1–65535).`);
  }

  const hostLower = parsed.hostname.toLowerCase();
  const isSupabaseHost =
    hostLower.endsWith(".supabase.co") || hostLower.endsWith(".pooler.supabase.com");
  const isPoolerHost = hostLower.endsWith(".pooler.supabase.com");
  const pgbouncerFlag = parsed.searchParams.get("pgbouncer") === "true";
  const isTransactionPooler = parsedPort === 6543 || pgbouncerFlag;

  let connectionMode: SupabaseConnectionMode = "STANDARD_OR_DIRECT";
  if (isTransactionPooler) {
    connectionMode = "SUPABASE_TRANSACTION_POOLER";
  } else if (isPoolerHost && parsedPort === 5432) {
    connectionMode = "SUPABASE_SESSION_POOLER";
  }

  const sslMode = parsed.searchParams.get("sslmode");
  const isLocalhost = hostLower === "localhost" || hostLower === "127.0.0.1";
  const requiresSsl =
    sslMode === "require" ||
    sslMode === "verify-ca" ||
    sslMode === "verify-full" ||
    (isSupabaseHost && !isLocalhost && sslMode !== "disable");

  return {
    databaseUrl: cleaned,
    maskedUrl: maskDatabaseUrl(cleaned),
    host: parsed.hostname,
    port: parsedPort,
    databaseName,
    sslMode,
    requiresSsl,
    isSupabaseHost,
    isTransactionPooler,
    connectionMode,
  };
}

export function getDatabaseConfig(): DatabaseEnvConfig {
  ensureEnvLoaded();
  return parseDatabaseUrl(process.env.DATABASE_URL, "DATABASE_URL");
}

export function getMigrationDatabaseConfig(): DatabaseEnvConfig {
  ensureEnvLoaded();
  const directUrl = process.env.DIRECT_DATABASE_URL?.trim();
  const envVarName = directUrl ? "DIRECT_DATABASE_URL" : "DATABASE_URL";
  const config = parseDatabaseUrl(
    directUrl || process.env.DATABASE_URL,
    envVarName
  );

  if (config.isTransactionPooler) {
    throw new DatabaseConfigError(
      `${envVarName} menggunakan Supabase Transaction Pooler (port 6543 / pgbouncer=true) yang tidak kompatibel untuk schema migration Drizzle. Setel DIRECT_DATABASE_URL ke Supabase Session Pooler (port 5432) atau Direct Connection (port 5432).`
    );
  }

  return config;
}

export function validateDatabaseEnv(): DatabaseEnvValidationResult {
  ensureEnvLoaded();
  const raw = process.env.DATABASE_URL;
  if (!raw?.trim()) {
    return {
      valid: false,
      configured: false,
      config: null,
      error:
        "DATABASE_URL belum diatur. Salin `.env.example` menjadi `.env` dan isi connection string PostgreSQL / Supabase.",
    };
  }

  try {
    const config = parseDatabaseUrl(raw, "DATABASE_URL");
    return {
      valid: true,
      configured: true,
      config,
      error: null,
    };
  } catch (err) {
    return {
      valid: false,
      configured: true,
      config: null,
      error: err instanceof Error ? err.message : "Konfigurasi DATABASE_URL tidak valid.",
    };
  }
}

export function validateMigrationDatabaseEnv(): DatabaseEnvValidationResult {
  ensureEnvLoaded();
  const directRaw = process.env.DIRECT_DATABASE_URL?.trim();
  const fallbackRaw = process.env.DATABASE_URL?.trim();
  if (!directRaw && !fallbackRaw) {
    return {
      valid: false,
      configured: false,
      config: null,
      error:
        "DIRECT_DATABASE_URL dan DATABASE_URL belum diatur. Diperlukan koneksi PostgreSQL Direct/Session Pooler (:5432) untuk migrasi.",
    };
  }

  try {
    const config = getMigrationDatabaseConfig();
    return {
      valid: true,
      configured: true,
      config,
      error: null,
    };
  } catch (err) {
    return {
      valid: false,
      configured: true,
      config: null,
      error:
        err instanceof Error ? err.message : "Konfigurasi koneksi migrasi tidak valid.",
    };
  }
}
