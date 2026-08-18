import { asc } from "drizzle-orm";
import { CreatorSearch } from "@/components/admin/CreatorSearch";
import { Panel } from "@/components/admin/ui";
import { getDb } from "@/db";
import { profile } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * Staff landing: pick a creator to work on. Authorization is the layout's job
 * (and the middleware's before it) — by the time this renders, the caller is
 * known staff.
 */
export default async function AdminHomePage() {
  const db = getDb();
  const initial = await db
    .select({
      id: profile.id,
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    })
    .from(profile)
    .orderBy(asc(profile.handle))
    .limit(20);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-malt text-[22px] font-extrabold tracking-[-0.4px] text-white">
          Бүтээгчид
        </h1>
        <p className="mt-1 font-inter text-[13px] text-white/40">
          Бүтээгч сонгоод бараа нэмэх, эсвэл хэсгүүдийг асаах/унтраах.
        </p>
      </div>
      <Panel title="Хайх">
        <CreatorSearch initial={initial} />
      </Panel>
    </div>
  );
}
