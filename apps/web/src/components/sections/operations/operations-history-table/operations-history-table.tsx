import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellLink, CellMuted, CellTime, type DataColumn } from "@/components/saqeel/data-table/data-table";

export type HistoryRow = {
  readonly id: string;
  readonly occurredAt: string;
  readonly occurredAtIso: string;
  readonly visitHref: string;
  readonly visitLabel: string;
  readonly event: string;
  readonly geofence: string;
  readonly position: string;
};

export type HistoryStrings = {
  readonly title: string;
  readonly description: string;
  readonly time: string;
  readonly visit: string;
  readonly event: string;
  readonly geofence: string;
  readonly position: string;
  readonly emptyTitle: string;
};

export default function OperationsHistoryTable({ rows, strings }: {
  rows: readonly HistoryRow[];
  strings: HistoryStrings;
}) {
  const columns: DataColumn<HistoryRow>[] = [
    {
      key: "time", header: strings.time, isRowHeader: true, numeric: true,
      cell: row => <CellTime dateTime={row.occurredAtIso}>{row.occurredAt}</CellTime>,
    },
    {
      key: "visit", header: strings.visit, width: "min",
      cell: row => <CellLink href={row.visitHref}><bdi>{row.visitLabel}</bdi></CellLink>,
    },
    { key: "event", header: strings.event, cell: row => row.event },
    { key: "geofence", header: strings.geofence, cell: row => row.geofence },
    {
      key: "position", header: strings.position, align: "end", numeric: true,
      cell: row => <CellMuted>{row.position}</CellMuted>,
    },
  ];

  return (
    <Card as="section" labelledBy="operations-history">
      <CardHeader
        level="h2"
        titleId="operations-history"
        title={strings.title}
        description={strings.description}
      />
      <CardBody>
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={row => row.id}
          empty={{ icon: "map", title: strings.emptyTitle }}
          density="compact"
        />
      </CardBody>
    </Card>
  );
}
