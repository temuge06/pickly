import { notFound } from "next/navigation";
import Link from "next/link";
import { Canvas } from "@/components/ui/Canvas";
import { getPublicProfile } from "@/lib/data/public-profile";
import { AskForm } from "./AskForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return { title: `Ask @${handle} — Pickly` };
}

export default async function AskPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await getPublicProfile(handle);
  // Feature off / no profile → 404, so the surface never hints at existence.
  if (!data || !data.profile.askEnabled) notFound();

  const { profile } = data;
  const prompt = profile.askPrompt ?? "Асуух зүйл байна уу?";

  return (
    <Canvas className="flex flex-col px-6 pt-12">
      <Link
        href={`/${profile.handle}`}
        className="mb-8 inline-flex items-center gap-1 font-mono text-[12px] text-paper/50"
      >
        ← @{profile.handle}
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-[22px] font-bold leading-tight text-paper">
          {profile.displayName}-д асуулт илгээх
        </h1>
        <p className="mt-2 font-body text-[14.5px] leading-relaxed text-paper/70">
          Нэр нууц. Хэн асуусныг {profile.displayName} харахгүй.
        </p>
      </div>

      <AskForm handle={profile.handle} prompt={prompt} />
    </Canvas>
  );
}
