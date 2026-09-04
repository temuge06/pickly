/**
 * The social platforms a creator can attach to their profile.
 *
 * One catalogue, shared by the editor (which renders a row per chosen
 * platform) and by the public header (which renders a glyph per stored key).
 * Keeping them in the same list is what stops the old failure mode where the
 * editor could save a key the profile had no icon for, and the link silently
 * vanished from the public page.
 *
 * Client-safe: no database import, so both a client editor and a server
 * component can read it.
 */

export const SOCIAL_KEYS = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "threads",
  "x",
  "telegram",
  "linkedin",
  "snapchat",
  "pinterest",
  "twitch",
  "spotify",
  "website",
  "email",
] as const;

export type SocialKey = (typeof SOCIAL_KEYS)[number];

export type SocialPlatform = {
  key: SocialKey;
  label: string;
  /** What the creator types — a handle for Instagram, a pasted link elsewhere. */
  placeholder: string;
  /** Prepended to a bare handle to build the stored URL. Still used by every
   *  platform as a tolerance: a creator who types just their username into a
   *  link field gets a working address rather than an error. */
  prefix: string;
  /** Shown as a static affix in the editor field so the creator only types
   *  the handle. Empty for every link-mode platform, which takes the whole
   *  value. */
  display: string;
  /**
   * How the editor asks for this platform.
   *
   *   "handle" — a username, typed after a fixed `display` affix
   *   "url"    — the whole link, pasted
   *
   * Instagram is the only handle-mode platform left. The design review found
   * the affix rows confusing everywhere else: a creator has the share link on
   * their clipboard, not a bare username, and platforms whose share URL is not
   * simply `prefix + handle` (a YouTube /channel/UC… address, a Facebook page
   * id, a Telegram invite) could not be expressed at all.
   */
  mode: "handle" | "url";
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: "instagram", label: "Instagram", placeholder: "username", prefix: "https://instagram.com/", display: "instagram.com/", mode: "handle" },
  { key: "tiktok", label: "TikTok", placeholder: "tiktok.com/@username", prefix: "https://tiktok.com/@", display: "", mode: "url" },
  { key: "youtube", label: "YouTube", placeholder: "youtube.com/@channel", prefix: "https://youtube.com/@", display: "", mode: "url" },
  { key: "facebook", label: "Facebook", placeholder: "facebook.com/page", prefix: "https://facebook.com/", display: "", mode: "url" },
  { key: "threads", label: "Threads", placeholder: "threads.net/@username", prefix: "https://threads.net/@", display: "", mode: "url" },
  { key: "x", label: "X", placeholder: "x.com/username", prefix: "https://x.com/", display: "", mode: "url" },
  { key: "telegram", label: "Telegram", placeholder: "t.me/username", prefix: "https://t.me/", display: "", mode: "url" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/username", prefix: "https://linkedin.com/in/", display: "", mode: "url" },
  { key: "snapchat", label: "Snapchat", placeholder: "snapchat.com/add/username", prefix: "https://snapchat.com/add/", display: "", mode: "url" },
  { key: "pinterest", label: "Pinterest", placeholder: "pinterest.com/username", prefix: "https://pinterest.com/", display: "", mode: "url" },
  { key: "twitch", label: "Twitch", placeholder: "twitch.tv/username", prefix: "https://twitch.tv/", display: "", mode: "url" },
  { key: "spotify", label: "Spotify", placeholder: "open.spotify.com/user/…", prefix: "https://open.spotify.com/user/", display: "", mode: "url" },
  { key: "website", label: "Вэбсайт", placeholder: "example.com", prefix: "https://", display: "", mode: "url" },
  { key: "email", label: "Имэйл", placeholder: "hello@example.com", prefix: "mailto:", display: "", mode: "url" },
];

const BY_KEY = new Map(SOCIAL_PLATFORMS.map((p) => [p.key, p]));

export function getPlatform(key: string): SocialPlatform | undefined {
  return BY_KEY.get(key as SocialKey);
}

export function isSocialKey(key: string): key is SocialKey {
  return BY_KEY.has(key as SocialKey);
}

