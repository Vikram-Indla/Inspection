import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./reviews-skeleton.module.css";

const FILTER_SLOTS = ["search", "status", "risk", "overdue"] as const;
const ROW_SLOTS = ["a", "b", "c", "d", "e"] as const;

/**
 * Mirrors the real screen's geometry: one card, a filter row, then the table.
 * A skeleton that does not match what replaces it is a second layout the reader
 * has to re-parse the moment the data lands (WEB-006 §5).
 */
export default function ReviewsSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.root}>
        <Card as="section">
          <CardHeader level="h2" title={<Skeleton shape="line" width="narrow" />} />
          <CardBody>
            <div className={styles.filters}>
              {FILTER_SLOTS.map(slot => <Skeleton key={slot} shape="block" width="narrow" size="md" />)}
            </div>
            <div className={styles.rows}>
              {ROW_SLOTS.map(slot => <Skeleton key={slot} shape="block" size="lg" />)}
            </div>
          </CardBody>
        </Card>
      </div>
    </SkeletonRegion>
  );
}
