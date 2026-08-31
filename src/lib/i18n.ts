/**
 * The public profile in Mongolian and English (Figma MVP1: the "MN black" /
 * "Eng Black" and "Mn White" / "Eng White" frame pairs).
 *
 * Scope is deliberately the visitor-facing profile only. The dashboard, admin
 * console and auth screens stay Mongolian: they are seen by the creator who
 * already chose to sign up in Mongolian, whereas a profile is a link that gets
 * sent to anyone.
 *
 * The locale is a COOKIE, not client state, because the profile is a server
 * component. Reading it during the render means the correct language is in the
 * first byte of HTML — no flash of Mongolian before English appears, and no
 * shipping both string tables to the browser to switch between.
 */

export const LOCALES = ["mn", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Mongolian is the default: the audience is Mongolian creators and their followers. */
export const DEFAULT_LOCALE: Locale = "mn";

export const LOCALE_COOKIE = "linkspot_lang";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "mn" || value === "en";
}

export function parseLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Every visitor-facing string on the profile. One flat table rather than a
 * library: there are a few dozen strings, no pluralisation, and no runtime
 * locale negotiation, so a dependency would be more machinery than the problem
 * needs. Adding a key here is a type error everywhere until both languages are
 * filled in, which is the property that actually keeps translations honest.
 */
const STRINGS = {
  // Section headings
  quickLinks: { mn: "Холбоосууд", en: "Quick Links" },
  promoCode: { mn: "Урамшууллын Код", en: "Promo Code" },
  myPicks: { mn: "Миний сонголт", en: "My Picks" },
  wishlist: { mn: "Хүслийн жагсаалт", en: "Wishlist" },
  notForMe: { mn: "Надад тохирсонгүй", en: "Not For Me" },
  askMeAnything: { mn: "Надаас юу ч асуугаарай!", en: "Ask Me Anything!" },
  picksSuffix: { mn: "-ийн сонголт", en: "'s Picks" },

  // Entertainment tabs
  tabMusic: { mn: "Дуу", en: "Music" },
  tabFilms: { mn: "Кино", en: "Movies" },
  tabBooks: { mn: "Ном", en: "Books" },
  listen: { mn: "сонсох", en: "listen" },
  stop: { mn: "зогсоох", en: "stop" },

  // Header
  follow: { mn: "Дагах", en: "Follow" },
  following: { mn: "Дагаж байна", en: "Following" },
  editProfile: { mn: "Профайл засах", en: "Edit profile" },
  backToMine: { mn: "Миний профайл руу буцах", en: "Back to my profile" },
  notifications: { mn: "Мэдэгдэл", en: "Notifications" },

  // Ask
  askPlaceholder: { mn: "Асуулт үлдээх", en: "Leave me questions!" },
  question: { mn: "Асуулт", en: "Question" },
  today: { mn: "өнөөдөр", en: "today" },
  yesterday: { mn: "өчигдөр", en: "yesterday" },
  daysAgoSuffix: { mn: " өдрийн өмнө", en: " days ago" },

  // Cards
  viewMore: { mn: "Дэлгэрэнгүй үзэх", en: "View more" },
  view: { mn: "үзэх", en: "view" },
  picksCount: { mn: " сонголт", en: " picks" },
  copy: { mn: "Хуулах", en: "Copy" },
  copied: { mn: "Хууллаа", en: "Copied" },
  promoCodeLabel: { mn: "Урамшууллын код", en: "Promo code" },
  viewProfile: { mn: "LinkSpot үзэх", en: "View on LinkSpot" },
  onLinkspot: { mn: "LinkSpot дээр", en: "on LinkSpot" },

  // Footer / chrome
  since: { mn: "2026 оноос", en: "since 2026" },
  switchLanguage: { mn: "Switch to English", en: "Монгол руу шилжих" },
} as const;

export type StringKey = keyof typeof STRINGS;

/** Look up one string. Both languages are required at the type level. */
export function t(locale: Locale, key: StringKey): string {
  return STRINGS[key][locale];
}

/**
 * Curried form, so a component can take one `t` and stop threading `locale`
 * through every call.
 */
export function translator(locale: Locale) {
  return (key: StringKey) => t(locale, key);
}

export type T = ReturnType<typeof translator>;
