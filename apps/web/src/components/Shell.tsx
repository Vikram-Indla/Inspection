import { redirect } from "next/navigation";
import { localeHref } from "@/lib/locale-path";
import { type ReactNode } from "react";
import { getRoleTitles, getShellRegions, getUserProfile, getUserRoles } from "@/lib/persona";
import { useT } from "@/lib/i18n";
import { getServerUser } from "@/lib/supabase-server";
import { buildShellNavigation } from "@/lib/shell-navigation";
import ShellClient, { type ShellClientStrings } from "@/components/ShellClient";
import { Heading } from "@/components/saqeel/type";
import { getNotificationStrings } from "@/features/shell/notification-strings";

const loadShellData = async () => {
  const [{ t, locale }, { data: { user } }] = await Promise.all([
    useT(),
    getServerUser(),
  ]);
  if (!user) {
    return { t, locale, user, roles: [] as string[], roleTitles: [] as string[], regions: [] as string[], profile: null };
  }
  const [{ data: roleRows }, regionRead, profileRead, titleRead] = await Promise.all([
    getUserRoles(user.id),
    getShellRegions(),
    getUserProfile(user.id),
    getRoleTitles(),
  ]);
  const roles = Array.from(new Set((roleRows ?? []).map(row => row.role_key))).sort();
  const titleByKey = new Map((titleRead.data ?? []).map(row => [row.role_key, row.title]));
  // A role_key with no configured title falls back to the key itself; it is
  // never dropped, because a silently shorter list would understate access.
  const roleTitles = roles.map(role => titleByKey.get(role) ?? role);
  const regions = regionRead.error
    ? []
    : Array.from(new Set((regionRead.data ?? []).map(row => row.region).filter((value): value is string => !!value))).sort();
  return { t, locale, user, roles, roleTitles, regions, profile: profileRead.data ?? null };
};

/**
 * Compatibility no-op for the three pages that used to start per-page shell
 * reads. K-001 moved those reads into the persistent `(app)` layout; starting
 * them from a page again would defeat that boundary.
 */
export function preloadShell(current: string) {
  void current;
}

