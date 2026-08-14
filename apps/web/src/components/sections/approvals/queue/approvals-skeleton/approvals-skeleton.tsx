import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./approvals-skeleton.module.css";

const RAIL_ENTRIES = 3;
const STEPS = 6;
const DIFF_ROWS = 6;
const ASIDE_PANELS = 3;

export default function ApprovalsSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.layout}>
        <Card as="div">
          <CardHeader title={<Skeleton shape="line" width="half" size="lg" />} trailing={<Skeleton shape="pill" width="tiny" />} />
          <CardBody gap="tight">
            {Array.from({ length: RAIL_ENTRIES }, (_unused, index) => (
              <span className={styles.entry} key={index}>
                <Skeleton shape="line" width="narrow" size="sm" />
                <Skeleton shape="line" width="wide" size="md" />
                <Skeleton shape="line" width="half" size="sm" />
                <Skeleton shape="pill" width="narrow" />
              </span>
            ))}
          </CardBody>
        </Card>

        <div className={styles.column}>
          <div className={styles.steps}>
            {Array.from({ length: STEPS }, (_unused, index) => (
              <span className={styles.step} key={index}><Skeleton shape="line" width="full" size="xl" /></span>
            ))}
          </div>

          <Card as="div">
            <CardHeader
              title={<Skeleton shape="line" width="wide" size="lg" />}
              description={<Skeleton shape="line" width="narrow" size="sm" />}
            />
            <CardBody gap="tight">
              {Array.from({ length: DIFF_ROWS }, (_unused, index) => (
                <span className={styles.row} key={index}>
                  <Skeleton shape="line" width="wide" size="sm" />
                  <Skeleton shape="line" width="half" size="sm" />
                  <Skeleton shape="line" width="half" size="sm" />
                </span>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className={styles.column}>
          {Array.from({ length: ASIDE_PANELS }, (_unused, index) => (
            <Card as="div" key={index}>
              <CardHeader title={<Skeleton shape="line" width="half" size="lg" />} />
              <CardBody gap="tight">
                <Skeleton shape="line" width="full" size="sm" />
                <Skeleton shape="line" width="wide" size="sm" />
                <Skeleton shape="pill" width="narrow" />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
