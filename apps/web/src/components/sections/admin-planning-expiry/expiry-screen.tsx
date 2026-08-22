import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { PlanningExpiryData } from "@/features/admin-planning-expiry/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import ExpiryRuleSection from "./expiry-rule-section";
import styles from "./expiry-screen.module.css";

export default function ExpiryScreen({ data, locale }: {
  data: PlanningExpiryData;
  locale: Locale;
}) {
  const copy = getMessages(locale).adminPlanningExpiry;

  return (
    <ShellPageFrame
      breadcrumbLabel={copy.breadcrumb.label}
      breadcrumbs={[{ label: copy.breadcrumb.administration, href: "/admin" }, { label: copy.title }]}
      title={copy.title}
    >
      <div className={styles.stack}>
        <Card as="section" role="status">
          <CardHeader
            level="h2"
            title={copy.governance.heading}
            trailing={<StatusPill tone="info">{copy.governance.pill}</StatusPill>}
          />
          <CardBody gap="tight">
            <Text tone="secondary">{copy.governance.body}</Text>
          </CardBody>
        </Card>

        {data.readFailed ? (
          <Card as="section" role="alert">
            <CardHeader
              level="h2"
              title={copy.error.heading}
              trailing={<StatusPill tone="danger">{copy.error.pill}</StatusPill>}
            />
            <CardBody gap="tight">
              <Text tone="secondary">{copy.error.body}</Text>
            </CardBody>
          </Card>
        ) : null}

        {data.canConfigure ? null : (
          <Card as="section" role="status">
            <CardHeader
              level="h2"
              title={copy.readOnly.heading}
              trailing={<StatusPill tone="neutral">{copy.readOnly.pill}</StatusPill>}
            />
            <CardBody gap="tight">
              <Text tone="secondary">{copy.readOnly.body}</Text>
            </CardBody>
          </Card>
        )}

        {data.groups.map(group => (
          <ExpiryRuleSection
            key={group.ruleType}
            group={group}
            copy={copy}
            locale={locale}
            canConfigure={data.canConfigure}
          />
        ))}

        <Text tone="muted">{copy.scheduler.note}</Text>
      </div>
    </ShellPageFrame>
  );
}
