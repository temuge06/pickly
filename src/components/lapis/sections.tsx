/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import Link from "next/link";
import type { ProfileCampaign } from "@/lib/data/campaigns";
import type {
  askMessage,
  collection,
  link,
  pick,
  profile,
  wishlistItem,
} from "@/db/schema";
import { ProductImage } from "@/components/ui/ProductImage";
import { socialGlyph } from "@/components/social-icons";
import { SOCIAL_PLATFORMS, detectLinkIcon, hostOf as socialHostOf } from "@/lib/socials";
import { FollowButton } from "./FollowButton";
import { PromoCard, type PublicPromo } from "./PromoCard";

type Profile = typeof profile.$inferSelect;
type Pick = typeof pick.$inferSelect;
type Collection = typeof collection.$inferSelect;
type LinkRow = typeof link.$inferSelect;
type Ask = typeof askMessage.$inferSelect;
type WishlistItem = typeof wishlistItem.$inferSelect;

// --- Status bar ------------------------------------------------------------

/**
 * The wordmark follows the creator's theme, but the arrow does NOT — it is a
 * fixed brand orange in every theme mock, so it stays a constant rather than a
 * token. It sits as a superscript at the wordmark's cap height.
 */
const LOGO_ARROW = "#ff5106";

/**
 * Top bar: the wordmark, plus whichever navigation the viewer is entitled to.
 *
 *   own profile      → bell (with an unread dot)
 *   someone else's,  → "back to my profile"
 *     signed in
 *   signed out       → wordmark only
 *
 * The bell is rendered only for the owner and the count is resolved
 * server-side, so a visitor's HTML contains no trace of it — nothing to reveal
 * by editing the DOM.
 */
export function LapisStatusBar({
  bell,
  backTo,
}: {
  /** Owner only. `unread` drives the dot. */
  bell?: { unread: number } | null;
  /** Signed-in viewer's own handle, when they are looking at someone else. */
  backTo?: string | null;
} = {}) {
  return (
    <div className="flex h-[54px] items-center gap-[8px] bg-[var(--t-bg)] px-[10px]">
      {backTo ? (
        <Link
          href={`/${backTo}`}
          aria-label="Миний профайл руу буцах"
          className="-ml-[2px] flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-[var(--t-accent)] transition-transform active:scale-95"
          style={{ background: "color-mix(in srgb, var(--t-accent) 12%, transparent)" }}
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
      ) : null}

      <span className="flex items-center">
        <span className="font-inter text-[16px] font-bold text-[var(--t-accent)]">Pickly</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="ml-[1px] h-[10px] w-[10px] -translate-y-[4px]"
          fill="none"
          stroke={LOGO_ARROW}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* diagonal shaft */}
          <path d="M5.5 18.5 L18 6" />
          {/* corner-bracket head */}
          <path d="M8.5 6 H18 V15.5" />
        </svg>
      </span>

      {bell ? (
        <Link
          href="/notifications"
          aria-label={
            bell.unread > 0
              ? `Мэдэгдэл — ${bell.unread} шинэ`
              : "Мэдэгдэл"
          }
          className="relative ml-auto flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[var(--t-accent)] transition-transform active:scale-95"
          style={{ background: "color-mix(in srgb, var(--t-accent) 12%, transparent)" }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5" />
            <path d="M13.7 19a2 2 0 0 1-3.4 0" />
          </svg>
          {bell.unread > 0 ? (
            <span
              className="absolute -right-[1px] -top-[1px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-[4px] font-inter text-[10px] font-bold leading-none"
              style={{
                background: "var(--t-accent)",
                color: "var(--t-on-accent)",
                boxShadow: "0 0 0 2px var(--t-bg)",
              }}
            >
              {bell.unread > 99 ? "99+" : bell.unread}
            </span>
          ) : null}
        </Link>
      ) : null}
    </div>
  );
}

// --- Header (bio shelf) ----------------------------------------------------

