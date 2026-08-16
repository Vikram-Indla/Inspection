import type { CSSProperties } from "react";
import { Button, CardBody, Text } from "@/components/experimental/linear";
import { DataTable, Segmented, type SegmentedOption, type TableColumn } from "@/components/experimental/linear-data";
import { SectionCard } from "./dashboard-chrome";
import styles from "./parts.module.css";

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

const MAX_ROWS = 8;

const rateStyle = (rate: number): CSSProperties => ({ "--lnr-rate": rate } as CSSProperties);

export function ComplianceExplorer({ rows, lenses, currentLens, hrefFor, strings }: {
  rows: readonly ExplorerRow[];
  lenses: readonly SegmentedOption<string>[];
  currentLens: string;
  hrefFor: (label: string) => string;
  strings: ExplorerStrings;
}) {
  const columns: readonly TableColumn<ExplorerRow>[] = [
    {
      key: "label",
      header: strings.lensLabel,
      isRowHeader: true,
      cell: row => <span className={styles.explorerLabel} title={row.label}><Text role="caption" as="span">{row.label}</Text></span>,
    },
    {
      key: "rate",
      header: strings.rateHeading,
      cell: row => (
        <span className={styles.meter}>
          <span className={styles.meterTrack} aria-hidden="true">
            {row.rate === null ? null : <span className={styles.meterFill} style={rateStyle(row.rate)} />}
          </span>
          <Text role="caption" tone="strong" weight="medium" as="span" numeric>
            {row.rate === null ? strings.missing : `${row.rate}%`}
          </Text>
        </span>
      ),
    },
    {
      key: "total",
      header: strings.countHeading,
      numeric: true,
      cell: row => <Text role="caption" as="span" numeric>{String(row.total)}</Text>,
    },
    {
      key: "open",
      header: strings.openFactories,
      cell: row => (
        <Button variant="quiet" href={hrefFor(row.label)} label={`${strings.openFactories} — ${row.label}`}>
          {strings.openFactories}
        </Button>
      ),
    },
  ];

  return (
    <SectionCard
      id="dashboard-compliance-explorer"
      title={strings.title}
      description={strings.description}
      actions={<Segmented label={strings.lens} options={lenses} current={currentLens} />}
    >
      <CardBody>
        <DataTable
          caption={strings.title}
          columns={columns}
          rows={rows.slice(0, MAX_ROWS)}
          getRowId={row => row.label}
          empty={{ title: strings.emptyTitle, description: strings.empty }}
        />
        <Text role="caption" tone="muted">{strings.footnote}</Text>
      </CardBody>
    </SectionCard>
  );
}
