"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label, TextInput, Hint } from "@/components/ui/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Phase = "checking" | "ready" | "invalid";

export function ResetPasswordForm() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // On mount, establish the recovery session from the token in the URL. We
  // parse it explicitly rather than relying on the client's auto-detection,
  // which differs between the #fragment (implicit) and ?code (PKCE) forms.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    (async () => {
      try {
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : "";
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const code = new URLSearchParams(window.location.search).get("code");

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        // Strip the token from the address bar.
        window.history.replaceState(null, "", "/reset-password");

        const { data } = await supabase.auth.getSession();
        if (!cancelled) setPhase(data.session ? "ready" : "invalid");
      } catch {
        if (!cancelled) setPhase("invalid");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
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

    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError("Шинэчлэхэд алдаа гарлаа. Дахин оролдоно уу.");
      setBusy(false);
      return;
    }
    window.location.assign("/dashboard");
  }

  if (phase === "checking") {
    return (
      <p className="py-10 text-center font-body text-[14px] text-paper/60">
        Түр хүлээнэ үү…
      </p>
    );
  }

  if (phase === "invalid") {
    return (
      <div className="text-center">
        <h1 className="font-display text-[22px] font-bold text-paper">
          Холбоос хүчингүй байна
        </h1>
        <p className="mt-3 font-body text-[14.5px] leading-relaxed text-paper/70">
          Нууц үг сэргээх холбоосын хугацаа дууссан эсвэл ашиглагдсан байна. Дахин
          хүсэлт гаргана уу.
        </p>
        <Link
          href="/forgot-password"
          className="mt-5 inline-block font-body text-[14px] font-medium text-marigold underline"
        >
          Дахин сэргээх холбоос авах
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="font-display text-[24px] font-bold text-paper">
          Шинэ нууц үг
        </h1>
        <p className="mt-2 font-body text-[14.5px] leading-relaxed text-paper/70">
          Шинэ нууц үгээ оруулаад үргэлжлүүлээрэй.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="password">Шинэ нууц үг</Label>
          <TextInput
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
          <Hint>Дор хаяж 6 тэмдэгт.</Hint>
        </div>
        <div>
          <Label htmlFor="confirm">Нууц үг давтах</Label>
          <TextInput
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
              <span className="text-berry">{error}</span>
            </Hint>
          ) : null}
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Хадгалж байна…" : "Нууц үг шинэчлэх"}
        </Button>
      </form>
    </>
  );
}
