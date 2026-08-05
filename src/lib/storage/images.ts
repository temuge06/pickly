import sharp from "sharp";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { REALISTIC_UA } from "@/lib/extract/canonicalize";

export const PICK_IMAGE_BUCKET = "pick-images";

export type RehostedImage = {
  url: string;
  width: number;
  height: number;
};

/**
 * Downloads a source image, converts to WebP, and stores it in Supabase
 * Storage — we never hotlink product images (CDNs block cross-origin and links
 * rot). Returns the public URL + dimensions for the blur placeholder. Returns
 * null on any failure so add-a-pick degrades to "no image" rather than failing
 * the whole save.
 */
export async function rehostImage(
  sourceUrl: string,
  profileId: string,
): Promise<RehostedImage | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: { "User-Agent": REALISTIC_UA },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const input = Buffer.from(await res.arrayBuffer());
    // Cap dimensions — product cards render at ≤480px; no need to store more.
    const pipeline = sharp(input).rotate().resize(960, 960, {
      fit: "inside",
      withoutEnlargement: true,
    });
    const { data, info } = await pipeline
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    const path = `${profileId}/${crypto.randomUUID()}.webp`;
    const admin = getSupabaseAdmin();
    const { error } = await admin.storage
      .from(PICK_IMAGE_BUCKET)
      .upload(path, data, { contentType: "image/webp", upsert: false });
    if (error) return null;

    const { data: pub } = admin.storage
      .from(PICK_IMAGE_BUCKET)
      .getPublicUrl(path);

    return { url: pub.publicUrl, width: info.width, height: info.height };
  } catch {
    return null;
  }
}
