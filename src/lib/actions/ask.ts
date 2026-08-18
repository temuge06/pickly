"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { askBlock, askMessage, profile } from "@/db/schema";
import { requireCurrentProfile } from "@/lib/auth/session";

/** Ensures a message belongs to the current creator; returns it. */
async function ownedMessage(messageId: string) {
  const me = await requireCurrentProfile();
  const db = getDb();
  const rows = await db
    .select()
    .from(askMessage)
    .where(and(eq(askMessage.id, messageId), eq(askMessage.profileId, me.id)))
    .limit(1);
  const msg = rows[0];
  if (!msg) throw new Error("Мессеж олдсонгүй.");
  return { me, msg, db };
}

export async function answerAsk(
  messageId: string,
  answerBody: string,
  makePublic: boolean,
) {
  const { msg, db } = await ownedMessage(messageId);
  const body = answerBody.trim();
  if (!body) throw new Error("Хариу заавал.");
  await db
    .update(askMessage)
    .set({
      answerBody: body,
      status: "answered",
      isPublic: makePublic,
      answeredAt: new Date(),
    })
    .where(eq(askMessage.id, msg.id));
  revalidatePath("/dashboard/ask");
  revalidatePath("/dashboard");
}

export async function toggleAskPublic(messageId: string, isPublic: boolean) {
  const { msg, db } = await ownedMessage(messageId);
  await db
    .update(askMessage)
    .set({ isPublic })
    .where(eq(askMessage.id, msg.id));
  revalidatePath("/dashboard/ask");
}

export async function hideAsk(messageId: string) {
  const { msg, db } = await ownedMessage(messageId);
  await db
    .update(askMessage)
    .set({ status: "hidden", isPublic: false })
    .where(eq(askMessage.id, msg.id));
  revalidatePath("/dashboard/ask");
}

export async function unhideAsk(messageId: string) {
  const { msg, db } = await ownedMessage(messageId);
  await db
    .update(askMessage)
    .set({ status: msg.answerBody ? "answered" : "new" })
    .where(eq(askMessage.id, msg.id));
  revalidatePath("/dashboard/ask");
}

/**
 * Block the asker behind a message (by fingerprint) and hide the message.
 * Future messages from that fingerprint get silent-success drops.
 */
export async function blockAsker(messageId: string) {
  const { me, msg, db } = await ownedMessage(messageId);
  if (msg.askerFingerprint) {
    await db
      .insert(askBlock)
      .values({ profileId: me.id, fingerprint: msg.askerFingerprint })
      .onConflictDoNothing();
  }
  await db
    .update(askMessage)
    .set({ status: "blocked", isPublic: false })
    .where(eq(askMessage.id, msg.id));
  revalidatePath("/dashboard/ask");
}

/**
 * Hand a product question to staff (question → pick, without giving creators
 * write access to picks).
 *
 * Creators can no longer turn an answer into a pick themselves — this marks
 * the message instead, and /admin surfaces the flagged ones as a work queue.
 * The creator keeps the part that is genuinely theirs (answering and
 * publishing); the catalogue write stays on the admin side of the boundary.
 */
export async function setAskFlaggedForPick(messageId: string, flagged: boolean) {
  const { msg, db } = await ownedMessage(messageId);
  await db
    .update(askMessage)
    .set({ flaggedForPick: flagged })
    .where(eq(askMessage.id, msg.id));
  revalidatePath("/dashboard/ask");
}

export async function setAskEnabled(enabled: boolean) {
  const me = await requireCurrentProfile();
  const db = getDb();
  await db
    .update(profile)
    .set({ askEnabled: enabled })
    .where(eq(profile.id, me.id));
  revalidatePath("/dashboard/ask");
  revalidatePath("/dashboard");
}

export async function setAskPrompt(prompt: string) {
  const me = await requireCurrentProfile();
  const db = getDb();
  await db
    .update(profile)
    .set({ askPrompt: prompt.trim() || null })
    .where(eq(profile.id, me.id));
  revalidatePath("/dashboard/ask");
}
