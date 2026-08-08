import { Card, CardBody, CardFooter, CardGrid, CardHeader, CardValueSlot } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./dashboard-skeleton.module.css";

function MetricTileSkeleton() {
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

function MetricCardSkeleton() {
  return (
    <Card as="div">
      <CardHeader
        eyebrow={<Skeleton shape="line" width="wide" size="sm" />}
        title={<Skeleton shape="line" width="full" size="lg" />}
      />
      <CardBody gap="tight">
        <CardValueSlot><Skeleton shape="pill" width="narrow" /></CardValueSlot>
        <Skeleton shape="line" width="half" size="sm" />
      </CardBody>
      <CardFooter>
        <Skeleton shape="pill" width="narrow" />
      </CardFooter>
    </Card>
  );
}

function ExplorerRowSkeleton() {
  return (
    <div className={styles.row}>
      <Skeleton shape="line" width="narrow" size="sm" />
      <Skeleton shape="line" width="full" size="sm" />
      <Skeleton shape="line" width="tiny" size="sm" />
    </div>
  );
}

export default function DashboardSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.toolbar}>
        <Skeleton shape="pill" width="narrow" />
        <Skeleton shape="line" width="tiny" size="sm" />
      </div>

      <Card as="div">
        <CardHeader
          eyebrow={<Skeleton shape="line" width="tiny" size="sm" />}
          title={<Skeleton shape="line" width="narrow" size="lg" />}
          trailing={<Skeleton shape="pill" width="full" />}
        />
        <CardBody>
          <CardGrid min="sm">
            {Array.from({ length: 4 }, (_, index) => <MetricTileSkeleton key={index} />)}
          </CardGrid>
        </CardBody>
      </Card>

      <Card as="div">
        <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
        <CardBody>
          <CardGrid min="md">
            {Array.from({ length: 3 }, (_, index) => <MetricCardSkeleton key={index} />)}
          </CardGrid>
        </CardBody>
      </Card>

      <Card as="div">
        <CardHeader
          title={<Skeleton shape="line" width="half" size="lg" />}
          description={<Skeleton shape="line" width="wide" size="sm" />}
          trailing={<Skeleton shape="pill" width="full" />}
        />
        <CardBody gap="tight">
          {Array.from({ length: 6 }, (_, index) => <ExplorerRowSkeleton key={index} />)}
        </CardBody>
      </Card>
    </SkeletonRegion>
  );
}
