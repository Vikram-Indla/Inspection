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
import PlanningPreview from "./PlanningPreview";
import RevampPlanningInsights from "./RevampPlanningInsights";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { getPlanningAiRecommendations } from "@/lib/planning/ai-recommendations";

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
  draft: "badge-draft", validated: "badge-draft", published: "badge-compliant",
  returned: "badge-warning", cancelled: "badge-critical", expired: "badge-disabled",
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
  const targetPreview = process.env.SAQEEL_M2_PREVIEW === "enabled" && first(sp.wa_preview) === "1";
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
          body={tr("plan.home.unauthorized.body", "Visit Planning is available to authorized planning staff.", "تخطيط الزيارات متاح لموظفي التخطيط المصرح لهم.")} />
      </Shell>
    );
  }

  const params = parseParams(sp);

  // CR-098 / WA-M2-AC-005 — expiry is scheduler-owned. A GET of the Planning
  // list must remain read-only; mutating lifecycle state during page rendering
  // bypasses the canonical transition/audit boundary and can race other users.
  // The list renders the persisted planning status from the scheduled sweep.

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
    sb.from("visit_plans").select("id, method, status, plan_reference, draft_version, created_at, created_by, profiles!visit_plans_created_by_fkey(full_name)")
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

  const visibleRows = list.rows.filter(row => !isTestFixtureEstablishment({ name: row.factoryName }));
  const [lastUpdates, planningAi] = await Promise.all([
    fetchLastUpdates(sb, visibleRows.map(r => r.id)),
    getPlanningAiRecommendations(visibleRows, locale),
  ]);

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
    { glyph: "▦", title: t("plan.method.bulk.title", "Plan multiple visits"), desc: t("plan.method.bulk.desc", "Use AND/OR criteria over the factory list to create many visits under one plan."), href: "/planning/bulk" },
    { glyph: "▣", title: t("plan.method.single.title", "Plan one visit"), desc: t("plan.method.single.desc", "Choose one registered factory by CR or Industrial License and create one visit."), href: "/planning/single" },
    {
      glyph: "⚡",
      title: t("plan.method.immediate.title", "Create an urgent visit"),
      desc: t(
        "plan.method.immediate.pending",
        "Immediate and unregistered-factory creation remain unavailable until their role and factory-source decisions are approved.",
      ),
      href: "/planning/immediate",
      blockedReason: t("plan.method.decisionPending", "Decision pending"),
    },
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

  if (targetPreview) {
    return (
      <Shell current="/planning" title={title}>
        <PlanningPreview methods={methods} drafts={drafts.map(draft => ({
          id: draft.id, method: t(`enum.${draft.method}`, draft.method), status: t(`enum.${draft.status}`, draft.status),
          planReference: draft.plan_reference, createdAt: draft.created_at, planner: draft.profiles?.full_name ?? "—", href: continueHref(draft),
        }))} effectivePackage={packageOptions[0]?.label ?? null} canCreate={access.can("planning.create")} locale={locale}
          planningDraftLabel={t("plan.draft.planningLabel", "Draft · planning")}
          planningDraftHelp={t(
            "plan.draft.planningHelp",
            "Visit intent is unpublished and not executable.",
          )} />
      </Shell>
    );
  }

  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const page = Math.min(list.page, totalPages);

  return (
    <Shell current="/planning" title="">
      <div className="sq-planning-heading">
        <h1>{title}</h1>
        <span>{tr("plan.list.subtitle", "Create inspection visits — bulk, single or immediate", "إنشاء زيارات التفتيش — جماعية أو فردية أو فورية")}</span>
      </div>
      {/* Page actions are intentional: creation and scoped export only. */}
      <CreateVisitSection methods={methods} canCreate={access.can("planning.create")} strings={{
        createLabel: tr("plan.list.createVisit", "Create visit", "إنشاء زيارة"),
        oneMethodNote: t("plan.home.oneMethod", "Choose one planning method for this creation session."),
      }}>
        {access.can("planning.export") && (
          <ExportButton params={params} strings={{
            label: tr("plan.list.export", "Export (CSV)", "تصدير (CSV)"),
            busyLabel: tr("plan.list.exporting", "Exporting…", "جارٍ التصدير…"),
            unauthorized: tr("plan.list.exportUnauthorized", "Export is not authorized for your account.", "التصدير غير مصرح لحسابك."),
            unavailable: tr("plan.list.exportUnavailable", "Export failed — nothing was downloaded. Try again.", "فشل التصدير — لم يتم تنزيل أي ملف. أعد المحاولة."),
            cappedNote: tr("plan.list.exportCapped", "Exported the first {n} matching rows — refine the filters for the rest.", "تم تصدير أول {n} صفًا مطابقًا — حسّن عوامل التصفية للباقي."),
          }} />
        )}
        <span />
      </CreateVisitSection>

      <RevampPlanningInsights
        rows={visibleRows}
        returned={list.countsAvailable ? list.counts.returned : "—"}
        ai={planningAi}
        strings={{
          insights: tr("plan.insights.title", "AI insights", "رؤى الذكاء الاصطناعي"),
          withheld: tr("plan.insights.withheld", "Provider output is withheld; current governed planning records show:", "تم حجب مخرجات المزوّد؛ وتُظهر سجلات التخطيط المحكومة الحالية:"),
          highPriority: tr("plan.insights.highPriority", "{n} high-priority visits in the loaded planning page.", "{n} زيارة عالية الأولوية في صفحة التخطيط المحملة."),
          returned: tr("plan.insights.returned", "{n} returned visits require planner attention.", "{n} زيارة معادة تتطلب انتباه المخطط."),
          expiring: tr("plan.insights.expiring", "{n} loaded visits reach their recorded window end within 72 hours.", "{n} زيارة محملة تنتهي نافذتها المسجلة خلال 72 ساعة."),
          matching: tr("plan.insights.matching", "{n} visits match the current RLS-scoped filters.", "{n} زيارة تطابق عوامل التصفية الحالية المقيّدة بسياسات الوصول."),
          unavailable: tr("plan.insights.unavailable", "AI provider unavailable", "مزوّد الذكاء الاصطناعي غير متاح"),
          factsAvailable: tr("plan.insights.factsAvailable", "Live record facts remain available", "تبقى حقائق السجلات المباشرة متاحة"),
          connected: tr("plan.insights.connected", "Gemini connected", "Gemini متصل"),
          advisory: tr("plan.insights.advisory", "Advisory only — confirm all governed planning rules before acting.", "للاسترشاد فقط — تحقق من جميع قواعد التخطيط المحكومة قبل اتخاذ أي إجراء."),
          recommendations: tr("plan.insights.recommendations", "AI recommendations", "توصيات الذكاء الاصطناعي"),
          priority: tr("plan.insights.priority", "Governed priority", "الأولوية المحكومة"),
          windowEnds: tr("plan.insights.windowEnds", "window ends", "تنتهي النافذة"),
          regionUnavailable: tr("plan.insights.regionUnavailable", "Region unavailable", "المنطقة غير متاحة"),
          plan: tr("plan.insights.plan", "Plan", "تخطيط"),
          review: tr("plan.insights.review", "Review", "مراجعة"),
          noCandidates: tr("plan.insights.noCandidates", "No high-priority recommendation candidate is visible in this page.", "لا يظهر في هذه الصفحة أي مرشح لتوصية عالية الأولوية."),
          quickActions: tr("plan.insights.quickActions", "Quick actions", "إجراءات سريعة"),
          returnedVisits: tr("plan.insights.returnedVisits", "Returned visits", "الزيارات المعادة"),
          highPriorityVisits: tr("plan.insights.highPriorityVisits", "High-priority visits", "الزيارات عالية الأولوية"),
          nearestExpiry: tr("plan.insights.nearestExpiry", "Nearest window expiry", "أقرب انتهاء للنافذة"),
          bulkPlanning: tr("plan.insights.bulkPlanning", "Bulk planning", "التخطيط المجمع"),
          singleVisit: tr("plan.insights.singleVisit", "Single visit", "زيارة واحدة"),
          immediateVisit: tr("plan.insights.immediateVisit", "Immediate visit", "زيارة فورية"),
        }}
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

      {/* Filter bar — GET form keeps all state in the URL (PLN-REQ-014/015/016).
          The primary row deliberately reflects the planner's first questions:
          what visit, who owns it, and when it is scheduled.  Audit and
          specialist filters remain available, without making the list feel
          like a configuration screen. */}
      <form method="get" action="/planning" className="sq-surface sq-panel"
        style={{ padding: "var(--space-6)", display: "flex", flexWrap: "wrap", gap: "var(--space-4)", alignItems: "flex-end" }}>
        {params.tab !== "all" && <input type="hidden" name="tab" value={params.tab} />}
        <label className="sq-field" style={{ flex: "1 1 260px" }}>
          <span className="sq-field__label">{tr("plan.list.searchLabel", "Search", "بحث")}</span>
          <input className="sq-input" type="search" name="q" defaultValue={params.search}
            placeholder={tr("plan.list.searchPlaceholder", "Visit reference, plan reference, CR, licence, factory or inspector…", "مرجع الزيارة، مرجع الخطة، السجل التجاري، الرخصة، المصنع أو المفتش…")} />
        </label>
        <label className="sq-field">
          <span className="sq-field__label">{tr("plan.list.filterInspector", "Inspector", "المفتش")}</span>
          <select className="sq-select" name="inspectorId" defaultValue={params.filters.inspectorId ?? ""}>
            <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
            {inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}
          </select>
        </label>
        <fieldset className="sq-field" style={{ minInlineSize: "min(100%, 310px)", margin: 0, padding: 0, border: 0 }}>
          <legend className="sq-field__label">{tr("plan.list.filterVisitDate", "Visit date", "تاريخ الزيارة")}</legend>
          <div className="sq-row" style={{ gap: "var(--space-2)", flexWrap: "wrap" }}>
            <label className="sr-only" htmlFor="planning-window-from">{tr("plan.list.filterWindowFrom", "Window from", "النافذة من")}</label>
            <input id="planning-window-from" className="sq-input sq-numeric" type="date" name="windowFrom" defaultValue={params.filters.windowFrom ?? ""} aria-label={tr("plan.list.filterWindowFrom", "Window from", "النافذة من")} />
            <span aria-hidden="true">—</span>
            <label className="sr-only" htmlFor="planning-window-to">{tr("plan.list.filterWindowTo", "Window to", "النافذة إلى")}</label>
            <input id="planning-window-to" className="sq-input sq-numeric" type="date" name="windowTo" defaultValue={params.filters.windowTo ?? ""} aria-label={tr("plan.list.filterWindowTo", "Window to", "النافذة إلى")} />
          </div>
        </fieldset>
        <div className="sq-row" style={{ gap: "var(--space-3)" }}>
          <button type="submit" className="sq-btn sq-btn--secondary">{tr("plan.list.apply", "Apply", "تطبيق")}</button>
          <a className="sq-btn sq-btn--subtle" href="/planning">{tr("plan.list.reset", "Reset", "إعادة تعيين")}</a>
        </div>
        <details style={{ flex: "1 1 100%" }} open={Boolean(params.filters.method || params.filters.visitType || params.filters.priority || params.filters.region || params.filters.city || params.filters.packageVersionId || params.filters.createdFrom || params.filters.createdTo || params.filters.bulkPlanRef || params.sort !== "window_start_asc")}>
          <summary className="sq-btn sq-btn--subtle" style={{ display: "inline-flex", cursor: "pointer" }}>{tr("plan.list.moreFilters", "More filters", "مزيد من عوامل التصفية")}</summary>
          <div style={{ marginBlockStart: "var(--space-4)", display: "flex", flexWrap: "wrap", gap: "var(--space-4)", alignItems: "flex-end" }}>
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
              <span className="sq-field__label">{tr("plan.list.filterPackage", "Report package", "حزمة التقارير")}</span>
              <select className="sq-select" name="packageVersionId" defaultValue={params.filters.packageVersionId ?? ""}>
                <option value="">{tr("plan.list.allOptions", "All", "الكل")}</option>
                {packageOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
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
          </div>
        </details>
      </form>

      {/* Canonical visit list (PLN-REQ-013) */}
      {visibleRows.length === 0 ? (
        <EmptyState glyph="🗓" title={tr("plan.list.empty", "No visits match", "لا توجد زيارات مطابقة")}
          body={tr("plan.list.emptyDesc", "No visits match the current tab, search and filters. Reset to see everything in your scope.", "لا توجد زيارات مطابقة للتبويب والبحث وعوامل التصفية الحالية. أعد التعيين لعرض كل ما في نطاقك.")} />
      ) : (
        <div className="sq-tablewrap planning-table-wrap"><table className="sq-table planning-visit-table" data-testid="planning-visit-table">
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
                <td className="sq-numeric"><a className="sq-link" href={`/visits/${row.id}`}><strong>{row.visitReference ?? tr("plan.referenceUnavailable", "Reference unavailable", "المرجع غير متاح")}</strong></a></td>
                <td><span className="planning-method">{t(`enum.${row.method}`, row.method)}</span></td>
                <td><span className={`badge planning-status ${STATUS_TONE[row.planningStatus] ?? "badge-pending"}`}>
                  <span className="dot" aria-hidden="true" />
                  {/* validated is internal — it displays and counts as Draft, never its own label */}
                  {row.planningStatus === "validated" ? t("enum.draft", "draft") : t(`enum.${row.planningStatus}`, row.planningStatus)}
                </span></td>
                <td>{t(`enum.${row.operationalState}`, row.operationalState.replace(/_/g, " "))}</td>
                <td>{t(`enum.${row.visitType}`, row.visitType)}</td>
                <td>{t(`enum.${row.executionMode}`, row.executionMode)}</td>
                <td>{row.priority ? t(`enum.${row.priority}`, row.priority) : "—"}</td>
                <td className="sq-numeric">{dash(row.crNumber)}</td>
                <td className="sq-numeric">{dash(row.licenseNumber)}</td>
                <td className="planning-cell-wrap">{dash(row.factoryName)}</td>
                <td>{dash(row.region)}</td>
                <td>{dash(row.city)}</td>
                <td className="planning-cell-wrap">{dash(row.inspectorName)}</td>
                <td className="sq-td-num sq-numeric">{fmt(row.windowStart)}</td>
                <td className="sq-td-num sq-numeric">{fmt(row.windowEnd)}</td>
                <td className="sq-td-num sq-numeric">{row.executionDate ? fmt(row.executionDate) : "—"}</td>
                <td className="planning-cell-wrap">{row.packageTitles.length > 0 ? row.packageTitles.join(", ") : "—"}</td>
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
          <div className="sq-tablewrap"><table className="sq-table planning-draft-table">
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
                  <td className="sq-numeric"><strong>{d.plan_reference ?? tr("plan.referenceUnavailable", "Reference unavailable", "المرجع غير متاح")}</strong></td>
                  <td><span className="planning-method">{t(`enum.${d.method}`, d.method)}</span></td>
                  <td><span className="badge badge-draft planning-status"><span className="dot" aria-hidden="true" />{t("enum.draft", "draft")}</span></td>
                  <td>{d.profiles?.full_name ?? "—"}</td>
                  <td className="sq-td-num sq-numeric">{fmt(d.created_at)}</td>
                  <td><a className="sq-link" href={continueHref(d)}>{tr("plan.list.continue", "Continue", "متابعة")}</a></td>
                  <td>
                    {/* M8 / PLN-CON-018 — discard is offered on OWN drafts only
                        (same ownership boundary as resume); the copy stays
                        distinct from cancelling a published visit. */}
                    {user && d.created_by === user.id ? (
                      <DiscardDraftButton planId={d.id} expectedVersion={d.draft_version}
                        label={tr("plan.list.discard", "Discard", "تجاهل")}
                        discardAria={tr("plan.list.discardAria", "Discard draft {ref}", "تجاهل المسودة {ref}").replace("{ref}", d.plan_reference ?? tr("plan.referenceUnavailable", "Reference unavailable", "المرجع غير متاح"))} />
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </section>
      )}

      {/* FIX WAVE F4 — M02-035 plan register entry point (preserved) */}
      <p><a className="sq-link" href="/planning/plans">{t("plan.home.registerLink", "Visit plans — status, child visits and progress")}</a></p>
      {/* M8 — /visits is the accepted management alias surface; the two are
          cross-linked in both directions (canonical §5/§6 reconciliation). */}
      <p><a className="sq-link" href="/visits">{tr("plan.home.visitsLink", "Visit management — bulk actions and lenses over the same visits (/visits)", "إدارة الزيارات — إجراءات جماعية وعدسات على نفس الزيارات")}</a></p>
    </Shell>
  );
}
