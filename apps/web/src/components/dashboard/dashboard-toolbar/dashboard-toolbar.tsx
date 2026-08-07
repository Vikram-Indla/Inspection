import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import { DASHBOARD_VIEWS, scopeToSearchParams, type DashboardScope, type DashboardView } from "@/features/dashboard/scope";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import styles from "./dashboard-toolbar.module.css";

export default function DashboardToolbar({ locale, scope, view, refreshedAt }: {
  locale: Locale;
  scope: DashboardScope;
  view: DashboardView;
  refreshedAt: string;
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
    <header className={styles.toolbar}>
      <SegmentedControl items={items} value={view} label={dashboard.perspective.label} tone="accent" />
      <p className={styles.updated} title={dashboard.updated.timezone}>
        <span className={styles.updatedLabel}>{dashboard.updated.label}</span>
        <time className={styles.updatedValue}>{refreshedAt}</time>
      </p>
    </header>
  );
}
