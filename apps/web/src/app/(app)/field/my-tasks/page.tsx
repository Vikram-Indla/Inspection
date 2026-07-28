import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import FieldLocationMap from "@/components/field/FieldLocationMap";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { loadFactory360Dossier, resolveFactory360Permissions } from "@/lib/factory360/dossier";
import type { ProductionLine } from "@/lib/factory360/dossier";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { isNotificationUnread } from "@/lib/notification-read";
import AssignmentTaskBrowser, { type AssignmentTask } from "./AssignmentTaskBrowser";
import TaskHeaderStatus from "./TaskHeaderStatus";
import styles from "./my-tasks.module.css";
// SCR-IPAD a11y hardening — reduced-motion, coarse-pointer touch targets,
// focus-visible and the global RTL directional-icon flip, applied via the scope.
import a11y from "@/components/field/field-a11y.module.css";

// SAQEEL Field My Tasks.dc.html — the design's real "My Tasks" screen: a
// master/detail surface (assigned task list → full establishment dossier with
// establishment data, evaluation indicators, license, visit location, governed
// regulatory chips and the start-visit actions). Previously the bottom tab's
// "My Tasks" slot only linked to the visits list; this is the missing native
// screen. Reads are RLS-scoped and every value is real or a governed "—" —
// no fabricated establishment/contact/machine data (project data-integrity law).
//
// Left list reuses the SAME assignments->visits->factories query shape and the
// SAME golden-journey fixture exclusion as /field/drafts. Right detail renders
// from the SHARED lib/factory360 dossier loader (identical business data,
// calculations and permissions as web SCR-WEB-400 and the iPad Factory 360),
// resolved from the selected visit's factory_id -> industrial_license -> CR.

type Assignment = {
  visit_id: string;
  status: string | null;
  return_reason: string | null;
  visits: VisitRow | null;
};
type VisitRow = {
  id: string;
  planning_status: string;
  operational_state: string;
  window_start: string;
  visit_type: string;
  execution_mode: string;
  priority: string | null;
  package_version_id: string | null;
  window_end: string | null;
  factory_id: string | null;
  factories: {
    id: string;
    name: string;
    factory_code: string | null;
    cr_number: string | null;
    region: string | null;
    city: string | null;
    official_lat: number | null;
    official_lng: number | null;
  } | null;
  inspections: { id: string; status: string } | null;
};
// plant_production_line_items is selected with these flags by the shared loader,
// but the ProductionLine export doesn't declare them — read them via this
// narrow extension rather than casting away the whole row.
type LineFlags = ProductionLine & {
  is_machine?: boolean | null;
  is_end_product?: boolean | null;
  is_raw_material?: boolean | null;
  is_spare_part?: boolean | null;
};
type RegCard = { title: string; lines: [string, string][] };

const REG_CHIPS = ["activities", "manufacturing", "contacts", "machines", "products", "raw", "documents", "license"] as const;
type RegChip = (typeof REG_CHIPS)[number];
// Chips with no governed source contract in MVP1. These never carry records, so
// they must not fall through to the generic "zero records" empty state — that
// would misread as "your scope has none" instead of "no source is wired yet".
const NO_SOURCE_CHIPS: readonly RegChip[] = ["manufacturing", "contacts"];

// SAQEEL's governed field-data boundary is the same explicit 24-factory set
// used by /field/reports. Keep this enumerated: a shape/prefix match could
// admit a future legacy row, and the complete list avoids hiding valid work.
const CLEAN_FACTORY_CODES = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204",
  "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402",
  "F-5501", "F-5502",
  "F-6601", "F-6602",
] as const;

type SearchParams = { task?: string; reg?: string; view?: string };

