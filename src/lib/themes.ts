import type { profile } from "@/db/schema";

/**
 * The public-profile palettes.
 *
 * The product ships TWO of them — a dark one and a light one — transcribed
 * from the MVP redesign (file JLqMihd0UwHkxgu9f1TbNX, section MVP1, node
 * 1208-9475), which is drawn only on those two variants. The designer's old
 * "Dalai #1 / Dalai #2" names are now what they always were to a creator:
 * Dark Mode and Light Mode.
 *
 * The two warm palettes ("On Fire", "Coral Wave") were retired at the
 * designer's request. Their ENUM VALUES survive in Postgres — dropping a value
 * from an enum means recreating the type — so `getTheme` maps each legacy key
 * onto the surviving palette of the same brightness (see THEME_ALIASES). That
 * keeps a profile saved before the change rendering correctly whether or not
 * migration 0013 has run against the database in front of it.
 *
 * Client-safe: no database import, so the dashboard's theme picker can render
 * swatches without pulling the postgres driver into the bundle.
 *
 * Each theme fills the SAME token contract, and every themed surface reads a
 * token rather than a literal colour — that is what makes switching a theme a
 * one-line change instead of a rewrite of every section.
 */

export type ThemeKey = (typeof profile.$inferSelect)["theme"];

export type ThemeTokens = {
  /** Page + every section background. */
  bg: string;
  /** Hairline dividers between sections. */
  border: string;
  /**
   * The signature "pop" of the palette: the wordmark's arrow, the rule under
   * the top bar, and the first tag chip on the bio shelf.
   *
   * On the two Dalai palettes this is LinkSpot green (#0ad85b) exactly as the
   * MVP design specifies. The two warm palettes take their own hero colour
   * instead — a green arrow over On Fire's rust would read as a foreign logo
   * pasted onto the page rather than as part of it.
   */
  brand: string;
  /** Text/glyphs sitting ON a brand-filled surface. */
  onBrand: string;
  /** Username, bio, icons, section titles, entertainment strip. */
  accent: string;
  /** Text/glyphs sitting ON an accent-filled surface. */
  onAccent: string;
  /** Body copy. */
  text: string;
  /** Secondary copy (handle, captions). */
  muted: string;
  /** Top Picks / Wishlist / Not For Me product cards. May be a gradient. */
  card: string;
  onCard: string;
  /** Ask Me Anything cards. May be a gradient. */
  ask: string;
  onAsk: string;
  /** My Picks collection boxes. One colour per theme — the spec sheets
   *  replace the old three-colour rotation with a single Category swatch. */
  category: string;
  onCategory: string;
  /**
   * The bright card the entertainment strip and Quick Links rows sit on. The
   * MVP design keeps these white on BOTH the black and the white variant —
   * album art and favicons are photographic and need a neutral mount — so this
   * is its own token rather than a reuse of `card`.
   */
  media: string;
  onMedia: string;
  /** Secondary line on a media card (artist, host). */
  onMediaMuted: string;
  /**
   * Social row on the bio shelf. The design draws bare glyphs on the dark
   * variant and filled discs on the light one; both fall out of these two
   * values, with a transparent `socialBg` meaning "no disc".
   */
  socialBg: string;
  onSocial: string;
  /** The composer input inside the Ask card, and its placeholder. */
  askField: string;
  onAskField: string;
  /** Inset panel behind the Similar shelf. */
  panel: string;
  /** Fallback circle behind an initial when a creator has no avatar. */
  avatarBg: string;
  /**
   * Follow button. The MVP design draws it as a near-black pill with white
   * type on BOTH variants — it is the page's one hard call to action and does
   * not soften with the palette — so this is an ink, not an inverse of `bg`.
   * Coral Wave substitutes its own crimson ink for the same reason On Fire
   * keeps a green-free logo: pure black is foreign to that palette.
   */
  btn: string;
  onBtn: string;
  /** Promo ticket: card body, the chip the code sits on, the Copy control,
   *  the big headline, and the small print.
   *
   *  These are the ONE set of tokens here that do not follow the theme. A
   *  coupon is advertiser artwork rather than part of the creator's palette —
   *  the review (ubcab coupon-3) asked for the orange ticket on both Dark and
   *  Light Mode, so both live themes carry identical values and the ticket
   *  looks the same wherever it is pasted. They stay tokens rather than
   *  hardcoded hexes so one theme can still diverge if a future coupon design
   *  needs it. */
  promoBg: string;
  promoChip: string;
  /** The code itself, which sits ON `promoChip`. */
  promoOnChip: string;
  promoBtn: string;
  promoOnBtn: string;
  promoHeadline: string;
  promoText: string;
  /** The full-width call-to-action on a product card. On Fire's values come
   *  straight from the Figma card spec (#911c11 on #620000); the other themes
   *  use the equivalent "one step darker than the card" treatment so the
   *  button stays legible against each card surface. */
  cardBtn: string;
  onCardBtn: string;
  cardBtnBorder: string;

  /* --- Dashboard (profile editing) surfaces ---------------------------------
   * The editor is themed by the SAME palette the creator picked for their
   * public page, so these four have to work on a near-black background
   * (On Fire, Dalai #1) and on a cream/white one (Coral Wave, Dalai #2)
   * alike. That is why they are explicit per theme rather than a hardcoded
   * white overlay: `rgba(255,255,255,0.04)` is invisible on white paper. */
  /** Content well — the panel a group of fields sits in. */
  well: string;
  /** Field surface — inputs, textareas, selects, chips. */
  field: string;
  /** Hairline ring around a well or field. */
  ring: string;
  /** Destructive text (Delete, error copy). Legible on `bg`. */
  danger: string;
  /** Confirmation text ("Saved ✓"). Legible on `bg`. */
  success: string;
};

