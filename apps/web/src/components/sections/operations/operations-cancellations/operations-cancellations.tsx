import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellLink, CellTime, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";

export type CancellationRow = {
  readonly id: string;
  readonly visitHref: string;
  readonly visitLabel: string;
  readonly factoryName: string;
  readonly inspectorName: string;
  readonly region: string;
  readonly reason: string;
  readonly status: string;
  readonly statusKey: string;
  readonly requestedAt: string;
  readonly requestedAtIso: string;
  readonly decidedAt: string | null;
  readonly decidedAtIso: string | null;
};

export type CancellationStrings = {
  readonly title: string;
  readonly description: string;
  readonly visit: string;
  readonly factory: string;
  readonly inspector: string;
  readonly region: string;
  readonly reason: string;
  readonly status: string;
  readonly requested: string;
  readonly decided: string;
  readonly emptyTitle: string;
  readonly missing: string;
};

const STATUS_TONE: Readonly<Record<string, StatusTone>> = {
  approved: "success",
  rejected: "danger",
  pending: "warning",
  requested: "warning",
  cancelled: "neutral",
};

export default function OperationsCancellations({ rows, strings }: {
  rows: readonly CancellationRow[];
  strings: CancellationStrings;
}) {
  const columns: DataColumn<CancellationRow>[] = [
    {
      key: "visit", header: strings.visit, isRowHeader: true, width: "min",
      cell: row => <CellLink href={row.visitHref}><bdi>{row.visitLabel}</bdi></CellLink>,
    },
    { key: "factory", header: strings.factory, width: "grow", cell: row => <span dir="auto">{row.factoryName}</span> },
    { key: "inspector", header: strings.inspector, cell: row => <bdi dir="auto">{row.inspectorName}</bdi> },
    { key: "region", header: strings.region, cell: row => row.region },
    { key: "reason", header: strings.reason, cell: row => <span dir="auto">{row.reason}</span> },
    {
      key: "status", header: strings.status, width: "min",
      cell: row => (
        <StatusPill tone={STATUS_TONE[row.statusKey] ?? "neutral"} size="sm">{row.status}</StatusPill>
      ),
    },
    {
      key: "requested", header: strings.requested, numeric: true,
      cell: row => <CellTime dateTime={row.requestedAtIso}>{row.requestedAt}</CellTime>,
    },
    {
      key: "decided", header: strings.decided, numeric: true,
      cell: row => row.decidedAt
        ? <CellTime dateTime={row.decidedAtIso ?? undefined}>{row.decidedAt}</CellTime>
        : strings.missing,
    },
  ];

  return (
    <Card as="section" labelledBy="operations-cancellations">
      <CardHeader
        level="h2"
        titleId="operations-cancellations"
        title={strings.title}
        description={strings.description}
      />
      <CardBody>
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={row => row.id}
          empty={{ icon: "calendar", title: strings.emptyTitle }}
          density="compact"
        />
      </CardBody>
    </Card>
  );
}
