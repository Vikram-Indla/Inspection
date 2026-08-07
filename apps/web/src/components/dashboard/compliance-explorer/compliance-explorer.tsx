import { type CSSProperties } from "react";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import styles from "./compliance-explorer.module.css";

export type ExplorerRow = {
  readonly label: string;
  readonly rate: number | null;
  readonly total: number;
};

export type ExplorerStrings = {
  readonly title: string;
  readonly description: string;
  readonly lens: string;
  readonly lensLabel: string;
  readonly openFactories: string;
  readonly emptyTitle: string;
  readonly empty: string;
  readonly footnote: string;
  readonly missing: string;
  readonly rateHeading: string;
  readonly countHeading: string;
};

type RateStyle = CSSProperties & Record<"--sqx-explorer-rate", string>;

const MAX_ROWS = 8;

function rateStyle(rate: number): RateStyle {
  return { "--sqx-explorer-rate": `${rate}%` };
}

export default function ComplianceExplorer({ rows, lenses, currentLens, hrefFor, strings }: {
  rows: readonly ExplorerRow[];
  lenses: readonly SegmentedItem<string>[];
  currentLens: string;
  hrefFor: (label: string) => string;
  strings: ExplorerStrings;
}) {
  return (
    <Card as="section" labelledBy="dashboard-compliance-explorer">
      <CardHeader
        level="h2"
        titleId="dashboard-compliance-explorer"
        title={strings.title}
        description={strings.description}
        trailing={<SegmentedControl items={lenses} value={currentLens} label={strings.lens} tone="accent" />}
      />
      <CardBody gap="tight">
        {rows.length ? (
          <div className={styles.table}>
            <div className={styles.head} aria-hidden="true">
              <span className={styles.headCell}>{strings.lensLabel}</span>
              <span />
              <span className={styles.headCell} data-align="end">{strings.rateHeading}</span>
              <span className={styles.headCell} data-align="end">{strings.countHeading}</span>
              <span />
            </div>
            {rows.slice(0, MAX_ROWS).map(row => (
              <div className={styles.row} key={row.label}>
                <span className={styles.label} title={row.label}>{row.label}</span>
                <span className={styles.track} aria-hidden="true">
                  {row.rate === null ? null : <span className={styles.fill} style={rateStyle(row.rate)} />}
                </span>
                <span className={styles.rate}>{row.rate === null ? strings.missing : `${row.rate}%`}</span>
                <span className={styles.total}>{row.total}</span>
                <Button
                  variant="tertiary" size="sm" href={hrefFor(row.label)}
                  label={`${strings.openFactories} — ${row.label}`} compactLabel
                >
                  {strings.openFactories}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="radar" title={strings.emptyTitle} description={strings.empty} />
        )}
      </CardBody>
      <CardFooter>
        <span className={styles.footnote}>{strings.footnote}</span>
      </CardFooter>
    </Card>
  );
}
