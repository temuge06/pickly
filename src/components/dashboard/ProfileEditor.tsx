"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label, TextArea, TextInput } from "@/components/ui/Field";
import { updateProfile } from "@/lib/actions/profile";
import { DashSection } from "./Section";

type Profile = {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  accentColor: string | null;
  socials: Record<string, string> | null;
};

export function ProfileEditor({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateProfile, null);
  const socials = profile.socials ?? {};

  return (
    <DashSection
      label="Профайл"
      action={
        <Button
          variant="quiet"
          className="!min-h-[36px] !px-2 !text-marigold"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Хаах" : "Засах"}
        </Button>
      }
    >
      {!open ? (
        <div className="rounded-2xl bg-paper/[0.05] px-4 py-3">
          <p className="font-body text-[14px] text-paper">{profile.displayName}</p>
          {profile.bio ? (
            <p className="mt-0.5 font-body text-[13px] text-paper/60">
              {profile.bio}
            </p>
          ) : null}
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-3 rounded-2xl bg-paper/[0.04] p-4">
          <div>
            <Label htmlFor="displayName">Харагдах нэр</Label>
            <TextInput
              id="displayName"
              name="displayName"
              defaultValue={profile.displayName}
              required
            />
          </div>
          <div>
            <Label htmlFor="bio">Танилцуулга</Label>
            <TextArea
              id="bio"
              name="bio"
              rows={2}
              maxLength={160}
              defaultValue={profile.bio ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="avatarUrl">Зургийн холбоос</Label>
            <TextInput
              id="avatarUrl"
              name="avatarUrl"
              type="url"
              defaultValue={profile.avatarUrl ?? ""}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <TextInput name="instagram" placeholder="Instagram" defaultValue={socials.instagram ?? ""} />
            <TextInput name="tiktok" placeholder="TikTok" defaultValue={socials.tiktok ?? ""} />
            <TextInput name="youtube" placeholder="YouTube" defaultValue={socials.youtube ?? ""} />
          </div>
          <input type="hidden" name="accentColor" value={profile.accentColor ?? ""} />
          {state?.error ? (
            <p className="font-body text-[13px] text-berry">{state.error}</p>
          ) : null}
          {state?.ok ? (
            <p className="font-body text-[13px] text-jade">Хадгаллаа.</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Хадгалж байна…" : "Хадгалах"}
          </Button>
        </form>
      )}
    </DashSection>
  );
}
