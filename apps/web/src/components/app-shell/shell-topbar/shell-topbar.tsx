import { type ReactNode } from "react";
import NotificationBell from "@/components/NotificationBell";
import Button from "@/components/saqeel/button/button";
import Icon from "@/components/saqeel/icon/icon";
import { getNotificationStrings } from "@/features/shell/notification-strings";
import type { ShellView } from "@/features/shell/types";
import { useT } from "@/lib/i18n";
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
  const { t, locale } = await useT();
  const ar = locale === "ar";
  const range = defaultDateRange();
  const administrationItems = view.groups.find(group => group.isAdministration)?.items ?? [];
  const navigationItems = view.groups.flatMap(group => group.items);
  const aiLabel = t("shell.aiEntry", ar ? "رؤى الذكاء الاصطناعي" : "AI Insights");

  return (
    <header className={styles.topbar}>
      {mobileNav}

      {view.isAdminWorkspace ? (
        <ShellAdminPalette
          items={administrationItems}
          locale={locale}
          strings={{
            open: ar ? "فتح أدوات الإدارة" : "Open admin tools",
            title: ar ? "الانتقال إلى أداة إدارية" : "Go to an admin tool",
            search: ar ? "ابحث في أدوات الإدارة المسموح بها" : "Search allowed admin tools",
            empty: ar ? "لا توجد أدوات مطابقة" : "No matching tools",
            close: ar ? "إغلاق" : "Close",
            resultsOne: ar ? "{count} نتيجة مسموح بها" : "{count} allowed result",
            resultsOther: ar ? "{count} نتيجة مسموح بها" : "{count} allowed results",
          }}
        />
      ) : (
        <div className={styles.controls}>
          <ShellSearch
            isFieldOnly={view.isFieldOnly}
            locale={locale}
            navigationItems={navigationItems}
            strings={{
              placeholder: t("shell.search", ar ? "ابحث عن مصنع أو سجل تجاري أو رخصة أو تفتيش…" : "Search factory, CR, license, inspection…"),
              results: t("shell.searchResults", ar ? "نتائج البحث العام" : "Global search results"),
              empty: t("shell.noSearchResults", ar ? "لا توجد نتائج متاحة لك" : "No results available to you"),
              loading: t("shell.searchLoading", ar ? "جارٍ البحث…" : "Searching…"),
              failed: t("shell.searchUnavailable", ar ? "البحث غير متاح الآن" : "Search not available right now"),
              navigation: t("shell.navigation", ar ? "وجهة" : "Navigation"),
            }}
          />
          <ShellScopeControls
            scope={view.scope}
            regions={view.regions}
            initialFrom={range.from}
            initialTo={range.to}
            initialRegion=""
            strings={{
              dateScope: t("shell.dateScope", ar ? "نطاق التاريخ" : "Date scope"),
              last30Days: t("shell.last30Days", ar ? "آخر 30 يوماً" : "Last 30 days"),
              from: t("shell.from", ar ? "من" : "From"),
              to: t("shell.to", ar ? "إلى" : "To"),
              apply: t("shell.apply", ar ? "تطبيق" : "Apply"),
              regionScope: t("shell.regionScope", ar ? "نطاق المنطقة" : "Region scope"),
              allRegions: t("shell.allRegions", ar ? "جميع المناطق" : "All Regions"),
              notApplicable: t("shell.notApplicable", ar ? "غير منطبق على هذه الصفحة" : "Not applicable on this page"),
            }}
          />
        </div>
      )}

      <div className={styles.actions}>
        <ShellLocaleToggle locale={locale} label={t("shell.language", ar ? "اللغة" : "Language")} />
        <ShellThemeToggle
          labels={{
            system: t("theme.system", ar ? "تتبع النظام" : "Follow system"),
            light: t("theme.light", ar ? "الوضع الفاتح" : "Light mode"),
            dark: t("theme.dark", ar ? "الوضع الداكن" : "Dark mode"),
          }}
        />
        <NotificationBell strings={await getNotificationStrings()} locale={locale} fieldOnly={view.isFieldOnly} />
        <Button variant="ai" icon="ai" href="/ai/suggestions" label={aiLabel} compactLabel>
          {aiLabel}
        </Button>
        <ShellUserMenu
          identity={view.identity}
          strings={{
            account: t("shell.account", ar ? "الحساب" : "Account"),
            roles: t("shell.roles", ar ? "الأدوار" : "Roles"),
            region: t("shell.regionScope", ar ? "نطاق المنطقة" : "Region scope"),
            profileSettings: t("shell.profileSettings", ar ? "إعدادات الملف الشخصي" : "Profile settings"),
            signOut: t("nav.signout", ar ? "تسجيل الخروج" : "Sign out"),
          }}
        />
      </div>
    </header>
  );
}
