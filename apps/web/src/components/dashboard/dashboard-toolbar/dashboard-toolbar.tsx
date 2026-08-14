import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import Toolbar from "@/components/saqeel/toolbar/toolbar";
import { DASHBOARD_VIEWS, scopeToSearchParams, type DashboardScope, type DashboardView } from "@/features/dashboard/scope";
import { getMessages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./dashboard-toolbar.module.css";
import { Text } from "@/components/saqeel/type";

export default function DashboardToolbar({ locale, scope, view, refreshedAt }: {
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
  const items: SegmentedItem<DashboardView>[] = DASHBOARD_VIEWS.map(id => ({
    value: id, label: dashboard.perspective[id], href: viewHref(id),
  }));

  return (
    <Toolbar
      as="header"
      trailing={
        <p className={styles.updated} title={dashboard.updated.timezone}>
          <span>{dashboard.updated.label}</span>
          <Text as="time" role="bodyStrong" tone="secondary" numeric>
            {formatDateTime(refreshedAt, locale, { hour12: true })}
          </Text>
        </p>
      }
    >
      <SegmentedControl items={items} value={view} label={dashboard.perspective.label} tone="accent" />
    </Toolbar>
  );
}
