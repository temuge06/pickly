/**
 * One glyph per entry in the social catalogue (src/lib/socials.ts), plus a
 * generic fallback.
 *
 * The public header used to look a key up in a partial map and `return null`
 * on a miss, so any platform the editor could save but this file did not draw
 * disappeared from the profile with no trace. Every key in SOCIAL_KEYS now has
 * a glyph, and `socialGlyph()` never returns null — an unknown key still gets
 * the chain-link fallback rather than silently dropping out of the row.
 */

type Props = { size?: number };

const box = (size: number) => ({ width: size, height: size });

export const SOCIAL_ICONS: Record<string, (p: Props) => React.ReactElement> = {
  instagram: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  tiktok: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.5 3c.4 2.2 1.9 3.6 4 3.9v2.8c-1.5 0-2.9-.4-4-1.2v6.4c0 3.4-2.5 5.7-5.6 5.7-2.9 0-5.4-2.2-5.4-5.4 0-3.1 2.5-5.4 5.6-5.4.4 0 .8 0 1.2.1v2.9a2.6 2.6 0 1 0 1.5 2.4V3h2.7Z" />
    </svg>
  ),
  youtube: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 8.2a2.6 2.6 0 0 0-1.8-1.8C18.5 6 12 6 12 6s-6.5 0-8.2.4A2.6 2.6 0 0 0 2 8.2 27 27 0 0 0 1.6 12 27 27 0 0 0 2 15.8a2.6 2.6 0 0 0 1.8 1.8C5.5 18 12 18 12 18s6.5 0 8.2-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22.4 12 27 27 0 0 0 22 8.2ZM10 15V9l5 3-5 3Z" />
    </svg>
  ),
  facebook: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-8h2.5l.4-3h-2.9V8.2c0-.9.3-1.5 1.6-1.5H16.5V4.1C16.2 4 15.2 4 14.1 4c-2.3 0-3.9 1.4-3.9 4v2.9H7.6v3h2.6v8h3.3Z" />
    </svg>
  ),
  threads: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.2 2c3 0 5.2 1 6.6 2.9 1 1.4 1.5 3.2 1.6 5.4h-2.2c-.1-1.8-.5-3.1-1.2-4.1-1-1.3-2.6-2-4.8-2-2.3 0-4 .8-5.1 2.2C6.1 7.9 5.6 9.8 5.6 12c0 2.2.5 4.1 1.5 5.5 1.1 1.5 2.8 2.3 5.1 2.3 2.1 0 3.6-.5 4.6-1.4.9-.8 1.4-1.8 1.4-2.9 0-1.2-.5-2.1-1.4-2.8a4.6 4.6 0 0 0-1-.6c-.2 1.5-.7 2.6-1.5 3.4-.8.8-1.9 1.2-3.2 1.2-1.2 0-2.2-.3-2.9-1a3 3 0 0 1-1-2.3c0-1.1.5-2 1.4-2.6.9-.6 2.1-.9 3.6-.9.6 0 1.1 0 1.7.1 0-.7-.2-1.3-.6-1.7-.4-.4-1-.6-1.8-.6-1.1 0-1.9.4-2.5 1.3l-1.8-1.2C8.1 6.9 9.5 6.2 11.3 6.2c1.4 0 2.5.4 3.3 1.2.7.8 1.1 1.9 1.2 3.3a6.5 6.5 0 0 1 2 1.3c1.2 1.1 1.8 2.5 1.8 4.2 0 1.8-.8 3.4-2.2 4.5-1.4 1.1-3.3 1.7-5.6 1.7-2.9 0-5.2-1-6.7-3C3.7 17.5 3.1 15 3.1 12s.6-5.5 2-7.3C6.7 2.8 9.1 2 12.2 2Zm.6 10.9c-1 0-1.8.2-2.3.5-.5.3-.7.7-.7 1.2 0 .4.2.7.5 1 .3.2.8.4 1.4.4.8 0 1.4-.2 1.8-.7.5-.5.8-1.2.9-2.2-.5-.1-1-.2-1.6-.2Z" />
    </svg>
  ),
  x: ({ size = 12 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.5 3h3l-6.6 7.5L21.5 21h-5.9l-4.2-5.4L6.5 21H3.4l7-8L2.9 3h6l3.8 5 4.8-5Zm-1 16h1.6L8.1 4.7H6.3L16.5 19Z" />
    </svg>
  ),
  telegram: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21.7 4.3 18.9 19c-.2 1-.8 1.2-1.6.8l-4.4-3.3-2.1 2c-.2.3-.4.5-.9.5l.3-4.5 8.1-7.3c.3-.3-.1-.5-.6-.2L7.7 12.3l-4.3-1.4c-.9-.3-1-.9.2-1.4l16.8-6.5c.8-.3 1.5.2 1.3 1.3Z" />
    </svg>
  ),
  linkedin: ({ size = 12 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.9 8.5H4V21h2.9V8.5ZM5.4 4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM21 21h-2.9v-6.5c0-1.6-.6-2.5-1.9-2.5-1 0-1.6.7-1.9 1.4V21H11.5V8.5h2.8v1.6c.5-.9 1.6-1.6 3-1.6 2.2 0 3.7 1.4 3.7 4.3V21Z" />
    </svg>
  ),
  snapchat: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2c2.7 0 4.6 2 4.7 4.7v2c.5.2 1-.2 1.5-.2.6 0 1.2.4 1.2 1s-.7.9-1.3 1.1c-.6.2-1.2.4-1.2.9 0 .9 2.1 3.4 4 4 .4.1.6.4.5.8-.2.7-1.6 1-2.6 1.2-.3 0-.4.3-.5.6-.1.4-.2.8-.7.8-.6 0-1.2-.3-2.2-.3-1.4 0-2 1.4-3.4 1.4s-2-1.4-3.4-1.4c-1 0-1.6.3-2.2.3-.5 0-.6-.4-.7-.8-.1-.3-.2-.6-.5-.6-1-.2-2.4-.5-2.6-1.2-.1-.4.1-.7.5-.8 1.9-.6 4-3.1 4-4 0-.5-.6-.7-1.2-.9C3.7 10.4 3 10.1 3 9.5s.6-1 1.2-1c.5 0 1 .4 1.5.2v-2C5.8 4 7.7 2 10.4 2Z" />
    </svg>
  ),
  pinterest: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.5-.2 1 .5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.1-3.8-3 0-4.9 2.2-4.9 4.7 0 .9.3 1.5.7 2 .2.2.2.3.1.6l-.2.9c-.1.3-.3.4-.5.3-1.4-.6-2.1-2.2-2.1-4C5.4 8.4 7.9 5 12.3 5c3.6 0 5.9 2.6 5.9 5.3 0 3.6-2 6.3-5 6.3-1 0-2-.5-2.3-1.2l-.6 2.4c-.2.8-.7 1.8-1.1 2.5A10 10 0 1 0 12 2Z" />
    </svg>
  ),
  twitch: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.3 3 3 6.4V19h4.3v2.6h2.4l2.5-2.6h3.5L21 14V3H4.3Zm14.9 10.1-2.7 2.8h-4.3l-2.4 2.4v-2.4H6.2V4.7h13v8.4ZM15.6 7.6h1.7v4.8h-1.7V7.6Zm-4.5 0h1.7v4.8h-1.7V7.6Z" />
    </svg>
  ),
  spotify: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.62.62 0 0 1-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 1 1-.28-1.21c3.8-.87 7.08-.5 9.72 1.11.3.18.39.57.21.85Zm1.23-2.74a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.98-1.17a.78.78 0 1 1-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.36.22.48.7.26 1.07Zm.1-2.85C14.8 8.96 9.5 8.79 6.42 9.72a.93.93 0 1 1-.54-1.78c3.53-1.07 9.38-.86 13.08 1.33a.93.93 0 1 1-.95 1.6Z" />
    </svg>
  ),
  website: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  ),
  email: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 8 8 5 8-5" />
    </svg>
  ),
  /** Fallback: anything not in the catalogue, and every custom Quick Link. */
  link: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.4 1.4" />
      <path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.4-1.4" />
    </svg>
  ),
  /** Quick Links only — createLink tags newsletter URLs with this key. */
  newsletter: ({ size = 13 }) => (
    <svg {...box(size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M7 9h10M7 13h10M7 17h6" />
    </svg>
  ),
};

/** Never null: an unrecognised key falls back to the chain-link glyph. */
export function socialGlyph(key: string, size?: number): React.ReactElement {
  const Icon = SOCIAL_ICONS[key] ?? SOCIAL_ICONS.link!;
  return <Icon size={size} />;
}
