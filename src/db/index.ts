import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Lazy singleton. Importing this module must never throw — the public profile
 * page imports the schema types and, when DATABASE_URL is absent, falls back to
 * fixtures without ever touching a connection. `getDb()` throws only if code
 * actually tries to query with no database configured.
 *
 * Pool sizing: `max: 1` serialised every query, including the ones inside
 * Promise.all — the public profile issues ~11 and they queued one behind the
 * other. A small pool lets those batches actually overlap while still being
 * gentle on Postgres connection limits from many warm instances. `idle_timeout`
 * hands connections back rather than pinning them to an idle instance.
 *
 * This matters far less than running the function in the database's region
 * (see vercel.json `regions`), but the two compound.
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
  const client = postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10 });
  _db = drizzle(client, { schema });
  return _db;
}

export { schema };
