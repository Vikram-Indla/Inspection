import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/saqeel/skeleton/skeleton";

export default function StatusSkeleton({ label }: { label: string }) {
  return (
    <ShellPageFrame>
      <SkeletonRegion label={label}>
        <Skeleton shape="line" size="xl" width="half" />
        <SkeletonText lines={1} width="wide" />
        <Skeleton shape="block" width="full" />
        <Skeleton shape="line" width="narrow" />
        <Skeleton shape="block" width="full" />
      </SkeletonRegion>
    </ShellPageFrame>
  );
}
