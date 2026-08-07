"use client";

import Link from "next/link";
import { useState } from "react";
import { LButton, LInput, LLabel, Hint } from "@/components/dashboard/lapis/ui";
import { resetPasswordDemo } from "@/lib/auth/password-auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email) return;
    if (password.length < 6) {
      setError("Нууц үг дор хаяж 6 тэмдэгт байх ёстой.");
      return;
    }
    if (password !== confirm) {
      setError("Нууц үг таарахгүй байна.");
      return;
    }
    setError("");
    setBusy(true);

    const res = await resetPasswordDemo(email, password);
    if ("error" in res) {
      setError(res.error);
      setBusy(false);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-[18px] bg-white/[0.05] p-6 text-center">
        <p className="font-malt text-[17px] font-extrabold text-white">
          Нууц үг шинэчлэгдлээ
        </p>
        <p className="mt-2 font-inter text-[14px] leading-relaxed text-[#feedd5]/70">
          Шинэ нууц үгээрээ нэвтэрнэ үү.
        </p>
        <Link
          href="/sign-in"
          className="mt-4 inline-block rounded-[14px] bg-[#fe7f42] px-5 py-2.5 font-malt text-[14px] font-bold text-[#3a1310]"
        >
          Нэвтрэх
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
      </div>
      <div>
        <LLabel htmlFor="password">Шинэ нууц үг</LLabel>
        <LInput
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <LLabel htmlFor="confirm">Нууц үг давтах</LLabel>
        <LInput
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error ? (
          <Hint>
            <span className="text-[#ff9a8a]">{error}</span>
          </Hint>
        ) : (
          <Hint>Имэйлээ оруулаад шинэ нууц үгээ тохируулна уу.</Hint>
        )}
      </div>
      <LButton type="submit" loading={busy} className="w-full">
        Нууц үг шинэчлэх
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
