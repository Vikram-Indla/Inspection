import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import TemplateRegistry, { type TemplateStrings } from "@/app/(app)/admin/packages/TemplateRegistry";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { TemplatesData } from "@/features/admin-templates/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import ConfigurationJourney from "./configuration-journey";
import styles from "./admin-templates.module.css";

export default function TemplatesScreen({ data, locale }: {
  data: TemplatesData;
  locale: Locale;
}) {
  const copy = getMessages(locale).adminTemplates;
  const registryStrings: TemplateStrings = { ...copy.registry, datePicker: copy.datePicker };
  const breadcrumbs = [{ label: copy.breadcrumb.administration, href: "/admin" }, { label: copy.title }];

  return (
    <ShellPageFrame
      breadcrumbLabel={copy.breadcrumb.label}
      breadcrumbs={breadcrumbs}
      title={copy.title}
      actions={<StatusPill tone="info">{copy.context}</StatusPill>}
    >
      <div className={styles.stack}>
        <ConfigurationJourney current="templates" labels={copy.journey} />

        {data.state === "error" ? (
          <Card as="section" role="alert">
            <CardHeader level="h2" title={copy.error.title} />
            <CardBody gap="tight">
              <Text as="p" tone="secondary">{copy.error.body}</Text>
              <Button variant="link" href="/admin/templates" label={copy.error.retry}>{copy.error.retry}</Button>
            </CardBody>
          </Card>
        ) : null}

        {data.state === "ready" && data.canWrite ? (
          <TemplateRegistry templates={[...data.rows]} strings={registryStrings} locale={locale} />
        ) : null}

        {data.state === "ready" && !data.canWrite ? (
          <Card as="section" role="note">
            <CardHeader level="h2" title={copy.readonly.title} />
            <CardBody><Text as="p" tone="secondary">{copy.readonly.body}</Text></CardBody>
          </Card>
        ) : null}

        {data.state === "ready" && data.rows.length === 0 ? (
          <EmptyState icon="forms" title={copy.empty.title} description={copy.empty.body} />
        ) : null}
      </div>
    </ShellPageFrame>
  );
}
