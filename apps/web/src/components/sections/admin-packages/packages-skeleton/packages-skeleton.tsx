import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./packages-skeleton.module.css";

const FILTERS = ["all", "published", "draft", "empty"] as const;
const ROWS = ["one", "two", "three", "four", "five", "six"] as const;

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

        <div className={styles.toolbar}>
          <Skeleton shape="line" width="half" />
          <Skeleton shape="line" width="tiny" />
        </div>

        <div className={styles.card}>
          {ROWS.map(key => (
            <div className={styles.row} key={key}>
              <div className={styles.rowText}>
                <Skeleton shape="line" width="tiny" />
                <Skeleton shape="line" width="half" />
                <Skeleton shape="line" width="wide" />
              </div>
              <Skeleton shape="line" width="tiny" />
            </div>
          ))}
        </div>
      </SkeletonRegion>
    </ShellPageFrame>
  );
}
