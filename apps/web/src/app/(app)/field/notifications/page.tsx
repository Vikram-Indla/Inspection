import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import type { FieldNotificationRow } from "@/lib/field-notifications";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import NotificationAttentionCenter from "./NotificationAttentionCenter";

// TASK-IPAD-NOTIFICATIONS-ASSIGNMENT-CHANGES-001
// The initial server read is recipient-scoped twice: explicitly here and by
// notif_own RLS. The client center retains that exact snapshot for honest
// offline display and repeats the same recipient predicate on reconnect.
export default async function FieldNotificationsList({ searchParams }: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  const title = tr("field.notifications.title", "Notifications", "الإشعارات");
  const back = (
    <Link href="/field" prefetch={false} className="btn btn-icon btn-ghost"
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional>
        <path d="m15 6-6 6 6 6" />
      </svg>
    </Link>
  );

  const { data, error } = await sb.from("notifications")
    .select("id, event_key, payload, channel, delivery_state, read_at, created_at")
    .eq("recipient", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[field notifications]", error.message, error.code);
    return (
      <>
        <FieldHeader leading={back} title={title} langHref={langHref} langLabel={langLabel} />
        <div style={{ flex: 1, padding: 20 }}>
          <div className="alert alert-critical" role="alert">
            {tr("field.notifications.unavailable", "Notifications are temporarily unavailable. Try again.", "الإشعارات غير متاحة مؤقتًا. حاول مرة أخرى.")}
          </div>
        </div>
      </>
    );
  }

  const rows = (data ?? []) as FieldNotificationRow[];
  const visitIds = Array.from(new Set(rows
    .map(row => typeof row.payload?.visit_id === "string" ? row.payload.visit_id : null)
    .filter((id): id is string => !!id)));
  const visitNames: Record<string, string> = {};
  if (visitIds.length) {
    const { data: visits, error: visitError } = await sb.from("visits")
      .select("id, factories(name)")
      .in("id", visitIds);
    if (visitError) {
      console.error("[field notifications visit context]", visitError.message, visitError.code);
    } else {
      for (const visit of (visits ?? []) as unknown as { id: string; factories: { name: string | null } | null }[]) {
        if (visit.factories?.name) visitNames[visit.id] = visit.factories.name;
      }
    }
  }

  return (
    <>
      <FieldHeader leading={back} title={title} langHref={langHref} langLabel={langLabel} />
      <NotificationAttentionCenter
        userId={user.id}
        initialRows={rows}
        initialVisitNames={visitNames}
        locale={locale === "ar" ? "ar" : "en"}
        initialFilter={filter === "unread" ? "unread" : "all"}
        strings={{
          all: tr("field.notifications.all", "All", "الكل"),
          unread: tr("field.notifications.unreadFilter", "Unread", "غير مقروءة"),
          newBadge: tr("field.notifications.newBadge", "New", "جديد"),
          empty: tr("field.notifications.empty", "No notifications in this view.", "لا توجد إشعارات في هذا القسم."),
          emptyUnread: tr("field.notifications.emptyUnread", "No unread notifications.", "لا توجد إشعارات غير مقروءة."),
          offlineCached: tr("field.notifications.offlineCached", "Offline — showing the cached attention state from {time}. It may be out of date.", "غير متصل — يتم عرض حالة التنبيهات المحفوظة من {time}. قد تكون قديمة."),
          offlineEmpty: tr("field.notifications.offlineEmpty", "Offline — no notification snapshot is cached on this device.", "غير متصل — لا توجد نسخة إشعارات محفوظة على هذا الجهاز."),
          live: tr("field.notifications.live", "Online — notification state is current.", "متصل — حالة الإشعارات محدثة."),
          refreshFailed: tr("field.notifications.refreshFailed", "Could not refresh notifications. The last cached state remains visible.", "تعذر تحديث الإشعارات. تظل آخر حالة محفوظة معروضة."),
          reconnecting: tr("field.notifications.reconnecting", "Connection restored — refreshing notifications.", "تمت استعادة الاتصال — جارٍ تحديث الإشعارات."),
          markRead: tr("field.notifications.markRead", "Mark read", "تحديد كمقروء"),
          acknowledgementOffline: tr("field.notifications.ackOffline", "Reconnect before marking this notification read. No acknowledgement was recorded.", "أعد الاتصال قبل تحديد الإشعار كمقروء. لم يتم تسجيل أي إقرار."),
          acknowledgementFailed: tr("field.notifications.ackFailed", "The read acknowledgement was not saved. Refresh and try again.", "لم يتم حفظ إقرار القراءة. حدّث الصفحة وحاول مرة أخرى."),
          open: tr("field.notifications.open", "Open", "فتح"),
          eventFallback: title,
          kinds: {
            assigned: tr("field.notifications.kind.assigned", "Visit assigned", "تم تعيين زيارة"),
            reassigned: tr("field.notifications.kind.reassigned", "Visit reassigned to you", "تمت إعادة تعيين الزيارة إليك"),
            released: tr("field.notifications.kind.released", "Assignment changed — you were released", "تغير التعيين — تمت إزالتك"),
            cancelled: tr("field.notifications.kind.cancelled", "Visit cancelled", "تم إلغاء الزيارة"),
            rescheduled: tr("field.notifications.kind.rescheduled", "Visit schedule changed", "تغير موعد الزيارة"),
            expired: tr("field.notifications.kind.expired", "Visit expired", "انتهت صلاحية الزيارة"),
            other: tr("field.notifications.kind.other", "Inspection notification", "إشعار تفتيش"),
          },
        }}
      />
    </>
  );
}
