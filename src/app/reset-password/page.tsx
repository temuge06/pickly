import { redirect } from "next/navigation";
import { Canvas } from "@/components/ui/Canvas";
import { dashboardEnabled } from "@/lib/env";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Шинэ нууц үг — Pickly" };

export default function ResetPasswordPage() {
  if (!dashboardEnabled) redirect("/sign-in");

  // The recovery session is established client-side from the token in the URL,
  // so the form itself decides whether the link is valid.
  return (
    <Canvas className="flex flex-col justify-center px-6">
      <ResetPasswordForm />
    </Canvas>
  );
}
