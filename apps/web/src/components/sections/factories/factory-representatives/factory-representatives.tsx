import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";

export type RepresentativeRow = {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly phone: string;
  readonly email: string;
  readonly isPrimary: boolean;
  readonly activeLabel: string;
  readonly activeTone: StatusTone;
};

export type RepresentativesStrings = {
  readonly title: string;
  readonly name: string;
  readonly role: string;
  readonly phone: string;
  readonly email: string;
  readonly flags: string;
  readonly primary: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly errorTitle: string;
};

export default function FactoryRepresentatives({ rows, error, strings }: {
  rows: readonly RepresentativeRow[];
  error: string | null;
  strings: RepresentativesStrings;
}) {
  const columns: DataColumn<RepresentativeRow>[] = [
    { key: "name", header: strings.name, isRowHeader: true, cell: row => row.name },
    { key: "role", header: strings.role, cell: row => row.role },
    { key: "phone", header: strings.phone, numeric: true, cell: row => <CellMuted>{row.phone}</CellMuted> },
    { key: "email", header: strings.email, cell: row => <CellMuted>{row.email}</CellMuted> },
    {
      key: "flags", header: strings.flags,
      cell: row => <>{row.isPrimary ? <StatusPill tone="info">{strings.primary}</StatusPill> : null} <StatusPill tone={row.activeTone}>{row.activeLabel}</StatusPill></>,
    },
  ];
  return (
    <Card as="section" labelledBy="representatives">
      <CardHeader level="h2" titleId="representatives" title={strings.title} />
      <CardBody>
        {error
          ? <EmptyState icon="account" tone="danger" title={strings.errorTitle} description={error} />
          : <DataTable rows={rows} columns={columns} getRowId={row => row.id} empty={{ icon: "account", title: strings.emptyTitle, description: strings.emptyDescription }} density="compact" />}
      </CardBody>
    </Card>
  );
}
