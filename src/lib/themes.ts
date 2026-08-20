import type { profile } from "@/db/schema";

/**
 * The four public-profile palettes, transcribed from the designer's Figma spec
 * sheets (file JLqMihd0UwHkxgu9f1TbNX, nodes 962-5637 / 962-5736 / 962-5798 /
 * 962-8119). Client-safe: no database import, so the dashboard's theme picker
 * can render swatches without pulling the postgres driver into the bundle.
 *
 * Each theme fills the SAME token contract, and every themed surface reads a
 * token rather than a literal colour — that is what makes switching a theme a
 * one-line change instead of a rewrite of every section.
 *
 * Two annotation labels in the Figma sheets contradict their own swatches
 * (On Fire's background label reads #FEEDD5, Dalai #2's reads #0B1014). The
 * swatches and the rendered mocks agree with each other, so the values below
 * follow the swatches: #2A1617 and #FFFFFF respectively.
 */

export type ThemeKey = (typeof profile.$inferSelect)["theme"];

export type ThemeTokens = {
  /** Page + every section background. */
  bg: string;
  /** Hairline dividers between sections. */
  border: string;
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
  /** "Similar creators" cards. May be a gradient. */
  others: string;
  onOthers: string;
  /** My Picks collection boxes. One colour per theme — the spec sheets
   *  replace the old three-colour rotation with a single Category swatch. */
  category: string;
  onCategory: string;
  /** Inset panel behind the Similar shelf. */
  panel: string;
  /** Fallback circle behind an initial when a creator has no avatar. */
  avatarBg: string;
  /** Follow button — a neutral inverse of the background in every theme. */
  btn: string;
  onBtn: string;
  /** Promo ticket: card body, the chip the code sits on, the Copy control,
   *  the big headline, and the small print. Taken from the four variants of
   *  the coupon component rather than derived — the designer picked a specific
   *  pairing per theme (e.g. yellow headline on every dark theme, black on the
   *  light one). */
  promoBg: string;
  promoChip: string;
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
  /** Designer's name, shown in the picker. */
  label: string;
  tokens: ThemeTokens;
};

export const THEMES: Theme[] = [
  {
    key: "on_fire",
    label: "On Fire",
    tokens: {
      bg: "#2a1617",
      border: "#7b4c46",
      accent: "#fe7f42",
      onAccent: "#ffffff",
      text: "#feedd5",
      muted: "#a2a9b4",
      card: "#b22c20",
      onCard: "#feedd5",
      ask: "linear-gradient(135deg, #fe7f42 0%, #b22c20 100%)",
      onAsk: "#feedd5",
      others: "linear-gradient(135deg, #b22c20 0%, #fffb97 100%)",
      onOthers: "#ffffff",
      category: "#fffb97",
      onCategory: "#2a1617",
      panel: "#1c0f0f",
      avatarBg: "#42282a",
      btn: "#ffffff",
      onBtn: "#0a0a0a",
      promoBg: "#fe7f42",
      promoChip: "#b22c20",
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
      accent: "#b1193f",
      onAccent: "#ffffff",
      text: "#b1193f",
      muted: "rgba(177,25,63,0.62)",
      card: "linear-gradient(135deg, #f62162 0%, #fdd566 100%)",
      onCard: "#ffffff",
      ask: "linear-gradient(135deg, #b1193f 0%, #ff5f5f 100%)",
      onAsk: "#ffffff",
      others: "linear-gradient(135deg, #ff5f5f 0%, #fdd566 100%)",
      onOthers: "#ffffff",
      category: "#fe5f63",
      onCategory: "#ffffff",
      panel: "rgba(177,25,63,0.08)",
      avatarBg: "rgba(177,25,63,0.14)",
      btn: "#ffffff",
      onBtn: "#b1193f",
      promoBg: "#c0003b",
      promoChip: "#ff605f",
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
    label: "Dalai #1",
    tokens: {
      bg: "#0b1014",
      border: "rgba(255,255,255,0.16)",
      accent: "#ffffff",
      onAccent: "#0b1014",
      text: "#ffffff",
      muted: "rgba(255,255,255,0.6)",
      card: "#1e1e1e",
      onCard: "#ffffff",
      ask: "#1e1e1e",
      onAsk: "#ffffff",
      others: "#ffffff",
      onOthers: "#0b1014",
      category: "#ffffff",
      onCategory: "#0b1014",
      panel: "#1e1e1e",
      avatarBg: "#1e1e1e",
      btn: "#ffffff",
      onBtn: "#0b1014",
      promoBg: "#222222",
      promoChip: "#3f3f3f",
      promoBtn: "#ffe500",
      promoOnBtn: "#1a1a1a",
      promoHeadline: "#ffe500",
      promoText: "#9b9b9b",
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
    label: "Dalai #2",
    tokens: {
      bg: "#ffffff",
      border: "rgba(0,0,0,0.12)",
      accent: "#000000",
      onAccent: "#ffffff",
      text: "#000000",
      muted: "rgba(0,0,0,0.55)",
      card: "#f7f7f7",
      onCard: "#000000",
      ask: "#f7f7f7",
      onAsk: "#000000",
      others: "#f7f7f7",
      onOthers: "#000000",
      category: "#000000",
      onCategory: "#ffffff",
      panel: "#f7f7f7",
      avatarBg: "#f0f0f0",
      btn: "#000000",
      onBtn: "#ffffff",
      promoBg: "#e7e7e7",
      promoChip: "#9a9a9a",
      promoBtn: "#ffffff",
      promoOnBtn: "#1a1a1a",
      promoHeadline: "#000000",
      promoText: "#000000",
      cardBtn: "#000000",
      onCardBtn: "#ffffff",
      cardBtnBorder: "#000000",
      well: "rgba(0,0,0,0.04)",
      field: "rgba(0,0,0,0.06)",
      ring: "rgba(0,0,0,0.12)",
      danger: "#c62828",
      success: "#127a4e",
    },
  },
];

export const DEFAULT_THEME: ThemeKey = "on_fire";

export function getTheme(key: string | null | undefined): Theme {
  return THEMES.find((t) => t.key === key) ?? THEMES[0]!;
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
    "--t-accent": t.accent,
    "--t-on-accent": t.onAccent,
    "--t-text": t.text,
    "--t-muted": t.muted,
    "--t-card": t.card,
    "--t-on-card": t.onCard,
    "--t-ask": t.ask,
    "--t-on-ask": t.onAsk,
    "--t-others": t.others,
    "--t-on-others": t.onOthers,
    "--t-category": t.category,
    "--t-on-category": t.onCategory,
    "--t-panel": t.panel,
    "--t-avatar-bg": t.avatarBg,
    "--t-btn": t.btn,
    "--t-on-btn": t.onBtn,
    "--t-promo-bg": t.promoBg,
    "--t-promo-chip": t.promoChip,
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
