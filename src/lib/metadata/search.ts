import { env } from "@/lib/env";

export type MediaResult = {
  externalId: string;
  title: string;
  subtitle: string | null; // year (films) / author (books)
  imageUrl: string | null;
  externalUrl: string | null;
};

/**
 * TMDB movie search. Returns [] when TMDB_API_KEY is absent (manual entry still
 * works). Never throws to the caller.
 */
export async function searchFilms(query: string): Promise<MediaResult[]> {
  if (!env.hasTmdb || !query.trim()) return [];
  try {
    const url = new URL("https://api.themoviedb.org/3/search/movie");
    url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
    url.searchParams.set("query", query);
    url.searchParams.set("include_adult", "false");
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      results: {
        id: number;
        title: string;
        release_date?: string;
        poster_path?: string | null;
      }[];
    };
    return json.results.slice(0, 12).map((r) => ({
      externalId: `tmdb:${r.id}`,
      title: r.title,
      subtitle: r.release_date ? r.release_date.slice(0, 4) : null,
      imageUrl: r.poster_path
        ? `https://image.tmdb.org/t/p/w342${r.poster_path}`
        : null,
      externalUrl: `https://www.themoviedb.org/movie/${r.id}`,
    }));
  } catch {
    return [];
  }
}

/**
 * Open Library book search — no key required. Covers from the covers CDN.
 */
export async function searchBooks(query: string): Promise<MediaResult[]> {
  if (!query.trim()) return [];
  try {
    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "12");
    url.searchParams.set(
      "fields",
      "key,title,author_name,first_publish_year,cover_i",
    );
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      docs: {
        key: string;
        title: string;
        author_name?: string[];
        cover_i?: number;
      }[];
    };
    return json.docs.slice(0, 12).map((d) => ({
      externalId: `openlibrary:${d.key}`,
      title: d.title,
      subtitle: d.author_name?.[0] ?? null,
      imageUrl: d.cover_i
        ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
        : null,
      externalUrl: `https://openlibrary.org${d.key}`,
    }));
  } catch {
    return [];
  }
}

/**
 * A song from the iTunes Search API. Extends MediaResult with the two fields
 * that only music carries: the 30s preview stream and the album it came from.
 */
export type MusicResult = MediaResult & {
  /** Numeric iTunes track id — the dedupe key for a manually-added song. */
  itunesTrackId: string;
  album: string | null;
  /** 30s AAC preview. Null on the small number of tracks Apple doesn't stream. */
  previewUrl: string | null;
};

type ItunesTrack = {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl?: string;
};

/**
 * iTunes Search song lookup — no key required, so music search works on every
 * deploy (unlike TMDB, which degrades to manual entry without one). Never
 * throws to the caller; a dead upstream is an empty result list.
 */
export async function searchMusic(query: string): Promise<MusicResult[]> {
  if (!query.trim()) return [];
  try {
    const url = new URL("https://itunes.apple.com/search");
    url.searchParams.set("term", query);
    url.searchParams.set("entity", "song");
    url.searchParams.set("limit", "10");
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = (await res.json()) as { results?: ItunesTrack[] };
    return (json.results ?? [])
      .filter((r): r is ItunesTrack & { trackId: number; trackName: string } =>
        typeof r.trackId === "number" && typeof r.trackName === "string",
      )
      .map((r) => ({
        externalId: `itunes:${r.trackId}`,
        itunesTrackId: String(r.trackId),
        title: r.trackName,
        subtitle: r.artistName ?? null,
        album: r.collectionName ?? null,
        // Apple serves artwork at whatever size the URL asks for. 100px is
        // what the API hands back and it's visibly soft on a 102px @2x disc.
        imageUrl: r.artworkUrl100?.replace(/\/100x100bb\.jpg$/, "/400x400bb.jpg") ?? null,
        previewUrl: r.previewUrl ?? null,
        externalUrl: r.trackViewUrl ?? null,
      }));
  } catch {
    return [];
  }
}
