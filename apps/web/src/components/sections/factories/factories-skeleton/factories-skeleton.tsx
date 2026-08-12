import { Card, CardBody, CardHeader, CardValueSlot } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import FactoryWorkspace from "@/components/sections/factories/factory-workspace/factory-workspace";
import styles from "./factories-skeleton.module.css";

function AdvisoryStripSkeleton() {
  return (
    <div className={styles.advisory}>
      <Skeleton shape="line" width="narrow" size="lg" />
      <Skeleton shape="pill" width="narrow" />
      <Skeleton shape="line" width="half" size="sm" />
      <span className={styles.advisoryAction}><Skeleton shape="line" width="tiny" size="sm" /></span>
    </div>
  );
}

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
        {Array.from({ length: 6 }, (_unused, index) => (
          <Skeleton key={index} shape="line" width={index % 2 === 0 ? "full" : "wide"} size="sm" />
        ))}
        <span className={styles.pills}>
          <Skeleton shape="pill" width="narrow" />
          <Skeleton shape="pill" width="narrow" />
        </span>
      </CardBody>
    </Card>
  );
}

function PanelCardSkeleton({ rows, pill = true, description = true }: {
  rows: number;
  pill?: boolean;
  description?: boolean;
}) {
  return (
    <Card as="div">
      <CardHeader
        title={<Skeleton shape="line" width="wide" size="lg" />}
        description={description ? <Skeleton shape="line" width="narrow" size="sm" /> : undefined}
        trailing={pill ? <Skeleton shape="pill" width="full" /> : undefined}
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
          top={<AdvisoryStripSkeleton />}
          start={
            <>
              <Card as="div">
                <CardHeader title={<Skeleton shape="line" width="half" size="lg" />} />
                <CardBody>
                  <div className={styles.stats}>
                    <StatTileSkeleton />
                    <StatTileSkeleton />
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
              <PanelCardSkeleton rows={6} pill={false} description={false} />
              <PanelCardSkeleton rows={6} description={false} />
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
