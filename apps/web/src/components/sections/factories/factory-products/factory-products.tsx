import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";

export type ProductRow = {
  readonly id: string;
  readonly name: string;
  readonly hsCode: string;
  readonly unit: string;
  readonly capacity: string;
  readonly isPrimary: boolean;
};

export type ProductsStrings = {
  readonly title: string;
  readonly name: string;
  readonly hsCode: string;
  readonly unit: string;
  readonly capacity: string;
  readonly flags: string;
  readonly primary: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly errorTitle: string;
};

export default function FactoryProducts({ rows, error, strings }: {
  rows: readonly ProductRow[];
  error: string | null;
  strings: ProductsStrings;
}) {
  const columns: DataColumn<ProductRow>[] = [
    { key: "name", header: strings.name, isRowHeader: true, width: "grow", cell: row => row.name },
    { key: "hsCode", header: strings.hsCode, numeric: true, align: "end", cell: row => <CellMuted>{row.hsCode}</CellMuted> },
    { key: "unit", header: strings.unit, cell: row => row.unit },
    { key: "capacity", header: strings.capacity, numeric: true, align: "end", cell: row => <CellMuted>{row.capacity}</CellMuted> },
    { key: "flags", header: strings.flags, cell: row => row.isPrimary ? <StatusPill tone="info">{strings.primary}</StatusPill> : null },
  ];
  return (
    <Card as="section" labelledBy="products">
      <CardHeader level="h2" titleId="products" title={strings.title} />
      <CardBody>
        {error
          ? <EmptyState icon="factory" tone="danger" title={strings.errorTitle} description={error} />
          : <DataTable rows={rows} columns={columns} getRowId={row => row.id} empty={{ icon: "factory", title: strings.emptyTitle, description: strings.emptyDescription }} density="compact" />}
      </CardBody>
    </Card>
  );
}
