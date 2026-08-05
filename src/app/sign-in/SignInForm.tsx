"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label, TextInput, Hint } from "@/components/ui/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignInForm({
  next,
  initialError,
}: {
  next?: string;
  initialError?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    initialError ? "error" : "idle",
  );
  const [message, setMessage] = useState(
    initialError ? "Холбоос хүчингүй байна. Дахин оролдоно уу." : "",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("sending");
    const supabase = createSupabaseBrowserClient();
    const params = new URLSearchParams();
    if (next) params.set("next", next);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?${params.toString()}`,
      },
    });
    if (error) {
      setState("error");
      setMessage("Илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
    } else {
      setState("sent");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-3xl bg-shelf p-6 text-center">
        <p className="font-display text-[17px] font-bold text-ink">
          Имэйлээ шалгана уу
        </p>
        <p className="mt-2 font-body text-[14px] leading-relaxed text-ink/70">
          <span className="font-medium">{email}</span> хаяг руу нэвтрэх холбоос
          илгээлээ. Холбоос дээр дарж үргэлжлүүлээрэй.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">Имэйл хаяг</Label>
        <TextInput
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="chi@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {state === "error" ? (
          <Hint>
            <span className="text-berry">{message}</span>
          </Hint>
        ) : (
          <Hint>Нэг удаагийн нэвтрэх холбоос имэйлээр очно.</Hint>
        )}
      </div>
      <Button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Илгээж байна…" : "Нэвтрэх холбоос авах"}
      </Button>
    </form>
  );
}
