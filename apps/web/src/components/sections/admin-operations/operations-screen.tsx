import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import InfoNote from "@/components/saqeel/info-note/info-note";
import BarSeries, { type BarPoint } from "@/components/saqeel/charts/bar-series/bar-series";
import StatCard from "@/components/saqeel/stat-card/stat-card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { adminOperationsMessages, errorSourceLabel } from "@/features/admin-operations/strings";
import type { OperationsView } from "@/features/admin-operations/types";
import { fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import OperationsErrorQueue from "./operations-error-queue";
import OperationsFlagVersions from "./operations-flag-versions";
import styles from "./operations.module.css";

export default function OperationsScreen({ data, locale }: { data: OperationsView; locale: Locale }) {
  const strings = adminOperationsMessages(locale);
  const failedSources = [
    data.errorsError ? strings.errorQueue.title : null,
    data.flagsError ? strings.flags.title : null,
    data.endpointsError ? strings.stats.endpoints : null,
  ].filter((value): value is string => Boolean(value));

  const chartPoints: readonly BarPoint[] = data.errorSourceCounts.map(entry => ({
    key: entry.key,
    label: errorSourceLabel(entry.key, locale),
    value: entry.count,
    display: String(entry.count),
  }));
  const chartMax = Math.max(1, ...chartPoints.map(point => point.value));
  const showChart = !data.errorsError && chartPoints.length > 0;

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.operations },
      ]}
      description={strings.subtitle}
      title={strings.title}
      actions={<StatusPill tone="info">{strings.badge}</StatusPill>}
    >
      <div className={styles.stack}>
        {failedSources.length ? (
          <Card as="section" role="alert">
            <CardHeader level="h2" title={strings.sourcesUnavailable.title} />
            <CardBody>
              <Text tone="secondary">{strings.sourcesUnavailable.body}</Text>
              <Text role="label" tone="muted">{failedSources.join(" · ")}</Text>
            </CardBody>
          </Card>
        ) : null}

        <div className={styles.statGrid}>
          <StatCard
            label={strings.stats.endpoints}
            status={data.endpointsError ? <StatusPill tone="warning">{strings.unavailable}</StatusPill> : undefined}
            value={data.endpointCount}
            sub={data.endpointsError ? undefined : fill(strings.stats.configured, { count: data.configuredCount })}
          />
          <StatCard
            label={strings.stats.openErrors}
            status={data.errorsError ? <StatusPill tone="warning">{strings.unavailable}</StatusPill> : undefined}
            value={data.openErrorCount}
            sub={data.errorsError ? undefined : strings.stats.noThroughput}
          />
          <StatCard
            label={strings.stats.publishedFlags}
            status={data.flagsError ? <StatusPill tone="warning">{strings.unavailable}</StatusPill> : undefined}
            value={data.publishedFlagCount}
            sub={data.flagsError ? undefined : strings.stats.sod}
          />
        </div>

        {showChart ? (
          <Card as="section">
            <CardHeader level="h2" title={strings.chart.title}
              trailing={<InfoNote label={strings.chart.title}>{strings.chart.caption}</InfoNote>} />
            <CardBody>
              <BarSeries points={chartPoints} domainMax={chartMax} ariaLabel={strings.chart.aria} rtl={locale === "ar"} />
            </CardBody>
          </Card>
        ) : null}

        <Card as="section">
          <CardHeader level="h2" title={strings.errorQueue.title} />
          <CardBody>
            {data.errorsError
              ? <Text tone="secondary">{strings.sourceUnavailable}</Text>
              : <OperationsErrorQueue errors={data.errors} strings={strings} locale={locale} />}
          </CardBody>
        </Card>

        <Card as="section">
          <CardHeader level="h2" title={strings.flags.title} />
          <CardBody>
            {data.flagsError
              ? <Text tone="secondary">{strings.sourceUnavailable}</Text>
              : <OperationsFlagVersions flags={data.flags} strings={strings} locale={locale} />}
          </CardBody>
        </Card>

        <Card as="section" role="note">
          <CardHeader level="h2" title={strings.policyHold.title} />
          <CardBody><Text tone="secondary">{strings.policyHold.body}</Text></CardBody>
        </Card>
      </div>
    </ShellPageFrame>
  );
}
