import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, AuthHeader } from "@/components/auth/AuthShell";
import { dashboardEnabled } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";
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
      <AuthShell>
        <AuthHeader
          title="Тавтай морил"
          subtitle="Нэвтрэх хэсэг идэвхжээгүй байна. Supabase тохируулсны дараа энд нэвтэрнэ."
        />
        <p className="text-center font-inter text-[13.5px] text-[#feedd5]/50">
          Одоогоор нийтийн профайлыг{" "}
          <Link href="/sarnai" className="text-[#fe7f42] underline">
            /sarnai
          </Link>{" "}
          дээр үзэж болно.
        </p>
      </AuthShell>
    );
  }

  // Already signed in → let the dashboard route decide onboarding vs home.
  const user = await getSessionUser();
  if (user) redirect(next ?? "/dashboard");

  return (
    <AuthShell>
      <AuthHeader
        title="Тавтай морил"
        subtitle="Имэйл, нууц үгээрээ шууд нэвтэрч эсвэл бүртгүүлээрэй."
      />
      <SignInForm next={next} initialError={error} />
    </AuthShell>
  );
}
