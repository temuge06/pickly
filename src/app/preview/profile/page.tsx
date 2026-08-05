import { notFound } from "next/navigation";
import { AskShelf } from "@/components/spotly/AskShelf";
import { BookShelf } from "@/components/spotly/BookShelf";
import { MovieShelf } from "@/components/spotly/MovieShelf";
import { MusicShelf } from "@/components/spotly/MusicShelf";
import { getPublicProfile } from "@/lib/data/public-profile";

export const metadata = { title: "Preview — spotly profile" };
export const dynamic = "force-dynamic";

/**
 * Full spotly-language profile replica (Figma frame 391-680), rendered against
 * real seed data (@sarnai) on the design's light theme at the 390px frame
 * width. Section order matches the frame: Кино, ДУУ/ХӨГЖИМ, НОМ/СОНИН, Асуулт.
 */
export default async function SpotlyProfilePreview() {
  const data = await getPublicProfile("sarnai");
  if (!data) notFound();

  return (
    <div className="min-h-dvh bg-neutral-300 py-8">
      <div className="mx-auto flex w-[390px] flex-col gap-[28px] bg-spotly-bg pb-16 pt-4">
        <MovieShelf films={data.films} />
        <MusicShelf tracks={data.tracks} />
        <BookShelf books={data.books} />
        <AskShelf questions={data.askMessages} />
      </div>
    </div>
  );
}
