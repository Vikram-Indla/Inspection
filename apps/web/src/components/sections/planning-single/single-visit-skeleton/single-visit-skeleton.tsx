import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./single-visit-skeleton.module.css";

const RESULT_ROWS = 3;
const CONFIG_FIELDS = 6;

export default function SingleVisitSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.stack}>
        <Card as="div">
          <CardHeader title={<Skeleton shape="line" width="half" size="lg" />} />
          <CardBody gap="tight">
            <Skeleton shape="line" width="full" size="xl" />
            {Array.from({ length: RESULT_ROWS }, (_unused, row) => (
              <span className={styles.result} key={row}>
                <Skeleton shape="pill" width="tiny" />
                <span className={styles.resultBody}>
                  <Skeleton shape="line" width="wide" size="md" />
                  <Skeleton shape="line" width="half" size="sm" />
                </span>
                <Skeleton shape="pill" width="narrow" />
              </span>
            ))}
          </CardBody>
        </Card>

        <Card as="div">
          <CardHeader
            title={<Skeleton shape="line" width="half" size="lg" />}
            description={<Skeleton shape="line" width="wide" size="sm" />}
          />
          <CardBody gap="tight">
            <div className={styles.fields}>
              {Array.from({ length: CONFIG_FIELDS }, (_unused, field) => (
                <span className={styles.field} key={field}>
                  <Skeleton shape="line" width="narrow" size="sm" />
                  <Skeleton shape="line" width="full" size="xl" />
                </span>
              ))}
            </div>
            <Skeleton shape="line" width="full" size="xl" />
          </CardBody>
        </Card>

        <Card as="div">
          <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
          <CardBody gap="tight">
            {Array.from({ length: 4 }, (_unused, row) => (
              <Skeleton key={row} shape="line" width={row % 2 === 0 ? "wide" : "half"} size="sm" />
            ))}
            <Skeleton shape="pill" width="narrow" />
          </CardBody>
        </Card>
      </div>
    </SkeletonRegion>
  );
}
