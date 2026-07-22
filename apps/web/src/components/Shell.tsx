import { redirect } from "next/navigation";
import { cache, type ReactNode } from "react";
import { getShellRegions, getUserRoles } from "@/lib/persona";
import { useT } from "@/lib/i18n";
import { getServerUser } from "@/lib/supabase-server";
import { buildShellNavigation } from "@/lib/shell-navigation";
import ShellClient, { type ShellClientStrings } from "@/components/ShellClient";
import { type BellStrings } from "@/components/NotificationBell";

const loadShellData = cache(async () => {
  const [{ t, locale }, { data: { user } }] = await Promise.all([
    useT(),
    getServerUser(),
  ]);
  if (!user) return { t, locale, user, roles: [] as string[], regions: [] as string[] };
  const [{ data: roleRows }, regionRead] = await Promise.all([
    getUserRoles(user.id),
    getShellRegions(),
  ]);
  const roles = Array.from(new Set((roleRows ?? []).map(row => row.role_key))).sort();
  const regions = regionRead.error
    ? []
    : Array.from(new Set((regionRead.data ?? []).map(row => row.region).filter((value): value is string => !!value))).sort();
  return { t, locale, user, roles, regions };
});

/**
 * Compatibility no-op for the three pages that used to start per-page shell
 * reads. K-001 moved those reads into the persistent `(app)` layout; starting
 * them from a page again would defeat that boundary.
 */
export function preloadShell(current: string) {
  void current;
}

