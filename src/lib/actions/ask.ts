"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { askBlock, askMessage, profile } from "@/db/schema";
import { requireCurrentProfile } from "@/lib/auth/session";
import { MAX_ASK_ANSWER } from "@/lib/validation";

/**
 * Every Ask write lands in three places now: the inbox page, the dashboard
 * tile's counter, and the creator's own profile — which carries both the
 * inline inbox and the published-answer shelf. Missing the last one is what
 * would leave an answered question sitting in the on-profile list until a hard
 * reload, so the paths are revalidated together rather than one per action.
 */
function revalidateAsk(handle: string) {
  revalidatePath("/dashboard/ask");
  revalidatePath("/dashboard");
  revalidatePath(`/${handle}`);
}

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
  const { me, msg, db } = await ownedMessage(messageId);
  const body = answerBody.trim();
  if (!body) throw new Error("Хариу заавал.");
  // The composer caps this too, but maxLength is a browser hint — a direct
  // call to the action is not bound by it.
  if (body.length > MAX_ASK_ANSWER) {
    throw new Error(`Хариулт хамгийн ихдээ ${MAX_ASK_ANSWER} тэмдэгт.`);
  }
  await db
    .update(askMessage)
    .set({
      answerBody: body,
      status: "answered",
      isPublic: makePublic,
      answeredAt: new Date(),
    })
    .where(eq(askMessage.id, msg.id));
  revalidateAsk(me.handle);
}

export async function toggleAskPublic(messageId: string, isPublic: boolean) {
  const { me, msg, db } = await ownedMessage(messageId);
  await db
    .update(askMessage)
    .set({ isPublic })
    .where(eq(askMessage.id, msg.id));
  revalidateAsk(me.handle);
}

export async function hideAsk(messageId: string) {
  const { me, msg, db } = await ownedMessage(messageId);
  await db
    .update(askMessage)
    .set({ status: "hidden", isPublic: false })
    .where(eq(askMessage.id, msg.id));
  revalidateAsk(me.handle);
}

export async function unhideAsk(messageId: string) {
  const { me, msg, db } = await ownedMessage(messageId);
  await db
    .update(askMessage)
    .set({ status: msg.answerBody ? "answered" : "new" })
    .where(eq(askMessage.id, msg.id));
  revalidateAsk(me.handle);
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
  revalidateAsk(me.handle);
}

export async function setAskEnabled(enabled: boolean) {
  const me = await requireCurrentProfile();
  const db = getDb();
  await db
    .update(profile)
    .set({ askEnabled: enabled })
    .where(eq(profile.id, me.id));
  revalidateAsk(me.handle);
}
