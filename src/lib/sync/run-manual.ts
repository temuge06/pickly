import "dotenv/config";
import { syncAllConnections } from "./run";

/**
 * `pnpm sync:manual` — runs the sync worker once against every connection,
 * printing outcomes. Same code path as the cron route.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }
  const outcomes = await syncAllConnections();
  if (outcomes.length === 0) {
    console.log("No connections to sync.");
  }
  for (const o of outcomes) {
    const line = `[${o.provider}] ${o.status} — ${o.itemsWritten} new item(s)`;
    console.log(o.error ? `${line} — ${o.error}` : line);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Manual sync failed:", err);
  process.exit(1);
});
