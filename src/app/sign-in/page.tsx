import Link from "next/link";
import { Canvas } from "@/components/ui/Canvas";
import { dashboardEnabled } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Sign in — Pickly" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  if (!dashboardEnabled) {
    return (
      <Canvas className="flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-[22px] font-bold text-paper">Pickly</h1>
        <p className="mt-3 max-w-[300px] font-body text-[14.5px] leading-relaxed text-paper/70">
          Нэвтрэх хэсэг идэвхжээгүй байна. Supabase тохируулсны дараа энд
          нэвтэрнэ. Одоогоор нийтийн профайлыг{" "}
          <Link href="/sarnai" className="text-marigold underline">
            /sarnai
          </Link>{" "}
          дээр үзэж болно.
        </p>
      </Canvas>
    );
  }

  // Already signed in → let the dashboard route decide onboarding vs home.
  const user = await getSessionUser();
  if (user) redirect(next ?? "/dashboard");

  return (
    <Canvas className="flex flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <h1 className="font-display text-[26px] font-bold text-paper">Pickly</h1>
        <p className="mt-2 font-body text-[14.5px] text-paper/70">
          Имэйл, нууц үгээрээ шууд нэвтэрч эсвэл бүртгүүлээрэй.
        </p>
      </div>
      <SignInForm next={next} initialError={error} />
    </Canvas>
  );
}
