"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label, TextInput, Hint } from "@/components/ui/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || state === "sending") return;
    setError("");
    setState("sending");

    const supabase = createSupabaseBrowserClient();
    // Land directly on /reset-password. The browser client there detects the
    // recovery token in the URL (either the #fragment or ?code form) and
    // establishes the recovery session client-side.
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (err) {
      setError("Илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
      setState("idle");
      return;
    }
    // Always show success (don't reveal whether the email is registered).
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="rounded-3xl bg-shelf p-6 text-center">
        <p className="font-display text-[17px] font-bold text-paper">
          Имэйлээ шалгана уу
        </p>
        <p className="mt-2 font-body text-[14px] leading-relaxed text-paper/70">
          Хэрэв <span className="font-medium">{email}</span> хаяг бүртгэлтэй бол
          нууц үг сэргээх холбоос очлоо. Холбоос дээр дарж шинэ нууц үгээ
          оруулаарай.
        </p>
        <Link
          href="/sign-in"
          className="mt-4 inline-block font-body text-[13.5px] font-medium text-marigold underline"
        >
          Нэвтрэх рүү буцах
        </Link>
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
        {error ? (
          <Hint>
            <span className="text-berry">{error}</span>
          </Hint>
        ) : (
          <Hint>Бүртгэлтэй хаяг руу сэргээх холбоос илгээнэ.</Hint>
        )}
      </div>
      <Button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Илгээж байна…" : "Сэргээх холбоос авах"}
      </Button>
      <Link
        href="/sign-in"
        className="text-center font-body text-[13.5px] font-medium text-paper/60 underline"
      >
        Нэвтрэх рүү буцах
      </Link>
    </form>
  );
}