export type Theme = {
  key: ThemeKey;
  /** Creator-facing name, shown in the picker. */
  label: string;
  tokens: ThemeTokens;
};

/**
 * Every palette the database can hold, retired ones included. Not exported:
 * the picker must only ever offer what THEMES lists, and a retired key reaches
 * a palette through getTheme's alias table instead.
 */
const PALETTES: Theme[] = [
  {
    key: "on_fire",
    label: "On Fire",
    tokens: {
      bg: "#2a1617",
      border: "#7b4c46",
      brand: "#fe7f42",
      onBrand: "#2a1617",
      accent: "#fe7f42",
      onAccent: "#ffffff",
      text: "#feedd5",
      muted: "#a2a9b4",
      card: "#b22c20",
      onCard: "#feedd5",
      ask: "linear-gradient(135deg, #fe7f42 0%, #b22c20 100%)",
      onAsk: "#feedd5",
      category: "#fffb97",
      onCategory: "#2a1617",
      media: "#feedd5",
      onMedia: "#2a1617",
      onMediaMuted: "rgba(42,22,23,0.62)",
      socialBg: "#fe7f42",
      onSocial: "#ffffff",
      askField: "rgba(254,237,213,0.14)",
      onAskField: "rgba(254,237,213,0.6)",
      panel: "#1c0f0f",
      avatarBg: "#42282a",
      btn: "#0a0a0a",
      onBtn: "#ffffff",
      promoBg: "#fe7f42",
      promoChip: "#b22c20",
      promoOnChip: "#feedd5",
      promoBtn: "#feedd5",
      promoOnBtn: "#1a1a1a",
      promoHeadline: "#ffe500",
      promoText: "#feedd5",
      cardBtn: "#911c11",
      onCardBtn: "#ffffff",
      cardBtnBorder: "#620000",
      well: "rgba(255,255,255,0.04)",
      field: "rgba(255,255,255,0.06)",
      ring: "rgba(255,255,255,0.10)",
      danger: "#ff9a8a",
      success: "#8fe0a0",
    },
  },
  {
    key: "coral_wave",
    label: "Coral Wave",
    tokens: {
      bg: "#feedd5",
      border: "rgba(177,25,63,0.22)",
      brand: "#b1193f",
      onBrand: "#ffffff",
      accent: "#b1193f",
      onAccent: "#ffffff",
      text: "#b1193f",
      muted: "rgba(177,25,63,0.62)",
      card: "linear-gradient(135deg, #f62162 0%, #fdd566 100%)",
      onCard: "#ffffff",
      ask: "linear-gradient(135deg, #b1193f 0%, #ff5f5f 100%)",
      onAsk: "#ffffff",
      category: "#fe5f63",
      onCategory: "#ffffff",
      media: "#ffffff",
      onMedia: "#b1193f",
      onMediaMuted: "rgba(177,25,63,0.62)",
      socialBg: "#b1193f",
      onSocial: "#ffffff",
      askField: "rgba(255,255,255,0.88)",
      onAskField: "rgba(177,25,63,0.5)",
      panel: "rgba(177,25,63,0.08)",
      avatarBg: "rgba(177,25,63,0.14)",
      btn: "#b1193f",
      onBtn: "#ffffff",
      promoBg: "#c0003b",
      promoChip: "#ff605f",
      promoOnChip: "#ffffff",
      promoBtn: "#feedd5",
      promoOnBtn: "#1a1a1a",
      promoHeadline: "#ffe500",
      promoText: "#feedd5",
      cardBtn: "#b1193f",
      onCardBtn: "#ffffff",
      cardBtnBorder: "#8d1032",
      well: "rgba(177,25,63,0.06)",
      field: "rgba(177,25,63,0.08)",
      ring: "rgba(177,25,63,0.18)",
      danger: "#c0003b",
      success: "#127a4e",
    },
  },
  {
    key: "dalai_1",
    label: "Dark Mode",
    tokens: {
      bg: "#0b1014",
      border: "#323232",
      brand: "#0ad85b",
      onBrand: "#0b1014",
      accent: "#ffffff",
      onAccent: "#0b1014",
      text: "#ffffff",
      muted: "rgba(255,255,255,0.6)",
      card: "#1e1e1e",
      onCard: "#ffffff",
      ask: "#1e1e1e",
      onAsk: "#ffffff",
      category: "#ffffff",
      onCategory: "#0b1014",
      media: "#ffffff",
      onMedia: "#0b1014",
      onMediaMuted: "#343434",
      socialBg: "transparent",
      onSocial: "#ffffff",
      askField: "#f6f6f6",
      onAskField: "#ababab",
      panel: "#1e1e1e",
      avatarBg: "#1e1e1e",
      btn: "#0a0a0a",
      onBtn: "#ffffff",
      promoBg: "#f58220",
      promoChip: "#ffffff",
      promoOnChip: "#f58220",
      promoBtn: "#f58220",
      promoOnBtn: "#ffffff",
      promoHeadline: "#ffffff",
      promoText: "#ffffff",
      cardBtn: "#2f2f2f",
      onCardBtn: "#ffffff",
      cardBtnBorder: "rgba(255,255,255,0.18)",
      well: "rgba(255,255,255,0.05)",
      field: "rgba(255,255,255,0.08)",
      ring: "rgba(255,255,255,0.14)",
      danger: "#ff9a8a",
      success: "#8fe0a0",
    },
  },
  {
    key: "dalai_2",
    label: "Light Mode",
    tokens: {
      // The MVP design's light variant ("Tsagaan"/"White") inverts the figure
      // and ground of the black one rather than merely lightening it: the PAGE
      // is #f6f6f6 and the CARDS are pure white, so a card still reads as
      // raised. The previous white-page/grey-card pairing did the opposite and
      // made every section look recessed.
      bg: "#f6f6f6",
      border: "#e3e3e3",
      brand: "#0ad85b",
      onBrand: "#0b1014",
      accent: "#0b1014",
      onAccent: "#ffffff",
      text: "#0b1014",
      muted: "rgba(11,16,20,0.55)",
      card: "#ffffff",
      onCard: "#0b1014",
      ask: "#ffffff",
      onAsk: "#0b1014",
      category: "#0b1014",
      onCategory: "#ffffff",
      media: "#ffffff",
      onMedia: "#0b1014",
      onMediaMuted: "#343434",
      socialBg: "#0b1014",
      onSocial: "#ffffff",
      askField: "#f6f6f6",
      onAskField: "#ababab",
      panel: "#ffffff",
      avatarBg: "#e9e9e9",
      btn: "#0b1014",
      onBtn: "#ffffff",
      promoBg: "#f58220",
      promoChip: "#ffffff",
      promoOnChip: "#f58220",
      promoBtn: "#f58220",
      promoOnBtn: "#ffffff",
      promoHeadline: "#ffffff",
      promoText: "#ffffff",
      cardBtn: "#0b1014",
      onCardBtn: "#ffffff",
      cardBtnBorder: "#0b1014",
      well: "rgba(11,16,20,0.04)",
      field: "#ffffff",
      ring: "rgba(11,16,20,0.10)",
      danger: "#c62828",
      success: "#127a4e",
    },
  },
];

