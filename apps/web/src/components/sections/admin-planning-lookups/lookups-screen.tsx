import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { PlanningLookupsData } from "@/features/admin-planning-lookups/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import LookupsManager from "./lookups-manager";
import styles from "./lookups-screen.module.css";

export default function LookupsScreen({ data, locale }: {
  data: PlanningLookupsData;
  locale: Locale;
}) {
  const copy = getMessages(locale).adminPlanningLookups;

  return (
    <ShellPageFrame
      breadcrumbLabel={copy.breadcrumb.label}
      breadcrumbs={[{ label: copy.breadcrumb.administration, href: "/admin" }, { label: copy.title }]}
      title={copy.title}
      description={copy.subtitle}
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

        <LookupsManager
          rows={data.rows}
          kinds={data.kinds}
          canConfigure={data.canConfigure}
          locale={locale === "ar" ? "ar" : "en"}
          copy={copy}
        />

        <Text tone="muted">{copy.deleteNote}</Text>
      </div>
    </ShellPageFrame>
  );
}
