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
    <div className="flex h-[54px] items-center bg-[#2a1617] px-[10px]">
      <span className="font-inter text-[16px] font-bold text-white">Pickly</span>
      <span className="ml-0.5 inline-block h-[7px] w-[7px] -translate-y-1 rounded-[1px] bg-[#fe7f42]" />
    </div>
  );
}

// --- Header (bio shelf) ----------------------------------------------------

export function LapisHeader({ profile }: { profile: Profile }) {
  const socials = (profile.socials ?? {}) as Record<string, string>;
  const socialKeys = Object.keys(socials).filter((k) => socials[k]);

  return (
    <div className="flex flex-col gap-[12px] border-b-[0.5px] border-[#7b4c46] bg-[#2a1617] px-[16px] py-[10px]">
      <div className="flex flex-col gap-[8px]">
        <div className="flex items-center gap-[23px]">
          <Avatar name={profile.displayName} url={profile.avatarUrl} />
          <div className="flex min-w-0 flex-col gap-[6px]">
            <p className="font-inter text-[19px] font-semibold leading-none tracking-[-0.38px] text-white">
              {profile.displayName}
            </p>
            <p className="font-inter text-[14px] leading-none tracking-[-0.28px] text-[#a2a9b4]">
              @{profile.handle}
            </p>
          </div>
        </div>
        {/* Bio: real profile.bio only — no placeholder, renders nothing when empty. */}
        {profile.bio?.trim() ? (
          <p className="font-inter text-[14px] leading-[18px] tracking-[-0.28px] text-[#feedd5]">
            {profile.bio}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-[25px]">
        <button className="h-[32px] w-[123px] rounded-[6px] bg-white font-inter text-[14px] font-semibold tracking-[-0.28px] text-[#0a0a0a]">
          Follow
        </button>
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
                  className="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#fe7f42] text-white"
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
    <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-full bg-[#42282a] font-inter text-[30px] font-semibold text-[#fe7f42]">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}

// --- Section title (After → Montserrat Alternates 800) ---------------------

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="font-malt text-[20px] font-extrabold uppercase leading-[16px] tracking-[-0.4px] text-white">
      {children}
    </p>
  );
}

// --- Pick card (shared by Top Picks / My Picks / Not For Me) ---------------

const STATUS_TOGGLE: Record<string, "on" | "off" | "mid"> = {
  recommend: "on",
  repurchased: "on",
  wont_rebuy: "off",
  testing: "mid",
};

function PickCard({ pick, muted = false }: { pick: Pick; muted?: boolean }) {
  const source = hostOf(pick.outboundUrl ?? pick.sourceUrl);
  const toggle = STATUS_TOGGLE[pick.status] ?? "mid";
  return (
    <div className="flex min-h-[319px] w-[168px] shrink-0 items-start rounded-[14px] bg-[#b22c20] px-[10px] py-[12px]">
      <div className="flex w-[149px] flex-col gap-[26px]">
        <div className="flex flex-col gap-[8px]">
          <div className={`relative aspect-square w-full overflow-hidden rounded-[10px] bg-black/10 shadow-[0px_1px_4.4px_0px_rgba(0,0,0,0.25)] ${muted ? "opacity-70 grayscale-[45%]" : ""}`}>
            {pick.imageUrl ? <ProductImage src={pick.imageUrl} alt={pick.title} sizes="149px" /> : null}
          </div>
          <div className="flex flex-col gap-[8px] text-white">
            <p className="min-h-[26px] text-[14px] font-bold uppercase leading-[13px]">{pick.title}</p>
            {pick.note ? (
              <p className="line-clamp-4 min-h-[48px] text-[14px] font-light leading-[12px] tracking-[-0.28px]">{pick.note}</p>
            ) : (
              <div className="min-h-[48px]" />
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-[28px] gap-y-1">
          {pick.outboundUrl ? (
            <a href={pick.outboundUrl} target="_blank" rel="noopener noreferrer" className="flex w-[58px] items-center justify-center rounded-[10px] bg-black px-[8px] py-[4px] text-[14px] font-semibold capitalize tracking-[-0.56px] text-white">
              үзэх<span className="ml-0.5 text-[9px]">↗</span>
            </a>
          ) : null}
          <Toggle state={toggle} />
          {source ? (
            <span className="flex items-center gap-1 text-[8px] font-light tracking-[-0.16px] text-white">
              <span className="h-[6px] w-[6px] rounded-full bg-white" />
              {source}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Toggle({ state }: { state: "on" | "off" | "mid" }) {
  return (
    <span className="flex h-[22px] w-[46px] items-center rounded-full bg-black/40 p-[2px]">
      <span className={`h-[18px] w-[18px] rounded-full bg-white transition-all ${state === "on" ? "ml-auto" : state === "mid" ? "mx-auto" : "mr-auto"}`} />
    </span>
  );
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

// --- Top Picks: ungrouped, non-wont_rebuy picks ----------------------------

export function LapisTopPicks({ picks }: { picks: Pick[] }) {
  if (picks.length === 0) return null;
  return (
    <div className="flex flex-col gap-[18px] border-b-[0.5px] border-[#323232] bg-[#2a1617] py-[20px] pl-[10px] font-malt">
      <SectionTitle>TOP PICKS</SectionTitle>
      <PickRow picks={picks} />
    </div>
  );
}

// --- My Picks: up to 3 collections as a responsive box grid ----------------
// 1 collection → one full-width box; 2 → two equal boxes; 3 → one tall box on
// the left + two stacked on the right (per the Spotly design).

const CATEGORY_BG = [
  "bg-[#e23d65]",
  "bg-[#ff5f5f]",
  "bg-gradient-to-b from-[#fdd566] to-[#e23d65]",
];

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
  colorIndex,
  tall,
  spanRows,
}: {
  title: string;
  count: number;
  images: string[];
  colorIndex: number;
  tall: boolean;
  spanRows?: boolean;
}) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[11px] ${
        CATEGORY_BG[colorIndex] ?? CATEGORY_BG[0]
      } ${spanRows ? "row-span-2" : ""}`}
    >
      <p className="absolute left-[11px] top-[15px] line-clamp-2 w-[70%] text-[14px] font-semibold leading-[16px] tracking-[-0.28px] text-white">
        {title}
      </p>
      <Polaroids images={images} tall={tall} />
      <p className="absolute bottom-[12px] left-[13px] text-[14px] leading-[12px] tracking-[-0.28px] text-white/80">
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
    <div className="flex flex-col gap-[18px] bg-[#feedd5] px-[10px] py-[20px] font-malt">
      <p className="font-malt text-[20px] font-extrabold uppercase leading-[16px] tracking-[-0.4px] text-[#b1193f]">
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
              colorIndex={i}
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
    <div className="flex flex-col gap-[18px] bg-[#2a1617] py-[20px] pl-[10px] font-malt">
      <SectionTitle>NOT FOR ME</SectionTitle>
      <PickRow picks={picks} muted />
    </div>
  );
}

// --- Wishlist --------------------------------------------------------------

export function LapisWishlist({ items }: { items: WishlistItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-[18px] bg-[#2a1617] py-[20px] pl-[10px] font-malt">
      <SectionTitle>WISHLIST</SectionTitle>
      <div className="no-scrollbar flex gap-[8px] overflow-x-auto scroll-pl-[10px] pr-[10px]">
        {items.map((w) => {
          const source = hostOf(w.url);
          return (
            <div key={w.id} className="flex h-[144px] w-[314px] shrink-0 items-start gap-[3px] rounded-[14px] bg-[#b22c20] p-[10px]">
              <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-[12px] bg-black/10">
                {w.imageUrl ? <ProductImage src={w.imageUrl} alt={w.title} sizes="120px" /> : null}
              </div>
              <div className="relative flex h-full flex-1 flex-col pl-[12px]">
                <p className="text-[14px] font-bold uppercase leading-[15px] text-white">{w.title}</p>
                {w.note ? (
                  <p className="mt-[8px] line-clamp-3 text-[13px] font-light leading-[13px] tracking-[-0.28px] text-white/95">{w.note}</p>
                ) : null}
                <div className="mt-auto flex items-center gap-[10px]">
                  {w.url ? (
                    <a href={w.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-[10px] bg-black px-[8px] py-[4px] text-[14px] font-semibold capitalize tracking-[-0.56px] text-white">
                      үзэх<span className="ml-0.5 text-[9px]">↗</span>
                    </a>
                  ) : null}
                  {source ? (
                    <span className="flex items-center gap-1 text-[8px] font-light tracking-[-0.16px] text-white">
                      <span className="h-[6px] w-[6px] rounded-full bg-white" />
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
    <div className="flex flex-col gap-[18px] bg-[#2a1617] px-[10px] py-[20px] font-malt">
      <SectionTitle>LINKS</SectionTitle>
      <div className="flex flex-col gap-[8px]">
        {links.map((l) => (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[48px] items-center justify-between gap-3 rounded-[14px] bg-[#fe7f42]/12 px-4 py-3 ring-1 ring-inset ring-[#fe7f42]/25"
          >
            <span className="truncate text-[14px] font-semibold text-[#feedd5]">
              {l.label}
            </span>
            <span className="shrink-0 text-[13px] text-[#fe7f42]">↗</span>
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
    <div className="flex flex-col gap-[18px] bg-[#2a1617] py-[20px] pl-[12px] font-malt">
      <SectionTitle>Ask Me Anything!</SectionTitle>
      <div className="no-scrollbar flex gap-[16px] overflow-x-auto pr-[12px]">
        <Link
          href={`/${handle}/ask`}
          className="flex h-[222px] w-[171px] shrink-0 flex-col rounded-[16px] bg-white p-[12px]"
        >
          <span className="w-fit rounded-full bg-[#fe7f42] px-[10px] py-[3px] text-[12px] font-bold text-white">
            Q&amp;A
          </span>
          <span className="mt-3 text-[13px] text-black/35">Асуулт үлдээх</span>
        </Link>
        {published.map((q) => (
          <div
            key={q.id}
            className="relative flex h-[222px] w-[166px] shrink-0 flex-col overflow-hidden rounded-[16px] bg-[#fe7f42] p-[14px]"
          >
            <Sparkle />
            <p className="mt-[8px] text-[14px] font-semibold text-white">Асуулт</p>
            <p className="mt-[6px] line-clamp-4 text-[15px] font-light italic leading-[1.05] text-white">
              “{q.body}”
            </p>
            {q.answerBody ? (
              <p className="mt-1 line-clamp-3 text-[12px] font-light text-[#feedd5]">
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

const SIMILAR_BG = ["#4b4b4b", "#d02c53", "#6b4bcc"];

export function LapisSimilar({ creators }: { creators: Creator[] }) {
  if (creators.length === 0) return null;
  return (
    <div className="bg-[#2a1617] p-[10px] font-malt">
      <div className="overflow-hidden rounded-[16px] bg-[#1c0f0f] p-[15px]">
        <div className="no-scrollbar flex gap-[8px] overflow-x-auto">
          {creators.map((c, i) => (
            <Link
              key={c.handle}
              href={`/${c.handle}`}
              className="flex h-[210px] w-[160px] shrink-0 flex-col items-center rounded-[16px] pt-[14px]"
              style={{ background: SIMILAR_BG[i % SIMILAR_BG.length] }}
            >
              <div className="h-[88px] w-[88px] overflow-hidden rounded-full bg-black/30">
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[34px] font-semibold text-white/80">
                    {c.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="mt-[11px] text-[14px] font-semibold text-white">
                {c.handle}
              </p>
              <p className="mt-[5px] line-clamp-2 w-[132px] px-1 text-center text-[10px] font-light uppercase leading-[16px] text-white/85">
                {c.bio ?? `${c.displayName} in da Pickly`}
              </p>
              <span className="mb-[12px] mt-auto rounded-[8px] bg-black/25 px-[14px] py-[4px] text-[13px] font-semibold uppercase text-white">
                pICKLY ҮЗЭХ
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Bottom nav ------------------------------------------------------------

export function LapisBottomNav() {
  const items = [
    { label: "Нүүр", icon: <IcoHome />, active: true, href: undefined as string | undefined },
    { label: "Discover", icon: <IcoCompass />, active: false, href: undefined },
    { label: "Saved", icon: <IcoBookmark />, active: false, href: undefined },
    // The creator's own management area. A visitor who isn't signed in is
    // routed to /sign-in by middleware; the creator lands on their dashboard.
    { label: "Профайл", icon: <IcoUser />, active: false, href: "/dashboard" },
  ];
  return (
    <div className="sticky bottom-0 left-0 right-0 flex h-[86px] items-start bg-[#0b1014] px-[5px] py-[10px]">
      <div className="flex h-[68px] w-full items-center rounded-[23px] border-[1.111px] border-white/[0.13] bg-[rgba(4,4,4,0.94)] p-px shadow-[0px_3px_16px_0px_rgba(176,24,61,0.1)]">
        {items.map((it) => {
          const inner = (
            <>
              {it.active ? (
                <span className="absolute inset-x-[6px] inset-y-[3px] rounded-[14px] bg-[#fe7f42] opacity-10" />
              ) : null}
              <span className={it.active ? "text-[#fe7f42]" : "text-white"}>{it.icon}</span>
              <span
                className={`font-inter text-[10px] ${
                  it.active ? "text-[#fe7f42]" : "font-medium text-white"
                }`}
              >
                {it.label}
              </span>
            </>
          );
          const cls =
            "relative flex flex-1 flex-col items-center justify-center gap-[3px] transition-transform active:scale-95";
          return it.href ? (
            <Link key={it.label} href={it.href} className={cls}>
              {inner}
            </Link>
          ) : (
            <div key={it.label} className={cls}>
              {inner}
            </div>
          );
        })}
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
function IcoHome() {
  return (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </svg>
  );
}
function IcoCompass() {
  return (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IcoBookmark() {
  return (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M6 3h12v18l-6-4-6 4V3Z" />
    </svg>
  );
}
function IcoUser() {
  return (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  );
}
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
