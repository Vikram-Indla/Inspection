import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/saqeel/skeleton/skeleton";
import styles from "./localization-skeleton.module.css";

const GAUGES = ["coverage", "reviewed", "risk"] as const;
const FILTERS = ["all", "missing", "draft", "reviewed", "orphaned"] as const;
const ROWS = ["one", "two", "three", "four", "five"] as const;

export default function LocalizationSkeleton({ label }: { label: string }) {
  return (
    <ShellPageFrame>
      <SkeletonRegion label={label}>
        <div className={styles.head}>
          <Skeleton shape="line" width="narrow" />
          <Skeleton shape="line" size="xl" width="half" />
          <Skeleton shape="line" width="wide" />
        </div>

        <div className={styles.gauges}>
          {GAUGES.map(key => (
            <div className={styles.gauge} key={key}>
              <Skeleton shape="circle" size="xl" />
              <div className={styles.gaugeText}>
                <Skeleton shape="line" size="sm" width="half" />
                <Skeleton shape="line" size="sm" width="wide" />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.filters}>
          {FILTERS.map(key => <Skeleton key={key} shape="line" width="tiny" />)}
        </div>

        <div className={styles.card}>
          <Skeleton shape="line" width="narrow" />
          {ROWS.map(key => (
            <div className={styles.row} key={key}>
              <SkeletonText lines={2} width="wide" />
              <Skeleton shape="block" width="full" />
              <Skeleton shape="pill" width="tiny" />
            </div>
          ))}
        </div>
      </SkeletonRegion>
    </ShellPageFrame>
  );
}
