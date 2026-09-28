"use client";

import { useState } from "react";
import { LButton, LInput, LLabel, Hint } from "@/components/dashboard/lapis/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function StaffLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || busy) return;
    setError("");
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInErr) {
        setError("Имэйл эсвэл нууц үг буруу байна.");
        setBusy(false);
        return;
      }
      // Same URL, now with a session: middleware lets staff through, and a
      // non-staff account lands back on this form.
      window.location.reload();
    } catch {
      setError("Алдаа гарлаа. Дахин оролдоно уу.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <LLabel htmlFor="email">Нэвтрэх нэр</LLabel>
        <LInput
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          placeholder="name@admin.com"
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
          autoComplete="current-password"
          required
          placeholder="••••••"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
        />
        {error ? (
          <Hint>
            <span className="text-[#ff9a8a]">{error}</span>
          </Hint>
        ) : null}
      </div>
      <LButton type="submit" loading={busy} className="w-full">
        Нэвтрэх
      </LButton>
    </form>
  );
}
