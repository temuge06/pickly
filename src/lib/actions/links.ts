"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { link } from "@/db/schema";
import { requireCurrentProfile } from "@/lib/auth/session";

function iconForUrl(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("youtube") || u.includes("youtu.be")) return "youtube";
  if (u.includes("tiktok")) return "tiktok";
  if (u.includes("instagram")) return "instagram";
  if (u.includes("substack") || u.includes("newsletter") || u.includes("mailchi"))
    return "newsletter";
  return "link";
}

export async function createLink(label: string, url: string) {
  const profile = await requireCurrentProfile();
  const l = label.trim();
  const u = url.trim();
  if (!l || !u) throw new Error("Нэр болон холбоос заавал.");
  try {
    new URL(u);
  } catch {
    throw new Error("Холбоос буруу байна.");
  }
  const db = getDb();
  const posRows = await db
    .select({ maxPos: max(link.position) })
    .from(link)
    .where(eq(link.profileId, profile.id));
  await db.insert(link).values({
    profileId: profile.id,
    label: l,
    url: u,
    icon: iconForUrl(u),
    position: (posRows[0]?.maxPos ?? -1) + 1,
  });
  revalidatePath("/dashboard");
}

export async function deleteLink(id: string) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  await db
    .delete(link)
    .where(and(eq(link.id, id), eq(link.profileId, profile.id)));
  revalidatePath("/dashboard");
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
}
