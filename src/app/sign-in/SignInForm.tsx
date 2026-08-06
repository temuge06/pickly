"use client";

import Link from "next/link";
import { useState } from "react";
import { LButton, LInput, LLabel, Hint } from "@/components/dashboard/lapis/ui";
import { signUpInstant } from "@/lib/auth/password-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function SignInForm({
  next,
  initialError,
}: {
  next?: string;
  initialError?: string;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    initialError ? "Нэвтрэлт хүчингүй байна. Дахин оролдоно уу." : "",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || busy) return;
    setError("");
    setBusy(true);

    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === "signup") {
        const res = await signUpInstant(email, password);
        if ("error" in res) {
          setError(res.error);
          setBusy(false);
          return;
        }
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) {
          setError("Бүртгэл амжилттай. Дахин нэвтэрнэ үү.");
          setMode("signin");
          setBusy(false);
          return;
        }
        window.location.assign("/onboarding");
        return;
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) {
        setError("Имэйл эсвэл нууц үг буруу байна.");
        setBusy(false);
        return;
      }
      window.location.assign(next ?? "/dashboard");
    } catch {
      setError("Алдаа гарлаа. Дахин оролдоно уу.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex gap-1 rounded-[16px] bg-white/[0.06] p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`flex-1 rounded-[12px] py-2.5 font-malt text-[13.5px] font-bold transition-colors ${
              mode === m
                ? "bg-[#fe7f42] text-[#3a1310]"
                : "text-[#feedd5]/55"
            }`}
          >
            {m === "signin" ? "Нэвтрэх" : "Бүртгүүлэх"}
          </button>
        ))}
      </div>

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
          onChange={(ev) => setEmail(ev.target.value)}
        />
      </div>

      <div>
        <LLabel htmlFor="password">Нууц үг</LLabel>
        <LInput
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={6}
          placeholder="••••••"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
        />
        {error ? (
          <Hint>
            <span className="text-[#ff9a8a]">{error}</span>
          </Hint>
        ) : (
          <Hint>
            {mode === "signup"
              ? "Дор хаяж 6 тэмдэгт. Имэйл баталгаажуулах шаардлагагүй."
              : "Нэвтэрч ороод хуудсаа удирдаарай."}
          </Hint>
        )}
      </div>

      <LButton type="submit" loading={busy} className="w-full">
        {mode === "signup" ? "Бүртгүүлэх" : "Нэвтрэх"}
      </LButton>

      {mode === "signin" ? (
        <Link
          href="/forgot-password"
          className="text-center font-malt text-[13px] font-medium text-[#feedd5]/55 underline"
        >
          Нууц үг мартсан уу?
        </Link>
      ) : null}
    </form>
  );
}