export async function AppShell({ children }: { children: ReactNode }) {
  const { t, locale, user, roles, regions } = await loadShellData();
  if (!user) redirect("/login");
  const groups = buildShellNavigation(roles).map(group => ({
    id: group.id,
    label: t(group.labelKey, locale === "ar" ? group.labelAr : group.labelEn),
    items: group.items.map(item => ({
      id: item.id,
      label: t(item.labelKey, locale === "ar" ? item.labelAr : item.labelEn),
      href: item.href,
      icon: item.icon,
      businessTab: item.businessTab,
      enabled: item.enabled,
      disabledReason: item.disabledReasonKey
        ? t(item.disabledReasonKey, locale === "ar" ? item.disabledReasonAr! : item.disabledReasonEn!)
        : undefined,
      parentId: item.parentId,
      parentLabel: item.parentLabelKey
        ? t(item.parentLabelKey, locale === "ar" ? item.parentLabelAr! : item.parentLabelEn!)
        : undefined,
    })),
  }));

  const shellStrings: ShellClientStrings = {
    primary: t("nav.primary", locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"),
    openMenu: t("shell.openMenu", locale === "ar" ? "فتح قائمة التنقل" : "Open navigation"),
    closeMenu: t("shell.closeMenu", locale === "ar" ? "إغلاق قائمة التنقل" : "Close navigation"),
    collapse: t("shell.collapse", locale === "ar" ? "طي القائمة" : "Collapse navigation"),
    expand: t("shell.expand", locale === "ar" ? "توسيع القائمة" : "Expand navigation"),
    navigationSearch: t("shell.search", locale === "ar" ? "ابحث في المصانع والزيارات والتفتيشات…" : "Search factories, visits, inspections…"),
    searchResults: t("shell.searchResults", locale === "ar" ? "نتائج البحث العام" : "Global search results"),
    noSearchResults: t("shell.noSearchResults", locale === "ar" ? "لا توجد نتائج مرئية ضمن صلاحياتك" : "No RLS-visible results"),
    searchLoading: t("shell.searchLoading", locale === "ar" ? "جارٍ البحث…" : "Searching…"),
    searchUnavailable: t("shell.searchUnavailable", locale === "ar" ? "البحث غير متاح مؤقتاً" : "Search temporarily unavailable"),
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
    roles: t("shell.roles", locale === "ar" ? "الأدوار" : "Roles"),
    profileSettings: t("shell.profileSettings", locale === "ar" ? "إعدادات الملف الشخصي" : "Profile settings"),
    fieldSettings: t("field.settings.title", locale === "ar" ? "إعدادات الميدان" : "Field settings"),
    signOut: t("nav.signout", locale === "ar" ? "تسجيل الخروج" : "Sign out"),
    themeLight: t("theme.light", locale === "ar" ? "الوضع الفاتح" : "Light mode"),
    themeDark: t("theme.dark", locale === "ar" ? "الوضع الداكن" : "Dark mode"),
    skipToContent: t("shell.skip", locale === "ar" ? "الانتقال إلى المحتوى" : "Skip to content"),
    loadingDestination: t("shell.loadingDestination", locale === "ar" ? "جارٍ تحميل الوجهة…" : "Loading destination…"),
  };

  const bellStrings: BellStrings = {
    label: t("bell.label", locale === "ar" ? "الإشعارات" : "Notifications"),
    heading: t("bell.heading", locale === "ar" ? "الإشعارات" : "Notifications"),
    empty: t("bell.empty", locale === "ar" ? "لا توجد إشعارات" : "No notifications"),
    markAll: t("bell.markAll", locale === "ar" ? "تحديد الكل كمقروء" : "Mark all read"),
    markRead: t("bell.markRead", locale === "ar" ? "تحديد كمقروء" : "Mark read"),
    unreadBadge: t("bell.unread", locale === "ar" ? "غير مقروء" : "unread"),
    loadError: t("bell.loadError", locale === "ar" ? "تعذر تحميل الإشعارات:" : "Couldn’t load notifications:"),
    view: t("bell.view", locale === "ar" ? "فتح" : "Open"),
    events: {
      assignment: t("bell.ev.assignment", locale === "ar" ? "تم إسناد زيارة جديدة" : "New visit assigned"),
      visit_cancelled: t("bell.ev.visitCancelled", locale === "ar" ? "تم إلغاء الزيارة" : "Visit cancelled"),
      visit_returned: t("bell.ev.visitReturned", locale === "ar" ? "أُعيدت الزيارة" : "Visit returned"),
      visit_expired: t("bell.ev.visitExpired", locale === "ar" ? "انتهت صلاحية الزيارة" : "Visit expired"),
      visit_republished: t("bell.ev.visitRepublished", locale === "ar" ? "أُعيد نشر الزيارة" : "Visit republished"),
      visit_rescheduled: t("bell.ev.visitRescheduled", locale === "ar" ? "أُعيدت جدولة الزيارة" : "Visit rescheduled"),
      submission_received: t("bell.ev.submissionReceived", locale === "ar" ? "تقرير بانتظار المراجعة" : "Submission awaiting review"),
      resubmission: t("bell.ev.resubmission", locale === "ar" ? "إعادة إرسال بانتظار المراجعة" : "Resubmission awaiting review"),
      review_decision: t("bell.ev.reviewDecision", locale === "ar" ? "صدر قرار المراجعة" : "Review decided"),
      virtual_scheduled: t("bell.ev.virtualScheduled", locale === "ar" ? "تمت جدولة جلسة افتراضية" : "Virtual session scheduled"),
      virtual_rescheduled: t("bell.ev.virtualRescheduled", locale === "ar" ? "تمت إعادة جدولة الجلسة الافتراضية" : "Virtual session rescheduled"),
      virtual_closed: t("bell.ev.virtualClosed", locale === "ar" ? "أغلقت الجلسة الافتراضية" : "Virtual session closed"),
      compliance_request_submitted: t("bell.ev.ccrSubmitted", locale === "ar" ? "تم إرسال طلب إعداد امتثال للمراجعة" : "Compliance request submitted for review"),
      compliance_request_returned: t("bell.ev.ccrReturned", locale === "ar" ? "أُعيد طلب إعداد الامتثال للتعديل" : "Compliance request returned for revision"),
      compliance_request_approved: t("bell.ev.ccrApproved", locale === "ar" ? "تمت الموافقة على طلب إعداد الامتثال" : "Compliance request approved"),
      compliance_request_partially_approved: t("bell.ev.ccrPartiallyApproved", locale === "ar" ? "تمت الموافقة جزئياً على طلب إعداد الامتثال" : "Compliance request partially approved"),
      compliance_request_rejected: t("bell.ev.ccrRejected", locale === "ar" ? "تم رفض طلب إعداد الامتثال" : "Compliance request rejected"),
      compliance_request_published: t("bell.ev.ccrPublished", locale === "ar" ? "تم نشر إعداد الامتثال المعتمد" : "Approved compliance configuration published"),
    },
    channels: {
      inapp: t("bell.ch.inapp", locale === "ar" ? "داخل التطبيق" : "in-app"),
      push: t("bell.ch.push", locale === "ar" ? "دفع" : "push"),
      sms: t("bell.ch.sms", locale === "ar" ? "رسالة نصية" : "SMS"),
      email: t("bell.ch.email", locale === "ar" ? "بريد إلكتروني" : "email"),
    },
    notConfigured: t("bell.notConfigured", locale === "ar" ? "المزود قيد الانتظار" : "provider pending"),
  };

  const languageHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  return (
    <ShellClient
      groups={groups}
      strings={shellStrings}
      bellStrings={bellStrings}
      locale={locale}
      languageHref={languageHref}
      languageLabel={locale === "ar" ? "English" : "العربية"}
      languageLang={locale === "ar" ? "en" : "ar"}
      email={user.email ?? user.id}
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
      {topbar ? <div className="ax-pagehead__route-tools">{topbar}</div> : null}
      <header className="ax-pagehead ax-pagehead--route">
        <div className="ax-pagehead__row">
          <div className="ax-pagehead__context"><h2>{title}</h2>{context}</div>
        </div>
      </header>
      <div className="ax-content">{children}</div>
    </>
  );
}
