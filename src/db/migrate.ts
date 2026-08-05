import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  // Extensions first — citext must exist before the generated migrations
  // that declare columns of that type run.
  const extensions = readFileSync(
    join(__dirname, "migrations/0000_extensions.sql"),
    "utf-8",
  );
  await sql.unsafe(extensions);

  await migrate(db, { migrationsFolder: join(__dirname, "migrations") });
  console.log("Migrations applied.");

  // RLS policies live outside the Drizzle journal (they reference Supabase's
  // auth.uid()). The file is idempotent, so applying it on every migrate is
  // safe and keeps policies in lockstep with the schema.
  const rls = readFileSync(join(__dirname, "rls.sql"), "utf-8");
  await sql.unsafe(rls);
  console.log("RLS policies applied.");

  await sql.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
