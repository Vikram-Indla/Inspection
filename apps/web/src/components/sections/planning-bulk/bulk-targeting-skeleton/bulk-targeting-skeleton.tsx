import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./bulk-targeting-skeleton.module.css";

const CONDITION_ROWS = 2;
const LEDGER_CELLS = 4;
const DISTRIBUTION_PANELS = 3;
const DISTRIBUTION_BARS = 4;
const EVIDENCE_ROWS = 6;

function CriteriaCard() {
  return (
    <Card as="div">
      <CardHeader
        title={<Skeleton shape="line" width="narrow" size="lg" />}
        description={<Skeleton shape="line" width="wide" size="sm" />}
      />
      <CardBody gap="tight">
        <Skeleton shape="pill" width="narrow" />
        <div className={styles.conditions}>
          {Array.from({ length: CONDITION_ROWS }, (_unused, row) => (
            <span className={styles.condition} key={row}>
              <Skeleton shape="line" width="full" size="xl" />
              <Skeleton shape="line" width="full" size="xl" />
              <Skeleton shape="line" width="full" size="xl" />
            </span>
          ))}
        </div>
        <span className={styles.actions}>
          <Skeleton shape="pill" width="narrow" />
          <Skeleton shape="pill" width="narrow" />
          <Skeleton shape="pill" width="tiny" />
        </span>
      </CardBody>
    </Card>
  );
}

function LedgerCard() {
  return (
    <Card as="div">
      <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
      <CardBody gap="tight">
        <div className={styles.ledger}>
          {Array.from({ length: LEDGER_CELLS }, (_unused, cell) => (
            <span className={styles.ledgerCell} key={cell}>
              <Skeleton shape="line" width="narrow" size="sm" />
              <Skeleton shape="line" width="half" size="lg" />
            </span>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function DistributionCards() {
  return (
    <div className={styles.panels}>
      {Array.from({ length: DISTRIBUTION_PANELS }, (_unused, panel) => (
        <Card as="div" key={panel}>
          <CardHeader title={<Skeleton shape="line" width="half" size="md" />} />
          <CardBody gap="tight">
            <div className={styles.panelRows}>
              {Array.from({ length: DISTRIBUTION_BARS }, (_unused, bar) => (
                <span className={styles.panelRow} key={bar}>
                  <span className={styles.panelLabel}>
                    <Skeleton shape="line" width="wide" size="sm" />
                  </span>
                  <span className={styles.panelBar}>
                    <Skeleton shape="line" width="full" size="sm" />
                  </span>
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function EvidenceCard() {
  return (
    <Card as="div">
      <CardHeader
        title={<Skeleton shape="line" width="narrow" size="lg" />}
        description={<Skeleton shape="line" width="half" size="sm" />}
      />
      <CardBody gap="tight">
        <Skeleton shape="line" width="full" size="xl" />
        {Array.from({ length: EVIDENCE_ROWS }, (_unused, row) => (
          <span className={styles.tableRow} key={row}>
            <Skeleton shape="block" width="tiny" size="sm" />
            <span className={styles.tableCell}>
              <Skeleton shape="line" width="wide" size="sm" />
            </span>
            <span className={styles.tableCell}>
              <Skeleton shape="line" width="half" size="sm" />
            </span>
            <Skeleton shape="pill" width="tiny" />
          </span>
        ))}
      </CardBody>
    </Card>
  );
}

export default function BulkTargetingSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.stack}>
        <CriteriaCard />
        <LedgerCard />
        <DistributionCards />
        <EvidenceCard />
      </div>
    </SkeletonRegion>
  );
}