/**
 * Turn whatever the creator typed into a URL that will actually open.
 *
 * Accepts a bare handle (`sarnai`, `@sarnai`), a bare domain path
 * (`instagram.com/sarnai`), or a full URL — in every mode, so a link field
 * that got a username still resolves. Returns null when there is nothing
 * usable left after trimming, so the caller can drop the key entirely rather
 * than store an empty string.
 */
export function normalizeSocial(key: string, raw: string): string | null {
  const platform = getPlatform(key);
  if (!platform) return null;
  const value = raw.trim();
  if (!value) return null;

  if (platform.key === "email") {
    const email = value.replace(/^mailto:/i, "").trim();
    return email.includes("@") ? `mailto:${email}` : null;
  }

  if (/^https?:\/\//i.test(value)) return value;

  // A pasted "instagram.com/sarnai" is a URL missing only its scheme; adding
  // the platform prefix on top of it would produce instagram.com/instagram.com/…
  if (/^[a-z0-9-]+(\.[a-z]{2,})+(\/|$)/i.test(value) || platform.key === "website") {
    return `https://${value.replace(/^\/+/, "")}`;
  }

  return platform.prefix + value.replace(/^@+/, "").replace(/^\/+/, "");
}

/* --- Quick Links ---------------------------------------------------------
 * A Quick Link is free-form (any URL, any title), but it still gets a glyph.
 * Both the editor's live preview and the server action that persists the row
 * resolve it through the same table, so what the creator sees while typing is
 * what ends up on the public page.
 */

const LINK_ICON_RULES: [RegExp, string][] = [
  [/(^|\.)youtube\.com|(^|\.)youtu\.be/, "youtube"],
  [/(^|\.)tiktok\.com/, "tiktok"],
  [/(^|\.)instagram\.com/, "instagram"],
  [/(^|\.)facebook\.com|(^|\.)fb\.(com|me)/, "facebook"],
  [/(^|\.)threads\.(net|com)/, "threads"],
  [/(^|\.)(x|twitter)\.com/, "x"],
  [/(^|\.)t\.me|(^|\.)telegram\./, "telegram"],
  [/(^|\.)linkedin\.com/, "linkedin"],
  [/(^|\.)snapchat\.com/, "snapchat"],
  [/(^|\.)pinterest\./, "pinterest"],
  [/(^|\.)twitch\.tv/, "twitch"],
  [/(^|\.)spotify\.com/, "spotify"],
  [/(^|\.)substack\.com|mailchi|(^|\.)beehiiv\.com|newsletter/, "newsletter"],
];

/** Icon key for a Quick Link URL. Always resolves — "link" is the fallback. */
export function detectLinkIcon(url: string): string {
  const host = hostOf(url) ?? url.toLowerCase();
  for (const [re, icon] of LINK_ICON_RULES) if (re.test(host)) return icon;
  return "link";
}

/** A sensible default title so adding a link needs one field, not two. */
export function suggestLinkLabel(url: string): string {
  const icon = detectLinkIcon(url);
  const platform = getPlatform(icon);
  if (platform) return platform.label;
  if (icon === "newsletter") return "Newsletter";
  const host = hostOf(url);
  if (!host) return "";
  const name = host.split(".")[0] ?? host;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function hostOf(url: string): string | null {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname
      .replace(/^www\./, "")
      .toLowerCase();
  } catch {
    return null;
  }
}

/** Accept a pasted URL with or without a scheme; null when unparseable. */
export function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const u = new URL(withScheme);
    return u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * The reverse: what to show in the editor field. A stored URL that matches the
 * platform's own prefix collapses back to the bare handle the creator typed;
 * anything else (a pasted third-party URL) is shown in full.
 */
export function displaySocial(key: string, url: string): string {
  const platform = getPlatform(key);
  if (!platform) return url;
  if (platform.key === "email") return url.replace(/^mailto:/i, "");
  // A link-mode field holds the whole address, so it is shown whole — minus
  // the scheme, which is noise the creator never has to retype (normalizeSocial
  // puts it back). Collapsing it to a bare handle here would be a lie: the
  // field no longer accepts one on its own.
  if (platform.mode === "url") return url.replace(/^https?:\/\//i, "");
  if (url.toLowerCase().startsWith(platform.prefix.toLowerCase())) {
    return url.slice(platform.prefix.length);
  }
  return url;
}
