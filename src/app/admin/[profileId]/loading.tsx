import { HeaderSkeleton, PanelSkeleton } from "@/components/admin/Skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <HeaderSkeleton />
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <PanelSkeleton rows={2} />
        <div className="flex flex-col gap-5">
          <PanelSkeleton rows={5} />
          <PanelSkeleton rows={2} />
        </div>
      </div>
    </div>
  );
}
