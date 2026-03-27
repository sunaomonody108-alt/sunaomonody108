import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // DATABASE_URLがpostgresql://で始まる場合、またはDATABASE_PROVIDERがpostgresqlの場合はPostgreSQLを使用
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isPostgres =
    process.env.DATABASE_PROVIDER === "postgresql" ||
    dbUrl.startsWith("postgresql://") ||
    dbUrl.startsWith("postgres://");
  const provider = isPostgres ? "postgresql" : "sqlite";

  if (provider === "postgresql") {
    // Production: standard PrismaClient with PostgreSQL connection URL
    return new PrismaClient({
      log: ["error"],
    });
  }

  // Local development: SQLite with better-sqlite3 adapter
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");

  const rawUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const dbRelative = rawUrl.replace(/^file:/, "");
  const dbPath = path.isAbsolute(dbRelative)
    ? dbRelative
    : path.join(process.cwd(), dbRelative);

  const adapter = new PrismaBetterSqlite3({ url: dbPath });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
