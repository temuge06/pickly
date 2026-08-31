import { z } from "zod";

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
 * Bio-shelf tag chips. The design lays out three chips on one 197px row, so
 * the cap is a layout constraint as much as a product one — a fourth chip
 * wraps under the username and breaks the header's height.
 */
export const MAX_PROFILE_TAGS = 3;

/** One chip. Short enough to stay on a single line at 12px. */
export const profileTagSchema = z
  .string()
  .trim()
  .min(1)
  .max(16, "Таг хамгийн ихдээ 16 тэмдэгт.");

/**
 * The whole chip row, normalised: blanks dropped, duplicates collapsed
 * case-insensitively (so "Boxing" and "boxing" cannot both occupy the row),
 * and truncated to the cap. Order is preserved because the first chip is the
 * filled one on the public page.
 */
export const profileTagsSchema = z
  .array(profileTagSchema.or(z.string().trim().max(16)))
  .transform((values) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of values) {
      const tag = raw.trim();
      if (!tag) continue;
      const key = tag.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(tag);
      if (out.length === MAX_PROFILE_TAGS) break;
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
