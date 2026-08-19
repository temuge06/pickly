import { Bar, PanelSkeleton } from "@/components/admin/Skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Bar w="200px" h={22} />
        <Bar w="280px" h={13} />
      </div>
      <PanelSkeleton rows={6} />
    </div>
  );
}
