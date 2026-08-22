import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import GovernanceNote from "@/components/saqeel/governance-note/governance-note";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import { PLANNING_CAPABILITIES } from "@/features/admin-planning-status/data";
import type { PlanningStatusData } from "@/features/admin-planning-status/queries";
import { getMessages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { humaniseEnum } from "@/lib/text";
import TransitionsTable from "./transitions-table";
import styles from "./status-screen.module.css";

export default function StatusScreen({ data, locale }: {
  data: PlanningStatusData;
  locale: Locale;
}) {
  const copy = getMessages(locale).adminPlanningStatus;
  const lang = locale === "ar" ? "ar" : "en";

  const stateLabel = (key: string): string =>
    copy.states[key as keyof typeof copy.states] ?? humaniseEnum(key, lang);

  const capabilityItems = PLANNING_CAPABILITIES.map(({ key }) => ({
    label: copy.capabilities[key].label,
    value: copy.capabilities[key].effect,
  }));

  const sourceLine = [
    copy.source.showing,
    data.versionLabel ?? "",
    data.effectiveFrom ? `${copy.source.effectiveFrom} ${formatDate(data.effectiveFrom, lang)}` : "",
  ].filter(Boolean).join(" · ");

  return (
    <ShellPageFrame
      breadcrumbLabel={copy.breadcrumb.label}
      breadcrumbs={[{ label: copy.breadcrumb.administration, href: "/admin" }, { label: copy.title }]}
      title={copy.title}
      actions={<><StatusPill tone="neutral" ping={false}>{copy.readOnlyPill}</StatusPill><GovernanceNote label={copy.governance.heading} lines={[copy.governance.body]} /><Button href="/admin/workflows" prefetch={false} variant="link" size="sm">{copy.governance.link}</Button></>}
    >
      <div className={styles.stack}>
        {data.isFallback ? (
          <Card as="section" role="status">
            <CardHeader
              level="h2"
              title={copy.fallback.heading}
              trailing={<StatusPill tone="warning">{copy.fallback.pill}</StatusPill>}
            />
            <CardBody gap="tight">
              <Text tone="secondary">{data.readFailed ? copy.fallback.error : copy.fallback.none}</Text>
            </CardBody>
          </Card>
        ) : (
          <Text tone="muted">{sourceLine}</Text>
        )}

        <section className={styles.section}>
          <Heading level={2} visual="label">{copy.sections.states}</Heading>
          <div className={styles.chips}>
            {data.states.map(state => (
              <span key={state} className={styles.chip}>
                <Text role="label" tone="secondary" as="span" dir="auto">{stateLabel(state)}</Text>
              </span>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <Heading level={2} visual="label">{copy.sections.transitions}</Heading>
          <TransitionsTable transitions={data.transitions} isFallback={data.isFallback} locale={lang} copy={copy} />
        </section>

        <section className={styles.section}>
          <Heading level={2} visual="label">{copy.sections.capabilities}</Heading>
          <DefinitionList items={capabilityItems} columns="two" />
          <Text tone="muted">{copy.capabilitiesNote}</Text>
        </section>
      </div>
    </ShellPageFrame>
  );
}
