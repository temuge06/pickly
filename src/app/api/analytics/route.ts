import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db";
import { analyticsEvent } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { analyticsBatchSchema } from "@/lib/analytics/events";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * The beacon endpoint. The profile page's tracker POSTs a batch of events here
 * as the visitor browses and, most importantly, as they leave — which is why
 * this is a route handler and not a server action: `navigator.sendBeacon`
 * sends a plain POST with no React plumbing, and it is the only delivery the
 * browser guarantees to finish after the tab is gone.
 *
 * Unauthenticated by design (a visitor has no account), so the body is treated
 * as hostile: it is parsed by the shared zod schema, capped in size, and the
 * only thing taken from a signed-in session is the viewer id — the creator id
 * is a foreign key, so an invented one simply fails to insert.
 *
 * Always 204, even on a bad payload. Nothing on the client listens for the
 * answer, and an error body would only tell a fuzzer what to change.
 */
export async function POST(request: NextRequest) {
  if (!env.hasDatabase) return new NextResponse(null, { status: 204 });

  let parsed;
  try {
    parsed = analyticsBatchSchema.safeParse(await request.json());
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  if (!parsed.success) return new NextResponse(null, { status: 204 });
  const { creatorId, sessionId, events } = parsed.data;

  // A signed-in viewer is attributed to their account rather than the random
  // browser id, so the same person on two devices is one viewer. Resolved
  // server-side from the cookie — the client never gets to claim to be someone.
  const viewer = await getSessionUser();
  const viewerSessionId = viewer?.id ?? sessionId;

  try {
    await getDb().insert(analyticsEvent).values(
      events.map((e) => ({
        creatorId,
        viewerSessionId,
        eventType: e.type,
        metadata: e.metadata,
      })),
    );
  } catch {
    // Unknown creator (FK) or a transient DB error — either way the visitor's
    // page is not the place to surface it.
  }

  return new NextResponse(null, { status: 204 });
}
