import { AuthShell, AuthHeader } from "@/components/auth/AuthShell";
import { StaffLoginForm } from "./StaffLoginForm";

export const metadata = { title: "Staff — LinkSpot", robots: { index: false } };

/**
 * The staff sign-in form. Visitors never see this URL: middleware rewrites any
 * /admin request that isn't from a staff session to here, so the address bar
 * keeps saying /admin and a successful sign-in just reloads that same page.
 *
 * Signing in only proves who you are. Whether you get in is still decided by
 * the admin_user row, checked in middleware, the admin layout and RLS.
 */
export default function StaffLoginPage() {
  return (
    <AuthShell>
      <AuthHeader title="Staff" subtitle="Админ хэсэгт нэвтрэх" />
      <StaffLoginForm />
    </AuthShell>
  );
}
