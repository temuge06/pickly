/* eslint-disable @next/next/no-img-element */
import { and, asc, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAddProduct } from "@/components/admin/AdminAddProduct";
import { AdminCollections } from "@/components/admin/AdminCollections";
import { AdminPromos } from "@/components/admin/AdminPromos";
import { CreatorCampaigns } from "@/components/admin/CreatorCampaigns";
import { AdminFeatureFlags } from "@/components/admin/AdminFeatureFlags";
import { Panel } from "@/components/admin/ui";
import { getDb } from "@/db";
import { askMessage, campaign, campaignAssignment, collection, pick, profile, wishlistItem } from "@/db/schema";
import { listCampaigns } from "@/lib/actions/campaigns";
import { listPromos } from "@/lib/actions/promos";
import { getFeatureFlags } from "@/lib/data/features";
import { formatMnt } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Per-creator staff view: add products (Panel A) and flip sections (Panel B). */
export default async function AdminCreatorPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const db = getDb();

  const rows = await db
    .select()
    .from(profile)
    .where(eq(profile.id, profileId))
    .limit(1);
  const creator = rows[0];
  if (!creator) notFound();

  const [collections, picks, wishlist, flagged, flags] = await Promise.all([
    db
      .select()
      .from(collection)
      .where(eq(collection.profileId, creator.id))
      .orderBy(asc(collection.position)),
    db
      .select()
      .from(pick)
      .where(eq(pick.profileId, creator.id))
      .orderBy(asc(pick.position)),
    db
      .select()
      .from(wishlistItem)
      .where(eq(wishlistItem.profileId, creator.id))
      .orderBy(asc(wishlistItem.position)),
    // The question → pick queue: messages this creator marked product-related.
    db
      .select()
      .from(askMessage)
      .where(
        and(
          eq(askMessage.profileId, creator.id),
          eq(askMessage.flaggedForPick, true),
        ),
      )
      .orderBy(desc(askMessage.answeredAt)),
    getFeatureFlags(creator.id),
  ]);

  const [assignedCampaigns, campaignLibrary] = await Promise.all([
    db
      .select({
        assignmentId: campaignAssignment.id,
        campaignId: campaign.id,
        title: campaign.title,
        bannerImageUrl: campaign.bannerImageUrl,
        isActive: campaign.isActive,
      })
      .from(campaignAssignment)
      .innerJoin(campaign, eq(campaign.id, campaignAssignment.campaignId))
      .where(
        and(
          eq(campaignAssignment.profileId, creator.id),
          eq(campaignAssignment.isActive, true),
        ),
      )
      .orderBy(asc(campaignAssignment.position)),
    listCampaigns(),
  ]);

  const promos = await listPromos(creator.id);

  const notForMe = picks.filter((p) => p.status === "wont_rebuy");
  const keep = picks.filter((p) => p.status !== "wont_rebuy");
  const topPicks = keep.filter((p) => p.collectionId === null);
  const inCollections = keep.filter((p) => p.collectionId !== null);

  return (
    <div className="flex flex-col gap-5">
      {/* Creator header */}
      <div className="flex items-center gap-3.5">
        <Link
          href="/admin"
          className="shrink-0 rounded-[10px] border border-white/[0.08] px-2.5 py-2 font-malt text-[12px] font-bold text-white/45 transition-colors hover:text-white/80"
        >
          ←
        </Link>
        {creator.avatarUrl ? (
          <img src={creator.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fe7f42]/15 font-inter text-[18px] font-semibold text-[#fe7f42]">
            {creator.displayName.trim().charAt(0).toUpperCase() || "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-malt text-[19px] font-extrabold tracking-[-0.3px] text-white">
            {creator.displayName}
          </h1>
          <p className="truncate font-inter text-[13px] text-white/40">@{creator.handle}</p>
        </div>
        <Link
          href={`/${creator.handle}`}
          target="_blank"
          className="shrink-0 rounded-[10px] bg-[#fe7f42]/12 px-3 py-2 font-malt text-[12px] font-bold text-[#fe7f42] transition-colors hover:bg-[#fe7f42]/20"
        >
          Профайл ↗
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Panel
          title="Бараа нэмэх"
          subtitle={`Холбоос тавихад мэдээлэл автоматаар татна. Бараа @${creator.handle}-ийн профайл дээр очно.`}
        >
          <AdminAddProduct
            profileId={creator.id}
            handle={creator.handle}
            collections={collections.map((c) => ({ id: c.id, title: c.title }))}
          />
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel
            title="Хэсгүүд"
            subtitle="Асаах/унтраахад шууд хадгалагдана. Бичлэг байхгүй бол асаалттай гэж үзнэ."
          >
            <AdminFeatureFlags profileId={creator.id} initial={flags} />
          </Panel>

          <Panel
            title="Top Picks баннер"
            subtitle="Энэ профайлын Top Picks хэсэгт ямар кампанит ажил ажиллаж байна."
          >
            <CreatorCampaigns
              profileId={creator.id}
              assigned={assignedCampaigns}
              library={campaignLibrary}
            />
          </Panel>

          <Panel
            title="Промо код"
            subtitle="Зураг, код, сайтын холбоос. Copy дарахад код хуулагдаад сайт нээгдэнэ."
          >
            <AdminPromos profileId={creator.id} promos={promos} />
          </Panel>

          <Panel
            title="Цуглуулга"
            subtitle="My Picks хэсгийн хайрцгууд. Бүтээгч өөрөө үүсгэхээ больсон тул эндээс удирдана."
          >
            <AdminCollections
              profileId={creator.id}
              collections={collections.map((c) => ({ id: c.id, title: c.title }))}
            />
          </Panel>
        </div>
      </div>

      {/* Question → pick queue (creators flag these; they can no longer create
          picks themselves). */}
      {flagged.length > 0 ? (
        <Panel
          title={`Ask-аас ирсэн хүсэлт (${flagged.length})`}
          subtitle="Бүтээгч эдгээр асуултыг «барааны асуулт» гэж тэмдэглэсэн байна."
        >
          <ul className="flex flex-col gap-2">
            {flagged.map((m) => (
              <li
                key={m.id}
                className="rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-3.5 py-3"
              >
                <p className="font-inter text-[13.5px] leading-relaxed text-white/85">{m.body}</p>
                {m.answerBody ? (
                  <p className="mt-1.5 border-l-2 border-[#fe7f42]/40 pl-2.5 font-inter text-[12.5px] leading-relaxed text-white/45">
                    {m.answerBody}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {/* Read-only inventory, so staff can see what's already there before
          adding a duplicate. */}
      <Panel title="Одоо байгаа" subtitle="Зөвхөн харах.">
        <div className="grid gap-5 sm:grid-cols-2">
          <ProductList label="Top Picks" items={topPicks} />
          <ProductList label="My Picks" items={inCollections} />
          <ProductList label="Wishlist" items={wishlist} />
          <ProductList label="Not For Me" items={notForMe} />
        </div>
      </Panel>
    </div>
  );
}

type Row = { id: string; title: string; imageUrl: string | null; priceMnt: number | null };

function ProductList({ label, items }: { label: string; items: Row[] }) {
  return (
    <div>
      <p className="mb-2 font-malt text-[11.5px] font-bold uppercase tracking-wide text-white/40">
        {label} · {items.length}
      </p>
      {items.length === 0 ? (
        <p className="font-inter text-[12.5px] text-white/25">Хоосон.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-2.5">
              <span className="h-8 w-8 shrink-0 overflow-hidden rounded-[7px] bg-white/[0.05]">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 truncate font-inter text-[13px] text-white/75">
                {p.title}
              </span>
              {p.priceMnt != null ? (
                <span className="shrink-0 font-inter text-[12px] text-white/35">
                  {formatMnt(p.priceMnt)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
