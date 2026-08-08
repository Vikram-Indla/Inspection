import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";

export type WorkloadRow = {
  readonly inspector: string;
  readonly assigned: number;
  readonly active: number;
  readonly completed: number;
  readonly overdue: number;
};

export type WorkloadStrings = {
  readonly title: string;
  readonly description: string;
  readonly inspector: string;
  readonly assigned: string;
  readonly active: string;
  readonly completed: string;
  readonly overdue: string;
  readonly emptyTitle: string;
};

export default function OperationsWorkloadTable({ rows, strings }: {
  rows: readonly WorkloadRow[];
  strings: WorkloadStrings;
}) {
  const columns: DataColumn<WorkloadRow>[] = [
    {
      key: "inspector", header: strings.inspector, isRowHeader: true, width: "grow",

      cell: row => <bdi dir="auto">{row.inspector}</bdi>,
    },
    { key: "assigned", header: strings.assigned, align: "end", numeric: true, cell: row => row.assigned },
    { key: "active", header: strings.active, align: "end", numeric: true, cell: row => row.active },
    { key: "completed", header: strings.completed, align: "end", numeric: true, cell: row => row.completed },
    { key: "overdue", header: strings.overdue, align: "end", numeric: true, cell: row => row.overdue },
  ];

  return (
    <Card as="section" labelledBy="operations-workload">
      <CardHeader
        level="h2"
        titleId="operations-workload"
        title={strings.title}
        description={strings.description}
      />
      <CardBody>
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={row => row.inspector}
          empty={{ icon: "access", title: strings.emptyTitle }}
          density="compact"
        />
      </CardBody>
    </Card>
  );
}
