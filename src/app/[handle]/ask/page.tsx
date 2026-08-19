import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/data/public-profile";
import { getTheme, themeStyle } from "@/lib/themes";
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
  // Two independent switches: the ADMIN flag (staff turned Ask off for this
  // creator) and the creator's own askEnabled toggle. Either one closes the
  // page — otherwise hiding the section on /[handle] would still leave this
  // URL reachable by anyone who guessed it.
  if (!data || !data.flags.ask || !data.profile.askEnabled) notFound();

  const { profile } = data;
  const prompt = profile.askPrompt ?? "Асуух зүйл байна уу?";
  const theme = getTheme(profile.theme);

  return (
    // This is the creator's page, so it wears the creator's palette — the same
    // tokens the profile renders with, resolved server-side.
    <div
      className="min-h-dvh bg-[var(--t-bg)] sm:bg-neutral-800 sm:py-8"
      style={themeStyle(profile.theme)}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `html,body{background-color:${theme.tokens.bg};overscroll-behavior-y:none}`,
        }}
      />
      <div className="relative mx-auto flex min-h-dvh w-full flex-col overflow-x-clip bg-[var(--t-bg)] font-malt sm:min-h-0 sm:max-w-[402px] sm:shadow-[0_0_80px_rgba(0,0,0,0.4)]">
        <div className="flex h-[54px] items-center gap-2 px-[10px]">
          <Link
            href={`/${profile.handle}`}
            className="flex items-center gap-1.5 font-inter text-[13px] font-semibold text-[var(--t-muted)] transition-opacity active:opacity-70"
          >
            <span aria-hidden>←</span> @{profile.handle}
          </Link>
        </div>

        <div className="flex flex-col gap-[18px] px-[16px] pb-10 pt-[6px]">
          <div className="flex flex-col gap-[8px]">
            <p className="font-malt text-[20px] font-extrabold uppercase leading-[22px] tracking-[-0.4px] text-[var(--t-accent)]">
              {profile.displayName}-д асуулт илгээх
            </p>
            <p className="font-inter text-[14px] leading-[18px] tracking-[-0.28px] text-[var(--t-text)]">
              Нэр нууц. Хэн асуусныг {profile.displayName} харахгүй.
            </p>
          </div>

          <AskForm handle={profile.handle} prompt={prompt} />
        </div>
      </div>
    </div>
  );
}
