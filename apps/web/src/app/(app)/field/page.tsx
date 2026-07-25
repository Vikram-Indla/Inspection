import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import FieldHeaderSync from "@/components/field/FieldHeaderSync";
import FieldNav from "@/components/field/FieldNav";
import FieldSyncChips from "@/components/field/FieldSyncChips";
import { buildDailyVisitHub, type DailyVisit, visitDestination } from "@/lib/field/daily-visit-hub";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import styles from "./daily-visit-hub.module.css";

// TASK-IPAD-DAILY-DASHBOARD-VISIT-HUB-001
// SCR-IPAD-600 · G2-P04 · MVP1-M03-001 · AC-0099
// Read-only inspector hub. Workflow changes remain behind the governed
// preparation, journey and inspection routes.

type Assignment = { visits: DailyVisit | DailyVisit[] | null };

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function FieldDashboard() {
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  const nav = (
    <FieldNav active="home" labels={{
      home: tr("field.tabs.home", "Home", "الرئيسية"),
      myTasks: tr("field.tabs.myTasks", "My Tasks", "مهامي"),
      establishments: tr("field.tabs.establishments", "Establishments", "المنشآت"),
      notifications: tr("field.tabs.notifications", "Notifications", "الإشعارات"),
      account: tr("field.tabs.account", "Account", "الحساب"),
    }} />
  );

  const [profileRead, assignmentRead] = await Promise.all([
    sb.from("profiles").select("full_name, region").eq("user_id", user.id).maybeSingle(),
    sb.from("assignments")
      .select("visits(id, planning_status, operational_state, execution_mode, visit_type, window_start, window_end, factory_id, package_version_id, factories(id, name, factory_code, region, city), inspections(id, status, started_at, submitted_at, reviews(returned_sections)))")
      .eq("inspector_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const header = (
    <FieldHeader
      title={tr("field.dashboard.title", "Today", "اليوم")}
      subtitle={new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
        weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Riyadh",
      }).format(new Date())}
      langHref={langHref}
      langLabel={langLabel}
      right={<FieldHeaderSync userId={user.id} strings={{
        online: tr("field.home.online", "Online", "متصل"),
        offline: tr("field.home.offline", "Offline", "غير متصل"),
        syncNow: tr("field.home.syncNow", "Sync now", "مزامنة الآن"),
        syncing: tr("field.home.syncing", "Syncing…", "جارٍ المزامنة…"),
      }} />}
    />
  );

  if (assignmentRead.error) {
    console.error("[field daily dashboard]", assignmentRead.error.message);
    return (
      <>
        {header}
        <main className={styles.wrap}>
          <section className={styles.error} role="alert">
            <h1>{tr("field.dashboard.unavailableTitle", "Today’s visits are unavailable", "زيارات اليوم غير متاحة")}</h1>
            <p>{tr("field.dashboard.serviceUnavailable", "Your assignments could not be loaded (ERR-OPS-001). No cached completion is being claimed.", "تعذر تحميل مهامك (ERR-OPS-001). لا يتم ادعاء أي اكتمال مخزن.")}</p>
            <Link href="/field" className="btn btn-primary">{tr("common.retry", "Try again", "إعادة المحاولة")}</Link>
          </section>
        </main>
        {nav}
      </>
    );
  }

  const visits = ((assignmentRead.data ?? []) as unknown as Assignment[])
    .flatMap((assignment) => {
      const value = assignment.visits;
      return Array.isArray(value) ? value : value ? [value] : [];
    })
    .map((visit) => ({
      ...visit,
      factories: one(visit.factories),
      inspections: one(visit.inspections),
    }))
    .filter((visit): visit is DailyVisit => !!visit.factories && !isTestFixtureEstablishment(visit.factories));
  const hub = buildDailyVisitHub(visits);
  const next = hub.nextVisit;
  const resume = hub.resumable;
  const fullName = profileRead.data?.full_name?.trim();
  const inspectorName = fullName || tr("field.home.inspector", "Inspector", "مفتش");
  const time = (value: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh",
  }).format(new Date(value));
  const status = (value: string) => t(`enum.${value}`, value.replaceAll("_", " "));

  const journeyLabel = (visit: DailyVisit) => {
    if (visit.inspections?.status === "in_progress" || visit.inspections?.status === "returned") {
      return tr("field.dashboard.resumeInspection", "Resume inspection", "استئناف التفتيش");
    }
    if (["on_the_way", "arrived"].includes(visit.operational_state)) {
      return tr("field.dashboard.continueJourney", "Continue journey", "متابعة الرحلة");
    }
    return tr("field.dashboard.prepareVisit", "Prepare visit", "الاستعداد للزيارة");
  };

  return (
    <>
      {header}
      <main className={styles.wrap}>
        <section className={styles.intro} aria-labelledby="daily-heading">
          <div>
            <p className={styles.eyebrow}>{tr("field.dashboard.inspectorHub", "Inspector visit hub", "مركز زيارات المفتش")}</p>
            <h1 id="daily-heading">{tr("field.dashboard.greeting", "Hello, {name}", "مرحباً، {name}").replace("{name}", inspectorName)}</h1>
            <p>{profileRead.data?.region || tr("field.dashboard.scopeNote", "Only visits assigned to you are shown.", "تظهر فقط الزيارات المسندة إليك.")}</p>
          </div>
          <FieldSyncChips userId={user.id} strings={{
            offlineQueued: tr("field.sync.offlineQueued", "Offline — {n} changes queued", "غير متصل — {n} تغييرات في الانتظار"),
            online: tr("field.sync.online", "Online", "متصل"),
            synced: tr("field.sync.synced", "All changes synced", "تمت مزامنة جميع التغييرات"),
            syncFailed: tr("field.sync.failed", "{n} sync conflict(s) — no data lost", "{n} تعارضات مزامنة — لم تفقد بيانات"),
          }} />
        </section>

        <section className={styles.summary} aria-label={tr("field.dashboard.summary", "Today summary", "ملخص اليوم")}>
          <div><strong>{hub.today.length}</strong><span>{tr("field.dashboard.assignedToday", "Assigned today", "مسندة اليوم")}</span></div>
          <div><strong>{hub.incompleteToday.length}</strong><span>{tr("field.dashboard.remainingToday", "Remaining", "متبقية")}</span></div>
          <div><strong>{hub.completedToday.length}</strong><span>{tr("field.dashboard.completedToday", "Completed today", "مكتملة اليوم")}</span></div>
          <Link href="/field/my-tasks" className={styles.attention}>
            <strong>{hub.attentionCount}</strong><span>{tr("field.dashboard.attention", "Need attention", "تحتاج اهتماماً")}</span>
          </Link>
        </section>

        {resume && (
          <section className={styles.resume} aria-labelledby="resume-heading">
            <div>
              <p className={styles.eyebrow}>{tr("field.dashboard.inProgress", "In-progress inspection", "تفتيش قيد التنفيذ")}</p>
              <h2 id="resume-heading"><bdi>{resume.factories?.name}</bdi></h2>
              <p>{tr("field.dashboard.savedWork", "Continue the assigned inspection from its governed workspace.", "تابع التفتيش المسند من مساحة العمل المحكومة.")}</p>
            </div>
            <Link href={visitDestination(resume)} className="btn btn-primary">
              {tr("field.dashboard.resume", "Resume inspection", "استئناف التفتيش")}
            </Link>
          </section>
        )}

        <section className={styles.next} aria-labelledby="next-heading">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>{tr("field.dashboard.nextVisit", "Next visit", "الزيارة التالية")}</p>
              <h2 id="next-heading">{next ? <bdi>{next.factories?.name}</bdi> : tr("field.dashboard.noNext", "No remaining visit today", "لا توجد زيارة متبقية اليوم")}</h2>
            </div>
            {next && <span className="badge badge-info">{status(next.operational_state)}</span>}
          </div>
          {next ? (
            <>
              <dl className={styles.details}>
                <div><dt>{tr("field.dashboard.time", "Time", "الوقت")}</dt><dd>{time(next.window_start)}</dd></div>
                <div><dt>{tr("field.dashboard.location", "Location", "الموقع")}</dt><dd>{[next.factories?.city, next.factories?.region].filter(Boolean).join(" · ") || "—"}</dd></div>
                <div><dt>{tr("field.dashboard.visitType", "Visit type", "نوع الزيارة")}</dt><dd>{next.visit_type ? status(next.visit_type) : "—"}</dd></div>
                <div><dt>{tr("field.dashboard.offlinePack", "Offline package", "حزمة العمل دون اتصال")}</dt><dd>{next.package_version_id ? tr("field.dashboard.assignedPackage", "Assigned; verify in preparation", "مسندة؛ تحقق أثناء الاستعداد") : tr("field.dashboard.noPackage", "Not assigned", "غير مسندة")}</dd></div>
              </dl>
              <div className={styles.actions}>
                <Link href={`/field/${next.id}`} className="btn btn-secondary">{tr("field.dashboard.preparation", "Preparation", "الاستعداد")}</Link>
                <Link href={`/field/${next.id}/travel`} className="btn btn-secondary">{tr("field.dashboard.travel", "Travel", "السفر")}</Link>
                <Link href={visitDestination(next)} className="btn btn-primary">{journeyLabel(next)}</Link>
              </div>
            </>
          ) : (
            <p className={styles.empty}>{tr("field.dashboard.noNextBody", "Nothing else assigned for today. Future work remains available in My Tasks.", "لا توجد مهام أخرى مسندة اليوم. تبقى المهام المستقبلية متاحة في مهامي.")}</p>
          )}
        </section>

        <section className={styles.schedule} aria-labelledby="schedule-heading">
          <div className={styles.sectionHead}>
            <h2 id="schedule-heading">{tr("field.dashboard.todayVisits", "Today’s visits", "زيارات اليوم")}</h2>
            <Link href="/field/my-tasks">{tr("field.dashboard.allVisits", "All assigned visits", "كل الزيارات المسندة")}</Link>
          </div>
          {hub.today.length === 0 ? (
            <div className={styles.empty} role="status">
              <strong>{tr("field.dashboard.emptyTitle", "No visits assigned today", "لا توجد زيارات مسندة اليوم")}</strong>
              <p>{tr("field.dashboard.emptyBody", "This is not a completion claim. Check My Tasks for future or returned work.", "هذا لا يعني اكتمال العمل. تحقق من مهامي للمهام المستقبلية أو المعادة.")}</p>
            </div>
          ) : (
            <ol className={styles.visitList}>
              {hub.today.map((visit) => {
                const completed = hub.completedToday.some((item) => item.id === visit.id);
                return (
                  <li key={visit.id}>
                    <Link href={visitDestination(visit)}>
                      <time dateTime={visit.window_start}>{time(visit.window_start)}</time>
                      <span><strong><bdi>{visit.factories?.name}</bdi></strong><small>{visit.factories?.factory_code || visit.visit_type || "—"}</small></span>
                      <span className={`badge ${completed ? "badge-compliant" : "badge-info"}`}>{completed ? tr("field.dashboard.completed", "Completed", "مكتملة") : status(visit.operational_state)}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <nav className={styles.journeyNav} aria-label={tr("field.dashboard.journeyNav", "Visit journey", "مسار الزيارة")}>
          <Link href={next ? `/field/${next.id}` : "/field/my-tasks"}><strong>{tr("field.dashboard.preparation", "Preparation", "الاستعداد")}</strong><span>{tr("field.dashboard.preparationHint", "Review assignment and readiness", "مراجعة المهمة والجاهزية")}</span></Link>
          <Link href={next ? `/field/${next.id}/travel` : "/field/my-tasks"}><strong>{tr("field.dashboard.travel", "Travel", "السفر")}</strong><span>{tr("field.dashboard.travelHint", "Open the governed journey", "فتح الرحلة المحكومة")}</span></Link>
          <Link href={resume ? visitDestination(resume) : next ? visitDestination(next) : "/field/drafts"}><strong>{tr("field.dashboard.workspace", "Workspace", "مساحة العمل")}</strong><span>{tr("field.dashboard.workspaceHint", "Resume active inspection work", "استئناف أعمال التفتيش النشطة")}</span></Link>
          <Link href="/field/my-tasks?view=completed"><strong>{tr("field.dashboard.history", "Completed history", "سجل المكتمل")}</strong><span>{tr("field.dashboard.historyHint", "{n} completed today", "{n} مكتملة اليوم").replace("{n}", String(hub.completedToday.length))}</span></Link>
        </nav>
      </main>
      {nav}
    </>
  );
}
