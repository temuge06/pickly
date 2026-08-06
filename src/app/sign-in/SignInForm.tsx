"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label, TextInput, Hint } from "@/components/ui/Field";
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
        // Create the account (already confirmed), then sign in for a session.
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
        // New account → send straight to onboarding (handle + name).
        window.location.assign("/onboarding");
        return;
      }

      // Sign in.
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
      <div className="flex rounded-full bg-shelf p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`flex-1 rounded-full py-2 font-display text-[13.5px] font-bold transition-colors ${
              mode === m ? "bg-marigold text-ink" : "text-paper/60"
            }`}
          >
            {m === "signin" ? "Нэвтрэх" : "Бүртгүүлэх"}
          </button>
        ))}
      </div>

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
          onChange={(ev) => setEmail(ev.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="password">Нууц үг</Label>
        <TextInput
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
            <span className="text-berry">{error}</span>
          </Hint>
        ) : (
          <Hint>
            {mode === "signup"
              ? "Дор хаяж 6 тэмдэгт. Имэйл баталгаажуулах шаардлагагүй."
              : "Нэвтэрч ороод хуудсаа удирдаарай."}
          </Hint>
        )}
      </div>

      <Button type="submit" disabled={busy}>
        {busy
          ? "Түр хүлээнэ үү…"
          : mode === "signup"
            ? "Бүртгүүлэх"
            : "Нэвтрэх"}
      </Button>
    </form>
  );
}
