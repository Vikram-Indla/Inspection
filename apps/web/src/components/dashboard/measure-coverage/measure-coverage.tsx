import { formatCount, formatPercent } from "@/i18n/numbers";
import BarSeries, { type BarPoint } from "@/components/saqeel/charts/bar-series/bar-series";
import Gauge from "@/components/saqeel/charts/gauge/gauge";
import { Heading, Text } from "@/components/saqeel/type";
import type { MeasureCoverage } from "@/features/dashboard/strip";
import { fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./measure-coverage.module.css";

export type MeasureCoverageStrings = {
  readonly meterLabel: string;
  readonly meterAria: string;
  readonly ratio: string;
  readonly reasons: string;
  readonly reasonsAria: string;
  readonly allLive: string;
};

export default function MeasureCoverage({ coverage, locale, strings, headingId }: {
  coverage: MeasureCoverage;
  locale: Locale;
  strings: MeasureCoverageStrings;
  headingId: string;
}) {
  if (!coverage.total) return null;

  const counts = {
    live: formatCount(coverage.live, locale),
    total: formatCount(coverage.total, locale),
  };
  const points: readonly BarPoint[] = coverage.reasons.map(reason => ({
    key: reason.key,
    label: reason.label,
    value: reason.count,
    display: formatCount(reason.count, locale),
  }));
  const peak = Math.max(...coverage.reasons.map(reason => reason.count), 1);

  return (
    <div className={styles.root}>
      <Gauge
        percent={coverage.percent}
        display={formatPercent(coverage.percent, locale)}
        label={strings.meterLabel}
        caption={fill(strings.ratio, counts)}
        ariaLabel={fill(strings.meterAria, counts)}
        size="sm"
      />
      <div className={styles.reasons}>
        {points.length ? (
          <>
            <Heading level={3} visual="subheading" id={headingId}>{strings.reasons}</Heading>
            <BarSeries
              points={points}
              domainMax={peak}
              ariaLabel={strings.reasonsAria}
              barSize={30}
              labelWidth={112}
            />
          </>
        ) : (
          <Text tone="secondary">{strings.allLive}</Text>
        )}
      </div>
    </div>
  );
}
