import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import * as schema from "./schema";
import {
  demoAskMessages,
  demoBooks,
  demoCollections,
  demoFilms,
  demoLinks,
  demoPicks,
  demoProfile,
  demoTracks,
} from "@/lib/fixtures/demo-profile";

/**
 * Seeds two demo creators with realistic Mongolian content so a fresh clone
 * shows the finished product. Creator 1 reuses the fixture data that also backs
 * the zero-key public page; creator 2 is defined inline.
 *
 * Requires DATABASE_URL. Auth users are created via the Supabase Admin API when
 * configured; otherwise inserted straight into auth.users (works against a
 * Supabase Postgres / local stack).
 */

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error("DATABASE_URL is not set.");

const client = postgres(DB_URL, { max: 1 });
const db = drizzle(client, { schema });

async function ensureAuthUser(
  id: string,
  email: string,
): Promise<void> {
  // Preferred: Admin API (handles Supabase's auth triggers correctly).
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } },
    );
    // createUser can't set a specific id, so we look up by email first and
    // reuse it; the returned id becomes the profile's user_id.
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { seed: true },
    });
    if (!error && created.user) {
      idOverrides[id] = created.user.id;
      return;
    }
    // Already exists → find it.
    const { data: list } = await admin.auth.admin.listUsers();
    const found = list?.users.find((u) => u.email === email);
    if (found) {
      idOverrides[id] = found.id;
      return;
    }
  }

  // Fallback: direct insert into auth.users (Supabase / local Postgres).
  await db.execute(sql`
    INSERT INTO auth.users (id, email)
    VALUES (${id}::uuid, ${email})
    ON CONFLICT (id) DO NOTHING
  `);
  idOverrides[id] = id;
}

// Maps the fixture/placeholder user ids to the real auth user ids.
const idOverrides: Record<string, string> = {};

async function main() {
  console.log("Seeding…");

  const user1 = "00000000-0000-4000-8000-000000000001";
  const user2 = "00000000-0000-4000-8000-000000000002";
  await ensureAuthUser(user1, "sarnai@pickly.local");
  await ensureAuthUser(user2, "tuguldur@pickly.local");

  // --- Creator 1: reuse fixtures (sarnai) ---
  const p1 = { ...demoProfile, userId: idOverrides[user1]! };
  await db
    .insert(schema.profile)
    .values(p1)
    .onConflictDoNothing({ target: schema.profile.id });

  await insertMany(schema.collection, demoCollections);
  await insertMany(schema.pick, demoPicks);
  await insertMany(schema.activityItem, [
    ...demoTracks,
    ...demoFilms,
    ...demoBooks,
  ]);
  await insertMany(schema.link, demoLinks);

  // Active connections so the sync-health path has data to reason about, and
  // so the "Listening/Watching are live" story is visible in the dashboard.
  await db
    .insert(schema.connection)
    .values([
      {
        id: "cc000000-0000-4000-8000-000000000001",
        profileId: demoProfile.id,
        provider: "spotify",
        externalUsername: "sarnai",
        status: "active",
        lastSyncAt: new Date(),
      },
      {
        id: "cc000000-0000-4000-8000-000000000002",
        profileId: demoProfile.id,
        provider: "letterboxd",
        externalUsername: "sarnai",
        status: "active",
        lastSyncAt: new Date(),
      },
    ])
    .onConflictDoNothing();

  // A few Ask messages: two published (fixtures) plus a new one and a filtered
  // one, so the inbox demonstrates every state.
  await insertMany(schema.askMessage, demoAskMessages);
  await db
    .insert(schema.askMessage)
    .values([
      {
        id: "fa000000-0000-4000-8000-000000000003",
        profileId: demoProfile.id,
        body: "Тэр цүнхийг хаанаас авсан бэ? Үнэтэй юу?",
        status: "new",
      },
      {
        id: "fa000000-0000-4000-8000-000000000004",
        profileId: demoProfile.id,
        body: "Чи новш юм. (filtered example)",
        status: "hidden",
      },
    ])
    .onConflictDoNothing();

  // --- Creator 2: tuguldur (music + film) ---
  const p2Id = "d1a1f7b0-0000-4000-8000-000000000002";
  await db
    .insert(schema.profile)
    .values({
      id: p2Id,
      userId: idOverrides[user2]!,
      handle: "tuguldur",
      displayName: "Төгөлдөр",
      bio: "film, vinyl, кофе. Кино тухай бичдэг.",
      avatarUrl: "https://picsum.photos/seed/tuguldur-avatar/200/200",
      accentColor: "#2f8f7a",
      socials: {
        instagram: "https://instagram.com/tuguldur",
        youtube: "https://youtube.com/@tuguldur",
      },
      askEnabled: true,
      askPrompt: "Кино, ном асуувал зохино 🎬",
      isMinor: false,
    })
    .onConflictDoNothing({ target: schema.profile.id });

  await db
    .insert(schema.pick)
    .values([
      {
        id: "b1000000-0000-4000-8000-000000000001",
        profileId: p2Id,
        title: "AeroPress Go",
        brand: "AeroPress",
        imageUrl: "https://picsum.photos/seed/aeropress/480/480",
        priceMnt: 165000,
        note: "Аяллын кофены хамгийн сайн шийдэл.",
        status: "recommend",
        meta: {},
        position: 0,
      },
      {
        id: "b1000000-0000-4000-8000-000000000002",
        profileId: p2Id,
        title: "Portra 400 (3 pack)",
        brand: "Kodak",
        imageUrl: "https://picsum.photos/seed/portra400/480/480",
        priceMnt: 145000,
        note: "Дуртай хальс. Дулаан өнгө.",
        status: "repurchased",
        meta: {},
        position: 1,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.activityItem)
    .values([
      {
        id: "a1000000-0000-4000-8000-000000000001",
        profileId: p2Id,
        provider: "letterboxd",
        kind: "film",
        externalId: "t-film-1",
        title: "In the Mood for Love",
        subtitle: "2000",
        imageUrl: "https://picsum.photos/seed/moodforlove/400/600",
        externalUrl: "https://letterboxd.com/film/in-the-mood-for-love/",
        occurredAt: new Date("2026-07-22T00:00:00Z"),
        meta: { rating: 5 },
      },
      {
        id: "a1000000-0000-4000-8000-000000000002",
        profileId: p2Id,
        provider: "manual",
        kind: "book",
        externalId: "t-book-1",
        title: "Norwegian Wood",
        subtitle: "Haruki Murakami",
        imageUrl: "https://picsum.photos/seed/norwegianwood/400/600",
        occurredAt: new Date("2026-07-05T00:00:00Z"),
        meta: {},
      },
    ])
    .onConflictDoNothing();

  console.log("Seed complete: @sarnai, @tuguldur");
  await client.end();
}

async function insertMany<T extends { id: string }>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
): Promise<void> {
  if (rows.length === 0) return;
  // Cast is safe: each fixture array matches its table's insert shape.
  await db
    .insert(table)
    .values(rows as never)
    .onConflictDoNothing();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
