import type { activityItem } from "@/db/schema";
import { MusicCard } from "./MusicCard";
import { SpotlySection } from "./SpotlySection";

type Track = typeof activityItem.$inferSelect;

/**
 * ДУУ, ХӨГЖИМ (music) shelf — spotly design language, Figma 391:693/734.
 * Watermark "СОНСЛОО", header (🎵 ДУУ, ХӨГЖИМ), horizontal row of music cards.
 * The per-song quote in the design is a creator note not present in synced
 * track data, so it renders only when a note exists (meta.note).
 */
export function MusicShelf({ tracks }: { tracks: Track[] }) {
  if (tracks.length === 0) return null;

  return (
    <SpotlySection watermark="СОНСЛОО" icon="🎵" title="ДУУ, ХӨГЖИМ">
      <div className="no-scrollbar flex snap-x scroll-pl-[20px] gap-[16px] overflow-x-auto px-[20px] pt-[18px]">
        {tracks.map((track) => (
          <MusicCard
            key={track.id}
            title={track.title}
            artist={track.subtitle}
            albumUrl={track.imageUrl}
            quote={(track.meta as { note?: string })?.note ?? null}
          />
        ))}
      </div>
    </SpotlySection>
  );
}
