"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFollow } from "@/lib/actions/follow";

/**
 * The profile's Follow control.
 *
 * It was a bare `<button>` with no handler — it rendered, it depressed, and it
 * did nothing. Now it writes a `follow` row, which is what fills the follower's
 * notification bell.
 *
 * Signed-out visitors get the same button; tapping it sends them to sign-in
 * with a `next` back to this profile, rather than hiding the affordance or
 * failing silently.
 */
export function FollowButton({
  handle,
  initialFollowing,
  isAuthed,
}: {
  handle: string;
  initialFollowing: boolean;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!isAuthed) {
      router.push(`/sign-in?next=${encodeURIComponent(`/${handle}`)}`);
      return;
    }
    const previous = following;
    setFollowing(!previous); // optimistic — the tap has to feel instant
    setError(null);
    start(async () => {
      const res = await toggleFollow(handle);
      if (res.error) {
        setFollowing(previous);
        if (res.error === "NOT_AUTHENTICATED") {
          router.push(`/sign-in?next=${encodeURIComponent(`/${handle}`)}`);
          return;
        }
        setError(res.error);
        return;
      }
      setFollowing(res.following);
    });
  }

  return (
    <span className="relative inline-flex flex-col">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={following}
        disabled={pending}
        className="flex h-[32px] w-[123px] items-center justify-center gap-1.5 rounded-[6px] font-inter text-[14px] font-semibold tracking-[-0.28px] transition-opacity disabled:opacity-70"
        style={
          following
            ? {
                // Following is the quieter state: an outline, so the filled
                // button always means "there is something to do here".
                background: "transparent",
                color: "var(--t-accent)",
                boxShadow: "inset 0 0 0 1.5px var(--t-accent)",
              }
            : { background: "var(--t-btn)", color: "var(--t-on-btn)" }
        }
      >
        {following ? (
          <>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
            Дагаж байна
          </>
        ) : (
          "Follow"
        )}
      </button>
      {error ? (
        <span className="absolute top-[34px] whitespace-nowrap font-inter text-[11px] text-[var(--t-accent)]">
          {error}
        </span>
      ) : null}
    </span>
  );
}
