import { type CSSProperties } from "react";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import styles from "./compliance-explorer.module.css";
import { Text } from "@/components/saqeel/type";

export type ExplorerRow = {
  readonly label: string;
  readonly rate: number | null;
  readonly total: number;
};

export type ExplorerStrings = {
  readonly title: string;
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

  const columns: DataColumn<ExplorerRow>[] = [
    {
      key: "label", header: strings.lensLabel, isRowHeader: true,
      cell: row => <span className={styles.label} title={row.label}>{row.label}</span>,
    },
    {
      key: "rate", header: strings.rateHeading,      cell: row => (
        <span className={styles.meter}>
          <span className={styles.track} aria-hidden="true">
            {row.rate === null ? null : <span className={styles.fill} style={rateStyle(row.rate)} />}
          </span>
          <span className={styles.rate}><Text as="span" role="bodyStrong">{row.rate === null ? strings.missing : `${row.rate}%`}</Text></span>
        </span>
      ),
    },
    {
      key: "total", header: strings.countHeading, align: "end", numeric: true,
      cell: row => <span className={styles.total}>{row.total}</span>,
    },
    {
      key: "open", header: "", align: "end", width: "min",
      cell: row => (
        <Button
          variant="tertiary" size="sm" href={hrefFor(row.label)}
          label={`${strings.openFactories} — ${row.label}`} compactLabel
        >
          {strings.openFactories}
        </Button>
      ),
    },
  ];

  return (
    <Card as="section" labelledBy="dashboard-compliance-explorer">
      <CardHeader
        level="h2"
        titleId="dashboard-compliance-explorer"
        title={strings.title}
        trailing={<SegmentedControl items={lenses} value={currentLens} label={strings.lens} tone="accent" />}
      />
      <CardBody gap="tight">
        <DataTable
          rows={rows.slice(0, MAX_ROWS)}
          columns={columns}
          getRowId={row => row.label}
          empty={{ icon: "radar", title: strings.emptyTitle, description: strings.empty }}
        />
      </CardBody>
      <CardFooter>
        <Text as="span" tone="muted">{strings.footnote}</Text>
      </CardFooter>
    </Card>
  );
}
