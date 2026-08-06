import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { dashboardEnabled } from "@/lib/env";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Шинэ нууц үг — Pickly" };

export default function ResetPasswordPage() {
  if (!dashboardEnabled) redirect("/sign-in");

  // The recovery session is established client-side from the token in the URL,
  // so the form itself decides whether the link is valid.
  return (
    <AuthShell>
      <p className="mb-6 text-center font-malt text-[15px] font-extrabold text-[#fe7f42]">
        Pickly
      </p>
      <ResetPasswordForm />
    </AuthShell>
  );
}
