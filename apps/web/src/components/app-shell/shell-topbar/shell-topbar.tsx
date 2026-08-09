import Link from "next/link";
import { type ReactNode } from "react";
import NotificationBell from "@/components/NotificationBell";
import Icon from "@/components/saqeel/icon/icon";
import { getNotificationStrings } from "@/features/shell/notification-strings";
import type { ShellView } from "@/features/shell/types";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import ShellAdminPalette from "./shell-admin-palette";
import ShellLocaleToggle from "./shell-locale-toggle";
import ShellScopeControls from "./shell-scope-controls";
import ShellSearch from "./shell-search";
import ShellThemeToggle from "./shell-theme-toggle";
import ShellUserMenu from "./shell-user-menu";
import styles from "./shell-topbar.module.css";

function isoDay(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from: isoDay(from), to: isoDay(to) };
}

export default async function ShellTopbar({ view, mobileNav }: {
  view: ShellView;
  mobileNav: ReactNode;
}) {
  const locale = await getLocale();
  const { common, shell } = getMessages(locale);
  const range = defaultDateRange();
  const administrationItems = view.groups.find(group => group.isAdministration)?.items ?? [];
  const navigationItems = view.groups.flatMap(group => group.items);
  const aiLabel = shell.aiInsights;

  return (
    <header className={styles.topbar}>
      {mobileNav}

      {view.isAdminWorkspace ? (
        <ShellAdminPalette
          items={administrationItems}
          locale={locale}
          strings={{
            open: shell.admin.open,
            title: shell.admin.title,
            search: shell.admin.search,
            empty: shell.admin.empty,
            close: common.action.close,
            resultsOne: shell.admin.resultsOne,
            resultsOther: shell.admin.resultsOther,
          }}
        />
      ) : (
        <div className={styles.controls}>
          <ShellSearch
            isFieldOnly={view.isFieldOnly}
            locale={locale}
            navigationItems={navigationItems}
            strings={{
              placeholder: shell.search.placeholder,
              results: shell.search.results,
              empty: shell.search.empty,
              loading: shell.search.loading,
              failed: shell.search.unavailable,
              navigation: common.field.navigation,
            }}
          />
          <ShellScopeControls
            scope={view.scope}
            regions={view.regions}
            initialFrom={range.from}
            initialTo={range.to}
            initialRegion=""
            locale={locale}
            strings={{
              dateScope: common.field.dateScope,
              last30Days: common.scope.last30Days,
              last7Days: common.scope.last7Days,
              previousMonth: common.scope.previousMonth,
              nextMonth: common.scope.nextMonth,
              thisMonth: common.scope.thisMonth,
              thisQuarter: common.scope.thisQuarter,
              thisYear: common.scope.thisYear,
              today: common.scope.today,
              yesterday: common.scope.yesterday,
              from: common.field.from,
              to: common.field.to,
              apply: common.action.apply,
              regionScope: common.field.regionScope,
              allRegions: common.scope.allRegions,
              notApplicable: common.state.notApplicable,
            }}
          />
        </div>
      )}

      <div className={styles.actions}>
        <ShellLocaleToggle locale={locale} label={common.field.language} />
        <ShellThemeToggle
          labels={{
            system: shell.theme.system,
            light: shell.theme.light,
            dark: shell.theme.dark,
          }}
        />
        <NotificationBell strings={await getNotificationStrings()} locale={locale} fieldOnly={view.isFieldOnly} />
        <Link className={styles.aiButton} href={localeHref(locale, "/ai/suggestions")} aria-label={aiLabel} title={aiLabel} prefetch={false}>
          <Icon name="ai" />
        </Link>
        <ShellUserMenu
          identity={view.identity}
          locale={locale}
          strings={{
            account: common.field.account,
            roles: common.field.roles,
            region: common.field.regionScope,
            profileSettings: common.field.profileSettings,
            signOut: common.action.signOut,
          }}
        />
      </div>
    </header>
  );
}
