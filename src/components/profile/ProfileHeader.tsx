import Image from "next/image";
import type { profile } from "@/db/schema";
import { InstagramIcon, TikTokIcon, YoutubeIcon } from "./icons";

type Profile = typeof profile.$inferSelect;

const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  youtube: YoutubeIcon,
} as const;

export function ProfileHeader({ profile }: { profile: Profile }) {
  const socials = (profile.socials ?? {}) as Record<string, string>;

  return (
    <header className="flex flex-col items-center px-6 pb-8 pt-10 text-center">
      {profile.avatarUrl ? (
        <div
          className="relative h-24 w-24 overflow-hidden rounded-full"
          style={{ boxShadow: "0 12px 20px -10px rgba(0,0,0,0.6)" }}
        >
          <Image
            src={profile.avatarUrl}
            alt={profile.displayName}
            fill
            sizes="96px"
            priority
            className="object-cover"
          />
        </div>
      ) : null}
      <h1 className="mt-4 font-display text-[22px] font-bold text-paper">
        {profile.displayName}
      </h1>
      <p className="mt-0.5 font-mono text-[13px] text-paper/55">
        @{profile.handle}
      </p>
      {profile.bio ? (
        <p className="mt-3 max-w-[300px] font-body text-[14.5px] leading-relaxed text-paper/85">
          {profile.bio}
        </p>
      ) : null}
      {Object.keys(socials).length > 0 ? (
        <div className="mt-4 flex items-center gap-4">
          {Object.entries(socials).map(([key, url]) => {
            const Icon = SOCIAL_ICONS[key as keyof typeof SOCIAL_ICONS];
            if (!Icon || !url) return null;
            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full text-paper/80 transition-colors hover:text-marigold"
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
