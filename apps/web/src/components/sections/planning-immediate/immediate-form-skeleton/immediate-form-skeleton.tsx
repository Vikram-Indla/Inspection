import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./immediate-form-skeleton.module.css";

const IDENTITY_FIELDS = 3;
const REASON_OPTIONS = 4;
const DISPATCH_FIELDS = 4;
const CHECKLIST_OPTIONS = 6;
const OUTCOME_LINES = 4;
const BLOCKER_ROWS = 4;

function FieldSkeleton() {
  return (
    <span className={styles.field}>
      <Skeleton shape="line" width="narrow" size="sm" />
      <Skeleton shape="line" width="full" size="xl" />
    </span>
  );
}

function ProtectionsCard() {
  return (
    <Card as="div">
      <CardBody gap="tight">
        <Skeleton shape="line" width="narrow" size="lg" />
        <span className={styles.summary}>
          <Skeleton shape="pill" width="tiny" />
        </span>
        <div className={styles.blockers}>
          {Array.from({ length: BLOCKER_ROWS }, (_unused, index) => (
            <span className={styles.blocker} key={index}>
              <Skeleton shape="line" width="narrow" size="sm" />
              <Skeleton shape="line" width="wide" size="sm" />
            </span>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function ChecklistCard() {
  return (
    <Card as="div">
      <CardHeader
        title={<Skeleton shape="line" width="narrow" size="lg" />}
        description={<Skeleton shape="line" width="half" size="sm" />}
      />
      <CardBody gap="tight">
        <div className={styles.checklist}>
          {Array.from({ length: CHECKLIST_OPTIONS }, (_unused, index) => (
            <Skeleton key={index} shape="line" width="full" size="lg" />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function IdentityCard() {
  return (
    <Card as="div">
      <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
      <CardBody>
        <Skeleton shape="line" width="full" size="lg" />
        {Array.from({ length: IDENTITY_FIELDS }, (_unused, index) => <FieldSkeleton key={index} />)}
      </CardBody>
    </Card>
  );
}

function ReasonCard() {
  return (
    <Card as="div">
      <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
      <CardBody gap="tight">
        <div className={styles.options}>
          {Array.from({ length: REASON_OPTIONS }, (_unused, index) => (
            <Skeleton key={index} shape="line" width="full" size="md" />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function DispatchCard() {
  return (
    <Card as="div">
      <CardHeader
        title={<Skeleton shape="line" width="narrow" size="lg" />}
        description={<Skeleton shape="line" width="half" size="sm" />}
      />
      <CardBody>
        <span className={styles.map}><Skeleton shape="block" width="full" size="xl" /></span>
        <div className={styles.pair}>
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
        {Array.from({ length: DISPATCH_FIELDS }, (_unused, index) => <FieldSkeleton key={index} />)}
      </CardBody>
    </Card>
  );
}

function OutcomeCard() {
  return (
    <Card as="div">
      <CardHeader title={<Skeleton shape="line" width="tiny" size="lg" />} />
      <CardBody gap="tight">
        {Array.from({ length: OUTCOME_LINES }, (_unused, index) => (
          <Skeleton key={index} shape="line" width={index % 2 === 0 ? "wide" : "half"} size="sm" />
        ))}
      </CardBody>
    </Card>
  );
}

export default function ImmediateFormSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.stack}>
        <ProtectionsCard />
        <div className={styles.columns}>
          <div className={styles.column}>
            <IdentityCard />
            <ReasonCard />
          </div>
          <DispatchCard />
        </div>
        <ChecklistCard />
        <OutcomeCard />
        <div className={styles.actionBar}>
          <Skeleton shape="pill" width="narrow" />
        </div>
      </div>
    </SkeletonRegion>
  );
}
