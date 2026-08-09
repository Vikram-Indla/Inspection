import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { WorkspaceItem, WorkspaceViolation } from "@/features/regulations/workspace-source";
import { configStatusTone, itemsLinkedToViolation, violationLevelTone } from "@/features/regulations/workspace-view";
import { fill } from "@/i18n/messages";
import styles from "./regulation-violations.module.css";

export type RegulationViolationsStrings = {
  readonly caption: string;
  readonly violation: string;
  readonly level: string;
  readonly category: string;
  readonly applicability: string;
  readonly correctiveAction: string;
  readonly grace: string;
  readonly raisedBy: string;
  readonly state: string;
  readonly graceDays: string;
  readonly none: string;
  readonly notLinked: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly footnote: string;
};

export default function RegulationViolations({ violations, items, labelFor, strings }: {
  violations: readonly WorkspaceViolation[];
  items: readonly WorkspaceItem[];
  labelFor: (value: string) => string;
  strings: RegulationViolationsStrings;
}) {
  const absent = <span className={styles.absent}>{strings.none}</span>;

  const columns: readonly DataColumn<WorkspaceViolation>[] = [
    {
      key: "violation",
      header: strings.violation,
      isRowHeader: true,
      cell: violation => (
        <span className={styles.identity}>
          <span className={styles.title}>{violation.title}</span>
          <bdi className={styles.code}>{violation.code}</bdi>
        </span>
      ),
    },
    {
      key: "level",
      header: strings.level,
      cell: violation => <StatusPill tone={violationLevelTone(violation.level)}>{violation.level}</StatusPill>,
    },
    { key: "category", header: strings.category, cell: violation => violation.category ? labelFor(violation.category) : absent },
    { key: "applicability", header: strings.applicability, cell: violation => violation.applicability ?? absent },
    { key: "correctiveAction", header: strings.correctiveAction, cell: violation => violation.corrective_action ?? absent },
    {
      key: "grace",
      header: strings.grace,
      align: "end",
      numeric: true,
      cell: violation => violation.grace_period_days === null
        ? absent
        : fill(strings.graceDays, { days: violation.grace_period_days }),
    },
    {
      key: "raisedBy",
      header: strings.raisedBy,
      cell: violation => {
        const linked = itemsLinkedToViolation(items, violation.code);
        return linked.length
          ? <span className={styles.codes}>{linked.map(item => <bdi className={styles.code} key={item.id}>{item.code}</bdi>)}</span>
          : <span className={styles.absent}>{strings.notLinked}</span>;
      },
    },
    {
      key: "state",
      header: strings.state,
      cell: violation => <StatusPill tone={configStatusTone(violation.status)}>{labelFor(violation.status)}</StatusPill>,
    },
  ];

  return (
    <>
      <DataTable
        rows={violations}
        columns={columns}
        getRowId={violation => violation.id}
        caption={strings.caption}
        density="compact"
        empty={{ title: strings.emptyTitle, description: strings.emptyBody }}
      />
      <p className={styles.footnote}>{strings.footnote}</p>
    </>
  );
}
