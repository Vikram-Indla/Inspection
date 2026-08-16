import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/saqeel/skeleton/skeleton";
import styles from "./packages-skeleton.module.css";

const FILTERS = ["all", "published", "draft", "empty"] as const;
const CARDS = ["one", "two", "three"] as const;

export default function PackagesSkeleton({ label }: { label: string }) {
  return (
    <ShellPageFrame>
      <SkeletonRegion label={label}>
        <div className={styles.head}>
          <Skeleton shape="line" width="narrow" />
          <Skeleton shape="line" size="xl" width="half" />
          <Skeleton shape="line" width="wide" />
        </div>

        <div className={styles.filters}>
          {FILTERS.map(key => <Skeleton key={key} shape="line" width="tiny" />)}
        </div>

        {CARDS.map(key => (
          <div className={styles.card} key={key}>
            <Skeleton shape="line" width="half" />
            <SkeletonText lines={1} width="wide" />
            <Skeleton shape="block" width="full" />
          </div>
        ))}
      </SkeletonRegion>
    </ShellPageFrame>
  );
}
