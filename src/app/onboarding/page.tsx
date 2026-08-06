import { redirect } from "next/navigation";
import { AuthShell, AuthHeader } from "@/components/auth/AuthShell";
import { dashboardEnabled } from "@/lib/env";
import { getCurrentProfile, getSessionUser } from "@/lib/auth/session";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = { title: "Эхлэх — Pickly" };

export default async function OnboardingPage() {
  if (!dashboardEnabled) redirect("/sign-in");

  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  // Already onboarded → dashboard.
  const existing = await getCurrentProfile();
  if (existing) redirect("/dashboard");

  return (
    <AuthShell>
      <AuthHeader
        title="Хуудсаа үүсгэе"
        subtitle="Дараа нь бүгдийг өөрчилж болно. Одоо цөөн зүйл л хэрэгтэй."
      />
      <OnboardingForm />
    </AuthShell>
  );
}
