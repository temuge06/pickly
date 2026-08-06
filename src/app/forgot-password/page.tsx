import { redirect } from "next/navigation";
import { Canvas } from "@/components/ui/Canvas";
import { dashboardEnabled } from "@/lib/env";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = { title: "Нууц үг мартсан — Pickly" };

export default function ForgotPasswordPage() {
  if (!dashboardEnabled) redirect("/sign-in");

  return (
    <Canvas className="flex flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <h1 className="font-display text-[24px] font-bold text-paper">
          Нууц үгээ мартсан уу?
        </h1>
        <p className="mt-2 font-body text-[14.5px] leading-relaxed text-paper/70">
          Имэйл хаягаа оруулбал сэргээх холбоос илгээнэ.
        </p>
      </div>
      <ForgotPasswordForm />
    </Canvas>
  );
}
