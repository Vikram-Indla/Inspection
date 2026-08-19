import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Text } from "@/components/saqeel/type";
import type { RiskModelsData } from "@/features/admin-risk-models/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import RiskComposer from "./risk-composer";
import RiskModelCard from "./risk-model-card";
import RiskSectionNav from "./risk-section-nav";
import styles from "./risk-models.module.css";

export default function RiskModelsScreen({ data, locale }: {
  data: RiskModelsData;
  locale: Locale;
}) {
  const copy = getMessages(locale).adminRiskModels;
  const nav = <RiskSectionNav current="/admin/risk/models" labels={copy.nav} />;
  const breadcrumbs = [{ label: copy.breadcrumb.administration, href: "/admin" }, { label: copy.title }];

  if (!data.enabled) {
    return (
      <ShellPageFrame breadcrumbLabel={copy.breadcrumb.label} breadcrumbs={breadcrumbs} title={copy.title}>
        <div className={styles.stack}>
          {nav}
          <NotYetBoundary
            title={copy.title}
            consequence={copy.off.consequence}
            seam="FEATURE_RISK_WORKBENCH=off"
            notAvailableLabel={copy.off.notAvailable}
            detailLabel={copy.off.whyPrereq}
          />
        </div>
      </ShellPageFrame>
    );
  }

  return (
    <ShellPageFrame breadcrumbLabel={copy.breadcrumb.label} breadcrumbs={breadcrumbs} title={copy.title}>
      <div className={styles.stack}>
        {nav}
        <Card as="section" role="note">
          <CardHeader level="h2" title={copy.banner.title} />
          <CardBody><Text tone="secondary">{copy.banner.body}</Text></CardBody>
        </Card>

        {data.readFailed ? (
          <Card as="section" role="alert"><CardHeader level="h2" title={copy.error} /></Card>
        ) : null}

        <RiskComposer copy={copy} />

        {data.rows.length === 0 && !data.readFailed ? (
          <EmptyState icon="risk" title={copy.empty.title} description={copy.empty.body} />
        ) : (
          <div className={styles.modelList}>
            {data.rows.map(model => <RiskModelCard key={model.id} model={model} copy={copy} />)}
          </div>
        )}
      </div>
    </ShellPageFrame>
  );
}
