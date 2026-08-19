import { PanelSkeleton } from "@/components/admin/Skeletons";
import { Bar } from "@/components/admin/Skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Bar w="180px" h={22} />
        <Bar w="320px" h={13} />
      </div>
      <PanelSkeleton rows={5} />
    </div>
  );
}
