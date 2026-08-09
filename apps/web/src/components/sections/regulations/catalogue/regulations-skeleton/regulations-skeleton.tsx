import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Skeleton, SkeletonRegion } from "@/components/saqeel/skeleton/skeleton";
import styles from "./regulations-skeleton.module.css";

const AUTHORITY_ROWS = 5;
const CATALOGUE_ROWS = 8;
const CATALOGUE_COLUMNS = 9;

export default function RegulationsSkeleton({ label }: { label: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className={styles.stack}>
        <Skeleton shape="pill" width="half" />

        <Card as="div">
          <CardHeader title={<Skeleton shape="line" width="wide" size="lg" />} />
          <CardBody gap="tight">
            <Skeleton shape="line" width="full" size="sm" />
          </CardBody>
        </Card>

        <div className={styles.layout}>
          <Card as="div">
            <CardHeader title={<Skeleton shape="line" width="wide" size="lg" />} />
            <CardBody gap="tight">
              {Array.from({ length: AUTHORITY_ROWS }, (_unused, index) => (
                <span className={styles.entry} key={index}>
                  <Skeleton shape="line" width={index % 2 === 0 ? "wide" : "half"} size="sm" />
                  <Skeleton shape="pill" width="tiny" />
                </span>
              ))}
            </CardBody>
          </Card>

          <Card as="div">
            <CardHeader
              title={<Skeleton shape="line" width="half" size="lg" />}
              description={<Skeleton shape="line" width="narrow" size="sm" />}
            />
            <CardBody>
              <div className={styles.filters}>
                <Skeleton shape="line" width="half" size="lg" />
                <Skeleton shape="pill" width="narrow" />
                <Skeleton shape="pill" width="narrow" />
                <Skeleton shape="pill" width="narrow" />
                <Skeleton shape="pill" width="narrow" />
              </div>
              <div className={styles.table}>
                {Array.from({ length: CATALOGUE_ROWS }, (_unused, row) => (
                  <span className={styles.row} key={row}>
                    {Array.from({ length: CATALOGUE_COLUMNS }, (_ignored, column) => (
                      <Skeleton key={column} shape="line" width={column === 0 ? "wide" : "narrow"} size="sm" />
                    ))}
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </SkeletonRegion>
  );
}
