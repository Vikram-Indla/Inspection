import Gauge from "@/components/saqeel/charts/gauge/gauge";
import { Card, CardBody } from "@/components/saqeel/card/card";
import { Text } from "@/components/saqeel/type";
import type { LocalizationData } from "@/features/admin-localization/queries";
import type { AdminLocalizationMessages } from "@/features/admin-localization/strings";
import { fill } from "@/i18n/messages";
import { formatCount, formatPercent } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import styles from "./localization-coverage.module.css";

export default function LocalizationCoverage({ data, strings, locale }: {
  data: LocalizationData;
  strings: AdminLocalizationMessages;
  locale: Locale;
}) {
  const count = (value: number) => formatCount(value, locale);

  return (
    <Card>
      <CardBody>
        <div className={styles.gauges}>
          <Gauge
            ariaLabel={`${strings.coverage.arabic} ${formatPercent(data.coveragePercent, locale)}`}
            caption={fill(strings.coverage.arabicCaption, {
              translated: count(data.translated),
              total: count(data.total),
            })}
            display={formatPercent(data.coveragePercent, locale)}
            label={strings.coverage.arabic}
            percent={data.coveragePercent}
            series={0}
          />
          <Gauge
            ariaLabel={`${strings.coverage.reviewed} ${formatPercent(data.reviewedPercent, locale)}`}
            caption={fill(strings.coverage.reviewedCaption, {
              reviewed: count(data.reviewed),
              translated: count(data.translated),
            })}
            display={formatPercent(data.reviewedPercent, locale)}
            label={strings.coverage.reviewed}
            percent={data.reviewedPercent}
            series={2}
          />
          <div className={styles.aside}>
            <Text role="label" tone="secondary">{strings.coverage.runsLong}</Text>
            <Text role="bodyStrong" numeric>{count(data.runsLong)}</Text>
            <Text role="label" tone="muted">
              {fill(strings.coverage.runsLongCaption, { count: count(data.runsLong) })}
            </Text>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
