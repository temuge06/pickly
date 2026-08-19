import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Lazy singleton. Importing this module must never throw — the public profile
 * page imports the schema types and, when DATABASE_URL is absent, falls back to
 * fixtures without ever touching a connection. `getDb()` throws only if code
 * actually tries to query with no database configured.
 *
 * Pool sizing: `max: 1`, deliberately.
 *
 * DATABASE_URL points at Supabase's pooler on port 5432, which is SESSION
 * mode: every client connection holds a real Postgres connection and the pool
 * caps at 15. Raising this to 3 exhausted it across warm instances and threw
 * `EMAXCONNSESSION: max clients reached in session mode`.
 *
 * One connection per instance does serialise the queries inside Promise.all,
 * but now that functions run in the database's region (vercel.json `regions`)
 * a round trip is ~5ms rather than ~220ms, so the whole batch costs tens of
 * milliseconds. The region was the real fix; this knob was not.
 *
 * To genuinely parallelise, move DATABASE_URL to the transaction pooler on
 * port 6543 — that mode is built for serverless fan-out — and only then raise
 * `max`. Doing one without the other breaks the site under load.
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
  const client = postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 10 });
  _db = drizzle(client, { schema });
  return _db;
}

export { schema };
