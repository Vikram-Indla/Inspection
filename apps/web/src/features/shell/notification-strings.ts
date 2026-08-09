import { useT } from "@/lib/i18n";
import { type BellStrings } from "@/components/NotificationBell";

export async function getNotificationStrings(): Promise<BellStrings> {
  const { t, locale } = await useT();
  const bellStrings: BellStrings = {
    label: t("bell.label", locale === "ar" ? "الإشعارات" : "Notifications"),
    heading: t("bell.heading", locale === "ar" ? "الإشعارات" : "Notifications"),
    empty: t("bell.empty", locale === "ar" ? "لا توجد إشعارات" : "No notifications"),
    markAll: t("bell.markAll", locale === "ar" ? "تحديد الكل كمقروء" : "Mark all read"),
    markRead: t("bell.markRead", locale === "ar" ? "تحديد كمقروء" : "Mark read"),
    unreadBadge: t("bell.unread", locale === "ar" ? "غير مقروء" : "unread"),
    loadError: t("bell.loadError", locale === "ar" ? "تعذر تحميل الإشعارات:" : "Couldn’t load notifications:"),
    view: t("bell.view", locale === "ar" ? "فتح" : "Open"),
    viewAll: t("bell.viewAll", locale === "ar" ? "عرض كل الإشعارات" : "View all notifications"),
    today: t("bell.today", locale === "ar" ? "اليوم" : "Today"),
    yesterday: t("bell.yesterday", locale === "ar" ? "أمس" : "Yesterday"),
    hoursAgo: t("bell.hoursAgo", locale === "ar" ? "قبل {n} ساعة" : "{n} hour{s} ago"),
    minutesAgo: t("bell.minutesAgo", locale === "ar" ? "قبل {n} دقيقة" : "{n} minute{s} ago"),
    justNow: t("bell.justNow", locale === "ar" ? "الآن" : "Just now"),
    events: {
      assignment: t("bell.ev.assignment", locale === "ar" ? "تم إسناد زيارة جديدة" : "New visit assigned"),
                              planning_supervision_requested: t("bell.ev.planSupervisionRequested", locale === "ar" ? "خطة بانتظار الإشراف" : "Plan awaiting supervision"),
      planning_supervision_rejected: t("bell.ev.planSupervisionRejected", locale === "ar" ? "رُفض إشراف الخطة" : "Plan supervision rejected"),
      planning_visit_reschedule: t("bell.ev.planVisitReschedule", locale === "ar" ? "أُعيدت جدولة زيارة مخططة" : "Planned visit rescheduled"),
      planning_visit_reassign: t("bell.ev.planVisitReassign", locale === "ar" ? "أُعيد إسناد زيارة مخططة" : "Planned visit reassigned"),
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
    contextLabels: {
      factory: t("bell.ctx.factory", locale === "ar" ? "المنشأة" : "Factory"),
      visit: t("bell.ctx.visit", locale === "ar" ? "الزيارة" : "Visit"),
      reason: t("bell.ctx.reason", locale === "ar" ? "السبب" : "Reason"),
      decision: t("bell.ctx.decision", locale === "ar" ? "القرار" : "Decision"),
    },
  };
  return bellStrings;
}
