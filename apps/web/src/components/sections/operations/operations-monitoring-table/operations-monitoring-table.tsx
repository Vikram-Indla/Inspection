"use client";

import Link from "next/link";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { humaniseEnum, sentenceCase } from "@/lib/text";
import type { MonitorRow } from "@/app/(app)/operations/actions";
import styles from "./operations-monitoring-table.module.css";

export type MonitoringTableStrings = {
  readonly visit: string;
  readonly factory: string;
  readonly state: string;
  readonly geofence: string;
  readonly inspector: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly refreshedAt: string;
  readonly autoNote: string;
};

const STATE_TONE: Readonly<Record<string, StatusTone>> = {
  executing: "success",
  arrived: "success",
  on_the_way: "info",
  prepared: "info",
  new: "neutral",
  cancelled: "danger",
  blocked: "danger",
};

const GEOFENCE_TONE: Readonly<Record<string, StatusTone>> = {
  inside: "success",
  override: "warning",
};

const MISSING = "—";
const ID_PREVIEW = 8;

export default function OperationsMonitoringTable({ rows, refreshedAt, enumLabels, strings }: {
  rows: readonly MonitorRow[];
  refreshedAt: string;
  enumLabels: Readonly<Record<string, string>>;
  strings: MonitoringTableStrings;
}) {
  const label = (value: string) => sentenceCase(enumLabels[value] ?? humaniseEnum(value));

  const columns: DataColumn<MonitorRow>[] = [
    {
      key: "visit", header: strings.visit, isRowHeader: true,
      cell: row => (
        <Link className={styles.link} href={`/visits/${row.id}`} prefetch={false}>
          <bdi>{row.id.slice(0, ID_PREVIEW)}</bdi>
        </Link>
      ),
    },
    {
      key: "factory", header: strings.factory,      cell: row => row.factory_id
        ? <Link className={styles.link} href={`/factories/${row.factory_id}`} prefetch={false}>{row.factory_name ?? MISSING}</Link>
        : (row.factory_name ?? MISSING),
    },
    {
      key: "state", header: strings.state,
      cell: row => (
        <StatusPill tone={STATE_TONE[row.operational_state] ?? "neutral"} ping>
          {label(row.operational_state)}
        </StatusPill>
      ),
    },
    {
      key: "geofence", header: strings.geofence,
      cell: row => row.geofence
        ? <StatusPill tone={GEOFENCE_TONE[row.geofence] ?? "danger"}>{label(row.geofence)}</StatusPill>
        : <span className={styles.muted}>{MISSING}</span>,
    },
    {
      key: "inspector", header: strings.inspector,
      cell: row => row.inspector ?? <span className={styles.muted}>{MISSING}</span>,
    },
  ];

  return (
    <div className={styles.root}>
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={row => row.id}
        empty={{ icon: "radar", title: strings.emptyTitle, description: strings.emptyBody }}
      />
      <p className={styles.footnote}>
        {strings.refreshedAt}{" "}
        <time className={styles.time}>{refreshedAt.slice(11, 19)}</time>
        {" · "}{strings.autoNote}
      </p>
    </div>
  );
}
