import { type CSSProperties } from "react";
import { Metric, Text } from "@/components/saqeel/type";
import type { MeasureCoverage } from "@/features/dashboard/strip";
import { fill } from "@/i18n/messages";
import { formatCount, formatPercent } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import styles from "./measure-coverage.module.css";

export type MeasureCoverageStrings = {
  readonly meterLabel: string;
  readonly meterAria: string;
  readonly ratio: string;
  readonly allLive: string;
};

type SegmentTone = "live" | "blocked";

type Segment = {
  readonly key: string;
  readonly label: string;
  readonly count: number;
  readonly tone: SegmentTone;
};

type SegmentStyle = CSSProperties & Record<"--sqx-seg", string>;

export default function MeasureCoverage({ coverage, locale, strings }: {
  coverage: MeasureCoverage;
  locale: Locale;
  strings: MeasureCoverageStrings;
}) {
  if (!coverage.total) return null;

  const counts = {
    live: formatCount(coverage.live, locale),
    total: formatCount(coverage.total, locale),
  };
  const segments: readonly Segment[] = [
    { key: "live", label: strings.meterLabel, count: coverage.live, tone: "live" as const },
    ...coverage.reasons.map(reason => ({
      key: reason.key,
      label: reason.label,
      count: reason.count,
      tone: "blocked" as const,
    })),
  ].filter(segment => segment.count > 0);

  return (
    <figure className={styles.root} role="img" aria-label={fill(strings.meterAria, counts)}>
      <div className={styles.head}>
        <Metric>{formatPercent(coverage.percent, locale)}</Metric>
        <Text role="label" tone="muted" as="span">{fill(strings.ratio, counts)}</Text>
      </div>

      <div className={styles.track} aria-hidden="true">
        {segments.map(segment => (
          <span
            key={segment.key}
            className={styles.segment}
            data-tone={segment.tone}
            style={{ "--sqx-seg": String(segment.count) } as SegmentStyle}
          />
        ))}
      </div>


      {coverage.reasons.length === 0 ? (
        <Text role="label" tone="secondary" as="figcaption">{strings.allLive}</Text>
      ) : null}
    </figure>
  );
}
