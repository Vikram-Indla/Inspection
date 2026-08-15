import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./analytics-skeleton.module.css";

const FILTERS = ["a", "b", "c", "d", "e"] as const;
const GAUGES = ["a", "b", "c"] as const;
const RATE_ROWS = ["a", "b", "c", "d", "e"] as const;
const DONUTS = ["a", "b"] as const;
const SUMMARY = ["a", "b"] as const;
const BANDS = [
  { key: "visits", rows: ["a", "b", "c", "d", "e"] },
  { key: "coverage", rows: ["a", "b", "c"] },
  { key: "enforcement", rows: ["a", "b", "c"] },
] as const;

export default function AnalyticsSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.root}>
        <div className={styles.head}>
          <Skeleton shape="line" width="narrow" size="lg" />
          <Skeleton shape="line" width="wide" size="sm" />
        </div>

        <Card as="div">
          <CardBody>
            <div className={styles.filters}>
              {FILTERS.map(slot => <Skeleton key={slot} shape="block" width="full" />)}
            </div>
          </CardBody>
        </Card>

        <div className={styles.split}>
          <Card as="div">
            <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
            <CardBody>
              <div className={styles.gauges}>
                {GAUGES.map(slot => <Skeleton key={slot} shape="circle" />)}
              </div>
              <div className={styles.rows}>
                {RATE_ROWS.map(slot => <Skeleton key={slot} shape="line" width="full" />)}
              </div>
            </CardBody>
          </Card>

          <Card as="div">
            <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
            <CardBody>
              {DONUTS.map(slot => (
                <div className={styles.donut} key={slot}>
                  <Skeleton shape="circle" />
                  <Skeleton shape="line" width="half" size="sm" />
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <Card as="div">
          <CardHeader title={<Skeleton shape="line" width="narrow" size="lg" />} />
          <CardBody>
            {BANDS.map(band => (
              <div className={styles.band} key={band.key}>
                <Skeleton shape="line" width="tiny" size="sm" />
                {band.rows.map(slot => <Skeleton key={slot} shape="line" width="full" />)}
              </div>
            ))}
          </CardBody>
        </Card>

        <div className={styles.summary}>
          {SUMMARY.map(slot => (
            <Card as="div" key={slot}>
              <CardBody>
                <div className={styles.figure}>
                  <Skeleton shape="line" width="narrow" size="sm" />
                  <Skeleton shape="circle" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card as="div">
          <CardBody>
            <Skeleton shape="line" width="half" size="sm" />
          </CardBody>
        </Card>
      </div>
    </SkeletonRegion>
  );
}
