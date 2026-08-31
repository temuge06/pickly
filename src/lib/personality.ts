import type { Locale } from "@/lib/i18n";

/**
 * The vocabulary behind the bio-shelf chips (Figma 1291:10350 — "ENTJ",
 * "Marketing", "Boxing").
 *
 * Those three chips are not free text: they are the creator's MBTI type plus
 * the first of their chosen interests, which is why the design fills the first
 * one and outlines the rest. Both lists are closed sets rather than open input,
 * so the same interest reads identically on every profile and can be matched
 * across creators later without a normalisation pass.
 *
 * Client-safe: no database import, so the onboarding and dashboard pickers can
 * render the whole vocabulary without pulling the postgres driver into the
 * bundle.
 */

/** The sixteen types. Order is the conventional four-group layout. */
export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export type MbtiType = (typeof MBTI_TYPES)[number];

export function isMbtiType(value: string): value is MbtiType {
  return (MBTI_TYPES as readonly string[]).includes(value);
}

/**
 * Where "I don't know my type" sends people. The free test is the one everyone
 * links to and it serves Mongolian, so a creator who has never taken it can
 * finish onboarding in one detour rather than abandoning the step.
 */
export const MBTI_TEST_URL = "https://www.16personalities.com/free-personality-test";

/**
 * Interests, stored by their stable `key` and rendered per locale. The key is
 * what lands in the database, so re-wording a label later does not orphan every
 * profile that picked it.
 *
 * Chosen for Mongolian creators rather than lifted from the reference
 * screenshots: the Figma pins Bumble's dating-app list ("Gin & tonic", "Hot
 * yoga"), which is the interaction pattern we want, not the vocabulary.
 */
export type Interest = { key: string; en: string; mn: string };

export const INTERESTS: Interest[] = [
  { key: "beauty", en: "Beauty", mn: "Гоо сайхан" },
  { key: "skincare", en: "Skincare", mn: "Арьс арчилгаа" },
  { key: "fashion", en: "Fashion", mn: "Загвар" },
  { key: "fitness", en: "Fitness", mn: "Фитнес" },
  { key: "running", en: "Running", mn: "Гүйлт" },
  { key: "boxing", en: "Boxing", mn: "Бокс" },
  { key: "basketball", en: "Basketball", mn: "Сагсан бөмбөг" },
  { key: "football", en: "Football", mn: "Хөл бөмбөг" },
  { key: "hiking", en: "Hiking", mn: "Явган аялал" },
  { key: "travel", en: "Travel", mn: "Аялал" },
  { key: "coffee", en: "Coffee", mn: "Кофе" },
  { key: "cooking", en: "Cooking", mn: "Хоол хийх" },
  { key: "food", en: "Food", mn: "Хоол" },
  { key: "music", en: "Music", mn: "Хөгжим" },
  { key: "kpop", en: "K-Pop", mn: "K-Pop" },
  { key: "hiphop", en: "Hip hop", mn: "Хип хоп" },
  { key: "films", en: "Films", mn: "Кино" },
  { key: "anime", en: "Anime", mn: "Аниме" },
  { key: "books", en: "Books", mn: "Ном" },
  { key: "writing", en: "Writing", mn: "Бичих" },
  { key: "photography", en: "Photography", mn: "Гэрэл зураг" },
  { key: "design", en: "Design", mn: "Дизайн" },
  { key: "art", en: "Art", mn: "Урлаг" },
  { key: "gaming", en: "Gaming", mn: "Тоглоом" },
  { key: "tech", en: "Tech", mn: "Технологи" },
  { key: "marketing", en: "Marketing", mn: "Маркетинг" },
  { key: "business", en: "Business", mn: "Бизнес" },
  { key: "startups", en: "Startups", mn: "Стартап" },
  { key: "finance", en: "Finance", mn: "Санхүү" },
  { key: "study", en: "Studying", mn: "Хичээл" },
  { key: "languages", en: "Languages", mn: "Хэл сурах" },
  { key: "cars", en: "Cars", mn: "Машин" },
  { key: "pets", en: "Pets", mn: "Тэжээвэр амьтан" },
  { key: "nature", en: "Nature", mn: "Байгаль" },
  { key: "camping", en: "Camping", mn: "Кемпинг" },
  { key: "dancing", en: "Dancing", mn: "Бүжиг" },
  { key: "singing", en: "Singing", mn: "Дуулах" },
  { key: "volunteering", en: "Volunteering", mn: "Сайн дурын ажил" },
  { key: "parenting", en: "Parenting", mn: "Хүүхэд асрах" },
  { key: "meditation", en: "Meditation", mn: "Бясалгал" },
];

/**
 * The picker caps at five so the choice stays a shortlist rather than a
 * checklist. The bio shelf then shows only the first two alongside the MBTI
 * chip, because the design's row fits three chips — the rest are stored for
 * matching creators to each other later.
 */
export const MAX_INTERESTS = 5;

/** How many interests reach the public chip row, after the MBTI chip. */
export const CHIP_INTERESTS = 2;

const BY_KEY = new Map(INTERESTS.map((i) => [i.key, i]));

export function isInterestKey(key: string): boolean {
  return BY_KEY.has(key);
}

/** Label for one interest key, or null if the key is not in the catalogue. */
export function interestLabel(key: string, locale: Locale): string | null {
  const found = BY_KEY.get(key);
  return found ? found[locale] : null;
}

/**
 * The chips shown under the username: MBTI first (it is the filled one), then
 * the leading interests. Unknown keys are dropped rather than rendered raw, so
 * retiring an interest from the catalogue cleans up every profile at once.
 */
export function profileChips(
  mbti: string | null,
  interests: string[] | null,
  locale: Locale,
): string[] {
  const chips: string[] = [];
  if (mbti && isMbtiType(mbti)) chips.push(mbti);
  for (const key of (interests ?? []).slice(0, CHIP_INTERESTS)) {
    const label = interestLabel(key, locale);
    if (label) chips.push(label);
  }
  return chips;
}
