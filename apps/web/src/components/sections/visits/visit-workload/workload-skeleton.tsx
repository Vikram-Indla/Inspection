import { Card, CardBody, CardGrid, CardHeader, CardValueSlot } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./workload-skeleton.module.css";

const STAT_CARDS = 4;
const TABLE_ROWS = 8;
const TABLE_COLUMNS = 6;

function StatCardSkeleton() {
  return (
    <Card as="div">
      <CardBody gap="tight">
        <Skeleton shape="line" width="wide" size="sm" />
        <CardValueSlot><Skeleton shape="line" width="tiny" size="xl" /></CardValueSlot>
      </CardBody>
    </Card>
  );
}

export default function WorkloadSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.stack}>
        <Skeleton shape="pill" width="narrow" />

        <CardGrid min="sm">
          {Array.from({ length: STAT_CARDS }, (_unused, index) => <StatCardSkeleton key={index} />)}
        </CardGrid>

        <Card as="div">
          <CardHeader
            title={<Skeleton shape="line" width="narrow" size="lg" />}
            description={<Skeleton shape="line" width="wide" size="sm" />}
          />
          <CardBody>
            <div className={styles.table}>
              <div className={styles.head}>
                {Array.from({ length: TABLE_COLUMNS }, (_unused, index) => (
                  <Skeleton key={index} shape="line" width="wide" size="sm" />
                ))}
              </div>
              {Array.from({ length: TABLE_ROWS }, (_unused, row) => (
                <div className={styles.row} key={row}>
                  {Array.from({ length: TABLE_COLUMNS }, (_unused, index) => (
                    <Skeleton key={index} shape="line" width={index === 1 ? "full" : "wide"} size="sm" />
                  ))}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </SkeletonRegion>
  );
}
