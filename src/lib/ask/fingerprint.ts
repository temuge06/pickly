/**
 * Coarse, stable-per-browser fingerprint used only so a creator can block a
 * persistent asker. Deliberately weak — a random id persisted in localStorage,
 * NOT a device fingerprint. Anyone can clear it; that's acceptable, because the
 * block is a nuisance-reducer, not a security boundary. No identity is derived.
 */
const KEY = "pickly_ask_fp";

export function getClientFingerprint(): string {
  if (typeof window === "undefined") return "anon";
  try {
    let fp = window.localStorage.getItem(KEY);
    if (!fp) {
      fp = crypto.randomUUID();
      window.localStorage.setItem(KEY, fp);
    }
    return fp;
  } catch {
    return "anon";
  }
}
