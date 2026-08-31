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
import { Wordmark } from "@/components/brand/Wordmark";
import { socialGlyph } from "@/components/social-icons";
import { SOCIAL_PLATFORMS, detectLinkIcon, hostOf as socialHostOf } from "@/lib/socials";
import { getTheme } from "@/lib/themes";
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
 *
 * The green hairline along the bottom is the design's one piece of persistent
 * brand colour (Figma 1208:11762) and is what separates the bar from the bio
 * shelf below, which shares its background.
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
    <div className="flex h-[54px] items-center gap-[8px] border-b border-[var(--t-brand)] bg-[var(--t-bg)] px-[15px]">
      {backTo ? (
        <Link
          href={`/${backTo}`}
          aria-label="Миний профайл руу буцах"
          className="-ml-[6px] flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-[var(--t-accent)] transition-transform active:scale-95"
          style={{ background: "color-mix(in srgb, var(--t-accent) 12%, transparent)" }}
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
      ) : null}

      <Wordmark height={21} className="shrink-0 text-[var(--t-accent)]" title="LinkSpot" />

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

  const tags = (profile.tags ?? []).filter((t) => t.trim());
  // The dark mock draws bare social glyphs, the light one draws filled discs.
  // Rather than hardcode that split, ask the palette: a transparent socialBg
  // IS the "no disc" instruction, so a future theme gets the right treatment
  // by setting one token.
  const bareSocials = getTheme(profile.theme).tokens.socialBg === "transparent";

  return (
    <div className="flex flex-col gap-[12px] bg-[var(--t-bg)] px-[16px] py-[10px]">
      <div className="flex flex-col gap-[8px]">
        <div className="flex items-center gap-[23px]">
          <Avatar name={profile.displayName} url={profile.avatarUrl} />
          {/* The design collapses the old name-over-@handle stack into a single
              identity line with the tag chips beneath it. The handle is already
              in the address bar and on every card that links here, so spending
              a second line on it pushed the chips off the shelf. */}
          <div className="flex min-w-0 flex-col gap-[12px]">
            <p className="truncate text-[19px] font-bold leading-[16px] tracking-[-0.38px] text-[var(--t-accent)]">
              {profile.displayName}
            </p>
            <TagChips tags={tags} />
          </div>
        </div>
        {/* Bio: real profile.bio only — no placeholder, renders nothing when empty. */}
        {profile.bio?.trim() ? (
          <p className="text-[14px] leading-[16px] tracking-[-0.28px] text-[var(--t-text)]">
            {profile.bio}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-[25px]">
        {isOwner ? (
          <Link
            href="/dashboard"
            className="flex h-[32px] w-[123px] items-center justify-center rounded-[6px] text-[14px] font-bold tracking-[-0.28px]"
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
          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-[14px] overflow-x-auto">
            {socialKeys.map((k) => (
              <a
                key={k}
                href={socials[k]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={k}
                className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--t-social-bg)", color: "var(--t-on-social)" }}
              >
                {/* Bare glyphs fill the 25px box; a glyph inside a disc has to
                    sit back from its edge. Both mocks draw a 25px target, so
                    the target never changes — only what is inside it. */}
                {socialGlyph(k, bareSocials ? 24 : 14)}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The self-descriptor row under the username (Figma 1291:10350). The FIRST
 * chip is filled with the theme's brand colour and the rest are outlined —
 * that is the design's way of giving one tag primacy without asking the
 * creator to choose a "main" one, so it is derived from position, not stored.
 */
function TagChips({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-[4px]">
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="flex h-[21px] items-center justify-center rounded-[10px] border-[0.5px] px-[13px] text-[12px] leading-[20px]"
          style={
            i === 0
              ? {
                  background: "var(--t-brand)",
                  color: "var(--t-on-brand)",
                  borderColor: "var(--t-brand)",
                }
              : {
                  background: "transparent",
                  color: "var(--t-accent)",
                  borderColor: "var(--t-accent)",
                }
          }
        >
          {tag}
        </span>
      ))}
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
    <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-full bg-[var(--t-avatar-bg)] text-[30px] font-bold text-[var(--t-accent)]">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}

// --- Section chrome --------------------------------------------------------

/**
 * Every section heading on the page (Figma 1275:8202 and siblings): 20px bold,
 * sentence case, on the theme's accent.
 *
 * Sentence case, not the old uppercase: the MVP design sets these in title
 * case, and Mongolian Cyrillic loses its ascender shapes when it is uppercased
 * wholesale, which is what made "УРАМШУУЛЛЫН КОД" read as a block of noise.
 */
function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-[20px] font-bold leading-[16px] tracking-[-0.4px] text-[var(--t-accent)]">
      {children}
    </p>
  );
}

/**
 * The standard section shell: heading indented 12px, content below it, and an
 * optional hairline rule at the bottom. `bleed` drops the horizontal padding
 * on the content so a shelf can run to the edge of the frame and hint at what
 * is off-screen, which is how every horizontally-scrolling section in the
 * design is drawn.
 */
function Section({
  title,
  divider = false,
  bleed = false,
  children,
}: {
  title: string;
  divider?: boolean;
  bleed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex flex-col gap-[14px] bg-[var(--t-bg)] py-[17px] ${
        divider ? "border-b-[0.58px] border-[var(--t-border)]" : ""
      }`}
    >
      <div className="px-[12px]">
        <SectionTitle>{title}</SectionTitle>
      </div>
      <div className={bleed ? "" : "px-[11px]"}>{children}</div>
    </section>
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
    <div className="no-scrollbar flex items-stretch gap-[8px] overflow-x-auto scroll-pl-[10px] px-[10px]">
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
  // "Bilguundalai's Picks" in the mock — the possessive leads with a capital
  // even though a handle is stored lowercase.
  const owner = handle.charAt(0).toLocaleUpperCase() + handle.slice(1);
  return (
    <Section title={`${owner}'s Picks`} divider bleed>
      <div className="no-scrollbar flex snap-x snap-mandatory items-start gap-[8px] overflow-x-auto scroll-pl-[10px] px-[10px]">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </Section>
  );
}

/**
 * Banner aspect ratio.
 *
 * The MVP design draws these as short 382×102 strips, but every banner in the
 * library is authored at 382×305 (public/campaigns/* are all 1528×1220). Cropping
 * live artwork to a third of its height would cut the headline off every one of
 * them, so the shelf keeps the ratio the assets are drawn at. Change this one
 * constant to "382/102" once the short banners exist — nothing else needs to move.
 */
const CAMPAIGN_ASPECT = "382/305";

function CampaignCard({ campaign }: { campaign: ProfileCampaign }) {
  const inner = (
    <>
      <div
        className="relative w-full overflow-hidden rounded-[20px] bg-black/10"
        style={{ aspectRatio: CAMPAIGN_ASPECT }}
      >
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
    <Section title="My Picks">
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
    </Section>
  );
}

// --- Not For Me: wont_rebuy picks ------------------------------------------

export function LapisNotForMe({ picks }: { picks: Pick[] }) {
  if (picks.length === 0) return null;
  return (
    <Section title="Not For Me" bleed>
      <PickRow picks={picks} muted />
    </Section>
  );
}

// --- Promo codes ----------------------------------------------------------

/** Staff-authored discount tickets. Hidden entirely when a creator has none,
 *  same rule as every other section. */
export function LapisPromos({ promos }: { promos: PublicPromo[] }) {
  if (promos.length === 0) return null;
  return (
    <Section title="Promo Code" bleed>
      <div className="no-scrollbar flex snap-x snap-mandatory items-start gap-[14px] overflow-x-auto scroll-pl-[12px] px-[12px]">
        {promos.map((p) => (
          <PromoCard key={p.id} promo={p} />
        ))}
      </div>
    </Section>
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
    <Section title="Wishlist" bleed>
      <div className="no-scrollbar flex gap-[8px] overflow-x-auto scroll-pl-[10px] px-[10px]">
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
    </Section>
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
    <Section title="Quick Links">
      <div className="flex flex-col gap-[8px]">
        {links.map((l) => {
          const host = socialHostOf(l.url);
          return (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[50px] items-center gap-[13px] rounded-[10px] px-[10px] py-[5px] transition-transform active:scale-[0.99]"
              // Quick Links ride the bright `media` surface, not `card`: the
              // design mounts them on the same white plate as the album art,
              // which is what keeps the row legible in all four palettes even
              // when `card` is a gradient.
              style={{ background: "var(--t-media)", color: "var(--t-on-media)" }}
            >
              {/* Filled square, not a circle — the design's 40px tile. Colours
                  are the inverse of the row so the tile reads as a stamp on it
                  regardless of which theme painted the row. */}
              <span
                className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[8px]"
                style={{ background: "var(--t-on-media)", color: "var(--t-media)" }}
              >
                {socialGlyph(l.icon ?? detectLinkIcon(l.url), 20)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] font-semibold leading-[17px] tracking-[-0.28px]">
                  {l.label}
                </span>
                {host ? (
                  <span
                    className="truncate text-[11px] leading-[13px]"
                    style={{ color: "var(--t-on-media-muted)" }}
                  >
                    {host}
                  </span>
                ) : null}
              </span>
              <ArrowOut className="mr-[8px] shrink-0" />
            </a>
          );
        })}
      </div>
    </Section>
  );
}

// --- Q&A -------------------------------------------------------------------

export function LapisAsk({
  handle,
  avatarUrl,
  displayName,
  askEnabled,
  questions,
}: {
  handle: string;
  /** The creator's picture, shown beside the Q&A label on the composer. */
  avatarUrl?: string | null;
  displayName?: string;
  askEnabled: boolean;
  questions: Ask[];
}) {
  if (!askEnabled) return null;
  const published = questions.filter((q) => q.isPublic && q.status === "answered");
  return (
    <Section title="Ask Me Anything!" divider bleed>
      <div className="flex flex-col gap-[10px]">
        {/* Composer. A full-width card in the design rather than the first tile
            of the shelf — asking is the point of the section, so it does not
            compete for space with the answers and does not scroll away. */}
        <div className="px-[11px]">
          <Link
            href={`/${handle}/ask`}
            className="flex flex-col rounded-[13px] px-[12px] pb-[17px] pt-[16px] transition-transform active:scale-[0.995]"
            style={{ background: "var(--t-ask)", color: "var(--t-on-ask)" }}
          >
            <span className="flex items-center gap-[10px]">
              <span
                className="flex h-[40px] w-[40px] shrink-0 items-center justify-center overflow-hidden rounded-full text-[16px] font-bold"
                style={{ background: "var(--t-avatar-bg)", color: "var(--t-accent)" }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (displayName ?? handle).trim().charAt(0).toUpperCase()
                )}
              </span>
              <span className="text-[18px] font-bold leading-[14px]">Q&amp;A</span>
            </span>
            {/* Looks like the input it leads to, but is not one: the real
                composer lives on /[handle]/ask behind the rate limiter and the
                wordlist filter, so this stays a link and the page keeps
                rendering on the server. */}
            <span
              className="mt-[16px] flex h-[45px] items-center rounded-[13px] px-[14px] text-[18px] leading-[14px]"
              style={{ background: "var(--t-ask-field)", color: "var(--t-on-ask-field)" }}
            >
              Асуулт үлдээх
            </span>
          </Link>
        </div>

        {published.length > 0 ? (
          <div className="no-scrollbar flex gap-[5px] overflow-x-auto scroll-pl-[11px] px-[11px]">
            {published.map((q) => (
              <AskCard key={q.id} question={q} />
            ))}
          </div>
        ) : null}
      </div>
    </Section>
  );
}

/**
 * One published question (Figma 1208:14888). The mock draws it as a two-sided
 * card — question on the front, answer on the back — so the answer is rendered
 * here as a labelled block beneath the quote rather than as a separate tile,
 * which keeps both halves reachable without a flip interaction the section has
 * no room to teach.
 */
function AskCard({ question }: { question: Ask }) {
  return (
    <article
      className="flex h-[222px] w-[166px] shrink-0 flex-col overflow-hidden rounded-[13px] px-[15px] pb-[7px] pt-[16px]"
      style={{ background: "var(--t-ask)", color: "var(--t-on-ask)" }}
    >
      <Sparkle />
      <p className="mt-[6px] text-[14px] font-bold leading-[1.2] tracking-[-0.28px]">
        Асуулт
      </p>
      <p className="mt-[6px] line-clamp-4 text-[14px] italic leading-[1.15] tracking-[-0.28px]">
        “{question.body}”
      </p>
      {question.answerBody ? (
        <p className="mt-[6px] line-clamp-3 text-[12px] leading-[1.15] opacity-75">
          {question.answerBody}
        </p>
      ) : null}
      {/* The mock puts a "Pinned" chip opposite the timestamp. There is no
          pinning in the data model and this change is a restyle, not a feature
          — so the row carries the age alone rather than a chip that would be
          decorative on every card. */}
      <p className="mt-auto text-[8.74px] leading-[1.2] tracking-[-0.17px] opacity-70">
        {relativeDays(question.createdAt)}
      </p>
    </article>
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
              <p className="mt-[5px] line-clamp-2 w-[132px] px-1 text-center text-[10px] font-light leading-[16px] text-[var(--t-on-others)]/85">
                {c.bio ?? `${c.displayName} on LinkSpot`}
              </p>
              <span className="mb-[12px] mt-auto rounded-[8px] bg-black/25 px-[14px] py-[4px] text-[13px] font-semibold text-[var(--t-on-others)]">
                LinkSpot үзэх
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Footer ----------------------------------------------------------------

/**
 * Closes the page with the mark and the year the product started (Figma
 * 1208:14891). Deliberately the only place on a creator's profile that names
 * the platform in body copy — everything above it belongs to the creator.
 */
export function LapisFooter() {
  return (
    <footer className="flex h-[75px] flex-col items-center justify-center gap-[6px] bg-[var(--t-bg)]">
      <Wordmark height={19} className="text-[var(--t-accent)]" title="LinkSpot" />
      <p className="text-[10px] uppercase leading-none text-[var(--t-accent)]">
        since 2026
      </p>
    </footer>
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

/**
 * "N өдрийн өмнө" — the age of a question, in the mock's own wording. Days
 * only: the shelf shows answered questions, which are rarely minutes old, and
 * a finer unit would just be noise at 8.74px.
 */
function relativeDays(at: Date | string): string {
  const then = typeof at === "string" ? new Date(at) : at;
  if (Number.isNaN(then.getTime())) return "";
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return "өнөөдөр";
  if (days === 1) return "өчигдөр";
  return `${days} өдрийн өмнө`;
}

/** The design's outbound corner-arrow, drawn as three bars rather than a glyph
 *  so it keeps its exact weight at 6px where a text "↗" turns to mush. */
function ArrowOut({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 8 8"
      width="8"
      height="8"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M0.9 0h6.2v1.8H0.9z" />
      <path d="M5.3 0h1.8v6.2H5.3z" />
      <path d="M0 5.9 5.9 0l1.3 1.3L1.3 7.2z" />
    </svg>
  );
}

const iconStyle: CSSProperties = { width: 21, height: 21 };
function Sparkle() {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 46 46"
      className="-ml-[4px]"
      fill="currentColor"
      aria-hidden
    >
      <path d="M23 0c.8 14 1.5 16 23 23-21.5 7-22.2 9-23 23-.8-14-1.5-16-23-23 21.5-7 22.2-9 23-23Z" />
    </svg>
  );
}

