import { z } from "zod";

/**
 * Handle rules: lowercase [a-z0-9_], 3–24 chars. Stored citext so lookups are
 * case-insensitive; we lowercase on the way in so the canonical form is stable.
 * Reserved words keep app routes from being shadowed by a handle.
 */
const RESERVED = new Set([
  "dashboard",
  "sign-in",
  "onboarding",
  "auth",
  "api",
  "ask",
  "_next",
  "favicon.ico",
  "admin",
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

export function isValidHandle(handle: string): boolean {
  return handleSchema.safeParse(handle).success;
}
