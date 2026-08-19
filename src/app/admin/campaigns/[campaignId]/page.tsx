import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignAssign } from "@/components/admin/CampaignAssign";
import { CampaignForm } from "@/components/admin/CampaignForm";
import { Panel } from "@/components/admin/ui";
import { getDb } from "@/db";
import { campaign } from "@/db/schema";
import { listCampaignCreators } from "@/lib/actions/campaigns";

export const dynamic = "force-dynamic";

/** Campaign detail: edit the creative, and run it across creators. */
export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const rows = await getDb()
    .select()
    .from(campaign)
    .where(eq(campaign.id, campaignId))
    .limit(1);
  const c = rows[0];
  if (!c) notFound();

  const assigned = await listCampaignCreators(c.id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/campaigns"
          className="shrink-0 rounded-[10px] border border-white/[0.08] px-2.5 py-2 font-malt text-[12px] font-bold text-white/45 transition-colors hover:text-white/80"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-malt text-[20px] font-extrabold tracking-[-0.3px] text-white">
            {c.title}
          </h1>
          <p className="font-inter text-[13px] text-white/40">
            {c.isActive ? "Идэвхтэй" : "Зогссон"} · {assigned.length} профайл
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Panel title="Кампанит ажил" subtitle="Баннер, холбоос, доорх бичиг.">
          <CampaignForm
            existing={{
              id: c.id,
              title: c.title,
              bannerImageUrl: c.bannerImageUrl,
              destinationUrl: c.destinationUrl,
              advertiserLabel: c.advertiserLabel,
            }}
          />
        </Panel>

        <Panel
          title="Профайлууд"
          subtitle="Нэг баннерыг олон профайл дээр нэг дор нэмж болно."
        >
          <CampaignAssign campaignId={c.id} assigned={assigned} />
        </Panel>
      </div>
    </div>
  );
}
