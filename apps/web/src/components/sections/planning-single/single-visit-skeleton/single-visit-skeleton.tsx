import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./single-visit-skeleton.module.css";

export default function SingleVisitSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.stack}>
        <Card as="div">
          <CardHeader
            eyebrow={<Skeleton shape="line" width="tiny" size="sm" />}
            title={<Skeleton shape="line" width="narrow" size="lg" />}
          />
          <CardBody gap="tight">
            <Skeleton shape="line" width="half" size="sm" />
            <Skeleton shape="line" width="full" size="xl" />
            <span className={styles.prompt}>
              <Skeleton shape="line" width="narrow" size="md" />
              <Skeleton shape="line" width="wide" size="sm" />
            </span>
          </CardBody>
        </Card>
      </div>
    </SkeletonRegion>
  );
}
