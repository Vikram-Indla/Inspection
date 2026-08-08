import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";

export type MaterialRow = {
  readonly id: string;
  readonly name: string;
  readonly sourceLabel: string;
  readonly sourceTone: StatusTone;
  readonly hsCode: string;
};

export type MaterialsStrings = {
  readonly title: string;
  readonly name: string;
  readonly source: string;
  readonly hsCode: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly errorTitle: string;
};

export default function FactoryMaterials({ rows, error, strings }: {
  rows: readonly MaterialRow[];
  error: string | null;
  strings: MaterialsStrings;
}) {
  const columns: DataColumn<MaterialRow>[] = [
    { key: "name", header: strings.name, isRowHeader: true, width: "grow", cell: row => row.name },
    { key: "source", header: strings.source, cell: row => <StatusPill tone={row.sourceTone}>{row.sourceLabel}</StatusPill> },
    { key: "hsCode", header: strings.hsCode, numeric: true, align: "end", cell: row => <CellMuted>{row.hsCode}</CellMuted> },
  ];
  return (
    <Card as="section" labelledBy="materials">
      <CardHeader level="h2" titleId="materials" title={strings.title} />
      <CardBody>
        {error
          ? <EmptyState icon="factory" tone="danger" title={strings.errorTitle} description={error} />
          : <DataTable rows={rows} columns={columns} getRowId={row => row.id} empty={{ icon: "factory", title: strings.emptyTitle, description: strings.emptyDescription }} density="compact" />}
      </CardBody>
    </Card>
  );
}
