import { Card, CardBody, CardGrid, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatCard from "@/components/saqeel/stat-card/stat-card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TrendBars, { type TrendPoint } from "@/components/saqeel/trend-bars/trend-bars";
import { Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import type { WorkloadData, WorkloadInspector } from "@/features/visits/workload";
import styles from "./visit-workload.module.css";

export type WorkloadStrings = ReturnType<
  typeof import("@/i18n/messages").getMessages
>["visits"]["workload"];

const PERCENT = 100;

function weekCaption(ms: number, locale: "ar" | "en"): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(ms));
}

function capacityCell(row: WorkloadInspector, cap: number, strings: WorkloadStrings) {
  if (row.peakDay === 0) return <Text as="span" tone="muted">{strings.noLoad}</Text>;
  const over = row.peakDay > cap;
  const filled = Math.min(PERCENT, Math.round((row.peakDay / cap) * PERCENT));
  return (
    <span className={styles.capacity}>
      <span aria-hidden="true">
        <TrendBars
          label={strings.columns.capacity}
          tone={over ? "danger" : "info"}
          points={[{ key: row.id, percent: filled, label: fill(strings.ofCap, { n: row.peakDay, cap }) }]}
        />
      </span>
      {over
        ? <StatusPill tone="danger">{fill(strings.overCap, { n: row.peakDay, cap })}</StatusPill>
        : <Text as="span" role="label" tone="secondary" numeric>{fill(strings.ofCap, { n: row.peakDay, cap })}</Text>}
    </span>
  );
}

function distributionCell(row: WorkloadInspector, data: WorkloadData, strings: WorkloadStrings, locale: "ar" | "en") {
  const points: readonly TrendPoint[] = row.weeks.map((count, index) => ({
    key: String(data.weekStarts[index]),
    percent: Math.round((count / data.weekPeak) * PERCENT),
    label: fill(strings.weekOf, { date: weekCaption(data.weekStarts[index], locale), n: count }),
  }));
  return <TrendBars points={points} tone="accent" label={strings.columns.distribution} />;
}

export default function VisitWorkload({ data, strings, locale }: {
  data: WorkloadData;
  strings: WorkloadStrings;
  locale: "ar" | "en";
}) {
  const columns: readonly DataColumn<WorkloadInspector>[] = [
    {
      key: "inspector",
      header: strings.columns.inspector,
      isRowHeader: true,
      cell: row => <Text as="span" role="bodyStrong" dir="auto">{row.name}</Text>,
    },
    {
      key: "distribution",
      header: strings.columns.distribution,
      cell: row => distributionCell(row, data, strings, locale),
    },
    {
      key: "window",
      header: strings.columns.window,
      align: "end",
      numeric: true,
      width: "min",
      cell: row => row.inWindow === 0
        ? <Text as="span" tone="muted">{strings.noLoad}</Text>
        : <Text as="span" role="label" numeric>{row.inWindow}</Text>,
    },
    {
      key: "later",
      header: strings.columns.later,
      align: "end",
      numeric: true,
      width: "min",
      cell: row => row.later === 0
        ? <Text as="span" tone="muted">{strings.noLoad}</Text>
        : <Text as="span" role="label" numeric>{row.later}</Text>,
    },
    {
      key: "total",
      header: strings.columns.total,
      align: "end",
      numeric: true,
      width: "min",
      cell: row => <Text as="span" role="bodyStrong" numeric>{row.total}</Text>,
    },
    {
      key: "capacity",
      header: strings.columns.capacity,
      cell: row => capacityCell(row, data.dailyCap, strings),
    },
  ];

  return (
    <>
      <CardGrid min="sm">
        <StatCard label={strings.kpi.inspectors} value={data.inspectors.length} />
        <StatCard label={strings.kpi.active} value={data.activeTotal} />
        <StatCard label={strings.kpi.later} value={data.laterTotal} />
        <StatCard label={strings.kpi.dailyCap} value={data.dailyCap} />
      </CardGrid>

      <Card as="section">
        <CardHeader level="h2" title={strings.heading} description={strings.note} />
        <CardBody>
          <DataTable
            rows={data.inspectors}
            columns={columns}
            getRowId={row => row.id}
            empty={{ icon: "calendar", title: strings.empty.title, description: strings.empty.body }}
          />
        </CardBody>
      </Card>
    </>
  );
}