export async function AppShell({ children }: { children: ReactNode }) {
  const { t, locale, user, roles, roleTitles, regions, profile } = await loadShellData();
  if (!user) {
    // SCR-PWA-001: a deep link into the field channel while signed out lands
    // on the field-specific biometric sign-in (SAQEEL Field Login.dc.html),
    // matching the /field top-level entry — not the desktop /login
    // story-panel surface.
    redirect(localeHref(locale, "/login"));
  }
  const groups = buildShellNavigation(roles).map(group => ({
    id: group.id,
    labelEn: group.labelEn,
    labelAr: group.labelAr,
    // The shell catalogue already carries reviewed bilingual labels. Do not
    // allow a stale/incorrect runtime catalogue row to turn the Arabic rail
    // back into English.
    label: locale === "ar" ? group.labelAr : t(group.labelKey, group.labelEn),
    items: group.items.map(item => ({
      id: item.id,
      labelEn: item.labelEn,
      labelAr: item.labelAr,
      label: locale === "ar" ? item.labelAr : t(item.labelKey, item.labelEn),
      href: item.href,
      icon: item.icon,
      businessTab: item.businessTab,
      badge: item.badge,
      enabled: item.enabled,
      disabledReason: item.disabledReasonKey
        ? t(item.disabledReasonKey, locale === "ar" ? item.disabledReasonAr! : item.disabledReasonEn!)
        : undefined,
      parentId: item.parentId,
      parentLabelEn: item.parentLabelEn,
      parentLabelAr: item.parentLabelAr,
      parentLabel: item.parentLabelKey
        ? locale === "ar"
          ? item.parentLabelAr!
          : t(item.parentLabelKey, item.parentLabelEn!)
        : undefined,
    })),
  }));

  const shellStrings: ShellClientStrings = {
    primary: t("nav.primary", locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"),
    openMenu: t("shell.openMenu", locale === "ar" ? "فتح قائمة التنقل" : "Open navigation"),
    closeMenu: t("shell.closeMenu", locale === "ar" ? "إغلاق قائمة التنقل" : "Close navigation"),
    collapse: t("shell.collapse", locale === "ar" ? "طي القائمة" : "Collapse navigation"),
    expand: t("shell.expand", locale === "ar" ? "توسيع القائمة" : "Expand navigation"),
    navigationSearch: t("shell.search", locale === "ar" ? "ابحث عن مصنع أو سجل تجاري أو رخصة أو تفتيش…" : "Search factory, CR, license, inspection…"),
    searchResults: t("shell.searchResults", locale === "ar" ? "نتائج البحث العام" : "Global search results"),
    noSearchResults: t("shell.noSearchResults", locale === "ar" ? "لا توجد نتائج متاحة لك" : "No results available to you"),
    searchLoading: t("shell.searchLoading", locale === "ar" ? "جارٍ البحث…" : "Searching…"),
    searchUnavailable: t("shell.searchUnavailable", locale === "ar" ? "البحث غير متاح الآن" : "Search not available right now"),
    dateScope: t("shell.dateScope", locale === "ar" ? "نطاق التاريخ" : "Date scope"),
    last30Days: t("shell.last30Days", locale === "ar" ? "آخر 30 يوماً" : "Last 30 days"),
    from: t("shell.from", locale === "ar" ? "من" : "From"),
    to: t("shell.to", locale === "ar" ? "إلى" : "To"),
    apply: t("shell.apply", locale === "ar" ? "تطبيق" : "Apply"),
    regionScope: t("shell.regionScope", locale === "ar" ? "نطاق المنطقة" : "Region scope"),
    allRegions: t("shell.allRegions", locale === "ar" ? "جميع المناطق" : "All Regions"),
    notApplicable: t("shell.notApplicable", locale === "ar" ? "غير منطبق على هذه الصفحة" : "Not applicable on this page"),
    aiEntry: t("shell.aiEntry", locale === "ar" ? "رؤى الذكاء الاصطناعي" : "AI Insights"),
    navigation: t("shell.navigation", locale === "ar" ? "وجهة" : "Navigation"),
    account: t("shell.account", locale === "ar" ? "الحساب" : "Account"),
    language: t("shell.language", locale === "ar" ? "اللغة" : "Language"),
    roles: t("shell.roles", locale === "ar" ? "الأدوار" : "Roles"),
    profileSettings: t("shell.profileSettings", locale === "ar" ? "إعدادات الملف الشخصي" : "Profile settings"),
    fieldSettings: t("field.settings.title", locale === "ar" ? "إعدادات الميدان" : "Field settings"),
    signOut: t("nav.signout", locale === "ar" ? "تسجيل الخروج" : "Sign out"),
    themeLight: t("theme.light", locale === "ar" ? "الوضع الفاتح" : "Light mode"),
    themeDark: t("theme.dark", locale === "ar" ? "الوضع الداكن" : "Dark mode"),
    skipToContent: t("shell.skip", locale === "ar" ? "الانتقال إلى المحتوى" : "Skip to content"),
    loadingDestination: t("shell.loadingDestination", locale === "ar" ? "جارٍ تحميل الوجهة…" : "Loading destination…"),
    admin: {
      languageSwitch: t("admin.shell.languageSwitch", "Arabic"),
      navigation: t("admin.shell.navigation", "Control Panel navigation"),
      controlPanel: t("admin.shell.controlPanel", "Control Panel"),
      authorized: t("admin.shell.authorized", "areas authorized"),
      loadingDestination: t("admin.shell.loadingDestination", "Loading destination…"),
      brandLabel: t("admin.shell.brandLabel", "SAQEEL | Saqeel"),
      brandArabic: t("admin.shell.brandArabic", "Saqeel"),
      brandEnglish: t("admin.shell.brandEnglish", "SAQEEL"),
      findTool: t("admin.shell.findTool", "Find a tool"),
      viewAll: t("admin.shell.viewAll", "View all authorized tools"),
      administration: t("admin.shell.administration", "ADMINISTRATION"),
      allTools: t("admin.shell.allTools", "All authorized tools, grouped by area"),
      close: t("admin.shell.close", "Close"),
      paletteTitle: t("admin.shell.paletteTitle", "Find a tool"),
      paletteOpen: t("admin.shell.paletteOpen", "Open admin tools"),
      paletteGoTo: t("admin.shell.paletteGoTo", "Go to an admin tool"),
      paletteSearch: t("admin.shell.paletteSearch", "Search allowed admin tools"),
      paletteResultsOne: t("admin.shell.paletteResultsOne", "{count} allowed result"),
      paletteResultsOther: t("admin.shell.paletteResultsOther", "{count} allowed results"),
      paletteEmpty: t("admin.shell.paletteEmpty", "No matching tools"),
      noMatch: t("admin.shell.noMatch", "No authorized tool matches."),
      hubs: {
        control: t("admin.shell.hub.control", "Control Panel"),
        people: t("admin.shell.hub.people", "People & Access"),
        rules: t("admin.shell.hub.rules", "Rules & Content"),
        planning: t("admin.shell.hub.planning", "Planning & Execution"),
        risk: t("admin.shell.hub.risk", "Risk & Intelligence"),
        connections: t("admin.shell.hub.connections", "Connections & Geography"),
        governance: t("admin.shell.hub.governance", "Governance & Operations"),
        security: t("admin.shell.hub.security", "Security & Audit"),
      },
    },
    // WA-PWA-TAB-r1 — labels transcribed from designs/pwa/pwa/pwa-tabbar.js,
    // both locales, verbatim. Not re-worded here.
    tabbar: {
      home: t("shell.tab.home", locale === "ar" ? "الرئيسية" : "Home"),
      myTasks: t("shell.tab.myTasks", locale === "ar" ? "مهامي" : "My Tasks"),
      establishments: t("shell.tab.establishments", locale === "ar" ? "المنشآت" : "Establishments"),
      notifications: t("shell.tab.notifications", locale === "ar" ? "الإشعارات" : "Notifications"),
      account: t("shell.tab.account", locale === "ar" ? "حسابي" : "Account"),
    },
  };

  const bellStrings = getNotificationStrings(locale);

  return (
    <ShellClient
      groups={groups}
      strings={shellStrings}
      bellStrings={bellStrings}
      locale={locale}
      email={user.email ?? user.id}
      displayName={profile?.full_name?.trim() || (user.email ?? user.id).split("@")[0]}
      roleTitles={roleTitles}
      homeRegion={profile?.region?.trim() || null}
      roles={roles}
      regions={regions}
    >
      {children}
    </ShellClient>
  );
}

/**
 * Route-owned header/content frame. The navigation, account controls and bell
 * now live above the page segment in AppShell, so this component can rerender
 * per route without remounting the application chrome.
 */
export default function Shell({ children, title, context, topbar }: {
  current: string; children: ReactNode; title: string; context?: ReactNode; topbar?: ReactNode;
}) {
  return (
    <>
      {topbar ? <div className="sq-pagehead__route-tools">{topbar}</div> : null}
      {title ? (
        <header className="sq-pagehead sq-pagehead--route">
          <div className="sq-pagehead__row">
            <div className="sq-pagehead__context">
              <Heading level={1} visual="display">{title}</Heading>
              {context}
            </div>
          </div>
        </header>
      ) : null}
      <div className="sq-content">{children}</div>
    </>
  );
}
