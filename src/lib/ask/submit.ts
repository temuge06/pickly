"use server";

import { and, count, eq, gte } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { askBlock, askMessage, profile } from "@/db/schema";
import { env } from "@/lib/env";
import { hashAskerIp } from "@/lib/crypto/tokens";
import { shouldHide } from "./wordlist";

const MAX_LENGTH = 500;
const HOURLY_LIMIT = 5;
const DAILY_LIMIT = 15;

export type AskSubmitResult = { ok: boolean };

/**
 * Public anonymous question submit. Every rejection returns { ok: true } —
 * over-limit, blocked, and filtered messages all look identical to the asker,
 * so a spammer can't probe the limits and there's no signal to weaponize. The
 * asker is never told whether or when a message was answered.
 *
 * Collects NO asker identity beyond a salted IP hash (rate-limit/abuse only)
 * and a coarse fingerprint (creator block). Raw IP is never stored.
 */
export async function submitAsk(
  handle: string,
  body: string,
  fingerprint: string,
): Promise<AskSubmitResult> {
  // Uniform success shape — the caller shows the same confirmation regardless.
  const ok: AskSubmitResult = { ok: true };

  if (!env.hasDatabase) return ok;

  const trimmed = (body ?? "").trim();
  if (trimmed.length === 0 || trimmed.length > MAX_LENGTH) return ok;

  const db = getDb();
  const rows = await db
    .select({ id: profile.id, askEnabled: profile.askEnabled })
    .from(profile)
    .where(eq(profile.handle, handle))
    .limit(1);
  const target = rows[0];
  if (!target || !target.askEnabled) return ok;

  const fp = (fingerprint ?? "").slice(0, 128) || "anon";

  // Blocked fingerprint → silent drop.
  const blocked = await db
    .select({ id: askBlock.id })
    .from(askBlock)
    .where(
      and(eq(askBlock.profileId, target.id), eq(askBlock.fingerprint, fp)),
    )
    .limit(1);
  if (blocked.length > 0) return ok;

  // Rate limits per (profile, ip hash). Silent drop when exceeded.
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "0.0.0.0";
  // hashAskerIp folds in ASK_DAILY_SALT when present; without it the hash is
  // weaker but still non-reversible enough for rate-limiting.
  const ipHash = hashAskerIp(ip);

  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000);
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

  const [hourCount, dayCount] = await Promise.all([
    db
      .select({ n: count() })
      .from(askMessage)
      .where(
        and(
          eq(askMessage.profileId, target.id),
          eq(askMessage.askerIpHash, ipHash),
          gte(askMessage.createdAt, hourAgo),
        ),
      ),
    db
      .select({ n: count() })
      .from(askMessage)
      .where(
        and(
          eq(askMessage.profileId, target.id),
          eq(askMessage.askerIpHash, ipHash),
          gte(askMessage.createdAt, dayAgo),
        ),
      ),
  ]);
  if ((hourCount[0]?.n ?? 0) >= HOURLY_LIMIT) return ok;
  if ((dayCount[0]?.n ?? 0) >= DAILY_LIMIT) return ok;

  // Wordlist filter → hidden (not deleted), never notified.
  const status = shouldHide(trimmed) ? "hidden" : "new";

  await db.insert(askMessage).values({
    profileId: target.id,
    body: trimmed,
    status,
    askerIpHash: ipHash,
    askerFingerprint: fp,
  });

  return ok;
}
