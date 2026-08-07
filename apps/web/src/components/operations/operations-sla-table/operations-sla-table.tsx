import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import styles from "./operations-sla-table.module.css";

export type SlaAlertRow = {
  readonly id: string;
  readonly visitHref: string;
  readonly visitLabel: string;
  readonly factoryName: string;
  readonly deadline: string;
  readonly status: string;
  readonly overdue: boolean;
  readonly escalation: string | null;
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
      cell: row => (
        <Link className={styles.link} href={row.visitHref} prefetch={false}>
          <bdi>{row.visitLabel}</bdi>
        </Link>
      ),
    },
    { key: "factory", header: strings.factory, width: "grow", cell: row => row.factoryName },
    {
      key: "deadline", header: strings.deadline, numeric: true,
      cell: row => <span className={styles.muted}>{row.deadline}</span>,
    },
    {
      key: "status", header: strings.status,
      cell: row => (
        <StatusPill tone={row.overdue ? "danger" : "warning"} size="sm" ping>{row.status}</StatusPill>
      ),
    },
    {
      key: "escalation", header: strings.escalation, align: "end", width: "min",
      cell: row => row.escalation
        ? <StatusPill tone="neutral" size="sm">{row.escalation}</StatusPill>
        : MISSING,
    },
  ];

  return (
    <Card as="section" labelledBy="operations-sla">
      <CardHeader level="h2" titleId="operations-sla" title={strings.title} description={strings.description} />
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