export default async function FieldMyTasks({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login"); // ERR-AUTH-001: never proceed with a null session

  const dt = (value: string | null | undefined) =>
    value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" }).format(new Date(value)) : "—";
  const dateTime = (value: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Riyadh",
    }).format(new Date(value));
  const text = (value: string | number | null | undefined) => (value == null || value === "" ? "—" : String(value));
  const label = (value: string | null | undefined) => (value ? t(`enum.${value}`, value.replaceAll("_", " ")) : "—");
  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";

  const [assignmentRead, notificationRead] = await Promise.all([
    sb.from("assignments")
      .select("visit_id, status, return_reason, visits(id, planning_status, operational_state, window_start, window_end, visit_type, execution_mode, priority, package_version_id, factory_id, factories(id, name, factory_code, cr_number, region, city, official_lat, official_lng), inspections(id, status))")
      .eq("inspector_id", user.id)
      .order("created_at", { ascending: false }),
    sb.from("notifications")
      .select("payload, read_at, delivery_state")
      .eq("recipient", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const { data: asg, error } = assignmentRead;

  if (error) {
    console.error("[field my-tasks]", error.message);
    return (
      <>
        <FieldHeader title={tr("field.myTasks.title", "My Tasks", "مهامي")}
          langHref={langHref} langLabel={langLabel} />
        <div className="panel-body">
          <div role="alert" className="alert alert-critical">
            {t("field.dashboard.serviceUnavailable", "Field data is temporarily unavailable (ERR-OPS-001). Try again.")}
          </div>
        </div>
      </>
    );
  }

  const assignments = (asg as unknown as Assignment[] ?? [])
    .filter((a): a is Assignment & { visits: VisitRow } => !!a.visits && !!a.visits.factories)
    .filter(a => ["published", "expired"].includes(a.visits.planning_status))
    .filter(a => CLEAN_FACTORY_CODES.includes(
      a.visits.factories!.factory_code as typeof CLEAN_FACTORY_CODES[number],
    ))
    .filter(a => !isTestFixtureEstablishment(a.visits.factories));
  const allTasks = assignments
    .map(a => a.visits)
    .filter((v): v is VisitRow => !!v && !!v.factories && ["published", "expired"].includes(v.planning_status))
    .filter(v => !isTestFixtureEstablishment(v.factories));
  // SCR-IPAD-600 completed-history entry point. This is a read-only projection
  // of recorded terminal/submitted facts; it never advances workflow state.
  const tasks = params.view === "completed"
    ? allTasks.filter(v =>
        ["submitted", "under_review"].includes(v.operational_state)
        || ["submitted", "approved", "rejected"].includes(v.inspections?.status ?? ""))
    : allTasks;
  const unreadAlertsByVisit = new Map<string, number>();
  if (!notificationRead.error) {
    for (const row of notificationRead.data ?? []) {
      if (!isNotificationUnread(row)) continue;
      const payload = row.payload as Record<string, unknown> | null;
      const visitId = typeof payload?.visit_id === "string" ? payload.visit_id : null;
      if (visitId) unreadAlertsByVisit.set(visitId, (unreadAlertsByVisit.get(visitId) ?? 0) + 1);
    }
  } else {
    console.error("[field my-tasks notifications]", notificationRead.error.message);
  }

  const browserTasks: AssignmentTask[] = assignments.map((a) => ({
    id: a.visits.id,
    assignmentStatus: a.status,
    returnReason: a.return_reason,
    planningStatus: a.visits.planning_status,
    operationalState: a.visits.operational_state,
    windowStart: a.visits.window_start,
    windowEnd: a.visits.window_end,
    visitType: a.visits.visit_type,
    executionMode: a.visits.execution_mode,
    priority: a.visits.priority,
    packageVersionId: a.visits.package_version_id,
    inspectionId: a.visits.inspections?.id ?? null,
    inspectionStatus: a.visits.inspections?.status ?? null,
    unreadAlertCount: unreadAlertsByVisit.get(a.visits.id) ?? 0,
    factory: {
      name: a.visits.factories!.name,
      code: a.visits.factories!.factory_code,
      region: a.visits.factories!.region,
      city: a.visits.factories!.city,
    },
  }));
  const renderNow = Date.now();
  const windowStartLabels = Object.fromEntries(
    browserTasks.map(task => [task.id, dateTime(task.windowStart)]),
  );

  const selected = tasks.find(v => v.id === params.task) ?? tasks[0] ?? null;
  const activeReg: RegChip = (REG_CHIPS as readonly string[]).includes(params.reg ?? "")
    ? (params.reg as RegChip) : "activities";
  const pane = params.task ? styles.paneDetail : styles.paneList;

  // status tone: expired planning wins; otherwise map the operational state.
  // Uses SAQEEL DS badge classes (badge-compliant/warning/critical/info).
  const statusTone = (v: VisitRow) => {
    if (v.planning_status === "expired") return "badge-warning";
    switch (v.operational_state) {
      case "submitted": case "approved": case "completed": case "closed": return "badge-compliant";
      case "cancelled": case "rejected": return "badge-critical";
      case "in_progress": case "arrived": case "checked_in": case "started": return "badge-info";
      default: return "badge-info";
    }
  };
  const statusLabel = (v: VisitRow) => (v.planning_status === "expired" ? label("expired") : label(v.operational_state));

  // Resolve the selected visit's factory -> industrial license -> CR, then load
  // the shared dossier. Identical resolution to /field/establishments.
  const permissions = selected?.factory_id ? await resolveFactory360Permissions(sb) : null;
  let dossier: Awaited<ReturnType<typeof loadFactory360Dossier>> | null = null;
  // The design's Establishment Data header carries a "Timeline" control. Its
  // governed target is the existing Factory 360 profile (CR-106 — factory
  // profile AND history), reached with the same CR/licence pair this screen
  // already resolved. No new capability is invented; when no CR/licence
  // mapping resolves there is no dossier section at all, so no dead control.
  let timelineHref: string | null = null;
  if (selected?.factory_id && permissions?.["view_factory_360"]) {
    const { data: licRows } = await sb.from("industrial_licenses")
      .select("id, commercial_registration_id, license_number")
      .eq("factory_id", selected.factory_id)
      .order("license_number");
    const lic = (licRows ?? []).find(r => (r as { commercial_registration_id: string | null }).commercial_registration_id) as
      { id: string; commercial_registration_id: string } | undefined;
    if (lic?.commercial_registration_id) {
      dossier = await loadFactory360Dossier(sb, lic.commercial_registration_id, lic.id, permissions);
      timelineHref = `/field/factory-360/${lic.commercial_registration_id}?license=${lic.id}`
        + `&return=${encodeURIComponent(`/field/my-tasks?task=${selected.id}`)}`;
    }
  }

  const cr = dossier?.cr ?? null;
  const factory = dossier?.factory ?? null;
  const selLicense = dossier?.selected ?? null;
  const address = dossier?.address ?? null;
  const lines = (dossier?.lines ?? []) as LineFlags[];
  const currentCompliance = dossier?.currentCompliance;

  const crTitle = cr
    ? (locale === "ar" ? cr.legal_name_ar ?? cr.legal_name ?? cr.legal_name_en ?? cr.cr_number
      : cr.legal_name_en ?? cr.legal_name ?? cr.legal_name_ar ?? cr.cr_number)
    : selected?.factories?.name ?? "—";

  const investment = selLicense?.investment_size != null
    ? new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(selLicense.investment_size)
    : "—";

  const addressText = address
    ? [address.address_line_1, locale === "ar" ? address.street_name_ar : address.street_name_en,
       locale === "ar" ? address.city_ar : address.city_en, locale === "ar" ? address.region_ar : address.region_en]
      .filter(Boolean).join(" · ") || "—"
    : "—";

  const lat = factory?.official_lat ?? selected?.factories?.official_lat ?? null;
  const lng = factory?.official_lng ?? selected?.factories?.official_lng ?? null;

  const showLineName = (row: LineFlags) => (locale === "ar" ? row.name_ar ?? row.name_en ?? "—" : row.name_en ?? row.name_ar ?? "—");
  const lineCard = (row: LineFlags): RegCard => ({
    title: showLineName(row),
    lines: [
      [tr("field.myTasks.hs", "HS / activity", "الترميز / النشاط"), text(row.hs_code ?? row.activity_code)],
      [tr("field.myTasks.qty", "Qty / capacity", "الكمية / الطاقة"), `${text(row.quantity)} / ${text(row.capacity)}`],
    ],
  });

  // Every card is built strictly from real, RLS-scoped dossier data. Chips with
  // no governed backing (contacts, manufacturing-status) resolve to an empty
  // array and render the governed "no records" state — never invented rows.
  const regCards: RegCard[] = (() => {
    if (!dossier) return [];
    switch (activeReg) {
      case "machines":
        return lines.filter(l => l.is_machine).map(lineCard);
      case "products":
        return lines.filter(l => l.is_end_product).map(lineCard);
      case "raw":
        return lines.filter(l => l.is_raw_material).map(lineCard);
      case "activities": {
        const withActivity = lines.filter(l => l.activity_code);
        if (withActivity.length) return withActivity.map(l => ({
          title: (locale === "ar" ? l.activity_name_ar ?? l.activity_name_en : l.activity_name_en ?? l.activity_name_ar) ?? showLineName(l),
          lines: [[tr("field.myTasks.activityNo", "Activity code", "رمز النشاط"), text(l.activity_code)]],
        }));
        return factory?.activity_class
          ? [{ title: label(factory.activity_class), lines: [[tr("field.myTasks.activityClass", "Activity class", "تصنيف النشاط"), label(factory.activity_class)]] }]
          : [];
      }
      case "documents":
        return dossier.docs.map(doc => ({
          title: doc.title,
          lines: [
            [tr("common.type", "Type", "النوع"), label(doc.business_category ?? doc.doc_type)],
            [tr("common.reference", "Reference", "المرجع"), text(doc.reference_no)],
            [tr("field.myTasks.validTo", "Valid to", "ساري حتى"), dt(doc.valid_to)],
          ],
        }));
      case "license": {
        const cards: RegCard[] = [];
        if (selLicense) cards.push({
          title: tr("field.myTasks.licenseCert", "Industrial license certificate", "شهادة الترخيص الصناعي"),
          lines: [
            [tr("field.myTasks.licenseNumber", "License number", "رقم الرخصة"), text(selLicense.license_number)],
            [tr("field.myTasks.expiryDate", "Expiry date", "تاريخ الانتهاء"), dt(selLicense.expiry_date)],
          ],
        });
        for (const rec of dossier.government) cards.push({
          title: text(rec.title ?? rec.record_type),
          lines: [
            [tr("common.reference", "Reference", "المرجع"), text(rec.external_record_id)],
            [tr("common.status", "Status", "الحالة"), label(rec.status)],
          ],
        });
        return cards;
      }
      // manufacturing status & contacts have no governed source contract here.
      default:
        return [];
    }
  })();

  const regChipLabel: Record<RegChip, string> = {
    activities: tr("field.myTasks.reg.activities", "Factory Activities", "أنشطة المصنع"),
    manufacturing: tr("field.myTasks.reg.manufacturing", "Manufacturing Status", "حالات التصنيع"),
    contacts: tr("field.myTasks.reg.contacts", "Contacts", "جهات الاتصال"),
    machines: tr("field.myTasks.reg.machines", "Machines", "الآلات"),
    products: tr("field.myTasks.reg.products", "Products", "المنتجات"),
    raw: tr("field.myTasks.reg.raw", "Raw Materials", "المواد الأولية"),
    documents: tr("field.myTasks.reg.documents", "Documents", "الوثائق"),
    license: tr("field.myTasks.reg.license", "License Documents", "وثائق الرخصة"),
  };

  // Start-visit wiring — identical to the dashboard's resolved start href:
  // resume the real inspection if one is under way, else open the governed
  // visit startup/check-in route. No invented route.
  const startHref = selected
    ? (selected.inspections && selected.inspections.status !== "not_started"
        ? `/field/inspection/${selected.inspections.id}`
        : `/field/${selected.id}`)
    : "/field#visits";
  const remoteHref = selected ? `/field/${selected.id}` : "/field#visits";

  const backBtn = selected ? (
    <Link href="/field/my-tasks" prefetch={false} className={`btn btn-icon btn-ghost ${styles.back}`}
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m9 6 6 6-6 6" /></svg>
    </Link>
  ) : undefined;

  return (
    <>
      <FieldHeader
        leading={backBtn}
        title={tr("field.myTasks.title", "My Tasks", "مهامي")}
        subtitle={tr("field.myTasks.sub", "Tasks assigned to you · authority-scoped", "المهام المسندة إليك · نطاق محكوم بالصلاحية")}
        langHref={langHref} langLabel={langLabel}
        right={
          <TaskHeaderStatus
            onlineLabel={tr("field.myTasks.onlinePill", "Online", "متصل")}
            offlineLabel={tr("field.myTasks.offlinePill", "Offline", "غير متصل")}
            syncLabel={tr("field.myTasks.syncNow", "Sync now", "مزامنة الآن")}
            syncingLabel={tr("field.myTasks.syncing", "Syncing…", "جارٍ المزامنة…")}
          />
        }
      />
      <div className={`${styles.grid} ${pane} ${a11y.scope}`}>
        {/* LEFT — assigned task list */}
        <div className={styles.list}>
          <AssignmentTaskBrowser
            tasks={browserTasks}
            selectedId={selected?.id ?? null}
            alertSourceAvailable={!notificationRead.error}
            locale={locale === "ar" ? "ar" : "en"}
            renderNow={renderNow}
            windowStartLabels={windowStartLabels}
            labels={{
              search: tr("field.myTasks.search", "Search factory, visit, city or region", "ابحث عن منشأة أو زيارة أو مدينة أو منطقة"),
              all: tr("field.myTasks.filter.all", "All", "الكل"),
              today: tr("field.myTasks.filter.today", "Today", "اليوم"),
              active: tr("field.myTasks.filter.active", "Active", "النشطة"),
              upcoming: tr("field.myTasks.filter.upcoming", "Upcoming", "القادمة"),
              alerts: tr("field.myTasks.filter.alerts", "Needs attention", "تحتاج إلى انتباه"),
              alertsUnavailable: tr("field.myTasks.alertsUnavailable", "Assignment alerts are temporarily unavailable. Other assignment data remains visible.", "تنبيهات المهام غير متاحة مؤقتاً. تبقى بيانات المهام الأخرى ظاهرة."),
              returned: tr("field.myTasks.filter.returned", "Returned", "المعادة"),
              expired: tr("field.myTasks.filter.expired", "Expired", "المنتهية"),
              earliest: tr("field.myTasks.sort.earliest", "Earliest first", "الأقرب أولاً"),
              latest: tr("field.myTasks.sort.latest", "Latest first", "الأبعد أولاً"),
              empty: tr("field.myTasks.empty", "No assigned tasks in your scope.", "لا توجد مهام مسندة ضمن نطاقك."),
              emptyFiltered: tr("field.myTasks.emptyFiltered", "No assignments match this search and filter.", "لا توجد مهام تطابق البحث والتصفية."),
              offline: tr("field.myTasks.offline", "Offline — server refresh is unavailable. Information shown may be stale; reconnect and retry.", "غير متصل — تحديث الخادم غير متاح. قد تكون المعلومات المعروضة قديمة؛ أعد الاتصال وحاول مجدداً."),
              online: tr("field.myTasks.online", "Online — assignments are server-scoped to you.", "متصل — المهام محددة لك من الخادم."),
              open: tr("field.myTasks.open", "Open assignment", "فتح المهمة"),
              prepare: tr("field.myTasks.prepare", "Accept / prepare", "قبول / تحضير"),
              continueAction: tr("field.myTasks.continue", "Continue", "متابعة"),
              preparing: tr("field.myTasks.preparing", "Preparing…", "جارٍ التحضير…"),
              returnAction: tr("field.myTasks.return", "Return…", "إعادة…"),
              viewOnly: tr("field.myTasks.viewOnly", "View only", "عرض فقط"),
              packageLinked: tr("field.myTasks.packageLinked", "Package linked", "حزمة مرتبطة"),
              packageMissing: tr("field.myTasks.packageMissing", "Package not linked", "لا توجد حزمة مرتبطة"),
              priority: tr("field.myTasks.priority", "Priority", "الأولوية"),
              statusLabels: {
                new: tr("field.myTasks.status.new", "New", "جديدة"),
                prepared: tr("field.myTasks.status.prepared", "Prepared", "جاهزة"),
                on_the_way: tr("field.myTasks.status.onTheWay", "On the way", "في الطريق"),
                arrived: tr("field.myTasks.status.arrived", "Arrived", "تم الوصول"),
                executing: tr("field.myTasks.status.executing", "In progress", "قيد التنفيذ"),
                submitted: tr("field.myTasks.status.submitted", "Submitted", "مرسلة"),
                approved: tr("field.myTasks.status.approved", "Approved", "معتمدة"),
                completed: tr("field.myTasks.status.completed", "Completed", "مكتملة"),
                closed: tr("field.myTasks.status.closed", "Closed", "مغلقة"),
                cancelled: tr("field.myTasks.status.cancelled", "Cancelled", "ملغاة"),
                rejected: tr("field.myTasks.status.rejected", "Rejected", "مرفوضة"),
              },
              priorityLabels: {
                low: tr("field.myTasks.priority.low", "Low", "منخفضة"),
                medium: tr("field.myTasks.priority.medium", "Medium", "متوسطة"),
                high: tr("field.myTasks.priority.high", "High", "عالية"),
                urgent: tr("field.myTasks.priority.urgent", "Urgent", "عاجلة"),
              },
            }}
          />
        </div>

        {/* RIGHT — selected task establishment detail */}
        <div className={styles.detail}>
          {!selected ? (
            <div className={styles.empty}>
              <div className="panel-title">{tr("field.myTasks.selectPrompt", "Select a task", "اختر مهمة")}</div>
              <p className="t-caption">{tr("field.myTasks.selectBody", "Pick a task from the list to see the establishment dossier.", "اختر مهمة من القائمة لعرض ملف المنشأة.")}</p>
            </div>
          ) : (
            <>
              <div className={styles.hero} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="avatar-lg">
                  <path d="M3 21V10l7 4v-4l7 4V6l4-2v17" /><path d="M3 21h18" />
                </svg>
              </div>

              {!dossier ? (
                <div className={styles.sec}>
                  <div className={styles.secHead}>
                    <h3><bdi>{crTitle}</bdi></h3>
                  </div>
                  <p className="t-caption">{tr(
                    "field.myTasks.noDossier",
                    "The full establishment dossier is unavailable until a commercial-registration/licence mapping exists for this factory, or Factory 360 access is granted.",
                    "ملف المنشأة الكامل غير متاح حتى يتوفر ربط بالسجل التجاري/الترخيص لهذا المصنع أو تُمنح صلاحية المصنع 360.",
                  )}</p>
                  <dl className={styles.row2}>
                    <div className={styles.kv}><dt className="k">{tr("field.myTasks.window", "Visit window", "نافذة الزيارة")}</dt><dd className="v id-code">{dt(selected.window_start)}</dd></div>
                    <div className={styles.kv}><dt className="k">{tr("field.myTasks.factoryCode", "Factory code", "رمز المصنع")}</dt><dd className="v"><bdi>{text(selected.factories?.factory_code)}</bdi></dd></div>
                  </dl>
                </div>
              ) : (
                <>
                  {/* 1 — Establishment Data */}
                  <div className={styles.sec}>
                    <div className={styles.secHead}>
                      <h3>{tr("field.myTasks.estData", "Establishment Data", "بيانات المنشأة")}</h3>
                      <span className="badge badge-info">{tr("field.myTasks.licensedEst", "Licensed establishment", "منشأة مرخصة")}</span>
                      <span className="grow" />
                      {timelineHref ? (
                        <Link href={timelineHref} prefetch={false} className="btn btn-secondary btn-sm">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
                            className={styles.secHeadIcon} aria-hidden="true">
                            <circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" />
                          </svg>
                          {tr("field.myTasks.timeline", "Timeline", "الجدول الزمني")}
                        </Link>
                      ) : null}
                    </div>
                    <div className={styles.title}><bdi>{crTitle}</bdi></div>
                    <dl className={styles.row2}>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.regNumber", "Registration no.", "رقم السجل")}</dt><dd className="v id-code"><bdi>{text(cr?.cr_number)}</bdi></dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.phone", "Phone", "رقم الهاتف")}</dt><dd className="v id-code">—</dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.investment", "Investment size", "حجم الاستثمار")}</dt><dd className="v"><bdi>{investment}</bdi></dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.requestDate", "Request created on", "تاريخ إنشاء الطلب")}</dt><dd className="v id-code">{dt(cr?.issue_date)}</dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.estType", "Establishment type", "نوع المنشأة")}</dt><dd className="v">{tr("field.myTasks.factory", "Factory", "مصنع")}</dd></div>
                      {/* Design renders establishment status as a badge. Tone
                          is informational only — no status is graded here, and
                          an absent status stays a dash rather than a badge. */}
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.estStatus", "Establishment status", "حالة المنشأة")}</dt>
                        <dd className="v">{cr?.status ? <span className="badge badge-info">{label(cr.status)}</span> : "—"}</dd></div>
                    </dl>
                  </div>

                  {/* 2 — Evaluation Indicators */}
                  <div className={styles.sec}>
                    <h3>{tr("field.myTasks.evalIndicators", "Evaluation Indicators", "مؤشرات التقييم")}</h3>
                    <dl className={styles.row2}>
                      <div className={styles.kv}>
                        <dt className="k">{tr("field.myTasks.complianceRate", "Compliance rate", "نسبة الامتثال")}</dt>
                        {/* Design pairs the rate with a trailing caption. The
                            only governed caption is the passed/answered basis
                            used by Factory 360 — no band word is invented. */}
                        <dd className="v id-code">
                          {currentCompliance?.rate == null ? t("f360.compliance.notAvailable", "Not Available") : `${currentCompliance.rate}%`}
                          {currentCompliance?.status === "available"
                            ? <span className="t-caption"> {currentCompliance.passed}/{currentCompliance.answered}</span>
                            : null}
                        </dd>
                      </div>
                      <div className={styles.kv}>
                        <dt className="k">{tr("field.myTasks.riskScore", "Risk score", "درجة الخطورة")}</dt>
                        <dd>
                          {permissions?.["view_risk_details"]
                            ? <span className={`badge ${factory?.risk_band === "high" ? "badge-critical" : factory?.risk_band === "medium" ? "badge-warning" : factory?.risk_band ? "badge-compliant" : "badge-outline"}`}><span className="dot" aria-hidden="true" />{text(factory?.risk_score)}{factory?.risk_band ? ` · ${label(factory.risk_band)}` : ""}</span>
                            : <span className="badge badge-outline">{t("f360.restricted", "restricted")}</span>}
                        </dd>
                      </div>
                    </dl>
                    <p className="t-caption">
                      {tr("field.myTasks.healthRiskNote", "Health score and risk score are separate, governed concepts.", "درجة الصحة ودرجة الخطورة مفهومان منفصلان محكومان.")}
                    </p>
                  </div>

                  {/* 3 — License Data */}
                  <div className={styles.sec}>
                    <h3>{tr("field.myTasks.licenseData", "License Data", "بيانات الترخيص")}</h3>
                    <dl className={styles.row2}>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.licenseType", "License type", "نوع الترخيص")}</dt><dd className="v">{label(selLicense?.license_type)}</dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.licenseStatus", "License status", "حالة الترخيص")}</dt><dd><span className="badge badge-compliant">{label(selLicense?.status)}</span></dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.expiryDate", "Expiry date", "تاريخ الانتهاء")}</dt><dd className="v id-code">{dt(selLicense?.expiry_date)}</dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.licenseNumber", "License number", "رقم الرخصة")}</dt><dd className="v id-code"><bdi>{text(selLicense?.license_number)}</bdi></dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.region", "Region", "المنطقة")}</dt><dd className="v">{label(factory?.region)}</dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.city", "City", "المدينة")}</dt><dd className="v">{label(factory?.city)}</dd></div>
                    </dl>
                  </div>

                  {/* 4 — Visit Location */}
                  <div className={styles.sec}>
                    <h3>{tr("field.myTasks.visitLocation", "Visit Location", "موقع الزيارة")}</h3>
                    <div className={styles.kv}>
                      <span className="k">{tr("field.myTasks.address", "Address", "العنوان")}</span>
                      <span className="v"><bdi>{addressText}</bdi></span>
                    </div>
                    <div className={styles.map}>
                      {lat != null && lng != null ? (
                        <>
                          <FieldLocationMap lat={lat} lng={lng} label={factory?.name ?? crTitle} />
                          {/* Design's map attribution caption. The provider is
                              named only on the branch that actually renders the
                              shared Mapbox GL map. */}
                          <span className={`id-code ${styles.mapCaption}`}>
                            Mapbox GL · {tr("field.myTasks.officialLoc", "official location", "الموقع الرسمي")}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="t-caption">{tr("field.myTasks.locUnavailable", "Official location unavailable", "الموقع الرسمي غير متاح")}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 5 — Regulatory Data */}
                  <div className={styles.sec}>
                    <h3>{tr("field.myTasks.regData", "Regulatory Data", "البيانات التنظيمية")}</h3>
                    <div className={styles.chiprow}>
                      {REG_CHIPS.map(chip => (
                        <Link key={chip} href={`/field/my-tasks?task=${selected.id}&reg=${chip}`} prefetch={false}
                          className={`${styles.chip} ${activeReg === chip ? styles.chipActive : ""}`}
                          aria-pressed={activeReg === chip ? "true" : "false"}>
                          {regChipLabel[chip]}
                        </Link>
                      ))}
                    </div>
                    {regCards.length === 0 && NO_SOURCE_CHIPS.includes(activeReg) ? (
                      <div className={styles.regstack}>
                        <div className={styles.regcard}>
                          <span className="badge badge-pending"><span className="dot" />{tr("field.myTasks.noSourceTag", "No governed source", "لا يوجد مصدر محكوم")}</span>
                          <p className="t-caption">
                            {tr("field.myTasks.noSource", "No governed source connected yet for", "لا يوجد مصدر محكوم متصل بعد لـ")} <bdi>{regChipLabel[activeReg]}</bdi>
                          </p>
                        </div>
                      </div>
                    ) : regCards.length === 0 ? (
                      <p className="t-caption">{tr("field.myTasks.noRecords", "No source-backed records are available in your scope for this section.", "لا توجد سجلات من مصدر موثوق ضمن نطاقك لهذا القسم.")}</p>
                    ) : (
                      <div className={styles.regstack}>
                        {regCards.map((c, i) => (
                          <div key={i} className={styles.regcard}>
                            <div className={styles.regcardTitle}><bdi>{c.title}</bdi></div>
                            <dl className={styles.row2}>
                              {c.lines.map(([k, val], j) => (
                                <div key={j} className={styles.kv}><dt className="k">{k}</dt><dd className="v"><bdi>{val}</bdi></dd></div>
                              ))}
                            </dl>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 6 — Sticky action bar */}
              <div className={styles.actionbar} role="group" aria-label={t("common.actions", "Actions")}>
                <a className="btn btn-secondary btn-block" href={remoteHref}>
                  {tr("field.myTasks.startRemote", "Start remote visit", "بدء زيارة عن بُعد")}
                </a>
                <a className="btn btn-primary btn-block" href={startHref}>
                  {tr("field.myTasks.startVisit", "Start visit execution", "بدء تنفيذ الزيارة")}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
      {/* No local nav spacer: FieldNav is position:fixed and renders its own
          .field-nav-spacer. Keeping the design's static 58px div here shrank
          the master/detail grid and floated the action bar above the tab bar. */}
    </>
  );
}
