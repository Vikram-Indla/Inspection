import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Text } from "@/components/saqeel/type";
import type { IntegrationsView } from "@/features/admin-integrations/types";
import { adminIntegrationsMessages } from "@/features/admin-integrations/strings";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { humaniseEnum } from "@/lib/text";
import IntegrationActivity, { type ActivityItem } from "./integration-activity";
import IntegrationRegistry from "./integration-registry";
import IntegrationsFrame, { type FrameMetric, type FrameTab } from "./integrations-frame";
import IntegrationsGovernance from "./integrations-governance";
import styles from "./integrations.module.css";

export default function IntegrationsScreen({ data, locale }: { data: IntegrationsView; locale: Locale }) {
  const strings = adminIntegrationsMessages(locale);
  const na = strings.notConfigured;

  const metrics: readonly FrameMetric[] = [
    { key: "registered", label: strings.metrics.registered, value: data.endpointsFailed ? na : String(data.endpoints.length), note: strings.metrics.registeredNote },
    { key: "configured", label: strings.metrics.configured, value: data.endpointsFailed ? na : String(data.configuredCount), note: strings.metrics.configuredNote },
    { key: "events", label: strings.metrics.events, value: data.eventsFailed ? na : String(data.events.length), note: strings.metrics.eventsNote },
  ];

  const tabs: readonly FrameTab[] = [
    { key: "connections", label: strings.tabs.connections, href: "/admin/integrations", current: true },
    { key: "senai", label: strings.tabs.senai, href: "/admin/integrations/senai-data" },
    { key: "factory", label: strings.tabs.factory, href: "/admin/integrations/factory-data" },
    { key: "history", label: strings.tabs.history, href: "/admin/integrations#integration-events" },
  ];

  const eventItems: readonly ActivityItem[] = data.events.slice(0, 8).map(event => ({
    id: event.id,
    title: humaniseEnum(event.event_kind, locale),
    meta: `${event.event_kind} · ${event.direction}`,
    stamp: formatDateTime(event.occurred_at, locale),
    status: humaniseEnum(event.outcome, locale),
  }));

  const exportItems: readonly ActivityItem[] = data.exports.slice(0, 8).map(job => ({
    id: job.id,
    title: humaniseEnum(job.export_kind, locale),
    meta: `${job.export_kind} · ${job.purpose}`,
    stamp: formatDateTime(job.requested_at, locale),
    status: humaniseEnum(job.status, locale),
  }));

  return (
    <IntegrationsFrame strings={strings} metrics={metrics} tabs={tabs}>
      <div className={styles.stack}>
        <Card as="section" role="note">
          <CardHeader level="h2" title={strings.banner.title} />
          <CardBody><Text tone="secondary">{strings.banner.body}</Text></CardBody>
        </Card>

        <IntegrationRegistry endpoints={data.endpoints} failed={data.endpointsFailed} strings={strings} locale={locale} />

        <div className={styles.split} id="integration-events">
          <IntegrationActivity
            title={strings.events.title}
            help={strings.events.help}
            items={eventItems}
            failed={data.eventsFailed}
            error={strings.events.error}
            emptyIcon="notify"
            emptyTitle={strings.events.emptyTitle}
            emptyBody={strings.events.emptyBody}
            alertLabel={strings.events.title}
          />
          <IntegrationActivity
            title={strings.exports.title}
            help={strings.exports.help}
            items={exportItems}
            failed={data.exportsFailed}
            error={strings.exports.error}
            emptyIcon="export"
            emptyTitle={strings.exports.emptyTitle}
            emptyBody={strings.exports.emptyBody}
            alertLabel={strings.exports.title}
          />
        </div>

        <IntegrationsGovernance strings={strings} />
      </div>
    </IntegrationsFrame>
  );
}
