import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { buildShellNavigation } from "@/lib/shell-navigation";
import ShellClient, { type ShellClientStrings } from "@/components/ShellClient";
import { type BellStrings } from "@/components/NotificationBell";

export default async function Shell({ current, children, title, context, topbar }: {
  current: string; children: ReactNode; title: string; context?: ReactNode; topbar?: ReactNode;
}) {
  const [{ t, locale }, sb] = await Promise.all([useT(), supabaseServer()]);
  const { data: { user } } = await getServerUser();
  if (!user) redirect("/login");

  // Server-side role-scoped navigation. RLS remains the authorization boundary;
  // this query only prevents irrelevant or unauthorized destinations appearing
  // in the shared chrome (RBAC-001..014, TASK-WEB-SHELL-001).
  const { data: roleRows } = await sb.from("user_roles").select("role_key").eq("user_id", user.id);
  const roles = Array.from(new Set((roleRows ?? []).map(row => row.role_key))).sort();
  const groups = buildShellNavigation(roles).map(group => ({
    id: group.id,
    label: t(group.labelKey, locale === "ar" ? group.labelAr : group.labelEn),
    items: group.items.map(item => ({
      id: item.id,
      label: t(item.labelKey, locale === "ar" ? item.labelAr : item.labelEn),
      href: item.href,
      icon: item.icon,
      businessTab: item.businessTab,
    })),
  }));

  const shellStrings: ShellClientStrings = {
    primary: t("nav.primary", locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"),
    openMenu: t("shell.openMenu", locale === "ar" ? "فتح قائمة التنقل" : "Open navigation"),
    closeMenu: t("shell.closeMenu", locale === "ar" ? "إغلاق قائمة التنقل" : "Close navigation"),
    collapse: t("shell.collapse", locale === "ar" ? "طي القائمة" : "Collapse navigation"),
    expand: t("shell.expand", locale === "ar" ? "توسيع القائمة" : "Expand navigation"),
    navigationSearch: t("shell.search", locale === "ar" ? "البحث في التنقل" : "Search navigation"),
    searchResults: t("shell.searchResults", locale === "ar" ? "نتائج التنقل" : "Navigation results"),
    noSearchResults: t("shell.noSearchResults", locale === "ar" ? "لا توجد وجهة مطابقة" : "No matching destination"),
    account: t("shell.account", locale === "ar" ? "الحساب" : "Account"),
    roles: t("shell.roles", locale === "ar" ? "الأدوار" : "Roles"),
    signOut: t("nav.signout", locale === "ar" ? "تسجيل الخروج" : "Sign out"),
    themeLight: t("theme.light", locale === "ar" ? "الوضع الفاتح" : "Light mode"),
    themeDark: t("theme.dark", locale === "ar" ? "الوضع الداكن" : "Dark mode"),
    skipToContent: t("shell.skip", locale === "ar" ? "الانتقال إلى المحتوى" : "Skip to content"),
  };

  const bellStrings: BellStrings = {
    label: t("bell.label", locale === "ar" ? "الإشعارات" : "Notifications"),
    heading: t("bell.heading", locale === "ar" ? "الإشعارات" : "Notifications"),
    empty: t("bell.empty", locale === "ar" ? "لا توجد إشعارات" : "No notifications"),
    markAll: t("bell.markAll", locale === "ar" ? "تحديد الكل كمقروء" : "Mark all read"),
    markRead: t("bell.markRead", locale === "ar" ? "تحديد كمقروء" : "Mark read"),
    unreadBadge: t("bell.unread", locale === "ar" ? "غير مقروء" : "unread"),
    loadError: t("bell.loadError", locale === "ar" ? "تعذر تحميل الإشعارات:" : "Couldn’t load notifications:"),
    events: {
      assignment: t("bell.ev.assignment", locale === "ar" ? "تم إسناد زيارة جديدة" : "New visit assigned"),
      visit_cancelled: t("bell.ev.visitCancelled", locale === "ar" ? "تم إلغاء الزيارة" : "Visit cancelled"),
      submission_received: t("bell.ev.submissionReceived", locale === "ar" ? "تقرير بانتظار المراجعة" : "Submission awaiting review"),
      resubmission: t("bell.ev.resubmission", locale === "ar" ? "إعادة إرسال بانتظار المراجعة" : "Resubmission awaiting review"),
      review_decision: t("bell.ev.reviewDecision", locale === "ar" ? "صدر قرار المراجعة" : "Review decided"),
      virtual_scheduled: t("bell.ev.virtualScheduled", locale === "ar" ? "تمت جدولة جلسة افتراضية" : "Virtual session scheduled"),
      virtual_rescheduled: t("bell.ev.virtualRescheduled", locale === "ar" ? "تمت إعادة جدولة الجلسة الافتراضية" : "Virtual session rescheduled"),
      virtual_closed: t("bell.ev.virtualClosed", locale === "ar" ? "أغلقت الجلسة الافتراضية" : "Virtual session closed"),
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
      current={current}
      title={title}
      context={context}
      topbar={topbar}
      groups={groups}
      strings={shellStrings}
      bellStrings={bellStrings}
      locale={locale}
      languageHref={languageHref}
      languageLabel={locale === "ar" ? "English" : "العربية"}
      languageLang={locale === "ar" ? "en" : "ar"}
      email={user.email ?? user.id}
      roles={roles}
    >
      {children}
    </ShellClient>
  );
}
