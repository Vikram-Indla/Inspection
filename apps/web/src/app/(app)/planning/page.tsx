import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { getPlanningAccess } from "@/lib/planning/access";
import PlanningPreview from "./PlanningPreview";
import RevampPlanningInsights from "./RevampPlanningInsights";
import SavedViewsButton from "./SavedViewsButton";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";

export const dynamic = "force-dynamic";

type DraftRow = {
  id: string;
  method: string;
  status: string;
  plan_reference: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
};

const continueHref = (draft: DraftRow) =>
  draft.method === "bulk"
    ? `/planning/bulk/review?plan=${draft.id}`
    : draft.method === "single"
      ? `/planning/single?plan=${draft.id}`
      : `/planning/immediate?plan=${draft.id}`;

// PKT-RESPONSIVE-PLANNING-003 · WA-DES-036
// The approved Planning landing is canonical at /planning. Its role boundary
// is resolved before any planning data read:
// - business_staff with planning.view receives all creation methods plus
//   RLS-scoped drafts and the effective package state;
// - Inspector receives only the explicitly authorized Immediate method;
// - administration/anonymous classes fail closed.
export default async function PlanningHome() {
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb); // identity verified once; the RPC class check below is the access decision

  const access = await getPlanningAccess(sb, ["planning.view", "planning.create", "planning.export"]);
  const title = t("plan.home.title", "Planning");
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

  const unavailable = () => (
    <Shell current="/planning" title={title}>
      <EmptyState
        glyph="⚠"
        title={tr("plan.home.unavailable.title", "Planning data unavailable", "بيانات التخطيط غير متاحة")}
        body={tr(
          "plan.home.unavailable.body",
          "The planning workspace could not be loaded (ERR-OPS-001). Nothing was created or changed. Try again.",
          "تعذر تحميل مساحة التخطيط (ERR-OPS-001). لم يتم إنشاء أو تغيير أي بيانات. أعد المحاولة.",
        )}
      />
    </Shell>
  );
  const unauthorized = () => (
    <Shell current="/planning" title={title}>
      <EmptyState
        glyph="⛔"
        title={tr("plan.home.unauthorized.title", "Authorized role required", "يلزم دور مصرح له")}
        body={tr(
          "plan.home.unauthorized.body",
          "Visit Planning is restricted to authorized planning capabilities.",
          "تخطيط الزيارات مقيّد بصلاحيات التخطيط المصرح بها.",
        )}
      />
    </Shell>
  );

  if (access.error) return unavailable();

  const methods = {
    bulk: {
      title: t("plan.method.bulk.title", "Plan multiple visits"),
      desc: t("plan.method.bulk.desc", "AND/OR criteria over the Factory list; many visits under one plan (M01-002)."),
      href: "/planning/bulk",
    },
    single: {
      title: t("plan.method.single.title", "Plan one visit"),
      desc: t("plan.method.single.desc", "One registered factory via CR / Industrial License; one plan, one visit (M01-034/042)."),
      href: "/planning/single",
    },
    immediate: {
      title: t("plan.method.immediate.title", "Create an urgent visit"),
      desc: t("plan.method.immediate.desc", "Registered or unregistered factory with mandatory location (M01-043/045/046)."),
      href: "/planning/immediate",
    },
  };

  if (access.accessClass === "inspector") {
    if (!access.can("planning.create.immediate")) return unauthorized();
    return (
      <Shell
        current="/planning"
        title={title}
        context={<span className="ax-caption ax-numeric">CR-001 · CR-043..CR-051 · WA-DES-036</span>}
      >
        <PlanningPreview
          methods={[methods.immediate]}
          drafts={[]}
          effectivePackage={undefined}
          canCreate
          locale={locale}
          showVisits={false}
          showPlans={false}
        />
      </Shell>
    );
  }

  const visibleRows = list.rows.filter(row => !isTestFixtureEstablishment({ name: row.factoryName }));
  const lastUpdates = await fetchLastUpdates(sb, visibleRows.map(r => r.id));

  const today = new Date().toISOString().slice(0, 10);
  const [packageRead, draftsRead] = await Promise.all([
    sb.from("package_versions")
      .select("id, version_label, packages(title)")
      .in("status", ["published", "locked"])
      .lte("effective_from", today)
      .or(`effective_to.is.null,effective_to.gte.${today}`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1),
    sb.from("visit_plans")
      .select("id, method, status, plan_reference, created_at, profiles(full_name)")
      .in("status", ["draft", "validated"])
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (packageRead.error || draftsRead.error) {
    console.error("[planning.home] canonical landing read failed:", packageRead.error?.message ?? draftsRead.error?.message);
    return unavailable();
  }

  const effectivePackage = ((packageRead.data ?? []) as unknown as {
    version_label: string;
    packages: { title: string } | null;
  }[])[0];
  const drafts = (draftsRead.data ?? []) as unknown as DraftRow[];

  return (
    <Shell current="/planning" title="">
      <div className="sq-planning-heading">
        <h1>{title}</h1>
        <span>{tr("plan.list.subtitle", "Create inspection visits — bulk, single or immediate", "إنشاء زيارات التفتيش — جماعية أو فردية أو فورية")}</span>
      </div>
      {/* Page actions — Create Visit / Export / Refresh (PLN-REQ-006/017/018) */}
      <div className="sq-planning-commandbar">
        <RefreshButton label={tr("plan.list.refresh", "Refresh", "تحديث")} busyLabel={tr("plan.list.refreshing", "Refreshing…", "جارٍ التحديث…")} />
        {access.can("planning.export") && (
          <ExportButton params={params} strings={{
            label: tr("plan.list.export", "Export (CSV)", "تصدير (CSV)"),
            busyLabel: tr("plan.list.exporting", "Exporting…", "جارٍ التصدير…"),
            unauthorized: tr("plan.list.exportUnauthorized", "Export is not authorized for your account.", "التصدير غير مصرح لحسابك."),
            unavailable: tr("plan.list.exportUnavailable", "Export failed — nothing was downloaded. Try again.", "فشل التصدير — لم يتم تنزيل أي ملف. أعد المحاولة."),
            cappedNote: tr("plan.list.exportCapped", "Exported the first {n} matching rows — refine the filters for the rest.", "تم تصدير أول {n} صفًا مطابقًا — حسّن عوامل التصفية للباقي."),
          }} />
        )}
        <SavedViewsButton label={tr("plan.list.savedViews", "Saved views", "العروض المحفوظة")} />
        <span />
        {access.can("planning.create") && (
          <CreateVisitSection methods={methods} strings={{
            createLabel: tr("plan.list.createVisit", "Create visit", "إنشاء زيارة"),
            oneMethodNote: t("plan.home.oneMethod", "One planning method per creation session (M01-011 · REF-001)."),
          }} />
        )}
      </div>

      <RevampPlanningInsights
        rows={visibleRows}
        total={list.total}
        returned={list.countsAvailable ? list.counts.returned : "—"}
      />

      {/* KPI / status tabs with live counts (PLN-REQ-012) */}
      <div className="sq-kpi-row" role="group" aria-label={tr("plan.list.tabsAria", "Planning status tabs", "تبويبات حالة التخطيط")}>
        {PLANNING_TABS.map(tab => (
          <a key={tab} href={hrefWith(sp, { tab: tab === "all" ? "" : tab, page: "" })}
            className="sq-surface sq-kpi" aria-current={params.tab === tab ? "page" : undefined}
            style={{ textDecoration: "none", color: "inherit", outline: params.tab === tab ? "2px solid var(--focus-ring, currentColor)" : undefined }}>
            <span className="sq-overline">{tabLabels[tab]}</span>
            {/* An unavailable count renders as an em dash, never as 0: the
                tab counts and the list fail independently, and a fabricated
                zero would read as "no visits in this state". */}
            <span className="sq-kpi__value sq-numeric">{list.countsAvailable ? list.counts[tab] : "—"}</span>
          </a>
        ))}
      </div>

      {/* Filter bar — GET form keeps all state in the URL (PLN-REQ-014/015/016) */}
      <form method="get" action="/planning" className="sq-surface sq-panel"
        style={{ padding: "var(--space-6)", display: "flex", flexWrap: "wrap", gap: "var(--space-4)", alignItems: "flex-end" }}>
        {params.tab !== "all" && <input type="hidden" name="tab" value={params.tab} />}
        <label className="sq-field" style={{ flex: "1 1 260px" }}>
          <span className="sq-field__label">{tr("plan.list.searchLabel", "Search", "بحث")}</span>
          <input className="sq-input" type="search" name="q" defaultValue={params.search}
            placeholder={tr("plan.list.searchPlaceholder", "Visit reference, plan reference, CR, licence, factory or inspector…", "مرجع الزيارة، مرجع الخطة، السجل التجاري، الرخصة، المصنع أو المفتش…")} />
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterMethod", "Planning type", "نوع التخطيط")}</span>
          <select className="sq-select" name="method" defaultValue={params.filters.method ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {["bulk", "single", "immediate"].map(m => <option key={m} value={m}>{t(`enum.${m}`, m)}</option>)}
          </select>
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterVisitType", "Visit type", "نوع الزيارة")}</span>
          <select className="sq-select" name="visitType" defaultValue={params.filters.visitType ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {visitTypeOptions.map(o => <option key={o.key} value={o.key}>{lookupLabel(o)}</option>)}
          </select>
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterPriority", "Priority", "الأولوية")}</span>
          <select className="sq-select" name="priority" defaultValue={params.filters.priority ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {priorityOptions.map(o => <option key={o.key} value={o.key}>{lookupLabel(o)}</option>)}
          </select>
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterRegion", "Region", "المنطقة")}</span>
          <select className="sq-select" name="region" defaultValue={params.filters.region ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterCity", "City", "المدينة")}</span>
          <select className="sq-select" name="city" defaultValue={params.filters.city ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterInspector", "Inspector", "المفتش")}</span>
          <select className="sq-select" name="inspectorId" defaultValue={params.filters.inspectorId ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}
          </select>
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterPackage", "Report package", "حزمة التقارير")}</span>
          <select className="sq-select" name="packageVersionId" defaultValue={params.filters.packageVersionId ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {packageOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterWindowFrom", "Window from", "النافذة من")}</span>
          <input className="sq-input sq-numeric" type="date" name="windowFrom" defaultValue={params.filters.windowFrom ?? ""} />
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterWindowTo", "Window to", "النافذة إلى")}</span>
          <input className="sq-input sq-numeric" type="date" name="windowTo" defaultValue={params.filters.windowTo ?? ""} />
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterCreatedFrom", "Created from", "أُنشئت من")}</span>
          <input className="sq-input sq-numeric" type="date" name="createdFrom" defaultValue={params.filters.createdFrom ?? ""} />
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterCreatedTo", "Created to", "أُنشئت إلى")}</span>
          <input className="sq-input sq-numeric" type="date" name="createdTo" defaultValue={params.filters.createdTo ?? ""} />
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterBulkPlanRef", "Bulk plan reference", "مرجع الخطة الجماعية")}</span>
          <input className="sq-input" type="text" name="bulkPlanRef" defaultValue={params.filters.bulkPlanRef ?? ""} placeholder="BP-…" />
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.sortLabel", "Sort", "الترتيب")}</span>
          <select className="sq-select" name="sort" defaultValue={params.sort}>
            {PLANNING_SORT_KEYS.map(k => <option key={k} value={k}>{sortLabels[k]}</option>)}
          </select>
        </label>
        <div className="sq-row" style={{ gap: "var(--space-3)" }}>
          <button type="submit" className="sq-btn sq-btn--secondary">{tr("plan.list.apply", "Apply", "تطبيق")}</button>
          <a className="sq-btn sq-btn--subtle" href="/planning">{tr("plan.list.reset", "Reset", "إعادة تعيين")}</a>
        </div>
      </form>

      {/* Canonical visit list (PLN-REQ-013) */}
      {visibleRows.length === 0 ? (
        <EmptyState glyph="🗓" title={tr("plan.list.empty", "No visits match", "لا توجد زيارات مطابقة")}
          body={tr("plan.list.emptyDesc", "No visits match the current tab, search and filters. Reset to see everything in your scope.", "لا توجد زيارات مطابقة للتبويب والبحث وعوامل التصفية الحالية. أعد التعيين لعرض كل ما في نطاقك.")} />
      ) : (
        <div className="sq-tablewrap"><table className="sq-table" data-testid="planning-visit-table">
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
            <th scope="col" className="sq-td-num">{tr("plan.list.colWindowStart", "Window Start", "بداية النافذة")}</th>
            <th scope="col" className="sq-td-num">{tr("plan.list.colWindowEnd", "Window End", "نهاية النافذة")}</th>
            <th scope="col" className="sq-td-num">{tr("plan.list.colExecutionDate", "Execution Date", "تاريخ التنفيذ")}</th>
            <th scope="col">{tr("plan.list.colPackages", "Report Packages", "حزم التقارير")}</th>
            <th scope="col">{tr("plan.list.colCreatedBy", "Created By", "أُنشئت بواسطة")}</th>
            <th scope="col" className="sq-td-num">{tr("plan.list.colCreatedDate", "Created Date", "تاريخ الإنشاء")}</th>
            <th scope="col">{tr("plan.list.colSourceChannel", "Source Channel", "قناة المصدر")}</th>
            <th scope="col">{tr("plan.list.colReturnStatus", "Return Status", "حالة الإرجاع")}</th>
            <th scope="col">{tr("plan.list.colBulkPlanRef", "Bulk Plan Reference", "مرجع الخطة الجماعية")}</th>
            <th scope="col" className="sq-td-num">{tr("plan.list.colLastUpdate", "Last Update", "آخر تحديث")}</th>
          </tr></thead>
          <tbody>
            {visibleRows.map((row: PlanningVisitRow) => (
              <tr key={row.id}>
                <td className="sq-numeric"><a className="sq-link" href={`/visits/${row.id}`}><strong>{row.visitReference ?? row.id.slice(0, 8)}</strong></a></td>
                <td><span className="sq-lozenge sq-lozenge--info">{t(`enum.${row.method}`, row.method)}</span></td>
                <td><span className={`sq-lozenge sq-lozenge--plan ${STATUS_TONE[row.planningStatus] ?? ""}`}>
                  {/* validated is internal — it displays and counts as Draft, never its own label */}
                  {row.planningStatus === "validated" ? t("enum.draft", "draft") : t(`enum.${row.planningStatus}`, row.planningStatus)}
                </span></td>
                <td>{t(`enum.${row.operationalState}`, row.operationalState.replace(/_/g, " "))}</td>
                <td>{t(`enum.${row.visitType}`, row.visitType)}</td>
                <td>{t(`enum.${row.executionMode}`, row.executionMode)}</td>
                <td>{row.priority ? t(`enum.${row.priority}`, row.priority) : "—"}</td>
                <td className="sq-numeric">{dash(row.crNumber)}</td>
                <td className="sq-numeric">{dash(row.licenseNumber)}</td>
                <td>{dash(row.factoryName)}</td>
                <td>{dash(row.region)}</td>
                <td>{dash(row.city)}</td>
                <td>{dash(row.inspectorName)}</td>
                <td className="sq-td-num sq-numeric">{fmt(row.windowStart)}</td>
                <td className="sq-td-num sq-numeric">{fmt(row.windowEnd)}</td>
                <td className="sq-td-num sq-numeric">{row.executionDate ? fmt(row.executionDate) : "—"}</td>
                <td>{row.packageTitles.length > 0 ? row.packageTitles.join(", ") : "—"}</td>
                <td>{dash(row.createdBy)}</td>
                <td className="sq-td-num sq-numeric">{fmt(row.createdAt)}</td>
                <td>{dash(row.sourceChannel)}</td>
                <td>{dash(row.returnReason ?? (row.planningStatus === "returned" ? t("enum.returned", "returned") : null))}</td>
                <td className="sq-numeric">{row.method === "bulk" ? dash(row.planReference) : "—"}</td>
                <td className="sq-td-num sq-numeric">{lastUpdates[row.id] ? fmt(lastUpdates[row.id]) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {/* Pagination — state carried in the URL like every other control */}
      {list.total > 0 && (
        <div className="sq-row" style={{ justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: "var(--space-3)" }}>
          <span className="sq-caption sq-numeric">
            {tr("plan.list.showing", "Showing {shown} of {total} · page {page} of {pages}", "عرض {shown} من {total} · صفحة {page} من {pages}")
              .replace("{shown}", String(visibleRows.length)).replace("{total}", String(list.total))
              .replace("{page}", String(page)).replace("{pages}", String(totalPages))}
          </span>
          <div className="sq-row" style={{ gap: "var(--space-3)" }}>
            {page > 1 && <a className="sq-btn sq-btn--subtle" href={hrefWith(sp, { page: String(page - 1) })}>{tr("plan.list.prev", "← Previous", "→ السابق")}</a>}
            {page < totalPages && <a className="sq-btn sq-btn--subtle" href={hrefWith(sp, { page: String(page + 1) })}>{tr("plan.list.next", "Next →", "التالي ←")}</a>}
          </div>
        </div>
      )}

      {/* Draft continuation (PLN-REQ-010 entry point; resume consumption is a later phase) */}
      {drafts.length > 0 && (
        <section className="sq-surface sq-panel" style={{ padding: "var(--space-6)" }}>
          <h3>{tr("plan.list.draftsHeading", "Draft plans — continue where you left off", "خطط مسودة — تابع من حيث توقفت")}</h3>
          <div className="sq-tablewrap"><table className="sq-table">
            <thead><tr>
              <th scope="col">{tr("plan.list.colPlanRef", "Plan Reference", "مرجع الخطة")}</th>
              <th scope="col">{tr("plan.list.colPlanningType", "Planning Type", "نوع التخطيط")}</th>
              <th scope="col">{tr("plan.list.colPlanningStatus", "Planning Status", "حالة التخطيط")}</th>
              <th scope="col">{tr("plan.list.colCreatedBy", "Created By", "أُنشئت بواسطة")}</th>
              <th scope="col" className="sq-td-num">{tr("plan.list.colCreatedDate", "Created Date", "تاريخ الإنشاء")}</th>
              <th scope="col">{tr("plan.list.colContinue", "Continue", "متابعة")}</th>
              <th scope="col">{tr("plan.list.colDiscard", "Discard", "تجاهل")}</th>
            </tr></thead>
            <tbody>
              {drafts.map(d => (
                <tr key={d.id}>
                  <td className="sq-numeric"><strong>{d.plan_reference ?? d.id.slice(0, 8)}</strong></td>
                  <td><span className="sq-lozenge sq-lozenge--info">{t(`enum.${d.method}`, d.method)}</span></td>
                  <td>{t("enum.draft", "draft")}</td>
                  <td>{d.profiles?.full_name ?? "—"}</td>
                  <td className="sq-td-num sq-numeric">{fmt(d.created_at)}</td>
                  <td><a className="sq-link" href={continueHref(d)}>{tr("plan.list.continue", "Continue", "متابعة")}</a></td>
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
      <p><a className="sq-link" href="/planning/plans">{t("plan.home.registerLink", "Visit plans — status, child visits and progress of every plan (M02-035)")}</a></p>
      {/* M8 — /visits is the accepted management alias surface; the two are
          cross-linked in both directions (canonical §5/§6 reconciliation). */}
      <p><a className="sq-link" href="/visits">{tr("plan.home.visitsLink", "Visit management — bulk actions and lenses over the same visits (/visits)", "إدارة الزيارات — إجراءات جماعية وعدسات على نفس الزيارات")}</a></p>
    </Shell>
  );
}
