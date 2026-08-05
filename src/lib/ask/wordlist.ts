/**
 * Wordlist filter for the anonymous Ask inbox. A match does NOT hard-delete —
 * the message lands as status='hidden' so nothing surfaces to the creator
 * unprompted, and they can open a filtered folder deliberately.
 *
 * This is a starter list covering common English profanity/slurs and Mongolian
 * Cyrillic offensive terms. It is intentionally conservative and MUST be
 * expanded and reviewed (ideally with a native Mongolian speaker + a
 * maintained open-source list) before public launch — see README safety notes.
 */

// English (substring-matched after normalization).
const EN_TERMS = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "faggot",
  "nigger",
  "retard",
  "whore",
  "slut",
  "rape",
  "kys",
  "kill yourself",
];

// Mongolian Cyrillic (word-boundary matched — Cyrillic).
const MN_TERMS = [
  "новш",
  "тэнэг",
  "муухай",
  "гичий",
  "садар",
  "залуу гичий",
];

// Basic leetspeak / obfuscation folding so "f u c k" and "sh1t" still match.
function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/3/g, "e")
    .replace(/4@/g, "a")
    .replace(/\$/g, "s")
    .replace(/[^a-zЀ-ӿ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns true when the body should be hidden. English is substring-matched on
 * the space-collapsed form (catches spaced-out obfuscation); Mongolian terms
 * are matched with Cyrillic word boundaries to avoid false positives.
 */
export function shouldHide(body: string): boolean {
  const normalized = normalize(body);
  const collapsed = normalized.replace(/ /g, "");

  for (const term of EN_TERMS) {
    const t = term.replace(/ /g, "");
    if (collapsed.includes(t)) return true;
  }
  for (const term of MN_TERMS) {
    const re = new RegExp(`(^|[^\\u0400-\\u04FF])${term}([^\\u0400-\\u04FF]|$)`);
    if (re.test(` ${normalized} `)) return true;
  }
  return false;
}
