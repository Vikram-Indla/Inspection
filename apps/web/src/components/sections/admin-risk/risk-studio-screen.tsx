import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Metric, Overline, Text } from "@/components/saqeel/type";
import RiskSectionNav from "@/components/sections/admin-risk-models/risk-section-nav";
import type { RiskSettingsData } from "@/features/admin-risk/types";
import { getMessages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import RiskForm from "./risk-form";
import styles from "./admin-risk.module.css";

export default function RiskStudioScreen({ data, locale }: {
  data: RiskSettingsData;
  locale: Locale;
}) {
  const copy = getMessages(locale).adminRisk;
  const ready = data.state === "ready" ? data : null;
  const breadcrumbs = [{ label: copy.breadcrumb.administration, href: "/admin" }, { label: copy.title }];

  const metrics = [
    { label: copy.metric.total, value: ready ? ready.weightTotalPct : copy.notConfigured, note: copy.metric.totalNote },
    { label: copy.metric.factors, value: ready ? String(ready.factorCount) : copy.notConfigured, note: copy.metric.factorsNote },
    { label: copy.metric.version, value: ready ? ready.versionLabel : copy.notConfigured, note: copy.metric.versionNote },
  ];

  return (
    <ShellPageFrame breadcrumbLabel={copy.breadcrumb.label} breadcrumbs={breadcrumbs} title={copy.title}>
      <div className={styles.stack}>
        <RiskSectionNav current="/admin/risk" labels={getMessages(locale).adminRiskModels.nav} />

        <div className={styles.metrics}>
          {metrics.map(metric => (
            <div key={metric.label} className={styles.metricCard}>
              <Overline>{metric.label}</Overline>
              <Metric>{metric.value}</Metric>
              <Text role="label" tone="muted" as="p">{metric.note}</Text>
            </div>
          ))}
        </div>

        <Card as="section" role="note">
          <CardHeader level="h2" title={copy.banner.title} />
          <CardBody><Text tone="secondary">{copy.banner.body}</Text></CardBody>
        </Card>

        {data.state === "error" ? (
          <Card as="section" role="alert">
            <CardHeader level="h2" title={copy.error.title} />
            <CardBody><Text tone="secondary">{copy.error.body}</Text></CardBody>
          </Card>
        ) : null}

        {data.state === "empty" ? (
          <EmptyState icon="risk" title={copy.empty.title} description={copy.empty.body} />
        ) : null}

        {ready ? (
          <RiskForm
            factors={ready.factors}
            lowMax={ready.lowMax}
            medMax={ready.medMax}
            updatedAtLabel={ready.updatedAt ? formatDateTime(ready.updatedAt, locale) : "—"}
            labels={copy.form}
            saveErrors={{
              weight_range: copy.saveError.weightRange,
              weight_sum: copy.saveError.weightSum,
              band_bounds: copy.saveError.bandBounds,
              provider: copy.saveError.provider,
            }}
          />
        ) : null}

        <div className={styles.footer}>
          <NotYetBoundary
            title={copy.trace.title}
            consequence={copy.trace.desc}
            seam="NEEDS_FACTORY_SCORING_INPUTS — per-factory trace"
            prerequisites={[copy.trace.pre1, copy.trace.pre2]}
            notAvailableLabel={copy.trace.notYet}
            detailLabel={copy.trace.whyPrereq}
          />

          <Card as="section" role="note" labelledBy="risk-reconstruction">
            <CardHeader level="h2" titleId="risk-reconstruction" title={copy.reconstruction.label} />
            <CardBody><Text as="p" tone="secondary">{copy.reconstruction.note}</Text></CardBody>
          </Card>

          <div className={styles.span}>
            <Card as="section" role="note" labelledBy="risk-governance">
              <CardHeader level="h2" titleId="risk-governance" title={copy.governance.label} />
              <CardBody>
                <div className={styles.governance}>
                  <Text as="p" tone="secondary">{copy.governance.sum}</Text>
                  <Text as="p" tone="secondary">{copy.governance.rls}</Text>
                  <Text as="p" tone="secondary">{copy.governance.trace}</Text>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </ShellPageFrame>
  );
}
