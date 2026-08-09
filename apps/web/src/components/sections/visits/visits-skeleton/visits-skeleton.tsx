import { Card, CardBody, CardGrid, CardHeader, CardValueSlot } from "@/components/saqeel/card/card";
import Stack from "@/components/saqeel/stack/stack";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./visits-skeleton.module.css";

const STATUS_TILES = 5;
const TABLE_COLUMNS = 8;
const TABLE_ROWS = 8;

function StatusTileSkeleton() {
  return (
    <Card as="div">
      <CardBody gap="tight">
        <Skeleton shape="line" width="wide" size="sm" />
        <CardValueSlot><Skeleton shape="line" width="tiny" size="xl" /></CardValueSlot>
      </CardBody>
    </Card>
  );
}

function TableRowSkeleton({ offset }: { offset: number }) {
  return (
    <div className={styles.row}>
      <Skeleton shape="line" width="full" size="sm" />
      {Array.from({ length: TABLE_COLUMNS - 1 }, (_unused, index) => (
        <Skeleton key={index} shape="line" width={(index + offset) % 3 === 0 ? "wide" : "full"} size="sm" />
      ))}
    </div>
  );
}

export default function VisitsSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <Stack gap="default">
        <div className={styles.scopebar}>
          <Skeleton shape="pill" width="narrow" />
          <Skeleton shape="line" width="tiny" size="sm" />
        </div>

        <CardGrid min="sm">
          {Array.from({ length: STATUS_TILES }, (_unused, index) => <StatusTileSkeleton key={index} />)}
        </CardGrid>

        <div className={styles.filters}>
          <Skeleton shape="line" width="full" size="lg" />
          <Skeleton shape="line" width="narrow" size="lg" />
          <Skeleton shape="line" width="narrow" size="lg" />
          <Skeleton shape="line" width="tiny" size="lg" />
        </div>

        <Card as="div">
          <CardHeader
            title={<Skeleton shape="line" width="narrow" size="lg" />}
            trailing={<Skeleton shape="pill" width="full" />}
          />
          <CardBody gap="tight">
            <Skeleton shape="line" width="wide" size="sm" />
            <Skeleton shape="line" width="half" size="sm" />
          </CardBody>
        </Card>

        <Card as="div">
          <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
          <CardBody>
            <div className={styles.table}>
              <div className={styles.head}>
                {Array.from({ length: TABLE_COLUMNS }, (_unused, index) => (
                  <Skeleton key={index} shape="line" width="wide" size="sm" />
                ))}
              </div>
              {Array.from({ length: TABLE_ROWS }, (_unused, index) => (
                <TableRowSkeleton key={index} offset={index} />
              ))}
            </div>
          </CardBody>
        </Card>

        <div className={styles.footer}>
          <Skeleton shape="line" width="narrow" size="sm" />
          <Skeleton shape="pill" width="tiny" />
        </div>
      </Stack>
    </SkeletonRegion>
  );
}
