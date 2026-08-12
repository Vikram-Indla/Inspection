import { Card, CardBody, CardGrid, CardHeader, CardValueSlot } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./visit-detail-skeleton.module.css";

function TrackTileSkeleton() {
  return (
    <Card as="div">
      <CardBody gap="tight">
        <Skeleton shape="line" width="wide" size="sm" />
        <CardValueSlot><Skeleton shape="pill" width="narrow" /></CardValueSlot>
      </CardBody>
    </Card>
  );
}

function TimelineRowSkeleton() {
  return (
    <div className={styles.row}>
      <Skeleton shape="line" width="half" size="sm" />
      <Skeleton shape="line" width="wide" size="sm" />
    </div>
  );
}

export default function VisitDetailSkeleton({ label }: { label: string }) {
  return (
    <div data-sqx-cards="flush">
      <SkeletonRegion label={label}>
        <Card as="div">
          <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
          <CardBody>
            <CardGrid min="sm">
              {Array.from({ length: 5 }, (_, index) => <TrackTileSkeleton key={index} />)}
            </CardGrid>
          </CardBody>
        </Card>

        <div className={styles.split}>
          <Card as="div">
            <CardHeader
              title={<Skeleton shape="line" width="narrow" size="lg" />}
              description={<Skeleton shape="line" width="wide" size="sm" />}
            />
            <CardBody gap="tight">
              {Array.from({ length: 3 }, (_, index) => <TimelineRowSkeleton key={index} />)}
            </CardBody>
          </Card>
          <Card as="div">
            <CardHeader title={<Skeleton shape="line" width="half" size="lg" />} />
            <CardBody gap="tight">
              {Array.from({ length: 2 }, (_, index) => <TimelineRowSkeleton key={index} />)}
            </CardBody>
          </Card>
        </div>

        <Card as="div">
          <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
          <CardBody gap="tight">
            {Array.from({ length: 4 }, (_, index) => <TimelineRowSkeleton key={index} />)}
          </CardBody>
        </Card>
      </SkeletonRegion>
    </div>
  );
}
