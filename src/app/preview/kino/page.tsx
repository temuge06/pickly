import { notFound } from "next/navigation";
import { MovieShelf } from "@/components/spotly/MovieShelf";
import { getPublicProfile } from "@/lib/data/public-profile";

export const metadata = { title: "Preview — Кино shelf" };
export const dynamic = "force-dynamic";

/**
 * Isolated preview of the spotly Кино shelf against real seed films (@sarnai),
 * on the design's light background at the 390px Figma frame width. This exists
 * so the section can be reviewed faithfully before deciding how the spotly
 * light theme integrates with the live (dark) profile page.
 */
export default async function KinoPreviewPage() {
  const data = await getPublicProfile("sarnai");
  if (!data) notFound();

  return (
    <div className="min-h-dvh bg-neutral-300 py-8">
      <div className="mx-auto w-[390px] bg-spotly-bg pb-10 pt-6">
        <MovieShelf films={data.films} />
      </div>
    </div>
  );
}
