/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

export const metadata = { title: "Preview — lapis pickly" };

/**
 * Faithful reproduction of the Figma "lapis pickly" frame (694-12989).
 * Exact colors/spacing/radii pulled from the Figma nodes. Fonts: the design's
 * two custom faces ("After" section titles, "GIP" notes) map to Montserrat
 * Alternates weights (both Cyrillic-native); Inter for the bio, DM Sans for the
 * bottom nav — all per the Figma. Content matches the frame's sample data;
 * images are the frame's own Figma-CDN assets (valid ~7 days).
 */

const A = "https://www.figma.com/api/mcp/asset";
const img = {
  avatar: `${A}/429bd39f-3fdc-4016-86fb-e553a4f057f3.png`,
  cosy: `${A}/0b5dfe6d-bb33-4728-a928-a960e505d87e.png`,
  sony: `${A}/17d956a8-ff4a-4646-b637-ce9bff49c7f6.png`,
  mongolz: `${A}/0b41c66a-ff2c-45b2-99b3-f95b014b1cdd.png`,
  toki: `${A}/3660a2c3-b3f9-4100-b6d3-e8b6a93ce8bb.png`,
  breakfast: `${A}/f3e9302c-978c-4769-87ff-4d5e60b58e44.png`,
  album1: `${A}/32ba4af5-b6a0-41fa-a3c5-7b3c17d9def4.png`,
  album2: `${A}/7fc2025c-75fd-4a35-ae1a-6d4832cb3f81.png`,
  album3: `${A}/c4585bcd-2e37-422a-aae3-f22ead6b2ea1.png`,
  bento1: `${A}/7a2ad6a4-5f6e-4a04-966e-e28d220542b9.png`,
  bento2: `${A}/eca97c10-3110-4b72-a82c-3033e54bf9fe.png`,
  bento3: `${A}/4335a1d8-dca9-42e4-9dad-76d430c5663e.png`,
  bento4: `${A}/eb8b13cb-90f4-42a0-870e-b98f2242abbd.png`,
};

export default function LapisPreview() {
  return (
    <div className="min-h-dvh bg-neutral-800 py-8">
      <div className="relative mx-auto w-[402px] overflow-hidden bg-[#2a1617] font-malt shadow-[0_0_80px_rgba(0,0,0,0.4)]">
        <div className="pb-[100px]">
          <StatusBar />
          <BioShelf />
          <MusicSection />
          <TopPicks />
          <MyPicks />
          <Wishlist />
          <NotForMe />
          <Qna />
          <Similar />
        </div>
        <BottomNav />
      </div>
    </div>
  );
}

// --- Status bar ------------------------------------------------------------

function StatusBar() {
  return (
    <div className="flex h-[54px] items-center bg-[#2a1617] px-[10px]">
      <span className="font-inter text-[16px] font-bold text-white">
        Pickly
      </span>
      <span className="ml-0.5 inline-block h-[7px] w-[7px] -translate-y-1 rounded-[1px] bg-[#fe7f42]" />
    </div>
  );
}

// --- Bio shelf -------------------------------------------------------------

