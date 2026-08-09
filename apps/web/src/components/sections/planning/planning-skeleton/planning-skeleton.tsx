import { Card, CardBody, CardGrid, CardHeader, CardValueSlot } from "@/components/saqeel/card/card";
import Stack from "@/components/saqeel/stack/stack";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./planning-skeleton.module.css";

const TABLE_COLUMNS = 7;
const TABLE_ROWS = 8;
const TOOLBAR_ACTIONS = 4;
const STAT_CARDS = 8;
const RECOMMENDATIONS = 3;
const QUICK_ACTIONS = 6;

function PanelSkeleton({ rows }: { rows: number }) {
  return (
    <Card as="div">
      <CardHeader
        eyebrow={<Skeleton shape="line" width="tiny" size="sm" />}
        title={<Skeleton shape="line" width="half" size="lg" />}
      />
      <CardBody gap="tight">
        {Array.from({ length: rows }, (_unused, index) => (
          <Skeleton key={index} shape="line" width={index % 2 === 0 ? "full" : "wide"} size="sm" />
        ))}
      </CardBody>
    </Card>
  );
}

function RecommendationSkeleton() {
  return (
    <div className={styles.reco}>
      <Skeleton shape="line" width="wide" size="md" />
      <Skeleton shape="pill" width="narrow" />
      <Skeleton shape="line" width="half" size="sm" />
    </div>
  );
}

function StatCardSkeleton() {
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
      {Array.from({ length: TABLE_COLUMNS }, (_unused, index) => (
        <Skeleton key={index} shape="line" width={(index + offset) % 3 === 0 ? "wide" : "full"} size="sm" />
      ))}
    </div>
  );
}

export default function PlanningSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <Stack gap="default">
        <Skeleton shape="pill" width="narrow" />

        <div className={styles.heading}>
          <Skeleton shape="line" width="narrow" size="xl" />
          <Skeleton shape="line" width="tiny" size="sm" />
        </div>

        <div className={styles.toolbar}>
          {Array.from({ length: TOOLBAR_ACTIONS }, (_unused, index) => (
            <Skeleton key={index} shape="pill" width="full" />
          ))}
        </div>

        <div className={styles.assistant}>
          <PanelSkeleton rows={5} />
          <Card as="div">
            <CardHeader
              eyebrow={<Skeleton shape="line" width="tiny" size="sm" />}
              title={<Skeleton shape="line" width="half" size="lg" />}
            />
            <CardBody>
              {Array.from({ length: RECOMMENDATIONS }, (_unused, index) => <RecommendationSkeleton key={index} />)}
            </CardBody>
          </Card>
          <PanelSkeleton rows={QUICK_ACTIONS} />
        </div>

        <CardGrid min="sm">
          {Array.from({ length: STAT_CARDS }, (_unused, index) => <StatCardSkeleton key={index} />)}
        </CardGrid>

        <div className={styles.filters}>
          <Skeleton shape="line" width="full" size="lg" />
          <Skeleton shape="line" width="narrow" size="lg" />
          <Skeleton shape="line" width="narrow" size="lg" />
          <Skeleton shape="line" width="tiny" size="lg" />
        </div>

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
