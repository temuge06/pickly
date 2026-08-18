/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import Link from "next/link";
import type {
  askMessage,
  collection,
  link,
  pick,
  profile,
  wishlistItem,
} from "@/db/schema";
import { ProductImage } from "@/components/ui/ProductImage";

type Profile = typeof profile.$inferSelect;
type Pick = typeof pick.$inferSelect;
type Collection = typeof collection.$inferSelect;
type LinkRow = typeof link.$inferSelect;
type Ask = typeof askMessage.$inferSelect;
type WishlistItem = typeof wishlistItem.$inferSelect;

// --- Status bar ------------------------------------------------------------

export function LapisStatusBar() {
  return (
    <div className="flex h-[54px] items-center bg-[var(--t-bg)] px-[10px]">
      <span className="font-inter text-[16px] font-bold text-[var(--t-accent)]">Pickly</span>
      <span className="ml-0.5 inline-block h-[7px] w-[7px] -translate-y-1 rounded-[1px] bg-[var(--t-accent)]" />
    </div>
  );
}

// --- Header (bio shelf) ----------------------------------------------------

export function LapisHeader({
  profile,
  isOwner = false,
}: {
  profile: Profile;
  /** Resolved on the server by comparing auth.uid() to this profile's owner.
   *  Never derive this client-side — the button must be absent, not hidden. */
  isOwner?: boolean;
}) {
  const socials = (profile.socials ?? {}) as Record<string, string>;
  const socialKeys = Object.keys(socials).filter((k) => socials[k]);

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
          <button
            className="h-[32px] w-[123px] rounded-[6px] font-inter text-[14px] font-semibold tracking-[-0.28px]"
            style={{ background: "var(--t-btn)", color: "var(--t-on-btn)" }}
          >
            Follow
          </button>
        )}
        {socialKeys.length > 0 ? (
          <div className="flex items-center gap-[13px]">
            {socialKeys.map((k) => {
              const glyph = SOCIAL_GLYPHS[k];
              if (!glyph) return null;
              return (
                <a
                  key={k}
                  href={socials[k]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[var(--t-accent)] text-[var(--t-on-accent)]"
                >
                  {glyph}
                </a>
              );
            })}
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
  recommenders = [],
}: {
  pick: Pick;
  muted?: boolean;
  recommenders?: string[];
}) {
  const source = hostOf(pick.outboundUrl ?? pick.sourceUrl);
  return (
    <div
      className="flex min-h-[319px] w-[168px] shrink-0 items-start rounded-[14px] px-[10px] py-[12px]"
      style={{ background: "var(--t-card)", color: "var(--t-on-card)" }}
    >
      <div className="flex w-[149px] flex-col gap-[26px]">
        <div className="flex flex-col gap-[8px]">
          <div className={`relative aspect-square w-full overflow-hidden rounded-[10px] bg-black/10 shadow-[0px_1px_4.4px_0px_rgba(0,0,0,0.25)] ${muted ? "opacity-70 grayscale-[45%]" : ""}`}>
            {pick.imageUrl ? <ProductImage src={pick.imageUrl} alt={pick.title} sizes="149px" /> : null}
          </div>
          <div className="flex flex-col gap-[8px] text-[var(--t-on-card)]">
            <p className="min-h-[26px] text-[14px] font-bold uppercase leading-[13px]">{pick.title}</p>
            {pick.note ? (
              <p className="line-clamp-4 min-h-[48px] text-[14px] font-light leading-[12px] tracking-[-0.28px]">{pick.note}</p>
            ) : (
              <div className="min-h-[48px]" />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center gap-[12px]">
            {pick.outboundUrl ? (
              <a href={pick.outboundUrl} target="_blank" rel="noopener noreferrer" className="flex w-[58px] items-center justify-center rounded-[10px] bg-[var(--t-card-btn)] text-[var(--t-on-card-btn)] px-[8px] py-[4px] text-[14px] font-semibold capitalize tracking-[-0.56px]">
                үзэх<span className="ml-0.5 text-[9px]">↗</span>
              </a>
            ) : null}
            <Recommenders avatars={recommenders} />
          </div>
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
}

/** Rotate a list by n so different cards lead with different faces. */
function rotate<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

function PickRow({
  picks,
  muted,
  recommenders,
}: {
  picks: Pick[];
  muted?: boolean;
  recommenders?: string[];
}) {
  const pool = recommenders ?? [];
  return (
    <div className="no-scrollbar flex items-stretch gap-[8px] overflow-x-auto scroll-pl-[10px] pr-[10px]">
      {picks.map((p, i) => (
        <PickCard
          key={p.id}
          pick={p}
          muted={muted}
          recommenders={pool.length ? rotate(pool, i).slice(0, 3) : []}
        />
      ))}
    </div>
  );
}

// --- Top Picks: ungrouped, non-wont_rebuy picks ----------------------------

export function LapisTopPicks({
  picks,
  recommenders,
}: {
  picks: Pick[];
  recommenders?: string[];
}) {
  if (picks.length === 0) return null;
  return (
    <div className="flex flex-col gap-[18px] border-b-[0.5px] border-[var(--t-border)] bg-[var(--t-bg)] py-[20px] pl-[10px] font-malt">
      <SectionTitle>TOP PICKS</SectionTitle>
      <PickRow picks={picks} recommenders={recommenders} />
    </div>
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

export function LapisNotForMe({
  picks,
  recommenders,
}: {
  picks: Pick[];
  recommenders?: string[];
}) {
  if (picks.length === 0) return null;
  return (
    <div className="flex flex-col gap-[18px] bg-[var(--t-bg)] py-[20px] pl-[10px] font-malt">
      <SectionTitle>NOT FOR ME</SectionTitle>
      <PickRow picks={picks} muted recommenders={recommenders} />
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

// --- Links (kept for reference; no longer rendered on the public profile) ---

export function LapisLinks({ links }: { links: LinkRow[] }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-col gap-[18px] bg-[var(--t-bg)] px-[10px] py-[20px] font-malt">
      <SectionTitle>LINKS</SectionTitle>
      <div className="flex flex-col gap-[8px]">
        {links.map((l) => (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[48px] items-center justify-between gap-3 rounded-[14px] bg-[var(--t-accent)]/12 px-4 py-3 ring-1 ring-inset ring-[var(--t-accent)]/25"
          >
            <span className="truncate text-[14px] font-semibold text-[var(--t-text)]">
              {l.label}
            </span>
            <span className="shrink-0 text-[13px] text-[var(--t-accent)]">↗</span>
          </a>
        ))}
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

const SOCIAL_GLYPHS: Record<string, React.ReactNode> = {
  facebook: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.5l.4-3h-2.9V8.2c0-.9.3-1.5 1.6-1.5H16.5V4.1C16.2 4 15.2 4 14.1 4c-2.3 0-3.9 1.4-3.9 4v2.9H7.6v3h2.6v8h3.3Z" /></svg>,
  instagram: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>,
  tiktok: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.4 2.2 1.9 3.6 4 3.9v2.8c-1.5 0-2.9-.4-4-1.2v6.4c0 3.4-2.5 5.7-5.6 5.7-2.9 0-5.4-2.2-5.4-5.4 0-3.1 2.5-5.4 5.6-5.4.4 0 .8 0 1.2.1v2.9a2.6 2.6 0 1 0 1.5 2.4V3h2.7Z" /></svg>,
  youtube: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8.2a2.6 2.6 0 0 0-1.8-1.8C18.5 6 12 6 12 6s-6.5 0-8.2.4A2.6 2.6 0 0 0 2 8.2 27 27 0 0 0 1.6 12 27 27 0 0 0 2 15.8a2.6 2.6 0 0 0 1.8 1.8C5.5 18 12 18 12 18s6.5 0 8.2-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22.4 12 27 27 0 0 0 22 8.2ZM10 15V9l5 3-5 3Z" /></svg>,
  x: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L21.5 21h-5.9l-4.2-5.4L6.5 21H3.4l7-8L2.9 3h6l3.8 5 4.8-5Zm-1 16h1.6L8.1 4.7H6.3L16.5 19Z" /></svg>,
  twitter: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L21.5 21h-5.9l-4.2-5.4L6.5 21H3.4l7-8L2.9 3h6l3.8 5 4.8-5Zm-1 16h1.6L8.1 4.7H6.3L16.5 19Z" /></svg>,
  linkedin: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6.9 8.5H4V21h2.9V8.5ZM5.4 4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM21 21h-2.9v-6.5c0-1.6-.6-2.5-1.9-2.5-1 0-1.6.7-1.9 1.4V21H11.5V8.5h2.8v1.6c.5-.9 1.6-1.6 3-1.6 2.2 0 3.7 1.4 3.7 4.3V21Z" /></svg>,
};
