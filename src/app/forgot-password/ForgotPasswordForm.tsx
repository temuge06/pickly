"use client";

import Link from "next/link";
import { useState } from "react";
import { LButton, LInput, LLabel, Hint } from "@/components/dashboard/lapis/ui";
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
    // Land directly on /reset-password. The browser client there establishes
    // the recovery session from the token in the URL.
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (err) {
      setError("Илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
      setState("idle");
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="rounded-[18px] bg-white/[0.05] p-6 text-center">
        <p className="font-malt text-[17px] font-extrabold text-white">
          Имэйлээ шалгана уу
        </p>
        <p className="mt-2 font-inter text-[14px] leading-relaxed text-[#feedd5]/70">
          Хэрэв <span className="font-medium text-[#feedd5]">{email}</span> хаяг
          бүртгэлтэй бол нууц үг сэргээх холбоос очлоо.
        </p>
        <Link
          href="/sign-in"
          className="mt-4 inline-block font-malt text-[13.5px] font-medium text-[#fe7f42] underline"
        >
          Нэвтрэх рүү буцах
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <LLabel htmlFor="email">Имэйл хаяг</LLabel>
        <LInput
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
            <span className="text-[#ff9a8a]">{error}</span>
          </Hint>
        ) : (
          <Hint>Бүртгэлтэй хаяг руу сэргээх холбоос илгээнэ.</Hint>
        )}
      </div>
      <LButton type="submit" loading={state === "sending"} className="w-full">
        Сэргээх холбоос авах
      </LButton>
      <Link
        href="/sign-in"
        className="text-center font-malt text-[13px] font-medium text-[#feedd5]/55 underline"
      >
        Нэвтрэх рүү буцах
      </Link>
    </form>
  );
}
