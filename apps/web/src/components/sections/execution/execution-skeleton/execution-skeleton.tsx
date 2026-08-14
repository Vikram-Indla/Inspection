import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./execution-skeleton.module.css";

const DAY_SLOTS = ["a", "b", "c", "d", "e", "f", "g"] as const;
const FILTER_SLOTS = ["a", "b", "c", "d", "e"] as const;
const ROW_SLOTS = ["a", "b", "c", "d", "e", "f"] as const;

export default function ExecutionSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.root}>
        <div className={styles.head}>
          <Skeleton shape="line" width="narrow" size="lg" />
          <Skeleton shape="pill" width="tiny" />
        </div>

        <section className={styles.calendar}>
          <Skeleton shape="line" width="half" size="sm" />
          <div className={styles.days}>
            {DAY_SLOTS.map(slot => <Skeleton key={slot} shape="block" size="lg" />)}
          </div>
        </section>

        <div className={styles.filters}>
          <Skeleton shape="pill" width="half" />
          {FILTER_SLOTS.map(slot => <Skeleton key={slot} shape="pill" width="tiny" />)}
        </div>

        <div className={styles.table}>
          {ROW_SLOTS.map(slot => <Skeleton key={slot} shape="line" width="full" />)}
        </div>
      </div>
    </SkeletonRegion>
  );
}
