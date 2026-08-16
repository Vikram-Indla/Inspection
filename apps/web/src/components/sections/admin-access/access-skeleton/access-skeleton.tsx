import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/saqeel/skeleton/skeleton";
import styles from "./access-skeleton.module.css";

const METRICS = ["accounts", "roles", "overrides"] as const;
const TABS = ["users", "roles", "review", "devices"] as const;
const ROWS = ["one", "two", "three", "four"] as const;

export default function AccessSkeleton({ label }: { label: string }) {
  return (
    <ShellPageFrame>
      <SkeletonRegion label={label}>
        <div className={styles.head}>
          <Skeleton shape="line" width="narrow" />
          <Skeleton shape="line" size="xl" width="half" />
          <Skeleton shape="line" width="wide" />
        </div>

        <div className={styles.metrics}>
          {METRICS.map(key => (
            <div className={styles.metric} key={key}>
              <Skeleton shape="line" size="sm" width="half" />
              <Skeleton shape="line" size="lg" width="narrow" />
              <Skeleton shape="line" size="sm" width="wide" />
            </div>
          ))}
        </div>

        <div className={styles.tabs}>
          {TABS.map(key => <Skeleton key={key} shape="line" width="tiny" />)}
        </div>

        <div className={styles.card}>
          <Skeleton shape="line" width="narrow" />
          <SkeletonText lines={1} width="wide" />
          {ROWS.map(key => <Skeleton key={key} shape="block" width="full" />)}
        </div>
      </SkeletonRegion>
    </ShellPageFrame>
  );
}
