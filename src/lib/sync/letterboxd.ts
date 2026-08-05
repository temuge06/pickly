import { REALISTIC_UA } from "@/lib/extract/canonicalize";
import {
  type Connection,
  type NormalizedItem,
  type ProviderAdapter,
} from "./types";

/**
 * Letterboxd has no public API — parse the per-user RSS feed. Each entry is one
 * logged film with title, year, rating, poster, and watched date. A 404 means
 * the username is wrong/private; the runner surfaces that as status 'error'.
 */
export class FeedNotFoundError extends Error {}

export const letterboxdAdapter: ProviderAdapter = {
  provider: "letterboxd",

  async sync(conn: Connection): Promise<NormalizedItem[]> {
    const username = conn.externalUsername?.trim();
    if (!username) throw new FeedNotFoundError("No Letterboxd username set.");

    const url = `https://letterboxd.com/${encodeURIComponent(username)}/rss/`;
    const res = await fetch(url, {
      headers: { "User-Agent": REALISTIC_UA, Accept: "application/rss+xml" },
    });
    if (res.status === 404) {
      throw new FeedNotFoundError(
        `Letterboxd "${username}" олдсонгүй. Хэрэглэгчийн нэрээ шалгана уу.`,
      );
    }
    if (!res.ok) throw new Error(`Letterboxd RSS failed: ${res.status}`);

    const xml = await res.text();
    return parseLetterboxdRss(xml);
  },
};

export function parseLetterboxdRss(xml: string): NormalizedItem[] {
  const items: NormalizedItem[] = [];
  const entries = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  for (const entry of entries) {
    const block = entry[1]!;
    const filmTitle = tag(block, "letterboxd:filmTitle");
    const filmYear = tag(block, "letterboxd:filmYear");
    const rating = tag(block, "letterboxd:memberRating");
    const watchedDate = tag(block, "letterboxd:watchedDate");
    const linkUrl = tag(block, "link");
    const guid = tag(block, "guid") ?? linkUrl ?? filmTitle ?? "";
    const pubDate = tag(block, "pubDate");
    const description = tag(block, "description") ?? "";

    // Only entries that are actually films (diary/review). Lists/other have no
    // filmTitle.
    if (!filmTitle) continue;

    const poster = firstImgSrc(description);
    const occurredAt = watchedDate
      ? new Date(`${watchedDate}T12:00:00Z`)
      : pubDate
        ? new Date(pubDate)
        : new Date();

    items.push({
      provider: "letterboxd",
      kind: "film",
      externalId: guid,
      title: filmTitle,
      subtitle: filmYear ?? null,
      imageUrl: poster,
      externalUrl: linkUrl ?? null,
      occurredAt,
      meta: rating ? { rating: Number.parseFloat(rating) } : {},
    });
  }
  return items;
}

function tag(block: string, name: string): string | null {
  const re = new RegExp(
    `<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${name}>`,
    "i",
  );
  const m = block.match(re);
  return m?.[1]?.trim() || null;
}

function firstImgSrc(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] ?? null;
}
