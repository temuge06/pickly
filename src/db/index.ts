import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Lazy singleton. Importing this module must never throw — the public profile
 * page imports the schema types and, when DATABASE_URL is absent, falls back to
 * fixtures without ever touching a connection. `getDb()` throws only if code
 * actually tries to query with no database configured.
 *
 * `max: 1` keeps this serverless-friendly on Vercel: one connection per warm
 * function instance rather than exhausting Postgres connection limits.
 */
let _db: PostgresJsDatabase<typeof schema> | null = null;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — this code path requires a database. " +
        "The public profile falls back to fixtures; dashboard/features need Postgres.",
    );
  }
  const client = postgres(url, { max: 1 });
  _db = drizzle(client, { schema });
  return _db;
}

export { schema };
