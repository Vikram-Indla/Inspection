import { type ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellMuted, CellTime, type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./factory-compliance.module.css";
import { Text } from "@/components/saqeel/type";

export type ComplianceReportRow = {
  readonly id: string;
  readonly reference: string;
  readonly recorded: string;
  readonly recordedIso: string | null;
  readonly status: string;
  readonly statusTone: StatusTone;
  readonly decision: string;
  readonly decisionTone: StatusTone | null;
};

export type ComplianceViolationRow = {
  readonly id: string;
  readonly title: string;
  readonly code: string;
  readonly level: string;
  readonly levelTone: StatusTone;
  readonly recorded: string;
  readonly recordedIso: string | null;
};

export type CompliancePenaltyRow = {
  readonly id: string;
  readonly noticeNumber: string;
  readonly status: string;
  readonly statusTone: StatusTone;
  readonly issued: string;
  readonly issuedIso: string | null;
  readonly violation: string;
};

export type FactoryComplianceStrings = {
  readonly title: string;
  readonly reports: string;
  readonly violations: string;
  readonly penalties: string;
  readonly reference: string;
  readonly recorded: string;
  readonly status: string;
  readonly decision: string;
  readonly violation: string;
  readonly code: string;
  readonly level: string;
  readonly notice: string;
  readonly issued: string;
  readonly reportsEmpty: string;
  readonly violationsEmpty: string;
  readonly penaltiesEmpty: string;
  readonly penaltiesRestricted: string;
  readonly trends: string;
};

export default function FactoryCompliance({ reports, violations, penalties, penaltiesReadable, trends, strings }: {
  reports: readonly ComplianceReportRow[];
  violations: readonly ComplianceViolationRow[];
  penalties: readonly CompliancePenaltyRow[];
  penaltiesReadable: boolean;
  trends: ReactNode;
  strings: FactoryComplianceStrings;
}) {
  const reportColumns: DataColumn<ComplianceReportRow>[] = [
    { key: "reference", header: strings.reference, isRowHeader: true, cell: row => <bdi>{row.reference}</bdi> },
    { key: "recorded", header: strings.recorded, numeric: true, cell: row => <CellTime dateTime={row.recordedIso ?? undefined}>{row.recorded}</CellTime> },
    { key: "status", header: strings.status, cell: row => <StatusPill tone={row.statusTone}>{row.status}</StatusPill> },
    {
      key: "decision",
      header: strings.decision,
      cell: row => row.decisionTone
        ? <StatusPill tone={row.decisionTone}>{row.decision}</StatusPill>
        : <CellMuted>{row.decision}</CellMuted>,
    },
  ];

  const violationColumns: DataColumn<ComplianceViolationRow>[] = [
    { key: "title", header: strings.violation, isRowHeader: true, cell: row => row.title },
    { key: "code", header: strings.code, numeric: true, cell: row => <CellMuted>{row.code}</CellMuted> },
    { key: "level", header: strings.level, cell: row => <StatusPill tone={row.levelTone}>{row.level}</StatusPill> },
    { key: "recorded", header: strings.recorded, numeric: true, cell: row => <CellTime dateTime={row.recordedIso ?? undefined}>{row.recorded}</CellTime> },
  ];

  const penaltyColumns: DataColumn<CompliancePenaltyRow>[] = [
    { key: "notice", header: strings.notice, isRowHeader: true, cell: row => <bdi>{row.noticeNumber}</bdi> },
    { key: "violation", header: strings.violation, cell: row => row.violation },
    { key: "status", header: strings.status, cell: row => <StatusPill tone={row.statusTone}>{row.status}</StatusPill> },
    { key: "issued", header: strings.issued, numeric: true, cell: row => <CellTime dateTime={row.issuedIso ?? undefined}>{row.issued}</CellTime> },
  ];

  return (
    <Card as="section" labelledBy="factory-compliance-title">
      <CardHeader
        level="h2"
        titleId="factory-compliance-title"
        title={strings.title}
      />
      <CardBody>
        <Text role="label" tone="muted">{strings.reports}</Text>
        <DataTable
          rows={reports}
          columns={reportColumns}
          getRowId={row => row.id}
          empty={{ icon: "review", title: strings.reportsEmpty }}
          density="compact"
        />

        <Text role="label" tone="muted">{strings.violations}</Text>
        <DataTable
          rows={violations}
          columns={violationColumns}
          getRowId={row => row.id}
          empty={{ icon: "enforcement", title: strings.violationsEmpty }}
          density="compact"
        />

        <Text role="label" tone="muted">{strings.penalties}</Text>
        {penaltiesReadable ? (
          <DataTable
            rows={penalties}
            columns={penaltyColumns}
            getRowId={row => row.id}
            empty={{ icon: "enforcement", title: strings.penaltiesEmpty }}
            density="compact"
          />
        ) : (
          <EmptyState icon="restricted" size="sm" title={strings.penaltiesRestricted} />
        )}

        <Text role="label" tone="muted">{strings.trends}</Text>
        {trends}
      </CardBody>
    </Card>
  );
}
