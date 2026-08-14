import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./review-detail-skeleton.module.css";

const TAB_SLOTS = ["a", "b", "c", "d", "e", "f", "g"] as const;
const ROW_SLOTS = ["a", "b", "c", "d"] as const;

export default function ReviewDetailSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.root}>
        <Skeleton shape="line" width="half" size="lg" />
        <div className={styles.tabs}>
          {TAB_SLOTS.map(slot => <Skeleton key={slot} shape="block" width="narrow" size="md" />)}
        </div>
        <Card as="section">
          <CardHeader level="h2" title={<Skeleton shape="line" width="narrow" />} />
          <CardBody>
            {ROW_SLOTS.map(slot => <Skeleton key={slot} shape="block" size="lg" />)}
          </CardBody>
        </Card>
      </div>
    </SkeletonRegion>
  );
}
