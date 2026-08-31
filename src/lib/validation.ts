import { z } from "zod";
import {
  MAX_INTERESTS,
  isInterestKey,
  isMbtiType,
  type MbtiType,
} from "@/lib/personality";

/**
 * Handle rules: lowercase [a-z0-9_], 3–24 chars. Stored citext so lookups are
 * case-insensitive; we lowercase on the way in so the canonical form is stable.
 * Reserved words keep app routes from being shadowed by a handle.
 */
const RESERVED = new Set([
  "dashboard",
  "sign-in",
  "forgot-password",
  "reset-password",
  "onboarding",
  "auth",
  "api",
  "ask",
  "_next",
  "favicon.ico",
  "admin",
  "notifications",
  "settings",
  "about",
]);

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Хэрэглэгчийн нэр дор хаяж 3 тэмдэгт.")
  .max(24, "Хэрэглэгчийн нэр хамгийн ихдээ 24 тэмдэгт.")
  .regex(/^[a-z0-9_]+$/, "Зөвхөн жижиг үсэг, тоо, доогуур зураас (_).")
  .refine((v) => !RESERVED.has(v), "Энэ нэрийг ашиглах боломжгүй.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Нэрээ оруулна уу.")
  .max(60, "Нэр хэтэрхий урт байна.");

export const bioSchema = z.string().trim().max(160).optional();

/**
 * MBTI type. Optional at every entry point: onboarding lets it be skipped, and
 * an empty string from a form means "cleared", not "invalid".
 */
export const mbtiSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => v === "" || isMbtiType(v), "MBTI төрөл буруу байна.")
  .transform((v) => (v === "" ? null : (v as MbtiType)))
  .nullable();

/**
 * Interest keys, normalised: anything outside the catalogue is dropped rather
 * than rejected, duplicates collapse, and the list is capped. Dropping instead
 * of erroring matters because the catalogue can shrink — a creator whose saved
 * interest was retired should keep the rest, not be unable to save at all.
 * Order is preserved, since the leading entries are the ones that reach the
 * public chip row.
 */
export const interestsSchema = z.array(z.string()).transform((values) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const key = raw.trim();
    if (!key || seen.has(key) || !isInterestKey(key)) continue;
    seen.add(key);
    out.push(key);
    if (out.length === MAX_INTERESTS) break;
  }
  return out;
});

/** My Picks shows at most three collection boxes. */
export const MAX_COLLECTIONS = 3;

/** Auth: email + password. Supabase hashes with bcrypt (72-byte input cap). */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Имэйл хаяг буруу байна.");

export const passwordSchema = z
  .string()
  .min(6, "Нууц үг дор хаяж 6 тэмдэгт байх ёстой.")
  .max(72, "Нууц үг хэтэрхий урт байна.");

export function isValidHandle(handle: string): boolean {
  return handleSchema.safeParse(handle).success;
}
