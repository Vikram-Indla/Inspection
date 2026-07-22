import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import { getPlanningAccess } from "@/lib/planning/access";
import {
  queryPlanningVisits, fetchLastUpdates,
  PLANNING_TABS, DEFAULT_PLANNING_SORT, PLANNING_SORT_KEYS,
  type PlanningTab, type PlanningListParams, type PlanningVisitRow,
} from "@/lib/planning/visit-list";
import CreateVisitSection, { type CreateVisitMethod } from "./CreateVisitSection";
import DiscardDraftButton from "./DiscardDraftButton";
import ExportButton from "./ExportButton";
import RefreshButton from "./RefreshButton";

export const dynamic = "force-dynamic";

// CD-020 / SCR-WEB-100 — Planning Visit List (PLN-REQ-005/006/012–018).
// /planning is the canonical list-first landing: KPI/status tabs, server-side
// search + typed filters held entirely in the URL (share-safe; they survive
// detail navigation), the contract columns, Create Visit / Export / Refresh
// page actions, draft continuation and returned work. Access is the canonical
// capability model: business_staff (any authenticated user who is neither
// admin nor inspector) may plan; inspector and admin classes are denied.
// Legacy routes (/planning/bulk, /single, /immediate, /plans) are untouched.

const PAGE_SIZE = 25;

const STATUS_TONE: Record<string, string> = {
  draft: "ax-lozenge--info", validated: "ax-lozenge--info", published: "ax-lozenge--info",
  returned: "ax-lozenge--warning", cancelled: "ax-lozenge--critical", expired: "ax-lozenge--critical",
};

const fmt = (iso: string) => new Date(iso).toISOString().slice(0, 16).replace("T", " ");
const dash = (v: string | null) => (v && v.length > 0 ? v : "—");

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

type Sp = Record<string, string | string[] | undefined>;

function parseParams(sp: Sp): PlanningListParams {
  const tabRaw = first(sp.tab);
  const tab: PlanningTab = (PLANNING_TABS as readonly string[]).includes(tabRaw) ? (tabRaw as PlanningTab) : "all";
  const sortRaw = first(sp.sort);
  return {
    tab,
    search: first(sp.q).trim(),
    filters: {
      method: first(sp.method) || undefined,
      visitType: first(sp.visitType) || undefined,
      region: first(sp.region) || undefined,
      city: first(sp.city) || undefined,
      inspectorId: first(sp.inspectorId) || undefined,
      windowFrom: first(sp.windowFrom) || undefined,
      windowTo: first(sp.windowTo) || undefined,
      createdFrom: first(sp.createdFrom) || undefined,
      createdTo: first(sp.createdTo) || undefined,
      packageVersionId: first(sp.packageVersionId) || undefined,
      priority: first(sp.priority) || undefined,
      bulkPlanRef: first(sp.bulkPlanRef) || undefined,
    },
    sort: PLANNING_SORT_KEYS.includes(sortRaw) ? sortRaw : DEFAULT_PLANNING_SORT,
    page: Math.max(1, Number.parseInt(first(sp.page), 10) || 1),
    pageSize: PAGE_SIZE,
  };
}

// Share-safe URL state: every link (tab, pagination) carries the current
// search/filter/sort state forward; only the intended key changes.
function hrefWith(sp: Sp, overrides: Record<string, string>): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const val = first(v);
    if (val) merged[k] = val;
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v) merged[k] = v; else delete merged[k];
  }
  const qs = new URLSearchParams(merged).toString();
  return qs ? `/planning?${qs}` : "/planning";
}

type DraftRow = {
  id: string; method: string; status: string; plan_reference: string | null;
  draft_version: number; created_at: string; created_by: string;
  profiles: { full_name: string } | null;
};

const continueHref = (d: DraftRow) =>
  d.method === "bulk" ? `/planning/bulk/review?plan=${d.id}`
    : d.method === "single" ? `/planning/single?plan=${d.id}`
      : `/planning/immediate?plan=${d.id}`;

