import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Stack from "@/components/saqeel/stack/stack";
import StatusPill from "@/components/saqeel/status-pill/status-pill";

export type KpiDefinitionRow = {
  readonly key: string;
  readonly metric: string;
  readonly sourceStatus: string;
  readonly formula: string | null;
};

export type KpiContractStrings = {
  readonly title: string;
  readonly configured: string;
  readonly notConfigured: string;
  readonly metric: string;
  readonly status: string;
  readonly formula: string;
  readonly unavailableTitle: string;
  readonly unavailableBody: string;
  readonly unauthorizedTitle: string;
  readonly emptyTitle: string;
  readonly missing: string;
};

export default function OperationsKpiContract({
  facts, rows, configured, unavailable, unauthorized, strings,
}: {
  facts: readonly Definition[];
  rows: readonly KpiDefinitionRow[];
  configured: boolean;
  unavailable: boolean;
  unauthorized: boolean;
  strings: KpiContractStrings;
}) {
  const columns: DataColumn<KpiDefinitionRow>[] = [
    { key: "metric", header: strings.metric, isRowHeader: true, cell: row => row.metric },
    {
      key: "status", header: strings.status, width: "min",
      cell: row => <StatusPill tone="neutral" ping={false}>{row.sourceStatus}</StatusPill>,
    },
    {
      key: "formula", header: strings.formula, width: "grow",
      cell: row => row.formula ?? strings.missing,
    },
  ];

  return (
    <Card as="section" labelledBy="operations-kpi-contract">
      <CardHeader
        level="h2"
        titleId="operations-kpi-contract"
        title={strings.title}
        description={configured ? strings.configured : strings.notConfigured}
      />
      <CardBody>
        {unavailable ? (
          <EmptyState
            icon="risk"
            title={strings.unavailableTitle}
            description={strings.unavailableBody}
          />
        ) : unauthorized ? (
          <EmptyState icon="restricted" title={strings.unauthorizedTitle} />
        ) : (
          <Stack gap="loose">
            <DefinitionList items={facts} />
            <DataTable
              rows={rows}
              columns={columns}
              getRowId={row => row.key}
              empty={{ icon: "radar", title: strings.emptyTitle }}
              density="compact"
            />
          </Stack>
        )}
      </CardBody>
    </Card>
  );
}