export function LapisHeader({
  profile,
  isOwner = false,
  isFollowing = false,
  isAuthed = false,
}: {
  profile: Profile;
  /** Resolved on the server by comparing auth.uid() to this profile's owner.
   *  Never derive this client-side — the button must be absent, not hidden. */
  isOwner?: boolean;
  /** Does the signed-in viewer already follow this profile? */
  isFollowing?: boolean;
  /** Signed in at all — decides whether Follow acts or routes to sign-in. */
  isAuthed?: boolean;
}) {
  const socials = (profile.socials ?? {}) as Record<string, string>;
  // Catalogue order first (so the row reads the same on every profile), then
  // anything stored under a key the catalogue does not know about — those used
  // to be dropped on the floor along with any platform this file had no glyph
  // for, which is why only Instagram ever showed up.
  const known = SOCIAL_PLATFORMS.map((p) => p.key as string).filter((k) => socials[k]);
  const extra = Object.keys(socials).filter((k) => socials[k] && !known.includes(k));
  const socialKeys = [...known, ...extra];

  return (
    <div className="flex flex-col gap-[12px] border-b-[0.5px] border-[var(--t-border)] bg-[var(--t-bg)] px-[16px] py-[10px]">
      <div className="flex flex-col gap-[8px]">
        <div className="flex items-center gap-[23px]">
          <Avatar name={profile.displayName} url={profile.avatarUrl} />
          <div className="flex min-w-0 flex-col gap-[6px]">
            <p className="font-inter text-[19px] font-semibold leading-none tracking-[-0.38px] text-[var(--t-accent)]">
              {profile.displayName}
            </p>
            <p className="font-inter text-[14px] leading-none tracking-[-0.28px] text-[var(--t-muted)]">
              @{profile.handle}
            </p>
          </div>
        </div>
        {/* Bio: real profile.bio only — no placeholder, renders nothing when empty. */}
        {profile.bio?.trim() ? (
          <p className="font-inter text-[14px] leading-[18px] tracking-[-0.28px] text-[var(--t-text)]">
            {profile.bio}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-[25px]">
        {isOwner ? (
          <Link
            href="/dashboard"
            className="flex h-[32px] w-[123px] items-center justify-center rounded-[6px] font-inter text-[14px] font-semibold tracking-[-0.28px]"
            style={{ background: "var(--t-btn)", color: "var(--t-on-btn)" }}
          >
            Профайл засах
          </Link>
        ) : (
          <FollowButton
            handle={profile.handle}
            initialFollowing={isFollowing}
            isAuthed={isAuthed}
          />
        )}
        {socialKeys.length > 0 ? (
          <div className="flex items-center gap-[13px]">
            {socialKeys.map((k) => (
              <a
                key={k}
                href={socials[k]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={k}
                className="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[var(--t-accent)] text-[var(--t-on-accent)]"
              >
                {socialGlyph(k, 13)}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Placeholder avatar (initial on a warm tint) when no image is uploaded. */
function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="h-[82px] w-[82px] shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-full bg-[var(--t-avatar-bg)] font-inter text-[30px] font-semibold text-[var(--t-accent)]">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}

// --- Section title (After → Montserrat Alternates 800) ---------------------

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="font-malt text-[20px] font-extrabold uppercase leading-[16px] tracking-[-0.4px] text-[var(--t-accent)]">
      {children}
    </p>
  );
}

// --- Pick card (shared by Top Picks / My Picks / Not For Me) ---------------

/** Overlapping avatar circles of the people who recommend this product. */
function Recommenders({ avatars }: { avatars: string[] }) {
  if (avatars.length === 0) return null;
  return (
    <div className="flex items-center">
      {avatars.slice(0, 3).map((src, i) => (
        <span
          key={i}
          className="relative -ml-[7px] h-[22px] w-[22px] shrink-0 overflow-hidden rounded-full ring-2 ring-white first:ml-0"
          style={{ background: "var(--t-card)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-cover" />
        </span>
      ))}
    </div>
  );
}

function PickCard({
  pick,
  muted = false,
}: {
  pick: Pick;
  muted?: boolean;
}) {
  const source = hostOf(pick.outboundUrl ?? pick.sourceUrl);
  return (
    <div
      className="flex min-h-[319px] w-[168px] shrink-0 items-start rounded-[14px] px-[10px] py-[12px]"
      style={{ background: "var(--t-card)", color: "var(--t-on-card)" }}
    >
      <div className="flex w-[149px] flex-col gap-[7px]">
        <div className="flex flex-col gap-[8px]">
          {/* Portrait 149x202, not square — the taller crop is what makes room
              for the full-width action below. */}
          <div
            className={`relative h-[202px] w-full overflow-hidden rounded-[10px] bg-black/10 shadow-[0px_1px_4.4px_0px_rgba(0,0,0,0.25)] ${
              muted ? "opacity-70 grayscale-[45%]" : ""
            }`}
          >
            {pick.imageUrl ? (
              <ProductImage src={pick.imageUrl} alt={pick.title} sizes="149px" />
            ) : null}
          </div>
          <p className="min-h-[26px] text-[14px] font-bold uppercase leading-[13px] text-[var(--t-on-card)]">
            {pick.title}
          </p>
        </div>

        {pick.outboundUrl ? (
          <a
            href={pick.outboundUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[37px] w-full items-center justify-center gap-[6px] rounded-[10px] border text-[12px] font-semibold tracking-[-0.48px]"
            style={{
              background: "var(--t-card-btn)",
              color: "var(--t-on-card-btn)",
              borderColor: "var(--t-card-btn-border)",
            }}
          >
            Дэлгэрэнгүй үзэх
            <span className="text-[10px] leading-none" aria-hidden>
              ↗
            </span>
          </a>
        ) : (
          <div className="h-[37px]" />
        )}

        {source ? (
          <span className="flex items-center justify-center gap-1 text-[8px] font-light tracking-[-0.16px] text-[var(--t-on-card)]/70">
            <span className="h-[6px] w-[6px] rounded-full bg-[var(--t-on-card)]/70" />
            {source}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Rotate a list by n so different cards lead with different faces. */
function rotate<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

function PickRow({ picks, muted }: { picks: Pick[]; muted?: boolean }) {
  return (
    <div className="no-scrollbar flex items-stretch gap-[8px] overflow-x-auto scroll-pl-[10px] pr-[10px]">
      {picks.map((p) => (
        <PickCard key={p.id} pick={p} muted={muted} />
      ))}
    </div>
  );
}

// --- Top Picks: sponsored campaign banners -------------------------------

/**
 * Top Picks is a campaign shelf, not a product shelf. My Picks, Wishlist and
 * Not For Me continue to render `pick` rows unchanged — only this section
 * sources from campaign_assignment.
 *
 * Card geometry follows the Figma spec (node 1033:6946): a 382x305 full-bleed
 * banner at radius 20, with the CTA pill inset 12px from the right and 17px
 * from the bottom.
 */
export function LapisTopPicks({
  campaigns,
  handle,
}: {
  campaigns: ProfileCampaign[];
  /** Titles the shelf after its owner — "temuge's picks". */
  handle: string;
}) {
  if (campaigns.length === 0) return null;
  return (
    <div className="flex flex-col gap-[18px] border-b-[0.5px] border-[var(--t-border)] bg-[var(--t-bg)] py-[20px] pl-[10px] font-malt">
      <SectionTitle>{`${handle}'s picks`}</SectionTitle>
      <div className="no-scrollbar flex snap-x snap-mandatory items-start gap-[8px] overflow-x-auto scroll-pl-[10px] pr-[10px]">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: ProfileCampaign }) {
  const inner = (
    <>
      <div className="relative aspect-[382/305] w-full overflow-hidden rounded-[20px] bg-black/10">
        {campaign.bannerImageUrl ? (
          <ProductImage
            src={campaign.bannerImageUrl}
            alt={campaign.title}
            sizes="330px"
          />
        ) : null}
        {/* Liquid-glass CTA pill, bottom-right on the banner. Fixed platform
            copy, not per-campaign. The backdrop blur is load-bearing as well
            as decorative: it softens whatever artwork sits behind the pill so
            the label stays readable on any creative. */}
        <span className="absolute bottom-[17px] right-[12px] flex h-[37px] w-[162px] items-center justify-center rounded-[20px] border border-white/45 bg-gradient-to-b from-white/25 to-white/5 backdrop-blur-[10px] backdrop-saturate-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),inset_0_-2px_4px_-1px_rgba(0,0,0,0.3),0_6px_16px_-4px_rgba(0,0,0,0.45)] text-[14px] font-bold text-white [text-shadow:0px_1px_3px_rgba(0,0,0,0.5)]">
          Дэлгэрэнгүй Үзэх
        </span>
      </div>
    </>
  );

  // Sized so the NEXT campaign's edge is always visible at the right of a
  // 402px frame — the full-bleed 382px card filled the viewport exactly and
  // read as the only one there was.
  const cls =
    "block w-[330px] max-w-[calc(100vw-72px)] shrink-0 snap-start";

  // The banner itself is the click target — tapping it goes straight to the
  // campaign's destination. No caption underneath.
  return campaign.destinationUrl ? (
    <a
      href={campaign.destinationUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={cls}
    >
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

// --- My Picks: up to 3 collections as a responsive box grid ----------------
// 1 collection → one full-width box; 2 → two equal boxes; 3 → one tall box on
// the left + two stacked on the right (per the Spotly design).

// One Category colour per theme — the Figma spec sheets replace the old
// three-colour rotation with a single swatch, so every collection box matches.
const CATEGORY_STYLE = {
  background: "var(--t-category)",
  color: "var(--t-on-category)",
} as const;

function Polaroids({ images, tall }: { images: string[]; tall: boolean }) {
  const shots = images.slice(0, 2);
  if (shots.length === 0) return null;
  const size = tall ? "h-[92px] w-[92px]" : "h-[52px] w-[52px]";
  const wrap = tall
    ? "pointer-events-none absolute inset-x-0 bottom-[30px] flex items-end justify-center"
    : "pointer-events-none absolute bottom-[8px] right-[8px] flex items-end justify-end";
  return (
    <div className={wrap}>
      {shots.map((src, i) => (
        <div
          key={i}
          className={`relative ${size} shrink-0 overflow-hidden rounded-[16px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] ${
            i === 0 ? "-rotate-[16deg]" : "-ml-4 rotate-[8deg]"
          }`}
        >
          <ProductImage src={src} alt="" sizes={tall ? "92px" : "52px"} />
        </div>
      ))}
    </div>
  );
}

function CategoryCard({
  title,
  count,
  images,
  tall,
  spanRows,
}: {
  title: string;
  count: number;
  images: string[];
  tall: boolean;
  spanRows?: boolean;
}) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[11px] ${spanRows ? "row-span-2" : ""}`}
      style={CATEGORY_STYLE}
    >
      <p className="absolute left-[11px] top-[15px] line-clamp-2 w-[70%] text-[14px] font-semibold leading-[16px] tracking-[-0.28px]">
        {title}
      </p>
      <Polaroids images={images} tall={tall} />
      <p className="absolute bottom-[12px] left-[13px] text-[14px] leading-[12px] tracking-[-0.28px] opacity-70">
        {count} picks
      </p>
    </div>
  );
}

export function LapisMyPicks({
  collections,
  picksByCollection,
}: {
  collections: Collection[];
  picksByCollection: Record<string, Pick[]>;
}) {
  const groups = collections
    .filter((c) => (picksByCollection[c.id]?.length ?? 0) > 0)
    .slice(0, 3);
  const n = groups.length;
  if (n === 0) return null;

  const gridCls =
    n === 1
      ? "grid-cols-1 grid-rows-1"
      : n === 2
        ? "grid-cols-2 grid-rows-1"
        : "grid-cols-2 grid-rows-2";

  return (
    <div className="flex flex-col gap-[18px] bg-[var(--t-bg)] px-[10px] py-[20px] font-malt">
      <p className="font-malt text-[20px] font-extrabold uppercase leading-[16px] tracking-[-0.4px] text-[var(--t-accent)]">
        MY PICKS
      </p>
      <div className={`grid gap-x-[6px] gap-y-[12px] ${gridCls}`} style={{ height: 254 }}>
        {groups.map((c, i) => {
          const picks = picksByCollection[c.id]!;
          const images = picks
            .map((p) => p.imageUrl)
            .filter((u): u is string => !!u);
          const tall = n <= 2 || i === 0;
          return (
            <CategoryCard
              key={c.id}
              title={c.title}
              count={picks.length}
              images={images}
              tall={tall}
              spanRows={n === 3 && i === 0}
            />
          );
        })}
      </div>
    </div>
  );
}

// --- Not For Me: wont_rebuy picks ------------------------------------------

export function LapisNotForMe({ picks }: { picks: Pick[] }) {
  if (picks.length === 0) return null;
  return (
    <div className="flex flex-col gap-[18px] bg-[var(--t-bg)] py-[20px] pl-[10px] font-malt">
      <SectionTitle>NOT FOR ME</SectionTitle>
      <PickRow picks={picks} muted />
    </div>
  );
}

// --- Promo codes ----------------------------------------------------------

/** Staff-authored discount tickets. Hidden entirely when a creator has none,
 *  same rule as every other section. */
export function LapisPromos({ promos }: { promos: PublicPromo[] }) {
  if (promos.length === 0) return null;
  return (
    <div className="flex flex-col gap-[18px] bg-[var(--t-bg)] py-[20px] pl-[10px] font-malt">
      <SectionTitle>PROMO CODES</SectionTitle>
      <div className="no-scrollbar flex snap-x snap-mandatory items-start gap-[8px] overflow-x-auto scroll-pl-[10px] pr-[10px]">
        {promos.map((p) => (
          <PromoCard key={p.id} promo={p} />
        ))}
      </div>
    </div>
  );
}

// --- Wishlist --------------------------------------------------------------

export function LapisWishlist({
  items,
  recommenders,
}: {
  items: WishlistItem[];
  recommenders?: string[];
}) {
  if (items.length === 0) return null;
  const pool = recommenders ?? [];
  return (
    <div className="flex flex-col gap-[18px] bg-[var(--t-bg)] py-[20px] pl-[10px] font-malt">
      <SectionTitle>WISHLIST</SectionTitle>
      <div className="no-scrollbar flex gap-[8px] overflow-x-auto scroll-pl-[10px] pr-[10px]">
        {items.map((w, i) => {
          const source = hostOf(w.url);
          const recs = pool.length ? rotate(pool, i).slice(0, 3) : [];
          return (
            <div
              key={w.id}
              className="flex h-[144px] w-[314px] shrink-0 items-start gap-[3px] rounded-[14px] p-[10px]"
              style={{ background: "var(--t-card)", color: "var(--t-on-card)" }}
            >
              <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-[12px] bg-black/10">
                {w.imageUrl ? <ProductImage src={w.imageUrl} alt={w.title} sizes="120px" /> : null}
              </div>
              <div className="relative flex h-full flex-1 flex-col pl-[12px]">
                <p className="text-[14px] font-bold uppercase leading-[15px] text-[var(--t-on-card)]">{w.title}</p>
                {w.note ? (
                  <p className="mt-[8px] line-clamp-3 text-[13px] font-light leading-[13px] tracking-[-0.28px] text-[var(--t-on-card)]/95">{w.note}</p>
                ) : null}
                <div className="mt-auto flex items-center gap-[10px]">
                  {w.url ? (
                    <a href={w.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-[10px] bg-[var(--t-card-btn)] text-[var(--t-on-card-btn)] px-[8px] py-[4px] text-[14px] font-semibold capitalize tracking-[-0.56px]">
                      үзэх<span className="ml-0.5 text-[9px]">↗</span>
                    </a>
                  ) : null}
                  <Recommenders avatars={recs} />
                  {source ? (
                    <span className="flex items-center gap-1 text-[8px] font-light tracking-[-0.16px] text-[var(--t-on-card)]/70">
                      <span className="h-[6px] w-[6px] rounded-full bg-[var(--t-on-card)]/70" />
                      {source}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Quick Links -----------------------------------------------------------

/**
 * The creator's own links — YouTube channel, newsletter, whatever they added
 * in the dashboard.
 *
 * These were being fetched and then thrown away: the page never rendered this
 * component, so a creator could add a link, see it listed in their editor, and
 * find no trace of it on the profile. It now sits directly under Ask, styled
 * as a stack of full-width rows rather than a horizontal shelf — a link is
 * read left-to-right and there are rarely more than a handful, so a scroll
 * rail would hide most of them behind a swipe for no gain.
 */
export function LapisQuickLinks({ links }: { links: LinkRow[] }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-col gap-[18px] bg-[var(--t-bg)] px-[10px] py-[20px] font-malt">
      <SectionTitle>QUICK LINKS</SectionTitle>
      <div className="flex flex-col gap-[8px]">
        {links.map((l) => {
          const host = socialHostOf(l.url);
          return (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[58px] items-center gap-[12px] rounded-[14px] px-[12px] py-[10px] transition-transform active:scale-[0.99]"
              style={{ background: "var(--t-card)", color: "var(--t-on-card)" }}
            >
              <span
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--t-card-btn)", color: "var(--t-on-card-btn)" }}
              >
                {socialGlyph(l.icon ?? detectLinkIcon(l.url), 17)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] font-bold leading-[17px] tracking-[-0.28px]">
                  {l.label}
                </span>
                {host ? (
                  <span className="truncate text-[11px] font-light leading-[14px] opacity-70">
                    {host}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 pr-[4px] text-[13px] leading-none opacity-80" aria-hidden>
                ↗
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// --- Q&A -------------------------------------------------------------------

export function LapisAsk({
  handle,
  askEnabled,
  questions,
}: {
  handle: string;
  askEnabled: boolean;
  questions: Ask[];
}) {
  if (!askEnabled) return null;
  const published = questions.filter((q) => q.isPublic && q.status === "answered");
  return (
    <div className="flex flex-col gap-[18px] bg-[var(--t-bg)] py-[20px] pl-[12px] font-malt">
      <SectionTitle>Ask Me Anything!</SectionTitle>
      <div className="no-scrollbar flex gap-[16px] overflow-x-auto pr-[12px]">
        <Link
          href={`/${handle}/ask`}
          className="flex h-[222px] w-[171px] shrink-0 flex-col rounded-[16px] p-[12px]"
          style={{ background: "var(--t-btn)", color: "var(--t-on-btn)" }}
        >
          <span className="w-fit rounded-full bg-[var(--t-accent)] px-[10px] py-[3px] text-[12px] font-bold text-[var(--t-on-accent)]">
            Q&amp;A
          </span>
          <span className="mt-3 text-[13px] text-black/35">Асуулт үлдээх</span>
        </Link>
        {published.map((q) => (
          <div
            key={q.id}
            className="relative flex h-[222px] w-[166px] shrink-0 flex-col overflow-hidden rounded-[16px] p-[14px]"
            style={{ background: "var(--t-ask)", color: "var(--t-on-ask)" }}
          >
            <Sparkle />
            <p className="mt-[8px] text-[14px] font-semibold text-[var(--t-on-ask)]">Асуулт</p>
            <p className="mt-[6px] line-clamp-4 text-[15px] font-light italic leading-[1.05] text-[var(--t-on-ask)]">
              “{q.body}”
            </p>
            {q.answerBody ? (
              <p className="mt-1 line-clamp-3 text-[12px] font-light text-[var(--t-text)]">
                {q.answerBody}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Similar creators ------------------------------------------------------

export type Creator = {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
};

// Same collapse as Category: one "others" surface per theme.
const SIMILAR_STYLE = {
  background: "var(--t-others)",
  color: "var(--t-on-others)",
} as const;

export function LapisSimilar({ creators }: { creators: Creator[] }) {
  if (creators.length === 0) return null;
  return (
    <div className="bg-[var(--t-bg)] p-[10px] font-malt">
      <div className="overflow-hidden rounded-[16px] bg-[var(--t-panel)] p-[15px]">
        <div className="no-scrollbar flex gap-[8px] overflow-x-auto">
          {creators.map((c, i) => (
            <Link
              key={c.handle}
              href={`/${c.handle}`}
              className="flex h-[210px] w-[160px] shrink-0 flex-col items-center rounded-[16px] pt-[14px]"
              style={SIMILAR_STYLE}
            >
              <div className="h-[88px] w-[88px] overflow-hidden rounded-full bg-black/30">
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[34px] font-semibold text-[var(--t-on-others)]/80">
                    {c.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="mt-[11px] text-[14px] font-semibold text-[var(--t-on-others)]">
                {c.handle}
              </p>
              <p className="mt-[5px] line-clamp-2 w-[132px] px-1 text-center text-[10px] font-light uppercase leading-[16px] text-[var(--t-on-others)]/85">
                {c.bio ?? `${c.displayName} in da Pickly`}
              </p>
              <span className="mb-[12px] mt-auto rounded-[8px] bg-black/25 px-[14px] py-[4px] text-[13px] font-semibold uppercase text-[var(--t-on-others)]">
                pICKLY ҮЗЭХ
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- helpers / icons -------------------------------------------------------

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const iconStyle: CSSProperties = { width: 21, height: 21 };
function Sparkle() {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" className="mx-auto" fill="white" aria-hidden>
      <path d="M23 0c.8 14 1.5 16 23 23-21.5 7-22.2 9-23 23-.8-14-1.5-16-23-23 21.5-7 22.2-9 23-23Z" />
    </svg>
  );
}

