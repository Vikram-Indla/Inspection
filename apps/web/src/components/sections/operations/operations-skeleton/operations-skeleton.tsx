import { Card, CardBody, CardGrid, CardHeader, CardMedia, CardValueSlot } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./operations-skeleton.module.css";

function StatTileSkeleton() {
  return (
    <Card as="div">
      <CardBody gap="tight">
        <Skeleton shape="line" width="wide" size="sm" />
        <CardValueSlot><Skeleton shape="line" width="narrow" size="lg" /></CardValueSlot>
        <Skeleton shape="line" width="half" size="sm" />
      </CardBody>
    </Card>
  );
}

function TableRowSkeleton() {
  return (
    <div className={styles.row}>
      <Skeleton shape="line" width="wide" size="sm" />
      <Skeleton shape="line" width="full" size="sm" />
      <Skeleton shape="pill" width="narrow" />
      <Skeleton shape="line" width="tiny" size="sm" />
    </div>
  );
}

function TableCardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card as="div">
      <CardHeader
        title={<Skeleton shape="line" width="narrow" size="lg" />}
        description={<Skeleton shape="line" width="wide" size="sm" />}
      />
      <CardBody gap="tight">
        <div className={styles.head}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} shape="line" width="half" size="sm" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, index) => <TableRowSkeleton key={index} />)}
      </CardBody>
    </Card>
  );
}

export default function OperationsSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.toolbar}>
        <Skeleton shape="pill" width="narrow" />
        <div className={styles.filters}>
          <Skeleton shape="pill" width="narrow" />
          <Skeleton shape="pill" width="tiny" />
        </div>
      </div>

      <Card as="div">
        <CardHeader
          title={<Skeleton shape="line" width="narrow" size="lg" />}
          description={<Skeleton shape="line" width="wide" size="sm" />}
          trailing={<Skeleton shape="pill" width="tiny" />}
        />
        <CardMedia height="lg">
          <Skeleton shape="block" width="full" size="xl" />
        </CardMedia>
      </Card>

      <Card as="div">
        <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
        <CardBody>
          <CardGrid min="sm">
            {Array.from({ length: 5 }, (_, index) => <StatTileSkeleton key={index} />)}
          </CardGrid>
        </CardBody>
      </Card>

      <TableCardSkeleton rows={6} />
      <TableCardSkeleton rows={4} />

      <Card as="div">
        <CardHeader
          title={<Skeleton shape="line" width="half" size="lg" />}
          description={<Skeleton shape="line" width="wide" size="sm" />}
        />
        <CardBody>
          <CardGrid min="lg">
            {Array.from({ length: 2 }, (_, column) => (
              <Card as="div" key={column}>
                <CardHeader title={<Skeleton shape="line" width="narrow" size="md" />} />
                <CardBody gap="tight">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div className={styles.listRow} key={index}>
                      <div className={styles.listBody}>
                        <Skeleton shape="line" width="half" size="sm" />
                        <Skeleton shape="line" width="wide" size="sm" />
                      </div>
                      <Skeleton shape="pill" width="tiny" />
                    </div>
                  ))}
                </CardBody>
              </Card>
            ))}
          </CardGrid>
        </CardBody>
      </Card>
    </SkeletonRegion>
  );
}
