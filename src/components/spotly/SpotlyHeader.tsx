import Image from "next/image";
import type { profile } from "@/db/schema";
import { InstagramIcon, TikTokIcon, YoutubeIcon } from "@/components/profile/icons";

type Profile = typeof profile.$inferSelect;

const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  youtube: YoutubeIcon,
} as const;

/**
 * Profile header — spotly light theme. No Figma frame covers the header, so
 * this is an adaptation in the design's language: Nunito name on white,
 * `#151515` ink, `#e94f7a` accent on the social icons.
 */
export function SpotlyHeader({ profile }: { profile: Profile }) {
  const socials = (profile.socials ?? {}) as Record<string, string>;

  return (
    <header className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
      {profile.avatarUrl ? (
        <div className="relative h-[88px] w-[88px] overflow-hidden rounded-full shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)]">
          <Image
            src={profile.avatarUrl}
            alt={profile.displayName}
            fill
            sizes="88px"
            priority
            className="object-cover"
          />
        </div>
      ) : null}
      <h1 className="mt-3 font-header text-[22px] font-black tracking-[-0.5px] text-spotly-ink">
        {profile.displayName}
      </h1>
      <p className="mt-0.5 font-header text-[13px] font-semibold text-black/45">
        @{profile.handle}
      </p>
      {profile.bio ? (
        <p className="mt-2.5 max-w-[300px] font-header text-[14px] leading-relaxed text-black/70">
          {profile.bio}
        </p>
      ) : null}
      {Object.keys(socials).length > 0 ? (
        <div className="mt-3.5 flex items-center gap-4">
          {Object.entries(socials).map(([key, url]) => {
            const Icon = SOCIAL_ICONS[key as keyof typeof SOCIAL_ICONS];
            if (!Icon || !url) return null;
            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full text-spotly-ink/70 transition-colors hover:text-spotly-accent"
                aria-label={key}
              >
                <Icon className="h-5 w-5" />
              </a>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}
