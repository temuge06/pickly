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
 * DATABASE_URL points at Supabase's transaction pooler on port 6543. It used
 * to be the session pooler (5432), where every client held a real Postgres
 * connection and the pool capped at 15; raising this to 3 there threw
 * `EMAXCONNSESSION: max clients reached in session mode`.
 *
 * One connection per instance does serialise the queries inside Promise.all,
 * but as long as functions run in the database's region (vercel.json
 * `regions`) a round trip is ~5ms rather than ~220ms, so the whole batch costs
 * tens of milliseconds. The region was the real fix; this knob was not.
 *
 * That makes `regions` and DATABASE_URL a COUPLED PAIR, and moving one without
 * the other silently costs ~200ms per query on every page. They are currently
 * Tokyo on both sides: `hnd1` and Supabase `ap-northeast-1`. If the database
 * ever moves, move `regions` with it.
 *
 * Now that DATABASE_URL is on the transaction pooler, `max` can be raised to
 * genuinely parallelise — but that is a separate, load-tested change.
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
  // prepare: false — the transaction pooler (port 6543) hands each transaction
  // to a different backend, so named prepared statements don't survive between
  // queries. Harmless on a session connection too.
  const client = postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 3,
    prepare: false,
  });
  _db = drizzle(client, { schema });
  return _db;
}

export { schema };
