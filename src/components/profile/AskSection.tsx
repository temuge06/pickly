import Link from "next/link";
import type { askMessage, profile } from "@/db/schema";

type AskMessage = typeof askMessage.$inferSelect;
type Profile = typeof profile.$inferSelect;

/**
 * Public Ask block. Shows the prompt + a link to the ask surface, plus any
 * published Q&As. Renders nothing about who asked — question text and answer
 * only. Hidden entirely when the creator disabled Ask.
 */
export function AskSection({
  profile,
  askMessages,
}: {
  profile: Profile;
  askMessages: AskMessage[];
}) {
  if (!profile.askEnabled) return null;
  const prompt = profile.askPrompt ?? "Асуух зүйл байна уу?";
  const published = askMessages.filter(
    (m) => m.isPublic && m.status === "answered",
  );

  return (
    <section className="px-4">
      <div className="relative">
        <div className="absolute -top-3 left-3 z-10 rounded-full bg-ink px-3 py-1.5">
          <span className="font-display text-[11px] font-bold uppercase tracking-wide text-shelf">
            Ask
          </span>
        </div>
        <div
          className="flex flex-col gap-3 rounded-[28px] bg-shelf px-4 pb-4 pt-8"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.55), 0 22px 34px -16px rgba(20,14,20,0.6)",
          }}
        >
          <Link
            href={`/${profile.handle}/ask`}
            className="flex min-h-[52px] items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3"
          >
            <span className="font-body text-[14.5px] font-medium text-shelf">
              {prompt}
            </span>
            <span className="shrink-0 rounded-full bg-marigold px-3 py-1.5 font-mono text-[11px] font-semibold text-ink">
              Асуух
            </span>
          </Link>

          {published.length > 0 ? (
            <div className="flex flex-col gap-2.5 pt-1">
              {published.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl bg-wall/[0.05] p-3.5"
                >
                  <p className="font-body text-[13.5px] font-medium leading-snug text-ink/75">
                    {m.body}
                  </p>
                  <p className="mt-1.5 border-l-2 border-marigold/60 pl-2.5 font-body text-[14px] leading-relaxed text-ink">
                    {m.answerBody}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
