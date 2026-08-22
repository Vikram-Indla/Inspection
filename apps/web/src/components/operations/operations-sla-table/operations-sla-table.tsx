import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellLink, CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import InfoNote from "@/components/saqeel/info-note/info-note";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";

export type SlaEscalation = {
  readonly label: string;
  readonly configured: boolean;
};

export type SlaAlertRow = {
  readonly id: string;
  readonly visitHref: string;
  readonly visitLabel: string;
  readonly factoryName: string;
  readonly deadline: string;
  readonly status: string;
  readonly overdue: boolean;
  readonly escalation: SlaEscalation | null;
};

export type SlaTableStrings = {
  readonly title: string;
  readonly description: string;
  readonly visit: string;
  readonly factory: string;
  readonly deadline: string;
  readonly status: string;
  readonly escalation: string;
  readonly emptyTitle: string;
};

const MISSING = "—";

export default function OperationsSlaTable({ rows, strings }: {
  rows: readonly SlaAlertRow[];
  strings: SlaTableStrings;
}) {
  const columns: DataColumn<SlaAlertRow>[] = [
    {
      key: "visit", header: strings.visit, isRowHeader: true,
      cell: row => <CellLink href={row.visitHref}><bdi>{row.visitLabel}</bdi></CellLink>,
    },
    { key: "factory", header: strings.factory, cell: row => row.factoryName },
    {
      key: "deadline", header: strings.deadline, numeric: true,
      cell: row => <CellMuted>{row.deadline}</CellMuted>,
    },
    {
      key: "status", header: strings.status,
      cell: row => (
        <StatusPill tone={row.overdue ? "danger" : "warning"} ping>{row.status}</StatusPill>
      ),
    },
    {
      key: "escalation", header: strings.escalation, align: "end", width: "min",
      cell: row => row.escalation
        ? row.escalation.configured
          ? <StatusPill tone="neutral">{row.escalation.label}</StatusPill>
          : <Text as="span" tone="muted">{row.escalation.label}</Text>
        : MISSING,
    },
  ];

  return (
    <Card as="section" labelledBy="operations-sla">
      <CardHeader level="h2" titleId="operations-sla" title={strings.title}
        trailing={<InfoNote label={strings.title}>{strings.description}</InfoNote>} />
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
