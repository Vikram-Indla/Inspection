import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/saqeel/skeleton/skeleton";
import { RULE_TYPES } from "@/app/(app)/admin/planning/expiry/types";
import styles from "./expiry-skeleton.module.css";

const ROWS_PER_SECTION = [3, 2, 2, 3] as const;

export default function ExpirySkeleton({ label }: { label: string }) {
  return (
    <ShellPageFrame>
      <SkeletonRegion label={label}>
        <div className={styles.head}>
          <Skeleton shape="line" size="xl" width="half" />
          <SkeletonText lines={1} width="wide" />
        </div>

        {RULE_TYPES.map((ruleType, index) => (
          <div className={styles.card} key={ruleType}>
            <Skeleton shape="line" width="narrow" />
            <Skeleton shape="line" size="sm" width="wide" />
            {Array.from({ length: ROWS_PER_SECTION[index] ?? 2 }, (_, row) => (
              <Skeleton key={row} shape="block" width="full" />
            ))}
          </div>
        ))}
      </SkeletonRegion>
    </ShellPageFrame>
  );
}
