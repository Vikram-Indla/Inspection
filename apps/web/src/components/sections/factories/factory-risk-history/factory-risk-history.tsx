import { type ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellMuted, CellTime, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import Stack from "@/components/saqeel/stack/stack";
import styles from "./factory-risk-history.module.css";

export type RiskSnapshotRow = {
  readonly id: string;
  readonly when: string;
  readonly whenIso: string;
  readonly score: string;
  readonly band: string;
  readonly model: string;
  readonly drivers: string;
};

export type RelatedViolation = {
  readonly key: string;
  readonly label: string;
};

export type RiskHistoryStrings = {
  readonly title: string;
  readonly description: string;
  readonly when: string;
  readonly score: string;
  readonly band: string;
  readonly model: string;
  readonly drivers: string;
  readonly emptyTitle: string;
  readonly relatedTitle: string;
};

export default function FactoryRiskHistory({ rows, violations, relatedEmptyNote, ai, strings }: {
  rows: readonly RiskSnapshotRow[];
  violations: readonly RelatedViolation[];
  relatedEmptyNote: string;
  ai: ReactNode;
  strings: RiskHistoryStrings;
}) {
  const columns: DataColumn<RiskSnapshotRow>[] = [
    { key: "when", header: strings.when, isRowHeader: true, numeric: true, cell: row => <CellTime dateTime={row.whenIso}>{row.when}</CellTime> },
    { key: "score", header: strings.score, numeric: true, align: "end", cell: row => row.score },
    { key: "band", header: strings.band, cell: row => row.band },
    { key: "model", header: strings.model, cell: row => <CellMuted>{row.model}</CellMuted> },
    { key: "drivers", header: strings.drivers, cell: row => <CellMuted>{row.drivers}</CellMuted> },
  ];
  return (
    <Card as="section" labelledBy="risk">
      <CardHeader level="h2" titleId="risk" title={strings.title} description={strings.description} />
      <CardBody>
        <Stack gap="loose">
          {ai}
          <DataTable rows={rows} columns={columns} getRowId={row => row.id} empty={{ icon: "risk", title: strings.emptyTitle }} density="compact" />
          <div className={styles.related}>
            <h3 className={styles.subhead}>{strings.relatedTitle}</h3>
            {violations.length
              ? <div className={styles.pills}>{violations.map(v => <StatusPill key={v.key} tone="danger">{v.label}</StatusPill>)}</div>
              : <p className={styles.note}>{relatedEmptyNote}</p>}
          </div>
        </Stack>
      </CardBody>
    </Card>
  );
}
