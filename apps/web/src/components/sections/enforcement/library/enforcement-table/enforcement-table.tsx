import Link from "next/link";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { ActionState, EnforcementRow, PenaltyState } from "@/features/enforcement/rows";
import { recordTone } from "@/features/enforcement/rows";
import { fill } from "@/i18n/messages";
import styles from "./enforcement-table.module.css";
import { Mono, Text } from "@/components/saqeel/type";

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
  const absent = <Text as="span" tone="muted">{strings.absent}</Text>;

  const penaltyCell = (state: PenaltyState) => {
    if (state.kind === "restricted") return <Text as="span" tone="muted">{strings.penaltyRestricted}</Text>;
    if (state.kind === "none") return <Text as="span" tone="muted">{strings.penaltyNone}</Text>;
    if (state.kind === "multiple") {
      return <span className={styles.warning}><Text as="span" tone="inherit">{fill(strings.penaltyMultiple, { count: state.count })}</Text></span>;
    }
    const { snapshot } = state;
    const name = snapshot.penaltyType ? labelFor(snapshot.penaltyType) : snapshot.penaltyRef;
    return (
      <span className={styles.stack}>
        <span>
          {name ?? absent}
          {snapshot.amount === null ? null : <> — <bdi>{fill(strings.amount, { amount: formatAmount(snapshot.amount) })}</bdi></>}
        </span>
        <Text as="span" tone="muted">
          {state.issued
            ? state.issuedAt ? `${strings.penaltyIssued} · ${formatDay(state.issuedAt)}` : strings.penaltyIssued
            : strings.penaltyInformational}
        </Text>
      </span>
    );
  };

  const actionCell = (state: ActionState) => {
    if (state.kind === "none") return <Text as="span" tone="muted">{strings.actionNone}</Text>;
    const label = state.kind === "open" ? strings.actionOpen : strings.actionClosed;
    return (
      <span className={styles.stack}>
        <StatusPill tone={state.kind === "open" ? "warning" : "success"}>{label}</StatusPill>
        <Text as="span" tone="muted">{state.forms.map(form => labelFor(form.form_type)).join(" · ")}</Text>
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
          <Text as="span" role="bodyStrong">{row.factory?.name ?? strings.unknownFactory}</Text>
          {row.factory?.region ? <Text as="span" tone="muted">{row.factory.region}</Text> : null}
        </span>
      ),
    },
    { key: "licence", header: strings.licence, cell: row => row.factory?.license_number ? <bdi><Mono tone="muted">{row.factory.license_number}</Mono></bdi> : absent },
    {
      key: "inspection",
      header: strings.inspection,
      cell: row => row.inspectionReference
        ? <bdi><Mono tone="muted">{row.inspectionReference}</Mono></bdi>
        : row.visitReference
          ? <bdi><Mono tone="muted">{row.visitReference}</Mono></bdi>
          : <Text as="span" tone="muted">{strings.noReference}</Text>,
    },
    {
      key: "violation",
      header: strings.violation,
      cell: row => (
        <span className={styles.stack}>
          <span>{row.violationTitle ?? absent}</span>
          {row.violationCode ? <bdi><Mono tone="muted">{row.violationCode}</Mono></bdi> : null}
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
      cell: row => row.recordedAt ? <bdi><Mono tone="muted">{formatDay(row.recordedAt)}</Mono></bdi> : absent,
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
