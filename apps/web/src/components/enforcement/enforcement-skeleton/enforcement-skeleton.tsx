import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./enforcement-skeleton.module.css";

export default function EnforcementSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.toolbar}>
        <Skeleton shape="pill" width="narrow" />
        <Skeleton shape="pill" width="tiny" />
        <Skeleton shape="pill" width="tiny" />
        <Skeleton shape="pill" width="tiny" />
      </div>
      <Card as="div">
        <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
        <CardBody gap="tight">
          {Array.from({ length: 8 }, (_, index) => (
            <div className={styles.row} key={index}>
              <Skeleton shape="line" width="narrow" size="sm" />
              <Skeleton shape="line" width="full" size="sm" />
              <Skeleton shape="line" width="tiny" size="sm" />
            </div>
          ))}
        </CardBody>
      </Card>
    </SkeletonRegion>
  );
}