function BioShelf() {
  return (
    <div className="flex flex-col gap-[12px] border-b-[0.5px] border-[#7b4c46] bg-[#2a1617] px-[16px] py-[10px]">
      <div className="flex flex-col gap-[8px]">
        <div className="flex items-center gap-[23px]">
          <img
            src={img.avatar}
            alt="Cutelapis"
            className="h-[82px] w-[82px] shrink-0 rounded-full object-cover"
          />
          <div className="flex flex-col gap-[10px]">
            <p className="font-inter text-[19px] font-semibold leading-none tracking-[-0.38px] text-white">
              Cutelapis
            </p>
            <p className="font-inter text-[14px] tracking-[-0.28px] text-[#a2a9b4]">
              Marketing - Gaming - Technology
            </p>
          </div>
        </div>
        <p className="font-inter text-[14px] tracking-[-0.28px] text-white">
          Cutelapis in da Pickly
        </p>
      </div>
      <div className="flex items-center gap-[25px]">
        <button className="h-[32px] w-[123px] rounded-[6px] bg-white font-inter text-[14px] font-semibold tracking-[-0.28px] text-[#0a0a0a]">
          Follow
        </button>
        <div className="flex items-center gap-[13px]">
          {SOCIALS.map((s) => (
            <span
              key={s.name}
              className="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#fe7f42] text-white"
            >
              {s.icon}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Music section (tabs + horizontal cards) -------------------------------

function MusicSection() {
  return (
    <div className="relative h-[244px] overflow-hidden bg-[#2a1617]">
      {/* Tabs */}
      <div className="absolute left-[26px] top-[17px] flex items-center gap-[30px] rounded-[19px] border border-[#fe7f42] bg-[#2a1617] p-[3px] drop-shadow-[0px_0px_1.65px_rgba(192,0,59,0.31)]">
        <span className="flex items-center justify-center rounded-[14px] bg-[#fe7f42] px-[30px] py-[7px] text-[14px] font-bold capitalize text-[#feedd5]">
          дуу
        </span>
        <span className="px-[30px] py-[7px] text-[14px] font-bold capitalize text-[rgba(254,223,194,0.3)]">
          Кино
        </span>
        <span className="px-[30px] py-[7px] text-[14px] font-bold capitalize text-[rgba(254,237,213,0.3)]">
          Ном
        </span>
      </div>
      {/* Cards */}
      <div className="no-scrollbar absolute left-[29px] top-[92px] flex gap-[7px] overflow-x-auto pr-[29px]">
        {[img.album1, img.album2, img.album3, img.album1, img.album2].map((a, i) => (
          <MusicBar key={i} album={a} />
        ))}
      </div>
    </div>
  );
}

function MusicBar({ album }: { album: string }) {
  return (
    <div className="flex h-[112px] w-[230px] shrink-0 items-center rounded-[14px] bg-[#fe7f42] py-[5px] pl-[5px] pr-[4px] drop-shadow-[0px_0px_2.85px_white]">
      <img
        src={album}
        alt=""
        className="h-[102px] w-[102px] shrink-0 rounded-[10px] object-cover"
      />
      <div className="relative h-[102px] w-[114px] shrink-0 pl-[5px]">
        <div className="flex flex-col gap-[9px] pt-[6px]">
          <div>
            <p className="text-[14px] font-bold leading-[16px] tracking-[-0.7px] text-[#feedd5]">
              Espresso
            </p>
            <p className="font-extralight text-[8px] tracking-[-0.16px] text-[#fff0e6]">
              Sabrina Carpenter
            </p>
          </div>
          <p className="w-[104px] text-[10px] font-light leading-[11px] tracking-[-0.2px] text-[#feedd5]">
            “This song lives in my head rent-free”
          </p>
        </div>
        {/* waveform */}
        <div className="absolute bottom-[13px] left-[0px] flex items-center gap-px">
          {WAVE.map((h, i) => (
            <span
              key={i}
              className="w-px rounded-[2px]"
              style={{ height: h, background: i < 8 ? "#feedd5" : "rgba(254,237,213,0.2)" }}
            />
          ))}
        </div>
        {/* Сонсох button */}
        <span className="absolute bottom-[8px] right-[1px] flex h-[20px] items-center gap-1 rounded-[10px] bg-[#feedd5] px-[6px] text-[12px] font-semibold capitalize tracking-[-0.48px] text-[#fe7f42]">
          сонсох<span className="text-[8px]">↗</span>
        </span>
      </div>
    </div>
  );
}

const WAVE = [3, 7, 9, 7, 13, 7, 3, 13, 7, 3, 7, 9, 7, 3, 7, 9, 7, 13, 9, 7, 3].map(
  (n) => `${n}px`,
);

// --- Section title (the "After" font → Montserrat Alternates 800) ----------

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="font-extrabold text-[20px] uppercase leading-[16px] tracking-[-0.4px] text-white">
      {children}
    </p>
  );
}

// --- Top Picks -------------------------------------------------------------

const TOP_PICKS = [
  { image: img.cosy, title: "cosy club ulaanbaatar", note: "хуучин ажилладаг байсан болохоор recommend хийнээ", source: "shoppy.mn" },
  { image: img.sony, title: "sony wch-520", note: "ягаан өнгөтэй нь бүр хөөрхөн", source: "shoppy.mn" },
  { image: img.mongolz, title: "mongolz hoodie erkhii mergen", note: "material n aygui dajgui za, oversized bolgoj umssun ch huurhun", source: "shoppy.mn" },
  { image: img.toki, title: "toki хоол хүргэлт", note: "хоол хүргэлт нь аягүй хурдан, найрсаг 100%", source: "shoppy.mn" },
  { image: img.breakfast, title: "өглөөний хоол самартай", note: "өглөөний цай идэж чаддаггүй надад лав гоё байдагаа", source: "shoppy.mn" },
];

function TopPicks() {
  return (
    <div className="flex flex-col gap-[18px] border-b-[0.5px] border-[#323232] bg-[#2a1617] py-[20px] pl-[10px]">
      <SectionTitle>TOP PICKS</SectionTitle>
      <div className="no-scrollbar flex items-center gap-[8px] overflow-x-auto pr-[10px]">
        {TOP_PICKS.map((p, i) => (
          <TopPickCard key={i} {...p} />
        ))}
      </div>
    </div>
  );
}

function TopPickCard({ image, title, note, source }: (typeof TOP_PICKS)[number]) {
  return (
    <div className="flex h-[319px] w-[168px] shrink-0 items-start rounded-[14px] bg-[#b22c20] px-[10px] py-[12px]">
      <div className="flex w-[149px] flex-col gap-[26px]">
        <div className="flex flex-col gap-[8px]">
          <img
            src={image}
            alt={title}
            className="aspect-square w-full rounded-[10px] object-cover shadow-[0px_1px_4.4px_0px_rgba(0,0,0,0.25)]"
          />
          <div className="flex flex-col gap-[8px] text-white">
            <p className="min-h-[26px] text-[14px] font-bold uppercase leading-[13px]">
              {title}
            </p>
            <p className="min-h-[48px] font-light text-[14px] leading-[12px] tracking-[-0.28px]">
              {note}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-[32px] gap-y-1">
          <span className="flex w-[58px] items-center justify-center rounded-[10px] bg-black px-[8px] py-[4px] text-[14px] font-semibold capitalize tracking-[-0.56px] text-white">
            үзэх<span className="ml-0.5 text-[9px]">↗</span>
          </span>
          <Toggle />
          <span className="flex items-center gap-1 text-[8px] font-light tracking-[-0.16px] text-white">
            <span className="h-[6px] w-[6px] rounded-full bg-white" />
            {source}
          </span>
        </div>
      </div>
    </div>
  );
}

/** The on/off pill toggle (Group 481763, ~46×22). */
function Toggle() {
  return (
    <span className="flex h-[22px] w-[46px] items-center rounded-full bg-black/40 p-[2px]">
      <span className="ml-auto h-[18px] w-[18px] rounded-full bg-white" />
    </span>
  );
}

// --- My Picks (bento) ------------------------------------------------------

function MyPicks() {
  return (
    <div className="flex flex-col gap-[18px] bg-[#2a1617] px-[10px] py-[20px]">
      <SectionTitle>MY PICKS</SectionTitle>
      <div className="grid h-[254px] grid-cols-2 gap-x-[6px] gap-y-[12px]">
        {/* Left tall orange */}
        <div className="relative row-span-2 overflow-hidden rounded-[11px] bg-[#fc7f45]">
          <p className="absolute left-[11px] top-[16px] font-semibold text-[14px] leading-[16px] tracking-[-0.28px] text-white">
            Миний дахин дахин
            <br />
            ашиглах...
          </p>
          <p className="absolute bottom-[14px] left-[13px] text-[14px] leading-[12px] tracking-[-0.28px] text-white/80">
            12 picks
          </p>
          <img src={img.bento1} alt="" className="absolute left-[2px] top-[92px] h-[100px] w-[100px] -rotate-[17deg] rounded-[20px] object-cover shadow-[0_4px_4px_rgba(0,0,0,0.25)]" />
          <img src={img.bento2} alt="" className="absolute left-[80px] top-[96px] h-[100px] w-[100px] rotate-[7deg] rounded-[20px] object-cover shadow-[0_4px_4px_rgba(0,0,0,0.25)]" />
        </div>
        {/* Top-right yellow */}
        <div className="relative overflow-hidden rounded-[11px] bg-[#fffc9b]">
          <p className="absolute left-[13px] top-[9px] font-semibold text-[14px] leading-[16px] tracking-[-0.28px] text-black">
            20к-аас доош favorite
          </p>
          <p className="absolute bottom-[10px] left-[13px] text-[14px] leading-[12px] tracking-[-0.28px] text-black">
            14 picks
          </p>
          <span className="absolute bottom-[8px] right-[14px] text-[30px] font-extrabold leading-none text-black">
            $$
          </span>
        </div>
        {/* Bottom-right red */}
        <div className="relative overflow-hidden rounded-[11px] bg-[#b22c20]">
          <p className="absolute left-[13px] top-[10px] font-semibold text-[14px] leading-[16px] tracking-[-0.28px] text-black">
            TEMU HAUL ХИЙХ ҮҮ?
          </p>
          <p className="absolute bottom-[10px] left-[15px] text-[14px] leading-[12px] tracking-[-0.28px] text-white">
            14 picks
          </p>
          <img src={img.bento3} alt="" className="absolute bottom-[8px] right-[42px] h-[54px] w-[54px] -rotate-[14deg] rounded-[16px] object-cover shadow-[0_4px_4px_rgba(0,0,0,0.25)]" />
          <img src={img.bento4} alt="" className="absolute bottom-[6px] right-[6px] h-[54px] w-[54px] rotate-[6deg] rounded-[16px] object-cover shadow-[0_4px_4px_rgba(0,0,0,0.25)]" />
        </div>
      </div>
    </div>
  );
}

// --- Wishlist --------------------------------------------------------------

const WISHLIST = [
  { image: img.bento1, title: "OSMO POCKET 3 CREATOR COMBO", note: "Хувцас хунар бүх юман дээр хэвлэж хастл хиймээр бн money2", source: "amazon.com" },
  { image: img.bento2, title: "DUAL MONITOR ARM", note: "Ширээгээ цоолоод энийг нэммээр байна Далайй", source: "temu.com" },
  { image: img.bento3, title: "mongolz jersey erkhii mergen", note: "Энийг л авчихмаар л байгаамдаа", source: "mongolz.shop" },
];

function Wishlist() {
  return (
    <div className="flex flex-col gap-[18px] bg-[#2a1617] py-[20px] pl-[10px]">
      <SectionTitle>WISHLIST</SectionTitle>
      <div className="no-scrollbar flex gap-[8px] overflow-x-auto pr-[10px]">
        {WISHLIST.map((w, i) => (
          <div key={i} className="flex h-[144px] w-[314px] shrink-0 items-start gap-[3px] rounded-[14px] bg-[#b22c20] p-[10px]">
            <img src={w.image} alt="" className="h-[120px] w-[120px] shrink-0 rounded-[12px] object-cover" />
            <div className="relative flex h-full flex-1 flex-col pl-[12px]">
              <p className="text-[14px] font-bold uppercase leading-[13px] text-white">
                {w.title}
              </p>
              <p className="mt-[11px] font-light text-[13px] leading-[12px] tracking-[-0.28px] text-white/95">
                {w.note}
              </p>
              <div className="mt-auto flex items-center gap-[10px]">
                <span className="flex items-center justify-center rounded-[10px] bg-black px-[8px] py-[4px] text-[14px] font-semibold capitalize tracking-[-0.56px] text-white">
                  үзэх<span className="ml-0.5 text-[9px]">↗</span>
                </span>
                <Toggle />
              </div>
              <span className="mt-[6px] flex items-center gap-1 text-[8px] font-light tracking-[-0.16px] text-white">
                <span className="h-[6px] w-[6px] rounded-full bg-white" />
                {w.source}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Not for me ------------------------------------------------------------

const NOT_FOR_ME = [
  { image: img.cosy, title: "tomn toms cafe niche", note: "Тэр кофе нтр нь одоо юувээ шороо юм уу хаашаа юм эввв" },
  { image: img.toki, title: "кимбаб чонгүг", note: "Жоомтой хоол идмээр байвал очоорой ххэ" },
  { image: img.breakfast, title: "moms touch", note: "дандаа түлэгдсэн тахиа өгдөг гэж сонссон." },
  { image: img.mongolz, title: "ubcab", note: "аймар хэл амтай жолооч нартай, жоохон аймар" },
];

function NotForMe() {
  return (
    <div className="flex flex-col gap-[18px] bg-[#2a1617] py-[20px] pl-[10px]">
      <SectionTitle>NOT FOR ME</SectionTitle>
      <div className="no-scrollbar flex gap-[8px] overflow-x-auto pr-[10px]">
        {NOT_FOR_ME.map((n, i) => (
          <div key={i} className="flex h-[278px] w-[224px] shrink-0 flex-col">
            <div className="px-[20px] pt-[20px]">
              <p className="text-[14px] font-bold uppercase leading-[13px] text-white">
                {n.title}
              </p>
              <p className="mt-[18px] font-light text-[14px] leading-[12px] tracking-[-0.28px] text-white/85">
                {n.note}
              </p>
            </div>
            <div className="relative mt-auto ml-[10px] h-[143px] w-[206px] overflow-hidden rounded-[12px]">
              <img src={n.image} alt="" className="h-full w-full object-cover grayscale-[35%]" />
              <span className="absolute bottom-[8px] left-[7px] flex items-center justify-center rounded-[10px] bg-black/80 px-[8px] py-[3px] text-[13px] font-semibold capitalize tracking-[-0.5px] text-white">
                үзэх<span className="ml-0.5 text-[8px]">↗</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Q&A -------------------------------------------------------------------

function Qna() {
  return (
    <div className="flex flex-col gap-[18px] bg-[#2a1617] py-[20px] pl-[12px]">
      <SectionTitle>Ask Me Anything!</SectionTitle>
      <div className="no-scrollbar flex gap-[16px] overflow-x-auto pr-[12px]">
        {/* Q input card */}
        <div className="flex h-[222px] w-[171px] shrink-0 flex-col rounded-[16px] bg-white p-[12px]">
          <span className="w-fit rounded-full bg-[#fe7f42] px-[10px] py-[3px] text-[12px] font-bold text-white">
            Q&amp;A
          </span>
          <p className="mt-3 text-[13px] text-black/35">Асуулт үлдээх</p>
        </div>
        {/* Question cards */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="relative flex h-[222px] w-[166px] shrink-0 flex-col overflow-hidden rounded-[16px] bg-[#fe7f42] p-[14px]"
          >
            <Sparkle />
            <p className="mt-[8px] text-[14px] font-semibold text-white">Асуулт</p>
            <p className="mt-[6px] font-light text-[15px] italic leading-[1.05] text-white">
              “Ямар тонер хэрэглэдэг вэ? Хаанаас авсан бэ?”
            </p>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-[8px] text-white/80">2 өдрийн өмнө</span>
              <span className="rounded-[4px] bg-white/15 px-[7px] py-px text-[8px] text-white">
                Pinned
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Similar creators ------------------------------------------------------

const SIMILAR = [
  { handle: "bilguundalai_n", bio: "END BI BIOGOO BICHNE DAHIAD BICHNE BI", bg: "#4b4b4b" },
  { handle: "fsky_anuri", bio: "end bi biogoo bichne dahiad bichne", bg: "#d02c53" },
  { handle: "temuge_G", bio: "END BI BIOGOO BICHNE DAHIAD BICHNE BI", bg: "#6b4bcc" },
];

function Similar() {
  return (
    <div className="bg-[#2a1617] p-[10px]">
      <div className="overflow-hidden rounded-[16px] bg-[#1c0f0f] p-[15px]">
        <div className="no-scrollbar flex gap-[8px] overflow-x-auto">
          {SIMILAR.map((c) => (
            <div
              key={c.handle}
              className="flex h-[210px] w-[160px] shrink-0 flex-col items-center rounded-[16px] pt-[14px]"
              style={{ background: c.bg }}
            >
              <div className="h-[88px] w-[88px] overflow-hidden rounded-full bg-black/30">
                <img src={img.avatar} alt="" className="h-full w-full object-cover" />
              </div>
              <p className="mt-[11px] text-[14px] font-semibold text-white">{c.handle}</p>
              <p className="mt-[5px] w-[132px] px-1 text-center font-light text-[10px] uppercase leading-[16px] text-white/85">
                {c.bio}
              </p>
              <span className="mt-auto mb-[12px] rounded-[8px] bg-black/25 px-[14px] py-[4px] text-[13px] font-semibold uppercase text-white">
                pICKLY ҮЗЭХ
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Bottom nav ------------------------------------------------------------

function BottomNav() {
  const items = [
    { label: "Нүүр", icon: <IcoHome />, active: true },
    { label: "Discover", icon: <IcoCompass />, active: false },
    { label: "Saved", icon: <IcoBookmark />, active: false },
    { label: "Профайл", icon: <IcoUser />, active: false },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 flex h-[86px] items-start bg-[#0b1014] px-[5px] py-[10px]">
      <div className="flex h-[68px] w-full items-center rounded-[23px] border-[1.111px] border-white/[0.13] bg-[rgba(4,4,4,0.94)] p-px shadow-[0px_3px_16px_0px_rgba(176,24,61,0.1)]">
        {items.map((it) => (
          <div
            key={it.label}
            className="relative flex flex-1 flex-col items-center justify-center gap-[3px]"
          >
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
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Icons -----------------------------------------------------------------

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

// --- Social glyphs (orange circles) ----------------------------------------

const SOCIALS = [
  { name: "facebook", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.5l.4-3h-2.9V8.2c0-.9.3-1.5 1.6-1.5H16.5V4.1C16.2 4 15.2 4 14.1 4c-2.3 0-3.9 1.4-3.9 4v2.9H7.6v3h2.6v8h3.3Z" /></svg> },
  { name: "instagram", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg> },
  { name: "tiktok", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.4 2.2 1.9 3.6 4 3.9v2.8c-1.5 0-2.9-.4-4-1.2v6.4c0 3.4-2.5 5.7-5.6 5.7-2.9 0-5.4-2.2-5.4-5.4 0-3.1 2.5-5.4 5.6-5.4.4 0 .8 0 1.2.1v2.9a2.6 2.6 0 1 0 1.5 2.4V3h2.7Z" /></svg> },
  { name: "x", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L21.5 21h-5.9l-4.2-5.4L6.5 21H3.4l7-8L2.9 3h6l3.8 5 4.8-5Zm-1 16h1.6L8.1 4.7H6.3L16.5 19Z" /></svg> },
  { name: "linkedin", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6.9 8.5H4V21h2.9V8.5ZM5.4 4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM21 21h-2.9v-6.5c0-1.6-.6-2.5-1.9-2.5-1 0-1.6.7-1.9 1.4V21H11.5V8.5h2.8v1.6c.5-.9 1.6-1.6 3-1.6 2.2 0 3.7 1.4 3.7 4.3V21Z" /></svg> },
  { name: "youtube", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8.2a2.6 2.6 0 0 0-1.8-1.8C18.5 6 12 6 12 6s-6.5 0-8.2.4A2.6 2.6 0 0 0 2 8.2 27 27 0 0 0 1.6 12 27 27 0 0 0 2 15.8a2.6 2.6 0 0 0 1.8 1.8C5.5 18 12 18 12 18s6.5 0 8.2-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22.4 12 27 27 0 0 0 22 8.2ZM10 15V9l5 3-5 3Z" /></svg> },
];
