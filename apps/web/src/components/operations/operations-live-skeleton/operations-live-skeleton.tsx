import { Card, CardBody, CardGrid, CardHeader, CardMedia, CardValueSlot } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import { Text } from "@/components/saqeel/type";
import styles from "./operations-live-skeleton.module.css";

function StatTileSkeleton() {
  return (
    <Card as="div">
      <CardBody gap="tight">
        <Skeleton shape="line" width="wide" size="sm" />
        <CardValueSlot><Skeleton shape="line" width="tiny" size="lg" /></CardValueSlot>
      </CardBody>
    </Card>
  );
}

function InspectorRowSkeleton() {
  return (
    <div className={styles.row}>
      <Skeleton shape="pill" width="narrow" />
      <Skeleton shape="line" width="wide" size="sm" />
      <Skeleton shape="line" width="full" size="sm" />
    </div>
  );
}

export default function OperationsLiveSkeleton({ label, disclosure }: {
  label: string;
  disclosure: string;
}) {
  return (
    <div data-sqx-cards="flush">
      <Text as="p" role="label" tone="secondary">{disclosure}</Text>
      <SkeletonRegion label={label}>
        <Card as="div">
          <CardBody>
            <CardGrid min="sm">
              {Array.from({ length: 3 }, (_, index) => <StatTileSkeleton key={index} />)}
            </CardGrid>
          </CardBody>
        </Card>

        <div className={styles.split}>
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
            <CardHeader
              title={<Skeleton shape="line" width="narrow" size="lg" />}
              trailing={<Skeleton shape="pill" width="tiny" />}
            />
            <CardBody gap="tight">
              {Array.from({ length: 4 }, (_, index) => <InspectorRowSkeleton key={index} />)}
            </CardBody>
          </Card>
        </div>
      </SkeletonRegion>
    </div>
  );
}
