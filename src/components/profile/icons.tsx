type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 3c.4 2.2 1.9 3.6 4 3.9v2.8c-1.5 0-2.9-.4-4-1.2v6.4c0 3.4-2.5 5.7-5.6 5.7-2.9 0-5.4-2.2-5.4-5.4 0-3.1 2.5-5.4 5.6-5.4.4 0 .8 0 1.2.1v2.9a2.6 2.6 0 0 0-1.2-.3 2.7 2.7 0 1 0 2.7 2.7V3h2.7Z" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 9.5v5l4.3-2.5-4.3-2.5Z" fill="currentColor" />
    </svg>
  );
}

export function NewsletterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LinkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9.5 14.5 14.5 9.5M8 10.5 6.6 12a3 3 0 0 0 4.4 4.4l1.6-1.6M16 13.5l1.4-1.5A3 3 0 0 0 13 7.6l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function iconForKey(icon: string | null) {
  switch (icon) {
    case "instagram":
      return InstagramIcon;
    case "tiktok":
      return TikTokIcon;
    case "youtube":
      return YoutubeIcon;
    case "newsletter":
      return NewsletterIcon;
    default:
      return LinkIcon;
  }
}
