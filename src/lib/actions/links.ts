"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { link } from "@/db/schema";
import { requireCurrentProfile } from "@/lib/auth/session";
import { detectLinkIcon, normalizeUrl } from "@/lib/socials";

export async function createLink(label: string, url: string) {
  const profile = await requireCurrentProfile();
  const l = label.trim();
  // A creator pastes "youtube.com/@me" as often as a full URL; requiring the
  // scheme by hand is friction with no upside, so it is added here instead.
  const u = normalizeUrl(url);
  if (!l || !u) throw new Error("Нэр болон холбоос заавал.");
  const db = getDb();
  const posRows = await db
    .select({ maxPos: max(link.position) })
    .from(link)
    .where(eq(link.profileId, profile.id));
  await db.insert(link).values({
    profileId: profile.id,
    label: l,
    url: u,
    icon: detectLinkIcon(u),
    position: (posRows[0]?.maxPos ?? -1) + 1,
  });
  revalidatePath("/dashboard");
  revalidatePath(`/${profile.handle}`);
}

export async function deleteLink(id: string) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  await db
    .delete(link)
    .where(and(eq(link.id, id), eq(link.profileId, profile.id)));
  revalidatePath("/dashboard");
  revalidatePath(`/${profile.handle}`);
}

export async function reorderLinks(orderedIds: string[]) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  await Promise.all(
    orderedIds.map((id, i) =>
      db
        .update(link)
        .set({ position: i })
        .where(and(eq(link.id, id), eq(link.profileId, profile.id))),
    ),
  );
  revalidatePath("/dashboard");
  revalidatePath(`/${profile.handle}`);
}
