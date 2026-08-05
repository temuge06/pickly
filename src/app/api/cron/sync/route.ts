import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { syncAllConnections } from "@/lib/sync/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron sync endpoint. Protected by CRON_SECRET (Vercel Cron sends it as a
 * Bearer token; also accepts ?secret= for manual curl). Every 6h via
 * vercel.json.
 */
export async function GET(request: NextRequest) {
  if (!env.hasCronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured." }, { status: 503 });
  }
  if (!env.hasDatabase) {
    return NextResponse.json({ error: "No database configured." }, { status: 503 });
  }

  const secret = process.env.CRON_SECRET!;
  const auth = request.headers.get("authorization");
  const bySecretParam = request.nextUrl.searchParams.get("secret");
  const authorized = auth === `Bearer ${secret}` || bySecretParam === secret;
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const outcomes = await syncAllConnections();
  return NextResponse.json({
    ok: true,
    synced: outcomes.length,
    outcomes,
  });
}