export default async function PlanningHome({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb); // identity verified once; the RPC class check below is the access decision

  const access = await getPlanningAccess(sb, ["planning.view", "planning.create", "planning.export"]);
  const title = t("plan.home.title", "Visit planning");
  if (access.error) {
    return (
      <Shell current="/planning" title={title}>
        <EmptyState glyph="⚠" title={tr("plan.home.unavailable.title", "Planning data unavailable", "بيانات التخطيط غير متاحة")}
          body={tr("plan.home.unavailable.body", "The planning workspace could not be loaded (ERR-OPS-001). Nothing was created or changed. Try again.", "تعذر تحميل مساحة التخطيط (ERR-OPS-001). لم يتم إنشاء أو تغيير أي بيانات. أعد المحاولة.")} />
      </Shell>
    );
  }
  if (access.accessClass !== "business_staff" || !access.can("planning.view")) {
    return (
      <Shell current="/planning" title={title}>
        <EmptyState glyph="⛔" title={tr("plan.home.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}
          body={tr("plan.home.unauthorized.body", "Visit Planning (SCR-WEB-100) is available to internal business staff. Inspector and administration accounts use their own workspaces.", "تخطيط الزيارات (SCR-WEB-100) متاح لموظفي الأعمال الداخليين. تستخدم حسابات المفتشين والإدارة مساحات عملها الخاصة.")} />
      </Shell>
    );
  }

  const params = parseParams(sp);

  // M02-016 parity with /visits — persist published→expired before reading so
  // the Expired tab and counts are fresh; a failed refresh never blocks the list.
  const { error: expiryError } = await sb.rpc("expire_lapsed_visits");
  if (expiryError) console.error("[planning.list] expiry refresh failed:", expiryError.message);

  const regionFilter = params.filters.region;
  const [list, lookupsRead, regionsRead, citiesRead, inspectorsRead, packagesRead, draftsRead] = await Promise.all([
    queryPlanningVisits(sb, params),
    sb.from("planning_lookups").select("kind, key, label_en, label_ar").in("kind", ["visit_type", "priority"]).eq("is_active", true).order("sort_order"),
    sb.from("factories").select("region").not("region", "is", null).limit(1000),
    regionFilter
      ? sb.from("factories").select("city").eq("region", regionFilter).not("city", "is", null).limit(1000)
      : sb.from("factories").select("city").not("city", "is", null).limit(1000),
    sb.from("profiles").select("user_id, full_name, user_roles!user_roles_user_id_fkey!inner(role_key)").eq("user_roles.role_key", "inspector").order("full_name"),
    sb.from("package_versions").select("id, version_label, packages(title)").order("published_at", { ascending: false, nullsFirst: false }).limit(500),
    sb.from("visit_plans").select("id, method, status, plan_reference, draft_version, created_at, created_by, profiles(full_name)")
      .in("status", ["draft", "validated"]).is("archived_at", null).order("created_at", { ascending: false }).limit(10),
  ]);

  const optionError = lookupsRead.error ?? regionsRead.error ?? citiesRead.error ?? inspectorsRead.error ?? packagesRead.error ?? draftsRead.error;
  if (!list.ok || optionError) {
    if (optionError) console.error("[planning.list] option/draft read failed:", optionError.message);
    return (
      <Shell current="/planning" title={title}>
        <EmptyState glyph="⚠" title={tr("plan.home.unavailable.title", "Planning data unavailable", "بيانات التخطيط غير متاحة")}
          body={tr("plan.home.unavailable.body", "The planning workspace could not be loaded (ERR-OPS-001). Nothing was created or changed. Try again.", "تعذر تحميل مساحة التخطيط (ERR-OPS-001). لم يتم إنشاء أو تغيير أي بيانات. أعد المحاولة.")} />
      </Shell>
    );
  }

  const lastUpdates = await fetchLastUpdates(sb, list.rows.map(r => r.id));

  const lookups = (lookupsRead.data ?? []) as { kind: string; key: string; label_en: string; label_ar: string | null }[];
  const lookupLabel = (l: { label_en: string; label_ar: string | null }) => (locale === "ar" ? (l.label_ar ?? l.label_en) : l.label_en);
  const visitTypeOptions = lookups.filter(l => l.kind === "visit_type");
  const priorityOptions = lookups.filter(l => l.kind === "priority");
  const distinct = (rows: Record<string, unknown>[], key: string) =>
    [...new Set(rows.map(r => r[key]).filter((v): v is string => typeof v === "string" && v.length > 0))].sort();
  const regionOptions = distinct((regionsRead.data ?? []) as Record<string, unknown>[], "region");
  const cityOptions = distinct((citiesRead.data ?? []) as Record<string, unknown>[], "city");
  const inspectors = (inspectorsRead.data ?? []).map(r => ({ user_id: r.user_id as string, full_name: r.full_name as string }));
  const packageOptions = ((packagesRead.data ?? []) as unknown as { id: string; version_label: string; packages: { title: string } | null }[])
    .map(p => ({ id: p.id, label: `${p.packages?.title ?? "—"} · ${p.version_label}` }));
  const drafts = (draftsRead.data ?? []) as unknown as DraftRow[];

  const methods: CreateVisitMethod[] = [
    { glyph: "▦", title: t("plan.method.bulk.title", "Plan multiple visits"), desc: t("plan.method.bulk.desc", "AND/OR criteria over the Factory list; many visits under one plan (M01-002)."), href: "/planning/bulk" },
    { glyph: "▣", title: t("plan.method.single.title", "Plan one visit"), desc: t("plan.method.single.desc", "One registered factory via CR / Industrial License; one plan, one visit (M01-034/042)."), href: "/planning/single" },
    { glyph: "⚡", title: t("plan.method.immediate.title", "Create an urgent visit"), desc: t("plan.method.immediate.desc", "Unregistered factory allowed with mandatory location (M01-045/046)."), href: "/planning/immediate" },
  ];

  const tabLabels: Record<PlanningTab, string> = {
    all: tr("plan.list.tabAll", "All", "الكل"),
    draft: t("enum.draft", "Draft"),
    published: t("enum.published", "Published"),
    returned: t("enum.returned", "Returned"),
    cancelled: t("enum.cancelled", "Cancelled"),
    expired: t("enum.expired", "Expired"),
  };

  const sortLabels: Record<string, string> = {
    created_desc: tr("plan.list.sortCreatedDesc", "Created — newest first", "الإنشاء — الأحدث أولاً"),
    created_asc: tr("plan.list.sortCreatedAsc", "Created — oldest first", "الإنشاء — الأقدم أولاً"),
    window_asc: tr("plan.list.sortWindowAsc", "Window — earliest first", "النافذة — الأقرب أولاً"),
    window_desc: tr("plan.list.sortWindowDesc", "Window — latest first", "النافذة — الأبعد أولاً"),
    reference_asc: tr("plan.list.sortReferenceAsc", "Visit reference", "مرجع الزيارة"),
    status_asc: tr("plan.list.sortStatusAsc", "Planning status", "حالة التخطيط"),
  };

  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const page = Math.min(list.page, totalPages);

  return (
    <Shell current="/planning" title={title}
      context={<span className="ax-caption ax-numeric">{tr("plan.list.context", "{total} visits in scope", "{total} زيارة في النطاق").replace("{total}", String(list.total))}</span>}>
      {/* Page actions — Create Visit / Export / Refresh (PLN-REQ-006/017/018) */}
      <div className="ax-row" style={{ gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
        {access.can("planning.create") && (
          <CreateVisitSection methods={methods} strings={{
            createLabel: tr("plan.list.createVisit", "Create Visit", "إنشاء زيارة"),
            oneMethodNote: t("plan.home.oneMethod", "One planning method per creation session (M01-011 · REF-001)."),
          }} />
        )}
        {access.can("planning.export") && (
          <ExportButton params={params} strings={{
            label: tr("plan.list.export", "Export (CSV)", "تصدير (CSV)"),
            busyLabel: tr("plan.list.exporting", "Exporting…", "جارٍ التصدير…"),
            unauthorized: tr("plan.list.exportUnauthorized", "Export is not authorized for your account.", "التصدير غير مصرح لحسابك."),
            unavailable: tr("plan.list.exportUnavailable", "Export failed — nothing was downloaded. Try again.", "فشل التصدير — لم يتم تنزيل أي ملف. أعد المحاولة."),
            cappedNote: tr("plan.list.exportCapped", "Exported the first {n} matching rows — refine the filters for the rest.", "تم تصدير أول {n} صفًا مطابقًا — حسّن عوامل التصفية للباقي."),
          }} />
        )}
        <RefreshButton label={tr("plan.list.refresh", "Refresh", "تحديث")} busyLabel={tr("plan.list.refreshing", "Refreshing…", "جارٍ التحديث…")} />
      </div>

      {/* KPI / status tabs with live counts (PLN-REQ-012) */}
      <div className="ax-kpi-row" role="group" aria-label={tr("plan.list.tabsAria", "Planning status tabs", "تبويبات حالة التخطيط")}>
        {PLANNING_TABS.map(tab => (
          <a key={tab} href={hrefWith(sp, { tab: tab === "all" ? "" : tab, page: "" })}
            className="ax-surface ax-kpi" aria-current={params.tab === tab ? "page" : undefined}
            style={{ textDecoration: "none", color: "inherit", outline: params.tab === tab ? "2px solid var(--focus-ring, currentColor)" : undefined }}>
            <span className="ax-overline">{tabLabels[tab]}</span>
            <span className="ax-kpi__value ax-numeric">{list.counts[tab]}</span>
          </a>
        ))}
      </div>

      {/* Filter bar — GET form keeps all state in the URL (PLN-REQ-014/015/016) */}
      <form method="get" action="/planning" className="ax-surface ax-panel"
        style={{ padding: "var(--space-6)", display: "flex", flexWrap: "wrap", gap: "var(--space-4)", alignItems: "flex-end" }}>
        {params.tab !== "all" && <input type="hidden" name="tab" value={params.tab} />}
        <label className="ax-field" style={{ flex: "1 1 260px" }}>
          <span className="ax-field__label">{tr("plan.list.searchLabel", "Search", "بحث")}</span>
          <input className="ax-input" type="search" name="q" defaultValue={params.search}
            placeholder={tr("plan.list.searchPlaceholder", "Visit reference, plan reference, CR, licence, factory or inspector…", "مرجع الزيارة، مرجع الخطة، السجل التجاري، الرخصة، المصنع أو المفتش…")} />
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.filterMethod", "Planning type", "نوع التخطيط")}</span>
          <select className="ax-select" name="method" defaultValue={params.filters.method ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {["bulk", "single", "immediate"].map(m => <option key={m} value={m}>{t(`enum.${m}`, m)}</option>)}
          </select>
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.filterVisitType", "Visit type", "نوع الزيارة")}</span>
          <select className="ax-select" name="visitType" defaultValue={params.filters.visitType ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {visitTypeOptions.map(o => <option key={o.key} value={o.key}>{lookupLabel(o)}</option>)}
          </select>
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.filterPriority", "Priority", "الأولوية")}</span>
          <select className="ax-select" name="priority" defaultValue={params.filters.priority ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {priorityOptions.map(o => <option key={o.key} value={o.key}>{lookupLabel(o)}</option>)}
          </select>
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.filterRegion", "Region", "المنطقة")}</span>
          <select className="ax-select" name="region" defaultValue={params.filters.region ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.filterCity", "City", "المدينة")}</span>
          <select className="ax-select" name="city" defaultValue={params.filters.city ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.filterInspector", "Inspector", "المفتش")}</span>
          <select className="ax-select" name="inspectorId" defaultValue={params.filters.inspectorId ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}
          </select>
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.filterPackage", "Report package", "حزمة التقارير")}</span>
          <select className="ax-select" name="packageVersionId" defaultValue={params.filters.packageVersionId ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {packageOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.filterWindowFrom", "Window from", "النافذة من")}</span>
          <input className="ax-input ax-numeric" type="date" name="windowFrom" defaultValue={params.filters.windowFrom ?? ""} />
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.filterWindowTo", "Window to", "النافذة إلى")}</span>
          <input className="ax-input ax-numeric" type="date" name="windowTo" defaultValue={params.filters.windowTo ?? ""} />
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.filterCreatedFrom", "Created from", "أُنشئت من")}</span>
          <input className="ax-input ax-numeric" type="date" name="createdFrom" defaultValue={params.filters.createdFrom ?? ""} />
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.filterCreatedTo", "Created to", "أُنشئت إلى")}</span>
          <input className="ax-input ax-numeric" type="date" name="createdTo" defaultValue={params.filters.createdTo ?? ""} />
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.filterBulkPlanRef", "Bulk plan reference", "مرجع الخطة الجماعية")}</span>
          <input className="ax-input" type="text" name="bulkPlanRef" defaultValue={params.filters.bulkPlanRef ?? ""} placeholder="BP-…" />
        </label>
        <label className="ax-field">
          <span className="ax-field__label">{tr("plan.list.sortLabel", "Sort", "الترتيب")}</span>
          <select className="ax-select" name="sort" defaultValue={params.sort}>
            {PLANNING_SORT_KEYS.map(k => <option key={k} value={k}>{sortLabels[k]}</option>)}
          </select>
        </label>
        <div className="ax-row" style={{ gap: "var(--space-3)" }}>
          <button type="submit" className="ax-btn ax-btn--secondary">{tr("plan.list.apply", "Apply", "تطبيق")}</button>
          <a className="ax-btn ax-btn--subtle" href="/planning">{tr("plan.list.reset", "Reset", "إعادة تعيين")}</a>
        </div>
      </form>

      {/* Canonical visit list (PLN-REQ-013) */}
      {list.rows.length === 0 ? (
        <EmptyState glyph="🗓" title={tr("plan.list.empty", "No visits match", "لا توجد زيارات مطابقة")}
          body={tr("plan.list.emptyDesc", "No visits match the current tab, search and filters. Reset to see everything in your scope.", "لا توجد زيارات مطابقة للتبويب والبحث وعوامل التصفية الحالية. أعد التعيين لعرض كل ما في نطاقك.")} />
      ) : (
        <div className="ax-tablewrap"><table className="ax-table" data-testid="planning-visit-table">
          <thead><tr>
            <th scope="col">{tr("plan.list.colVisitRef", "Visit Reference", "مرجع الزيارة")}</th>
            <th scope="col">{tr("plan.list.colPlanningType", "Planning Type", "نوع التخطيط")}</th>
            <th scope="col">{tr("plan.list.colPlanningStatus", "Planning Status", "حالة التخطيط")}</th>
            <th scope="col">{tr("plan.list.colOperationalState", "Operational State", "الحالة التشغيلية")}</th>
            <th scope="col">{tr("plan.list.colVisitType", "Visit Type", "نوع الزيارة")}</th>
            <th scope="col">{tr("plan.list.colVisitMode", "Visit Mode", "نمط الزيارة")}</th>
            <th scope="col">{tr("plan.list.colPriority", "Priority", "الأولوية")}</th>
            <th scope="col">{tr("plan.list.colCrNumber", "CR Number", "رقم السجل التجاري")}</th>
            <th scope="col">{tr("plan.list.colLicenceNumber", "Licence Number", "رقم الرخصة")}</th>
            <th scope="col">{tr("plan.list.colFactoryName", "Factory Name", "اسم المصنع")}</th>
            <th scope="col">{tr("plan.list.colRegion", "Region", "المنطقة")}</th>
            <th scope="col">{tr("plan.list.colCity", "City", "المدينة")}</th>
            <th scope="col">{tr("plan.list.colInspector", "Assigned Inspector", "المفتش المعيّن")}</th>
            <th scope="col" className="ax-td-num">{tr("plan.list.colWindowStart", "Window Start", "بداية النافذة")}</th>
            <th scope="col" className="ax-td-num">{tr("plan.list.colWindowEnd", "Window End", "نهاية النافذة")}</th>
            <th scope="col" className="ax-td-num">{tr("plan.list.colExecutionDate", "Execution Date", "تاريخ التنفيذ")}</th>
            <th scope="col">{tr("plan.list.colPackages", "Report Packages", "حزم التقارير")}</th>
            <th scope="col">{tr("plan.list.colCreatedBy", "Created By", "أُنشئت بواسطة")}</th>
            <th scope="col" className="ax-td-num">{tr("plan.list.colCreatedDate", "Created Date", "تاريخ الإنشاء")}</th>
            <th scope="col">{tr("plan.list.colSourceChannel", "Source Channel", "قناة المصدر")}</th>
            <th scope="col">{tr("plan.list.colReturnStatus", "Return Status", "حالة الإرجاع")}</th>
            <th scope="col">{tr("plan.list.colBulkPlanRef", "Bulk Plan Reference", "مرجع الخطة الجماعية")}</th>
            <th scope="col" className="ax-td-num">{tr("plan.list.colLastUpdate", "Last Update", "آخر تحديث")}</th>
          </tr></thead>
          <tbody>
            {list.rows.map((row: PlanningVisitRow) => (
              <tr key={row.id}>
                <td className="ax-numeric"><a className="ax-link" href={`/visits/${row.id}`}><strong>{row.visitReference ?? row.id.slice(0, 8)}</strong></a></td>
                <td><span className="ax-lozenge ax-lozenge--info">{t(`enum.${row.method}`, row.method)}</span></td>
                <td><span className={`ax-lozenge ax-lozenge--plan ${STATUS_TONE[row.planningStatus] ?? ""}`}>
                  {/* validated is internal — it displays and counts as Draft, never its own label */}
                  {row.planningStatus === "validated" ? t("enum.draft", "draft") : t(`enum.${row.planningStatus}`, row.planningStatus)}
                </span></td>
                <td>{t(`enum.${row.operationalState}`, row.operationalState.replace(/_/g, " "))}</td>
                <td>{t(`enum.${row.visitType}`, row.visitType)}</td>
                <td>{t(`enum.${row.executionMode}`, row.executionMode)}</td>
                <td>{row.priority ? t(`enum.${row.priority}`, row.priority) : "—"}</td>
                <td className="ax-numeric">{dash(row.crNumber)}</td>
                <td className="ax-numeric">{dash(row.licenseNumber)}</td>
                <td>{dash(row.factoryName)}</td>
                <td>{dash(row.region)}</td>
                <td>{dash(row.city)}</td>
                <td>{dash(row.inspectorName)}</td>
                <td className="ax-td-num ax-numeric">{fmt(row.windowStart)}</td>
                <td className="ax-td-num ax-numeric">{fmt(row.windowEnd)}</td>
                <td className="ax-td-num ax-numeric">{row.executionDate ? fmt(row.executionDate) : "—"}</td>
                <td>{row.packageTitles.length > 0 ? row.packageTitles.join(", ") : "—"}</td>
                <td>{dash(row.createdBy)}</td>
                <td className="ax-td-num ax-numeric">{fmt(row.createdAt)}</td>
                <td>{dash(row.sourceChannel)}</td>
                <td>{dash(row.returnReason ?? (row.planningStatus === "returned" ? t("enum.returned", "returned") : null))}</td>
                <td className="ax-numeric">{row.method === "bulk" ? dash(row.planReference) : "—"}</td>
                <td className="ax-td-num ax-numeric">{lastUpdates[row.id] ? fmt(lastUpdates[row.id]) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {/* Pagination — state carried in the URL like every other control */}
      {list.total > 0 && (
        <div className="ax-row" style={{ justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: "var(--space-3)" }}>
          <span className="ax-caption ax-numeric">
            {tr("plan.list.showing", "Showing {shown} of {total} · page {page} of {pages}", "عرض {shown} من {total} · صفحة {page} من {pages}")
              .replace("{shown}", String(list.rows.length)).replace("{total}", String(list.total))
              .replace("{page}", String(page)).replace("{pages}", String(totalPages))}
          </span>
          <div className="ax-row" style={{ gap: "var(--space-3)" }}>
            {page > 1 && <a className="ax-btn ax-btn--subtle" href={hrefWith(sp, { page: String(page - 1) })}>{tr("plan.list.prev", "← Previous", "→ السابق")}</a>}
            {page < totalPages && <a className="ax-btn ax-btn--subtle" href={hrefWith(sp, { page: String(page + 1) })}>{tr("plan.list.next", "Next →", "التالي ←")}</a>}
          </div>
        </div>
      )}

      {/* Draft continuation (PLN-REQ-010 entry point; resume consumption is a later phase) */}
      {drafts.length > 0 && (
        <section className="ax-surface ax-panel" style={{ padding: "var(--space-6)" }}>
          <h3>{tr("plan.list.draftsHeading", "Draft plans — continue where you left off", "خطط مسودة — تابع من حيث توقفت")}</h3>
          <div className="ax-tablewrap"><table className="ax-table">
            <thead><tr>
              <th scope="col">{tr("plan.list.colPlanRef", "Plan Reference", "مرجع الخطة")}</th>
              <th scope="col">{tr("plan.list.colPlanningType", "Planning Type", "نوع التخطيط")}</th>
              <th scope="col">{tr("plan.list.colPlanningStatus", "Planning Status", "حالة التخطيط")}</th>
              <th scope="col">{tr("plan.list.colCreatedBy", "Created By", "أُنشئت بواسطة")}</th>
              <th scope="col" className="ax-td-num">{tr("plan.list.colCreatedDate", "Created Date", "تاريخ الإنشاء")}</th>
              <th scope="col">{tr("plan.list.colContinue", "Continue", "متابعة")}</th>
              <th scope="col">{tr("plan.list.colDiscard", "Discard", "تجاهل")}</th>
            </tr></thead>
            <tbody>
              {drafts.map(d => (
                <tr key={d.id}>
                  <td className="ax-numeric"><strong>{d.plan_reference ?? d.id.slice(0, 8)}</strong></td>
                  <td><span className="ax-lozenge ax-lozenge--info">{t(`enum.${d.method}`, d.method)}</span></td>
                  <td>{t("enum.draft", "draft")}</td>
                  <td>{d.profiles?.full_name ?? "—"}</td>
                  <td className="ax-td-num ax-numeric">{fmt(d.created_at)}</td>
                  <td><a className="ax-link" href={continueHref(d)}>{tr("plan.list.continue", "Continue →", "متابعة ←")}</a></td>
                  <td>
                    {/* M8 / PLN-CON-018 — discard is offered on OWN drafts only
                        (same ownership boundary as resume); the copy stays
                        distinct from cancelling a published visit. */}
                    {user && d.created_by === user.id ? (
                      <DiscardDraftButton planId={d.id}
                        label={tr("plan.list.discard", "Discard", "تجاهل")}
                        discardAria={tr("plan.list.discardAria", "Discard draft {ref}", "تجاهل المسودة {ref}").replace("{ref}", d.plan_reference ?? d.id.slice(0, 8))} />
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </section>
      )}

      {/* FIX WAVE F4 — M02-035 plan register entry point (preserved) */}
      <p><a className="ax-link" href="/planning/plans">{t("plan.home.registerLink", "Visit plans — status, child visits and progress of every plan (M02-035) →")}</a></p>
      {/* M8 — /visits is the accepted management alias surface; the two are
          cross-linked in both directions (canonical §5/§6 reconciliation). */}
      <p><a className="ax-link" href="/visits">{tr("plan.home.visitsLink", "Visit management — bulk actions and lenses over the same visits (/visits) →", "إدارة الزيارات — إجراءات جماعية وعدسات على نفس الزيارات ←")}</a></p>
    </Shell>
  );
}
