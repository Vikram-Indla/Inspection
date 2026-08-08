import { Card, CardBody, CardHeader, CardValueSlot } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import FactoryWorkspace from "@/components/sections/factories/factory-workspace/factory-workspace";
import styles from "./factories-skeleton.module.css";

function StatTileSkeleton() {
  return (
    <Card as="div">
      <CardBody gap="tight">
        <Skeleton shape="line" width="wide" size="sm" />
        <CardValueSlot><Skeleton shape="line" width="narrow" size="xl" /></CardValueSlot>
      </CardBody>
    </Card>
  );
}

function LicenceCardSkeleton() {
  return (
    <Card as="div">
      <CardBody gap="tight">
        <Skeleton shape="line" width="wide" size="lg" />
        <Skeleton shape="line" width="narrow" size="sm" />
        <Skeleton shape="line" width="half" size="sm" />
        <Skeleton shape="pill" width="narrow" />
      </CardBody>
    </Card>
  );
}

function PanelCardSkeleton({ rows }: { rows: number }) {
  return (
    <Card as="div">
      <CardHeader
        eyebrow={<Skeleton shape="line" width="narrow" size="sm" />}
        title={<Skeleton shape="line" width="wide" size="lg" />}
        trailing={<Skeleton shape="pill" width="full" />}
      />
      <CardBody gap="tight">
        {Array.from({ length: rows }, (_, index) => <Skeleton key={index} shape="line" width={index % 2 === 0 ? "full" : "wide"} size="sm" />)}
      </CardBody>
    </Card>
  );
}

export default function FactoriesSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.scopebar}>
        <Skeleton shape="line" width="narrow" size="lg" />
        <Skeleton shape="pill" width="tiny" />
      </div>

      <div data-sqx-cards="flush">
        <FactoryWorkspace
          startLabel={label}
          endLabel={label}
          start={
            <>
              <Card as="div">
                <CardHeader title={<Skeleton shape="line" width="half" size="lg" />} />
                <CardBody>
                  <div className={styles.stats}>
                    <StatTileSkeleton />
                    <StatTileSkeleton />
                  </div>
                </CardBody>
              </Card>
              <LicenceCardSkeleton />
              <LicenceCardSkeleton />
              <LicenceCardSkeleton />
            </>
          }
          end={
            <>
              <PanelCardSkeleton rows={3} />
              <PanelCardSkeleton rows={2} />
              <PanelCardSkeleton rows={2} />
            </>
          }
        >
          <PanelCardSkeleton rows={4} />
          <PanelCardSkeleton rows={3} />
          <PanelCardSkeleton rows={5} />
        </FactoryWorkspace>
      </div>
    </SkeletonRegion>
  );
}
