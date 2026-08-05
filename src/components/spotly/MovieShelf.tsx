import type { activityItem } from "@/db/schema";
import { MoviePosterCard } from "./MoviePosterCard";
import { SpotlySection } from "./SpotlySection";

type Film = typeof activityItem.$inferSelect;

/**
 * Кино (movie) shelf — spotly design language, Figma frame 391-680.
 * Watermark "ҮЗЛЭЭ", header (💬 Кино), then a horizontal scroll-snap row of
 * poster cards with a 14px gap (391:820). 20px side gutter matches the header.
 */
export function MovieShelf({ films }: { films: Film[] }) {
  if (films.length === 0) return null;

  return (
    <SpotlySection watermark="ҮЗЛЭЭ" icon="💬" title="Кино">
      <div className="no-scrollbar flex snap-x scroll-pl-[20px] gap-[14px] overflow-x-auto px-[20px]">
        {films.map((film) => {
          const rating =
            typeof (film.meta as { rating?: number })?.rating === "number"
              ? (film.meta as { rating: number }).rating
              : null;
          return (
            <MoviePosterCard
              key={film.id}
              title={film.title}
              rating={rating}
              posterUrl={film.imageUrl}
            />
          );
        })}
      </div>
    </SpotlySection>
  );
}
