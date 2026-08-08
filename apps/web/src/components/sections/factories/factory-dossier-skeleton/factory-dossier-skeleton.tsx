import { Card, CardBody, CardHeader, CardValueSlot } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion, type SkeletonWidth } from "@/components/saqeel/skeleton/skeleton";
import FactoryDossier from "@/components/sections/factories/factory-dossier/factory-dossier";
import styles from "./factory-dossier-skeleton.module.css";

const NAV_CHIPS: readonly SkeletonWidth[] = ["narrow", "tiny", "narrow", "half", "tiny", "narrow", "tiny", "half", "narrow"];

function FactRow() {
  return (
    <div className={styles.fact}>
      <Skeleton shape="line" width="narrow" size="sm" />
      <Skeleton shape="line" width="wide" size="sm" />
    </div>
  );
}

function TableRow() {
  return (
    <div className={styles.row}>
      <Skeleton shape="line" width="narrow" size="sm" />
      <Skeleton shape="line" width="full" size="sm" />
      <Skeleton shape="line" width="half" size="sm" />
      <Skeleton shape="pill" width="tiny" />
    </div>
  );
}

function TableCardSkeleton({ rows }: { rows: number }) {
  return (
    <Card as="div">
      <CardHeader
        title={<Skeleton shape="line" width="half" size="lg" />}
        description={<Skeleton shape="line" width="wide" size="sm" />}
      />
      <CardBody gap="tight">
        {Array.from({ length: rows }, (_, index) => <TableRow key={index} />)}
      </CardBody>
    </Card>
  );
}

export default function FactoryDossierSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <FactoryDossier
        aside={
          <>
            <Card as="div">
              <CardHeader
                eyebrow={<Skeleton shape="line" width="narrow" size="sm" />}
                title={<Skeleton shape="line" width="wide" size="lg" />}
                trailing={<Skeleton shape="pill" width="full" />}
              />
              <CardBody gap="tight">
                {Array.from({ length: 7 }, (_, index) => <FactRow key={index} />)}
              </CardBody>
            </Card>

            <Card as="div">
              <CardHeader
                title={<Skeleton shape="line" width="half" size="lg" />}
                trailing={<Skeleton shape="pill" width="full" />}
              />
              <CardBody gap="tight">
                <CardValueSlot><Skeleton shape="line" width="narrow" size="xl" /></CardValueSlot>
                <FactRow />
                <FactRow />
                <Skeleton shape="line" width="full" size="sm" />
                <Skeleton shape="line" width="wide" size="sm" />
              </CardBody>
            </Card>

            <Card as="div">
              <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
              <CardBody gap="tight">
                <Skeleton shape="line" width="wide" size="sm" />
                <Skeleton shape="line" width="half" size="sm" />
                <div className={styles.map} />
                <div className={styles.legend}>
                  <Skeleton shape="pill" width="narrow" />
                  <Skeleton shape="pill" width="narrow" />
                  <Skeleton shape="pill" width="narrow" />
                </div>
              </CardBody>
            </Card>
          </>
        }
      >
        <div className={styles.nav}>
          {NAV_CHIPS.map((width, index) => <Skeleton key={index} shape="pill" width={width} />)}
        </div>
        <TableCardSkeleton rows={4} />
        <TableCardSkeleton rows={5} />
        <TableCardSkeleton rows={4} />
        <TableCardSkeleton rows={3} />
      </FactoryDossier>
    </SkeletonRegion>
  );
}
