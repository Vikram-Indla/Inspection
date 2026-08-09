import Link from "next/link";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { ActionState, EnforcementRow, PenaltyState } from "@/features/enforcement/rows";
import { recordTone } from "@/features/enforcement/rows";
import { fill } from "@/i18n/messages";
import styles from "./enforcement-table.module.css";

export type EnforcementTableStrings = {
  readonly caption: string;
  readonly factory: string;
  readonly licence: string;
  readonly inspection: string;
  readonly violation: string;
  readonly penalty: string;
  readonly inspector: string;
  readonly record: string;
  readonly action: string;
  readonly date: string;
  readonly open: string;
  readonly openLabel: string;
  readonly absent: string;
  readonly unknownFactory: string;
  readonly noReference: string;
  readonly penaltyNone: string;
  readonly penaltyRestricted: string;
  readonly penaltyMultiple: string;
  readonly penaltyIssued: string;
  readonly penaltyInformational: string;
  readonly amount: string;
  readonly actionNone: string;
  readonly actionOpen: string;
  readonly actionClosed: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
};

export default function EnforcementTable({ rows, selectedId, hrefFor, formatDay, formatAmount, labelFor, strings }: {
  rows: readonly EnforcementRow[];
  selectedId: string;
  hrefFor: (row: EnforcementRow) => string;
  formatDay: (iso: string) => string;
  formatAmount: (value: number) => string;
  labelFor: (value: string) => string;
  strings: EnforcementTableStrings;
}) {
  const absent = <span className={styles.absent}>{strings.absent}</span>;

  const penaltyCell = (state: PenaltyState) => {
    if (state.kind === "restricted") return <span className={styles.absent}>{strings.penaltyRestricted}</span>;
    if (state.kind === "none") return <span className={styles.absent}>{strings.penaltyNone}</span>;
    if (state.kind === "multiple") {
      return <span className={styles.warning}>{fill(strings.penaltyMultiple, { count: state.count })}</span>;
    }
    const { snapshot } = state;
    const name = snapshot.penaltyType ? labelFor(snapshot.penaltyType) : snapshot.penaltyRef;
    return (
      <span className={styles.stack}>
        <span>
          {name ?? absent}
          {snapshot.amount === null ? null : <> — <bdi>{fill(strings.amount, { amount: formatAmount(snapshot.amount) })}</bdi></>}
        </span>
        <span className={styles.caption}>
          {state.issued
            ? state.issuedAt ? `${strings.penaltyIssued} · ${formatDay(state.issuedAt)}` : strings.penaltyIssued
            : strings.penaltyInformational}
        </span>
      </span>
    );
  };

  const actionCell = (state: ActionState) => {
    if (state.kind === "none") return <span className={styles.absent}>{strings.actionNone}</span>;
    const label = state.kind === "open" ? strings.actionOpen : strings.actionClosed;
    return (
      <span className={styles.stack}>
        <StatusPill tone={state.kind === "open" ? "warning" : "success"}>{label}</StatusPill>
        <span className={styles.caption}>{state.forms.map(form => labelFor(form.form_type)).join(" · ")}</span>
      </span>
    );
  };

  const columns: readonly DataColumn<EnforcementRow>[] = [
    {
      key: "factory",
      header: strings.factory,
      isRowHeader: true,
      cell: row => (
        <span className={styles.stack}>
          <span className={styles.title}>{row.factory?.name ?? strings.unknownFactory}</span>
          {row.factory?.region ? <span className={styles.caption}>{row.factory.region}</span> : null}
        </span>
      ),
    },
    { key: "licence", header: strings.licence, cell: row => row.factory?.license_number ? <bdi className={styles.code}>{row.factory.license_number}</bdi> : absent },
    {
      key: "inspection",
      header: strings.inspection,
      cell: row => row.inspectionReference
        ? <bdi className={styles.code}>{row.inspectionReference}</bdi>
        : row.visitReference
          ? <bdi className={styles.code}>{row.visitReference}</bdi>
          : <span className={styles.absent}>{strings.noReference}</span>,
    },
    {
      key: "violation",
      header: strings.violation,
      cell: row => (
        <span className={styles.stack}>
          <span>{row.violationTitle ?? absent}</span>
          {row.violationCode ? <bdi className={styles.code}>{row.violationCode}</bdi> : null}
        </span>
      ),
    },
    { key: "penalty", header: strings.penalty, cell: row => penaltyCell(row.penalty) },
    { key: "inspector", header: strings.inspector, cell: row => row.inspector ?? absent },
    {
      key: "record",
      header: strings.record,
      cell: row => <StatusPill tone={recordTone(row.recordStatus)}>{labelFor(row.recordStatus)}</StatusPill>,
    },
    { key: "action", header: strings.action, cell: row => actionCell(row.action) },
    {
      key: "date",
      header: strings.date,
      numeric: true,
      cell: row => row.recordedAt ? <bdi className={styles.code}>{formatDay(row.recordedAt)}</bdi> : absent,
    },
    {
      key: "open",
      header: strings.open,
      width: "min",
      cell: row => (
        <Link className={styles.open} href={hrefFor(row)} aria-label={fill(strings.openLabel, { factory: row.factory?.name ?? strings.unknownFactory })}>
          {strings.open}
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      getRowSelected={row => row.id === selectedId}
      caption={strings.caption}
      density="compact"
      empty={{ icon: "search", title: strings.emptyTitle, description: strings.emptyBody }}
    />
  );
}
