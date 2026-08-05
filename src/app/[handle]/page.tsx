import { notFound } from "next/navigation";
import { LapisMusic } from "@/components/lapis/LapisMusic";
import {
  LapisAsk,
  LapisBottomNav,
  LapisHeader,
  LapisLinks,
  LapisSimilar,
  LapisStatusBar,
  LapisTopPicks,
} from "@/components/lapis/sections";
import { getOtherCreators, getPublicProfile } from "@/lib/data/public-profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await getPublicProfile(handle);
  if (!data) notFound();

  const { profile, picks, tracks, films, books, links, askMessages } = data;
  const creators = await getOtherCreators(profile.id);

  return (
    <div className="min-h-dvh bg-neutral-800 sm:py-8">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[402px] flex-col overflow-x-clip bg-[#2a1617] font-malt shadow-[0_0_80px_rgba(0,0,0,0.4)] sm:min-h-0">
        <div className="flex-1">
          <LapisStatusBar />
          <LapisHeader profile={profile} />
          <LapisMusic tracks={tracks} films={films} books={books} />
          <LapisTopPicks picks={picks} />
          <LapisLinks links={links} />
          <LapisAsk
            handle={profile.handle}
            askEnabled={profile.askEnabled}
            questions={askMessages}
          />
          <LapisSimilar creators={creators} />
        </div>
        <LapisBottomNav />
      </div>
    </div>
  );
}
