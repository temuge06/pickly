"use client";

import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { updateProfile, type ProfileUpdateResult } from "@/lib/actions/profile";
import { LButton } from "./ui";

/**
 * One save for the whole profile screen.
 *
 * The Хадгалах button used to sit inside the Профайл card, halfway up a long
 * page, which read as "save this box" rather than "I'm done" — creators filled
 * in the sections below it and left without it ever being the last thing they
 * touched. The design review asked for the opposite: one button at the very
 * bottom, and landing on the public profile once it succeeds.
 *
 * That splits the form from its submit control across two subtrees, so the
 * action state lives here instead of in either of them. The button reaches the
 * form through `form={FORM_ID}` — a real HTML association, not a synthetic
 * click — which keeps every field in one <form> and avoids nesting one form
 * inside another (illegal, and the reason an earlier attempt at a second form
 * saved with a null displayName).
 */

const FORM_ID = "lapis-profile-form";

type Ctx = {
  /** Put this on the <form> the fields live in, and on any submit button. */
  formId: string;
  action: (payload: FormData) => void;
  state: ProfileUpdateResult | null;
  saving: boolean;
};

const ProfileSaveCtx = createContext<Ctx | null>(null);

export function useProfileSave(): Ctx {
  const ctx = useContext(ProfileSaveCtx);
  if (!ctx) throw new Error("useProfileSave outside <ProfileSaveProvider>");
  return ctx;
}

export function ProfileSaveProvider({
  handle,
  children,
}: {
  /** Where a successful save lands the creator: their own public page. */
  handle: string;
  children: ReactNode;
}) {
  const [state, action, saving] = useActionState(updateProfile, null);
  const router = useRouter();

  useEffect(() => {
    if (!state?.ok) return;
    // push, not replace: Back still returns to the editor, which is what a
    // creator who wants one more tweak expects.
    router.push(`/${handle}`);
  }, [state, handle, router]);

  return (
    <ProfileSaveCtx.Provider value={{ formId: FORM_ID, action, state, saving }}>
      {children}
    </ProfileSaveCtx.Provider>
  );
}

/**
 * The one submit control, rendered after the last section. Errors surface here
 * rather than beside the field that caused them — the offending field can be
 * several screens up, and a message the creator never scrolls back to is the
 * same as no message.
 */
export function ProfileSaveBar() {
  const { formId, state, saving } = useProfileSave();
  return (
    <div className="animate-fade-up flex flex-col gap-2 px-4 pt-1">
      {state?.error ? (
        <p className="font-malt text-[13px] text-[var(--t-danger)]">{state.error}</p>
      ) : null}
      <LButton type="submit" form={formId} loading={saving} className="w-full">
        {saving ? "Хадгалж байна…" : "Хадгалах"}
      </LButton>
    </div>
  );
}
