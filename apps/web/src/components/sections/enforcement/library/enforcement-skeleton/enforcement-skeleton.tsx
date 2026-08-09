import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./enforcement-skeleton.module.css";

const FILTERS = 4;
const ROWS = 8;
const COLUMNS = 9;

export default function EnforcementSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.stack}>
        <Card as="div">
          <CardHeader title={<Skeleton shape="line" width="half" size="lg" />} trailing={<Skeleton shape="pill" width="narrow" />} />
          <CardBody><Skeleton shape="line" width="full" size="sm" /></CardBody>
        </Card>

        <Card as="div">
          <CardHeader
            title={<Skeleton shape="line" width="half" size="lg" />}
            description={<Skeleton shape="line" width="narrow" size="sm" />}
          />
          <CardBody>
            <div className={styles.filters}>
              {Array.from({ length: FILTERS }, (_unused, index) => (
                <Skeleton key={index} shape="line" width="narrow" size="xl" />
              ))}
            </div>
            <div className={styles.rows}>
              {Array.from({ length: ROWS }, (_unused, row) => (
                <span className={styles.row} key={row}>
                  {Array.from({ length: COLUMNS }, (_ignored, column) => (
                    <Skeleton key={column} shape="line" width={column === 0 ? "wide" : "narrow"} size="sm" />
                  ))}
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </SkeletonRegion>
  );
}
