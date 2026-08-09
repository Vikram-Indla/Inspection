import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellLink, CellMuted, CellTime, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { EnforcementRecordView } from "@/features/enforcement/records";

export type EnforcementTableStrings = {
  readonly title: string;
  readonly factory: string;
  readonly license: string;
  readonly inspection: string;
  readonly violation: string;
  readonly penalty: string;
  readonly inspector: string;
  readonly status: string;
  readonly date: string;
  readonly actionForm: string;
  readonly emptyTitle: string;
  readonly empty: string;
};

export default function EnforcementTable({ rows, detailHref, strings }: {
  rows: readonly EnforcementRecordView[];
  detailHref: (id: string) => string;
  strings: EnforcementTableStrings;
}) {
  const columns: DataColumn<EnforcementRecordView>[] = [
    {
      key: "factory", header: strings.factory, isRowHeader: true,
      cell: row => <CellLink href={detailHref(row.id)}><bdi>{row.factory}</bdi></CellLink>,
    },
    { key: "license", header: strings.license, cell: row => <CellMuted>{row.license}</CellMuted> },
    { key: "inspection", header: strings.inspection, cell: row => <CellMuted>{row.inspectionRef}</CellMuted> },
    { key: "violation", header: strings.violation, cell: row => row.violation },
    { key: "penalty", header: strings.penalty, cell: row => row.penalty },
    { key: "inspector", header: strings.inspector, cell: row => row.inspector },
    {
      key: "status", header: strings.status,
      cell: row => <StatusPill tone={row.statusTone}>{row.statusLabel}</StatusPill>,
    },
    {
      key: "date", header: strings.date, numeric: true,
      cell: row => <CellTime dateTime={row.issuedDate ?? undefined}>{row.issuedOn}</CellTime>,
    },
    { key: "actionForm", header: strings.actionForm, cell: row => row.actionForm },
  ];

  return (
    <Card as="section" labelledBy="enforcement-records">
      <CardHeader level="h2" titleId="enforcement-records" title={strings.title} />
      <CardBody>
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={row => row.id}
          empty={{ icon: "enforcement", title: strings.emptyTitle, description: strings.empty }}
          density="compact"
        />
      </CardBody>
    </Card>
  );
}
