"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Hint, Label, TextInput } from "@/components/ui/Field";
import { completeOnboarding } from "@/lib/auth/onboarding";

export function OnboardingForm() {
  const [state, action, pending] = useActionState(completeOnboarding, null);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="handle">Хэрэглэгчийн нэр</Label>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[15px] text-paper/45">pickly.mn/</span>
          <TextInput
            id="handle"
            name="handle"
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            placeholder="sarnai"
            pattern="[a-z0-9_]+"
          />
        </div>
        <Hint>Жижиг үсэг, тоо, доогуур зураас (_). 3–24 тэмдэгт.</Hint>
      </div>

      <div>
        <Label htmlFor="displayName">Харагдах нэр</Label>
        <TextInput
          id="displayName"
          name="displayName"
          required
          placeholder="Сарнай Бат-Эрдэнэ"
        />
      </div>

      <div>
        <Label htmlFor="avatarUrl">Зургийн холбоос (заавал биш)</Label>
        <TextInput
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          inputMode="url"
          placeholder="https://…"
        />
        <Hint>Дараа нь профайлаасаа солиж болно.</Hint>
      </div>

      {state?.error ? (
        <p className="font-body text-[13.5px] text-berry">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Үүсгэж байна…" : "Хуудас үүсгэх"}
      </Button>
    </form>
  );
}
