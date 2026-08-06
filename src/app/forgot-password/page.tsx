import { redirect } from "next/navigation";
import { AuthShell, AuthHeader } from "@/components/auth/AuthShell";
import { dashboardEnabled } from "@/lib/env";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = { title: "Нууц үг мартсан — Pickly" };

export default function ForgotPasswordPage() {
  if (!dashboardEnabled) redirect("/sign-in");

  return (
    <AuthShell>
      <AuthHeader
        title="Нууц үгээ мартсан уу?"
        subtitle="Имэйл хаягаа оруулбал сэргээх холбоос илгээнэ."
      />
      <ForgotPasswordForm />
    </AuthShell>
  );
}
