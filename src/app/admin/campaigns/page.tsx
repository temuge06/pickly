import Link from "next/link";
import { CampaignLibrary } from "@/components/admin/CampaignLibrary";
import { Panel } from "@/components/admin/ui";
import { listCampaigns } from "@/lib/actions/campaigns";

export const dynamic = "force-dynamic";

/** Campaign library. Authorization is the /admin layout's job. */
export default async function CampaignsPage() {
  const campaigns = await listCampaigns();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="shrink-0 rounded-[10px] border border-white/[0.08] px-2.5 py-2 font-malt text-[12px] font-bold text-white/45 transition-colors hover:text-white/80"
        >
          ←
        </Link>
        <div>
          <h1 className="font-malt text-[22px] font-extrabold tracking-[-0.4px] text-white">
            Кампанит ажил
          </h1>
          <p className="mt-1 font-inter text-[13px] text-white/40">
            Top Picks хэсэгт харагдах баннерууд.
          </p>
        </div>
      </div>
      <Panel title="Сан">
        <CampaignLibrary campaigns={campaigns} />
      </Panel>
    </div>
  );
}
