import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { WorkspacePenalty, WorkspaceViolation } from "@/features/regulations/workspace-source";
import { configStatusTone } from "@/features/regulations/workspace-view";
import { fill } from "@/i18n/messages";
import styles from "./regulation-penalties.module.css";
import { Mono, Text } from "@/components/saqeel/type";

export type RegulationPenaltiesStrings = {
  readonly caption: string;
  readonly penalty: string;
  readonly type: string;
  readonly amount: string;
  readonly violation: string;
  readonly grace: string;
  readonly due: string;
  readonly legalBasis: string;
  readonly state: string;
  readonly days: string;
  readonly none: string;
  readonly noAmount: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly footnote: string;
};

export default function RegulationPenalties({ penalties, violations, formatAmount, labelFor, strings }: {
  penalties: readonly WorkspacePenalty[];
  violations: readonly WorkspaceViolation[];
  formatAmount: (value: number) => string;
  labelFor: (value: string) => string;
  strings: RegulationPenaltiesStrings;
}) {
  const absent = <Text as="span" tone="muted">{strings.none}</Text>;
  const violationById = new Map(violations.map(violation => [violation.id, violation]));
  const days = (value: number | null) => value === null ? absent : fill(strings.days, { days: value });

  const columns: readonly DataColumn<WorkspacePenalty>[] = [
    {
      key: "penalty",
      header: strings.penalty,
      isRowHeader: true,
      cell: penalty => <bdi><Mono tone="muted">{penalty.penalty_ref}</Mono></bdi>,
    },
    { key: "type", header: strings.type, cell: penalty => penalty.penalty_type ? labelFor(penalty.penalty_type) : absent },
    {
      key: "amount",
      header: strings.amount,
      align: "end",
      numeric: true,
      cell: penalty => penalty.amount === null
        ? <Text as="span" tone="muted">{strings.noAmount}</Text>
        : <bdi>{formatAmount(penalty.amount)}</bdi>,
    },
    {
      key: "violation",
      header: strings.violation,
      cell: penalty => {
        const violation = violationById.get(penalty.violation_code_id);
        return violation
          ? <span className={styles.identity}>
              <span>{violation.title}</span>
              <bdi><Mono tone="muted">{violation.code}</Mono></bdi>
            </span>
          : absent;
      },
    },
    { key: "grace", header: strings.grace, align: "end", numeric: true, cell: penalty => days(penalty.grace_period_days) },
    { key: "due", header: strings.due, align: "end", numeric: true, cell: penalty => days(penalty.due_period_days) },
    { key: "legalBasis", header: strings.legalBasis, cell: penalty => penalty.legal_basis ?? absent },
    {
      key: "state",
      header: strings.state,
      cell: penalty => <StatusPill tone={configStatusTone(penalty.status)}>{labelFor(penalty.status)}</StatusPill>,
    },
  ];

  return (
    <>
      <DataTable
        rows={penalties}
        columns={columns}
        getRowId={penalty => penalty.id}
        caption={strings.caption}
        density="compact"
        empty={{ title: strings.emptyTitle, description: strings.emptyBody }}
      />
      <p className={styles.footnote}>{strings.footnote}</p>
    </>
  );
}
