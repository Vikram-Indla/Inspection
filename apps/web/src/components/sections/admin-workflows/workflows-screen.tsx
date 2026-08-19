import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Text } from "@/components/saqeel/type";
import { adminWorkflowsMessages } from "@/features/admin-workflows/strings";
import type { WorkflowsView } from "@/features/admin-workflows/types";
import type { Locale } from "@/lib/i18n";
import SlaTable from "./sla-table";
import WorkflowVersionCard from "./workflow-version-card";
import styles from "./workflows.module.css";

export default function WorkflowsScreen({ data, locale }: { data: WorkflowsView; locale: Locale }) {
  const strings = adminWorkflowsMessages(locale);

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[{ label: strings.breadcrumb.root }, { label: strings.breadcrumb.leaf }]}
      description={strings.subtitle}
      title={strings.title}
    >
      <div className={styles.stack}>
        <Card as="section" role="note">
          <CardHeader level="h2" title={strings.banner.title} />
          <CardBody><Text tone="secondary">{strings.banner.body}</Text></CardBody>
        </Card>

        {data.loadError ? (
          <Card as="section" role="alert"><CardBody><Text tone="danger">{strings.loadError}</Text></CardBody></Card>
        ) : null}

        {!data.loadError && data.versions.length === 0 ? (
          <EmptyState icon="workflow" title={strings.empty.title} description={strings.empty.body} />
        ) : null}

        {data.versions.length > 0 ? (
          <div className={styles.versionStack}>
            {data.versions.map(version => (
              <WorkflowVersionCard key={version.id} version={version} strings={strings} locale={locale} />
            ))}
          </div>
        ) : null}

        <Card as="section">
          <CardHeader level="h2" title={strings.sla.title} />
          <CardBody>
            {data.calError
              ? <Text tone="secondary">{strings.sla.loadError}</Text>
              : <SlaTable calendars={data.calendars} strings={strings} />}
            <Text role="label" tone="muted">{strings.sla.note}</Text>
          </CardBody>
        </Card>
      </div>
    </ShellPageFrame>
  );
}
