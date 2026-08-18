import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";
import { dashboardEnabled } from "@/lib/env";

export const metadata = { title: "Staff — Pickly" };
export const dynamic = "force-dynamic";

/**
 * The /admin access boundary, enforced a second time.
 *
 * Middleware already turns a non-staff request away before it reaches here, and
 * RLS refuses the writes underneath. This layout is the third, in-process
 * check: it runs on the server for every page in the segment, so no /admin page
 * can be authored that forgets to authorize itself, and no rendered output —
 * not even the shell — is produced for a non-staff account.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!dashboardEnabled) redirect("/sign-in");
  const admin = await getAdminUser();
  if (!admin) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-[#0f1115] text-[#e8eaed]">
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0f1115]/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-3.5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="font-inter text-[15px] font-bold text-white">Pickly</span>
            <span className="rounded-[6px] bg-[#fe7f42]/15 px-2 py-0.5 font-malt text-[11px] font-black uppercase tracking-wide text-[#fe7f42]">
              Staff
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex min-h-[38px] items-center rounded-[10px] px-3 font-malt text-[12.5px] font-semibold text-white/45 transition-colors hover:text-white/80"
            >
              Миний профайл
            </Link>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="flex min-h-[38px] items-center rounded-[10px] px-3 font-malt text-[12.5px] font-semibold text-white/45 transition-colors hover:text-white/80"
              >
                Гарах
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-6">{children}</main>
    </div>
  );
}
