import { redirect } from "next/navigation";
import { Canvas } from "@/components/ui/Canvas";
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
    <Canvas className="flex flex-col justify-center px-6">
      <div className="mb-7">
        <h1 className="font-display text-[24px] font-bold text-paper">
          Хуудсаа үүсгэе
        </h1>
        <p className="mt-2 font-body text-[14.5px] leading-relaxed text-paper/70">
          Дараа нь бүгдийг өөрчилж болно. Одоо гурван зүйл л хэрэгтэй.
        </p>
      </div>
      <OnboardingForm />
    </Canvas>
  );
}
