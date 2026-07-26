import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import FieldHeaderSync from "@/components/field/FieldHeaderSync";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { loadAssignedVisits } from "../data";
import FieldCalendarBoard from "./FieldCalendarBoard";
import styles from "../visits.module.css";

export default async function FieldVisitsCalendar() {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { visits, error } = await loadAssignedVisits(sb, user.id);
  const header = <div className={styles.header}><FieldHeader title={tr("field.visits.calendarTitle", "Visit Calendar", "تقويم الزيارات")} subtitle={tr("field.visits.calendarScope", "Prepared visits assigned to you", "الزيارات المُعدّة والمسندة إليك")} langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"} langLabel={locale === "ar" ? "EN" : "AR"} right={<FieldHeaderSync userId={user.id} strings={{ online: tr("field.sync.online","Online","متصل"), offline: tr("field.sync.offline","Offline","غير متصل"), syncNow: tr("field.sync.now","Sync now","مزامنة الآن"), syncing: tr("field.sync.syncing","Syncing…","جارٍ المزامنة…") }}/>} /></div>;
  if (error) {
    console.error(`[field.visits.calendar] load failed: ${error.message}`);
    return <>{header}<main className={styles.page}><div className="alert alert-critical" role="alert">{tr("field.visits.error", "Assigned visits are temporarily unavailable. Please try again.", "الزيارات المسندة غير متاحة مؤقتاً. يرجى المحاولة مرة أخرى.")}</div></main></>;
  }
  // CR-101: new visits remain in the assignment pool; only prepared-or-later visits enter Calendar.
  const calendarVisits = visits.filter(v => v.operationalState !== "new");
  const s = {
    calendarView: tr("field.visits.calendarView", "Calendar view", "عرض التقويم"), day: tr("field.visits.day","Day","يوم"), week: tr("field.visits.week","Week","أسبوع"), month: tr("field.visits.month","Month","شهر"),
    prev: tr("field.visits.prev","Previous","السابق"), next: tr("field.visits.next","Next","التالي"), today: tr("field.visits.today","Today","اليوم"), empty: tr("field.visits.calendarEmpty","No prepared visits in this range.","لا توجد زيارات مُعدّة في هذه الفترة."), more: tr("field.visits.more","+{n} more","+{n} إضافية"),
  };
  return <>{header}<main className={`${styles.page} ${styles.calendarShell}`}><nav className={styles.views} aria-label={tr("field.visits.views","Assigned visit views","طرق عرض الزيارات المسندة")}><Link href="/field/visits">{tr("field.visits.list","List","القائمة")}</Link><Link href="/field/visits/calendar" aria-current="page">{tr("field.visits.calendar","Calendar","التقويم")}</Link><Link href="/field/map">{tr("field.visits.map","Map","الخريطة")}</Link></nav><FieldCalendarBoard visits={calendarVisits} locale={locale} s={s}/></main></>;
}
