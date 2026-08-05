import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import FieldHeaderSync from "@/components/field/FieldHeaderSync";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import VisitsClient from "./VisitsClient";
import { loadAssignedVisits } from "./data";
import styles from "./visits.module.css";

export default async function FieldVisits() {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { visits, error } = await loadAssignedVisits(sb, user.id);
  const header = <div className={styles.header}><FieldHeader
    title={tr("field.visits.title", "My Visits", "زياراتي")}
    subtitle={tr("field.visits.scope", "Assigned to you", "المسندة إليك")}
    langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"} langLabel={locale === "ar" ? "EN" : "AR"}
    right={<FieldHeaderSync userId={user.id} strings={{
      online: tr("field.sync.online", "Online", "متصل"), offline: tr("field.sync.offline", "Offline", "غير متصل"),
      syncNow: tr("field.sync.now", "Sync now", "مزامنة الآن"), syncing: tr("field.sync.syncing", "Syncing…", "جارٍ المزامنة…"),
    }}/>}
  /></div>;
  if (error) {
    console.error(`[field.visits] load failed: ${error.message}`);
    return <>{header}<main className={styles.page}><div className="alert alert-critical" role="alert">{tr("field.visits.error", "Assigned visits are temporarily unavailable. Please try again.", "الزيارات المسندة غير متاحة مؤقتاً. يرجى المحاولة مرة أخرى.")}</div></main></>;
  }
  const strings = {
    viewsAria: tr("field.visits.views", "Assigned visit views", "طرق عرض الزيارات المسندة"),
    list: tr("field.visits.list", "List", "القائمة"), calendar: tr("field.visits.calendar", "Calendar", "التقويم"), map: tr("field.visits.map", "Map", "الخريطة"),
    segmentsAria: tr("field.visits.segments", "Visit timing", "توقيت الزيارات"),
    today: tr("field.visits.today", "Today", "اليوم"), upcoming: tr("field.visits.upcoming", "Upcoming", "القادمة"), completed: tr("field.visits.completed", "Completed", "المكتملة"),
    search: tr("field.visits.search", "Search by visit no., establishment, CR, or license", "بحث برقم الزيارة أو المنشأة أو السجل أو الترخيص"),
    sort: tr("field.visits.sort", "Sort assigned visits", "ترتيب الزيارات المسندة"), soonest: tr("field.visits.soonest", "Soonest first", "الأقرب أولاً"), latest: tr("field.visits.latest", "Latest first", "الأبعد أولاً"),
    all: tr("field.visits.all", "All", "الكل"), high: tr("field.visits.high", "High", "عالية"), medium: tr("field.visits.medium", "Medium", "متوسطة"), low: tr("field.visits.low", "Low", "منخفضة"),
    empty: tr("field.visits.empty", "No assigned visits match this view.", "لا توجد زيارات مسندة تطابق هذا العرض."), emptyBody: tr("field.visits.emptyBody", "Change the timing, risk, or search filter.", "غيّر مرشح التوقيت أو الأولوية أو البحث."),
    loadMore: tr("field.visits.loadMore", "Load more visits", "تحميل مزيد من الزيارات"),
    twoStates: tr("field.visits.twoStates", "Two states per visit: planning then field execution — always separate.", "حالتان لكل زيارة: التخطيط ثم التنفيذ الميداني — منفصلتان دائماً."),
    directions: tr("field.visits.directions", "Directions", "الاتجاهات"), continue: tr("field.visits.continue", "Continue", "متابعة"), results: tr("field.visits.results", "View results", "عرض النتائج"), start: tr("field.visits.start", "Start", "بدء"), view: tr("field.visits.view", "View", "عرض"), km: tr("field.visits.km", "km", "كم"),
    // The real column domains, verified against the database — not guessed.
    // planning_status and operational_state are Postgres enums; visit_type and
    // execution_mode are the values the visits table actually carries. An earlier
    // pass listed bulk/single/immediate, which exist in no column, so periodic,
    // complaint and follow_up fell through to the raw key in both locales.
    ...Object.fromEntries([
      // planning_status
      "draft", "validated", "published", "returned", "cancelled", "expired",
      // operational_state
      "new", "prepared", "on_the_way", "arrived", "executing", "submitted", "under_review",
      // visit_type
      "periodic", "complaint", "follow_up",
      // execution_mode
      "physical", "virtual", "administrative",
    ].map(k => [`enum.${k}`, t(`enum.${k}`, k.replaceAll("_", " "))])),
  };
  return <>{header}<VisitsClient visits={visits} locale={locale} now={Date.now()} strings={strings}/></>;
}
