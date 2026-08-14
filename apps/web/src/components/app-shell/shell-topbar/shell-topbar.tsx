import Link from "next/link";
import { type ReactNode } from "react";
import NotificationBell from "@/components/notifications/notification-bell";
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

export default async function ShellTopbar({ view, mobileNav }: {
  view: ShellView;
  mobileNav: ReactNode;
}) {
  const locale = await getLocale();
  const { common, shell } = getMessages(locale);
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
            initialFrom=""
            initialTo=""
            initialRegion=""
            locale={locale}
            strings={{
              dateScope: common.field.dateScope,
              from: common.field.from,
              to: common.field.to,
              apply: common.action.apply,
              previousMonth: common.action.previousMonth,
              nextMonth: common.action.nextMonth,
              regionScope: common.field.regionScope,
              allRegions: common.scope.allRegions,
              anyDate: common.scope.anyDate,
              notApplicable: common.state.notApplicable,
              presets: common.scope,
            }}
          />
        </div>
      )}

      <div className={styles.actions}>
        <ShellLocaleToggle locale={locale} label={common.field.language} />
        <ShellThemeToggle
          labels={{
            light: shell.theme.light,
            dark: shell.theme.dark,
          }}
        />
        <NotificationBell strings={getNotificationStrings(locale)} locale={locale} fieldOnly={view.isFieldOnly} />
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
