import { defineConfig } from "drizzle-kit";

// `generate` (diffing schema → SQL) never connects, so a placeholder URL is
// fine when only generating migrations offline. `migrate`/`push`/`studio` do
// connect — those go through src/db/migrate.ts, which requires a real
// DATABASE_URL and fails loudly if it's missing.
const url =
  process.env.DATABASE_URL ??
  "postgres://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
