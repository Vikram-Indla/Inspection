import type { ReactNode } from "react";
import { Badge, Card, CardHeader, Heading, Notice, Text, type LinearHeadingLevel, type LinearNoticeTone } from "@/components/experimental/linear";
import { Segmented, type SegmentedOption } from "@/components/experimental/linear-data";
import { DASHBOARD_VIEWS, scopeToSearchParams, type DashboardScope, type DashboardView } from "@/features/dashboard/scope";
import { getMessages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./parts.module.css";

export function DashboardNotice({ tone, pill, title, level = 2, children, actions }: {
  tone: LinearNoticeTone;
  pill: string;
  title: string;
  level?: LinearHeadingLevel;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Notice tone={tone} live="status">
      <div className={styles.metricHead}>
        <div className={styles.updated}>
          <Heading level={level} role="bodyLg">{title}</Heading>
          <Badge label={pill} />
        </div>
        {children}
        {actions}
      </div>
    </Notice>
  );
}

export function DashboardToolbar({ locale, scope, view, refreshedAt }: {
  locale: Locale;
  scope: DashboardScope;
  view: DashboardView;
  refreshedAt: number;
}) {
  const { dashboard } = getMessages(locale);
  const viewHref = (next: DashboardView) => {
    const query = scopeToSearchParams(scope);
    query.set("view", next);
    return localeHref(locale, `/dashboard?${query.toString()}`);
  };
  const options: SegmentedOption<DashboardView>[] = DASHBOARD_VIEWS.map(id => ({
    value: id, label: dashboard.perspective[id], href: viewHref(id),
  }));

  return (
    <header className={styles.toolbar}>
      <Segmented label={dashboard.perspective.label} options={options} current={view} />
      <p className={styles.updated}>
        <Text role="caption" tone="muted" as="span">{dashboard.updated.label}</Text>
        <Text role="caption" tone="strong" weight="medium" as="span" numeric>
          {formatDateTime(refreshedAt, locale, { hour12: true })}
        </Text>
      </p>
    </header>
  );
}

export function SectionCard({ id, title, description, actions, children }: {
  id: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card as="section" labelledBy={id}>
      <CardHeader level={2} titleId={id} title={title} description={description} actions={actions} />
      {children}
    </Card>
  );
}