/**
 * What a creator can actually choose, in picker order: the dark variant first,
 * because it is the default and the one the MVP frames are drawn on.
 */
export const THEMES: Theme[] = [
  PALETTES.find((t) => t.key === "dalai_1")!,
  PALETTES.find((t) => t.key === "dalai_2")!,
];

/**
 * Retired key → the surviving palette of the same brightness. On Fire was the
 * dark warm theme and Coral Wave the light one, so each lands on the variant
 * whose figure/ground it already had; a profile that was dark stays dark.
 */
const THEME_ALIASES: Partial<Record<string, ThemeKey>> = {
  on_fire: "dalai_1",
  coral_wave: "dalai_2",
};

export const DEFAULT_THEME: ThemeKey = "dalai_1";

export function getTheme(key: string | null | undefined): Theme {
  const resolved = (key && THEME_ALIASES[key]) || key;
  return THEMES.find((t) => t.key === resolved) ?? THEMES[0]!;
}

/**
 * The theme as inline CSS custom properties for the profile root element.
 * Applied server-side on the wrapper, so the correct palette is in the very
 * first byte of HTML — no flash of the wrong theme, and no client JS involved.
 */
export function themeStyle(key: string | null | undefined): React.CSSProperties {
  const t = getTheme(key).tokens;
  return {
    "--t-bg": t.bg,
    "--t-border": t.border,
    "--t-brand": t.brand,
    "--t-on-brand": t.onBrand,
    "--t-accent": t.accent,
    "--t-on-accent": t.onAccent,
    "--t-text": t.text,
    "--t-muted": t.muted,
    "--t-card": t.card,
    "--t-on-card": t.onCard,
    "--t-ask": t.ask,
    "--t-on-ask": t.onAsk,
    "--t-category": t.category,
    "--t-on-category": t.onCategory,
    "--t-media": t.media,
    "--t-on-media": t.onMedia,
    "--t-on-media-muted": t.onMediaMuted,
    "--t-social-bg": t.socialBg,
    "--t-on-social": t.onSocial,
    "--t-ask-field": t.askField,
    "--t-on-ask-field": t.onAskField,
    "--t-panel": t.panel,
    "--t-avatar-bg": t.avatarBg,
    "--t-btn": t.btn,
    "--t-on-btn": t.onBtn,
    "--t-promo-bg": t.promoBg,
    "--t-promo-chip": t.promoChip,
    "--t-promo-on-chip": t.promoOnChip,
    "--t-promo-btn": t.promoBtn,
    "--t-promo-on-btn": t.promoOnBtn,
    "--t-promo-headline": t.promoHeadline,
    "--t-promo-text": t.promoText,
    "--t-card-btn": t.cardBtn,
    "--t-on-card-btn": t.onCardBtn,
    "--t-card-btn-border": t.cardBtnBorder,
    "--t-well": t.well,
    "--t-field": t.field,
    "--t-ring": t.ring,
    "--t-danger": t.danger,
    "--t-success": t.success,
  } as React.CSSProperties;
}
