import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellLink, CellMuted, CellTime, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";

export type LocationLogRow = {
  readonly id: string;
  readonly when: string;
  readonly whenIso: string;
  readonly kindLabel: string;
  readonly kindTone: StatusTone;
  readonly coords: string;
  readonly reason: string;
  readonly visitHref: string;
  readonly visitShort: string;
};

export type LocationLogStrings = {
  readonly title: string;
  readonly description: string;
  readonly when: string;
  readonly kind: string;
  readonly coordinates: string;
  readonly mismatch: string;
  readonly visit: string;
  readonly emptyTitle: string;
};

export default function FactoryLocationLog({ rows, strings }: {
  rows: readonly LocationLogRow[];
  strings: LocationLogStrings;
}) {
  const columns: DataColumn<LocationLogRow>[] = [
    { key: "when", header: strings.when, isRowHeader: true, numeric: true, cell: row => <CellTime dateTime={row.whenIso}>{row.when}</CellTime> },
    { key: "kind", header: strings.kind, cell: row => <StatusPill tone={row.kindTone}>{row.kindLabel}</StatusPill> },
    { key: "coordinates", header: strings.coordinates, numeric: true, cell: row => <CellMuted><bdi>{row.coords}</bdi></CellMuted> },
    { key: "mismatch", header: strings.mismatch, cell: row => row.reason },
    { key: "visit", header: strings.visit, width: "min", cell: row => <CellLink href={row.visitHref}><bdi>{row.visitShort}</bdi></CellLink> },
  ];
  return (
    <Card as="section" labelledBy="location">
      <CardHeader level="h2" titleId="location" title={strings.title} description={strings.description} />
      <CardBody>
        <DataTable rows={rows} columns={columns} getRowId={row => row.id} empty={{ icon: "map", title: strings.emptyTitle }} density="compact" />
      </CardBody>
    </Card>
  );
}
