import { Badge, Heading, Text } from "@/components/experimental/linear";
import { DataTable, type TableColumn } from "@/components/experimental/linear-data";
import { BarSeries, Gauge, type BarPoint } from "@/components/experimental/linear-charts/charts";
import type { MeasureCoverage } from "@/features/dashboard/strip";
import type { MetricDisplay, MethodologyEntry } from "@/app/(app)/dashboard/dashboard-format";
import { fill } from "@/i18n/messages";
import { formatCount, formatPercent } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import { MethodologyDisclosure } from "./methodology";
import styles from "./parts.module.css";

export type CoverageStrings = {
  readonly meterLabel: string;
  readonly meterAria: string;
  readonly ratio: string;
  readonly reasons: string;
  readonly reasonsAria: string;
  readonly allLive: string;
};

export type RegisterStrings = {
  readonly methodology: string;
  readonly why: string;
  readonly measure: string;
  readonly state: string;
  readonly basis: string;
  readonly emptyTitle: string;
};

export function MeasureCoveragePanel({ coverage, locale, strings, headingId }: {
  coverage: MeasureCoverage;
  locale: Locale;
  strings: CoverageStrings;
  headingId: string;
}) {
  if (!coverage.total) return null;

  const counts = {
    live: formatCount(coverage.live, locale),
    total: formatCount(coverage.total, locale),
  };
  const peak = Math.max(...coverage.reasons.map(reason => reason.count), 1);
  const points: readonly BarPoint[] = coverage.reasons.map(reason => ({
    label: reason.label,
    percent: (reason.count / peak) * 100,
    display: formatCount(reason.count, locale),
  }));

  return (
    <div className={styles.coverage}>
      <div className={styles.coverageReasons}>
        <Gauge
          label={strings.meterLabel}
          percent={coverage.percent}
          display={formatPercent(coverage.percent, locale)}
        />
        <Text role="caption" tone="muted" numeric>{fill(strings.ratio, counts)}</Text>
      </div>
      <div className={styles.coverageReasons}>
        {points.length ? (
          <>
            <Heading level={3} role="bodyLg" id={headingId}>{strings.reasons}</Heading>
            <BarSeries label={strings.reasonsAria} points={points} tone={3} />
          </>
        ) : (
          <Text role="caption" tone="muted">{strings.allLive}</Text>
        )}
      </div>
    </div>
  );
}

export function RequirementRegister({ metrics, methodology, strings }: {
  metrics: readonly MetricDisplay[];
  methodology: Readonly<Record<string, MethodologyEntry>>;
  strings: RegisterStrings;
}) {
  const ordered = [...metrics].sort(
    (first, second) => Number(first.kind === "status") - Number(second.kind === "status"),
  );

  const columns: readonly TableColumn<MetricDisplay>[] = [
    {
      key: "measure",
      header: strings.measure,
      isRowHeader: true,
      cell: metric => <Text role="caption" as="span">{metric.title}</Text>,
    },
    {
      key: "state",
      header: strings.state,
      numeric: true,
      cell: metric => metric.kind === "status"
        ? <Badge label={metric.text} />
        : <Text role="caption" tone="strong" weight="medium" as="span" numeric>{metric.text}</Text>,
    },
    {
      key: "basis",
      header: strings.basis,
      cell: metric => (
        <MethodologyDisclosure
          entry={methodology[metric.metricId]}
          label={metric.kind === "status" ? strings.why : strings.methodology}
        />
      ),
    },
  ];

  return (
    <DataTable
      caption={strings.measure}
      columns={columns}
      rows={ordered}
      getRowId={metric => metric.metricId}
      empty={{ title: strings.emptyTitle }}
    />
  );
}
