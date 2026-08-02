// M1 Dashboard presentation.
//
// Values and statuses come from the server-side KPI projection. This file
// composes governed records and real provider components; it never invents a
// policy threshold, formula, route, map feature or production value.

import type { ReactNode } from "react";
import type { GeoTone } from "@/components/GeoMap";
import {
  findMetric,
  type DashboardKpiProjection,
  type SharedMetric,
} from "@/lib/dashboard-kpi/contract";
import {
  complianceBreakdown,
  formatDuration,
  type FactoryRef,
  type GeoRow,
  type ResponseRow,
  type ReviewRow,
  type VisitRow,
} from "./metrics";
import {
  buildMethodology,
  metricDisplay,
  statusLabel,
  statusTone,
  type MetricDisplay,
  type MethodologyEntry,
} from "./dashboard-format";
import MetricStrip, { type MetricStripStrings } from "./MetricStrip";
import RegionalScope from "./RegionalScope";
import BasisDrawer from "./BasisDrawer";
import DecisionCanvas, {
  type CanvasLayer,
  type CanvasMarker,
  type CanvasRankRow,
  type DecisionCanvasStrings,
} from "./DecisionCanvas";
import OpsMap, { type OpsMapStrings, type OpsPin } from "../operations/OpsMap";
import styles from "./dashboard.module.css";
import RevampStrategicView from "./RevampStrategicView";
import RevampOperationalView from "./RevampOperationalView";
import { ROLE_DASHBOARD_METRICS, type DashboardPersona } from "@/lib/dashboard-role";

type Locale = "en" | "ar";
type DashboardMetrics = ReturnType<typeof import("./metrics").buildDashboardMetrics>;

const copy = (locale: Locale, en: string, ar: string) => locale === "ar" ? ar : en;

function auditLabel(locale: Locale, action: string) {
  const normalized = action.trim().toUpperCase();
  const labels: Record<string, [string, string]> = {
    INSERT: ["Record created", "تم إنشاء السجل"],
    UPDATE: ["Record updated", "تم تحديث السجل"],
    DELETE: ["Record removed", "تمت إزالة السجل"],
    CREATE: ["Record created", "تم إنشاء السجل"],
    SUBMIT: ["Submitted for review", "تم الإرسال للمراجعة"],
    APPROVE: ["Approved", "تم الاعتماد"],
    RETURN: ["Returned for correction", "أُعيد للتصحيح"],
    REJECT: ["Rejected", "تم الرفض"],
  };
  const label = labels[normalized];
  return label ? copy(locale, label[0], label[1]) : action;
}

function paramsHref(current: Record<string, string>, patch: Record<string, string>) {
  const params = new URLSearchParams({ ...current, ...patch });
  for (const [key, value] of [...params.entries()]) if (!value) params.delete(key);
  return `/dashboard?${params.toString()}`;
}

function metricWithSourceState(metric: SharedMetric, partialSources: string[], locale: Locale): SharedMetric {
  if (!partialSources.length || metric.sourceStatus !== "live") return metric;
  return {
    ...metric,
    sourceStatus: "partial",
    unavailableReason: copy(
      locale,
      `Partial source set: ${partialSources.join(", ")}`,
      `مجموعة مصادر جزئية: ${partialSources.join("، ")}`,
    ),
  };
}

function stripFor(projection: DashboardKpiProjection, ids: string[], locale: Locale, partialSources: string[]) {
  const metrics: MetricDisplay[] = [];
  const methodology: Record<string, MethodologyEntry> = {};
  for (const id of ids) {
    const source = findMetric(projection, id);
    if (!source) continue;
    const metric = metricWithSourceState(source, partialSources, locale);
    metrics.push(metricDisplay(metric, locale));
    methodology[id] = buildMethodology(metric, locale);
  }
  return { metrics, methodology };
}

function stripStrings(locale: Locale): MetricStripStrings {
  return {
    methodology: copy(locale, "Methodology", "المنهجية"),
    why: copy(locale, "Why unavailable?", "لماذا غير متاح؟"),
    close: copy(locale, "Close", "إغلاق"),
    advisory: copy(locale, "Advisory only · traceable", "استشاري فقط · قابل للتتبع"),
    blockedTitle: copy(locale, "Governed boundary", "حد معتمد"),
    drillFallback: copy(locale, "Open records", "فتح السجلات"),
  };
}

export function RoleDashboardSummary({ locale, persona, projection, partialSources }: {
  locale: Locale;
  persona: DashboardPersona;
  projection: DashboardKpiProjection;
  partialSources: string[];
}) {
  const roleName = {
    admin: copy(locale, "Admin", "الإدارة"),
    planner: copy(locale, "Planner", "المخطط"),
    supervisor: copy(locale, "Supervisor", "المشرف"),
    inspector: copy(locale, "Inspector", "المفتش"),
  }[persona];
  const strip = stripFor(projection, [...ROLE_DASHBOARD_METRICS[persona]], locale, partialSources);
  return <section className="panel stack" aria-labelledby="role-dashboard-summary">
    <div className="panel-header">
      <div>
        <p className="eyebrow">{copy(locale, "Your work", "عملك")}</p>
        <h2 className="panel-title" id="role-dashboard-summary">{roleName}</h2>
      </div>
      <span className="badge badge-info">{copy(locale, "RLS scoped", "مقيّد بسياسات الصفوف")}</span>
    </div>
    <MetricStrip metrics={strip.metrics} methodology={strip.methodology} strings={stripStrings(locale)} />
  </section>;
}

function Panel({ title, meta, children, accent = false }: {
  title: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  accent?: boolean;
}) {
  return <section className={`${styles.panel}${accent ? ` ${styles.panelAccent}` : ""}`}>
    <div className={styles.panelHeader}>
      <h3 className={styles.panelTitle}>{title}</h3>
      {meta && <span className={styles.idCode}>{meta}</span>}
    </div>
    <div className={styles.panelBody}>{children}</div>
  </section>;
}

function Bars({ rows, empty, suffix = "" }: {
  rows: { label: string; value: number }[];
  empty: string;
  suffix?: string;
}) {
  if (!rows.length) return <div className={styles.empty} role="status">{empty}</div>;
  const max = Math.max(1, ...rows.map(row => row.value));
  return <div className={styles.bars}>
    {rows.slice(0, 8).map(row => <div className={styles.barRow} key={row.label}>
      <span className={styles.barLabel} title={row.label}>{row.label}</span>
      <progress className={styles.track} value={row.value} max={max}>{row.value}</progress>
      <strong className={styles.barValue}>{row.value}{suffix}</strong>
    </div>)}
  </div>;
}

function MetricCoverage({ projection, category, locale, excluded, partialSources }: {
  projection: DashboardKpiProjection;
  category: "strategic" | "operational";
  locale: Locale;
  excluded: string[];
  partialSources: string[];
}) {
  const metrics = projection.metrics
    .filter(metric => metric.category === category && !excluded.includes(metric.metricId))
    .map(metric => metricWithSourceState(metric, partialSources, locale));
  const blockedDetail = copy(
    locale,
    "This measure needs an approved policy or data contract before it can be shown. No substitute value is used.",
    "يتطلب هذا المؤشر سياسة أو عقد بيانات معتمداً قبل عرضه. ولا تُستخدم أي قيمة بديلة.",
  );
  return <div className={styles.metricCoverage}>
    {metrics.map(metric => {
      const display = metricDisplay(metric, locale);
      return <article className={styles.metricCoverageCard} key={metric.metricId}>
        <div className={styles.metricCoverageHead}>
          <span className={styles.idCode}>{metric.metricId}</span>
          <span className={`${styles.statusChip} ${styles[`tone_${statusTone(metric.sourceStatus)}`]}`}>
            <span className={styles.dot} aria-hidden="true" />
            {statusLabel(metric.sourceStatus, locale)}
          </span>
        </div>
        <h4 className={styles.metricCoverageTitle}>{display.title}</h4>
        {display.kind === "value" && <strong className={styles.metricCoverageValue}>{display.text}</strong>}
        <p className={styles.detail}>
          {display.kind === "status"
            ? blockedDetail
            : display.sub ?? copy(locale, "Source-backed and RLS scoped.", "مدعوم بالمصدر ومقيّد حسب الصلاحيات.")}
        </p>
        {metric.drill.route && <a className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} href={metric.drill.route}>{copy(locale, "View details", "عرض التفاصيل")}</a>}
      </article>;
    })}
  </div>;
}

export function DashboardControls({ locale, view, params, from, to, region, query, refreshedAt, partialSources }: {
  locale: Locale;
  view: "strategic" | "operational";
  params: Record<string, string>;
  from: string;
  to: string;
  region: string;
  query: string;
  refreshedAt: string;
  partialSources: string[];
}) {
  return <header className="grid-toolbar">
    <form action="/dashboard" method="get" className="seg" role="tablist" aria-label={copy(locale, "Dashboard perspective", "منظور لوحة القيادة")}>
      <input type="hidden" name="group" value={params.group ?? "region"} />
      {query ? <input type="hidden" name="q" value={query} /> : null}
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="to" value={to} />
      {region ? <input type="hidden" name="region" value={region} /> : null}
      <button className="seg-opt" type="submit" name="view" value="strategic"
        role="tab" aria-selected={view === "strategic"}
        id="dashboard-tab-strategic" aria-controls="dashboard-strategic">
        {copy(locale, "Strategic View", "المنظور الاستراتيجي")}
      </button>
      <button className="seg-opt" type="submit" name="view" value="operational"
        role="tab" aria-selected={view === "operational"}
        id="dashboard-tab-operational" aria-controls="dashboard-operational">
        {copy(locale, "Operational View", "المنظور التشغيلي")}
      </button>
    </form>
    {partialSources.length > 0 && <div className="alert alert-critical" role="alert">
      <strong>{copy(locale, "Partial dashboard", "لوحة قيادة جزئية")}</strong>
      <span>{partialSources.join(" · ")}</span>
    </div>}
    {/* refreshedAt was computed with a deliberate Riyadh formatter, passed in,
        typed — and never rendered. "As of" is the provenance this reader
        actually needs, and it is the honest frame for every number below.
        Riyadh is named because the whole dashboard is scoped to that calendar
        day, so an unlabelled clock time would be ambiguous. */}
    <span className="grow" />
    <p className="desc">
      <span className="tl-meta">
        {copy(locale, "As of", "حتى")} {refreshedAt} · {copy(locale, "Riyadh", "الرياض")}
      </span>
    </p>
  </header>;
}

export function StrategicView({ locale, metrics, projection, factories, group, params, partialSources }: {
  locale: Locale;
  metrics: DashboardMetrics;
  projection: DashboardKpiProjection;
  factories: FactoryRef[];
  group: "region" | "city" | "sector" | "authority";
  params: Record<string, string>;
  partialSources: string[];
}) {
  const strategic = metrics.strategic;
  const unknown = copy(locale, "Not recorded", "غير مسجل");
  const headlineIds = ["STR-KPI-001", "STR-KPI-005", "STR-KPI-007", "STR-KPI-011"];
  const representedIds = [...headlineIds, "STR-KPI-003", "STR-KPI-004"];
  const strip = stripFor(projection, headlineIds, locale, partialSources);
  const regionRows = complianceBreakdown(strategic.approvedScopedResponses as ResponseRow[], "region", unknown);
  const grouped = complianceBreakdown(strategic.approvedScopedResponses as ResponseRow[], group, unknown);

  const requirementStrip = stripFor(
    projection,
    Array.from({ length: 12 }, (_, index) => `STR-KPI-${String(index + 1).padStart(3, "0")}`),
    locale,
    partialSources,
  );
  return <RevampStrategicView locale={locale} metrics={metrics} factories={factories} group={group} params={params}
    requirementStrip={requirementStrip} requirementStripStrings={stripStrings(locale)} />;

  const markers: CanvasMarker[] = factories
    .filter(factory => factory.official_lat != null && factory.official_lng != null)
    .slice(0, 1200)
    .map(factory => ({
      id: factory.id,
      lat: Number(factory.official_lat),
      lng: Number(factory.official_lng),
      label: factory.name,
      region: factory.region,
      href: `/factories/${factory.id}`,
      toneRisk: "neutral" as GeoTone,
      toneCompliance: "neutral" as GeoTone,
    }));
  const layers: CanvasLayer[] = [
    { id: "locations", label: copy(locale, "Locations", "المواقع"), available: true },
    { id: "compliance", label: copy(locale, "Compliance classification", "تصنيف الامتثال"), available: false },
    { id: "risk", label: copy(locale, "Risk classification", "تصنيف المخاطر"), available: false },
  ];
  // SAQEEL Executive Overview — the regional rail is the leadership read of the
  // national picture, so every in-scope region is listed (the design's "13
  // منطقة" ranked list). Truncating to a top-N silently hid governed regions
  // from the only surface that ranks them; the rail already scrolls.
  const ranking: CanvasRankRow[] = regionRows
    .slice()
    .sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101))
    .map(row => ({
      key: row.label,
      name: row.label,
      detail: copy(locale, `${row.compliant}/${row.total} eligible answers`, `${row.compliant}/${row.total} إجابة مؤهلة`),
      value: row.rate == null ? "—" : `${row.rate}%`,
      tone: "neutral",
    }));
  const canvasStrings: DecisionCanvasStrings = {
    panelTitle: copy(locale, "National factory map", "الخريطة الوطنية للمصانع"),
    rankTitle: copy(locale, "Regional compliance", "الامتثال حسب المنطقة"),
    syncedToMap: copy(locale, `${ranking.length} regions · RLS-scoped records`, `${ranking.length} منطقة · سجلات مقيّدة حسب الصلاحيات`),
    provider: copy(locale, "Map source: Mapbox", "مصدر الخريطة: Mapbox"),
    loadingTitle: copy(locale, "Loading factory map", "جارٍ تحميل خريطة المصانع"),
    loadingBody: copy(locale, "Loading governed official coordinates.", "جارٍ تحميل الإحداثيات الرسمية المعتمدة."),
    emptyTitle: copy(locale, "No mapped factories in scope", "لا توجد مصانع على الخريطة ضمن النطاق"),
    emptyBody: copy(locale, "No visible factory has official coordinates in this scope.", "لا يوجد مصنع ظاهر يحمل إحداثيات رسمية ضمن هذا النطاق."),
    legendTitle: copy(locale, "Classification", "التصنيف"),
    legendHealthy: "",
    legendAttention: "",
    legendCritical: "",
    provenance: copy(locale, "Official coordinates only", "الإحداثيات الرسمية فقط"),
    open: copy(locale, "View details", "عرض التفاصيل"),
    allRegions: copy(locale, "All regions", "جميع المناطق"),
    blockedLayer: copy(locale, "Classification policy is not configured; pins remain neutral.", "سياسة التصنيف غير مهيأة؛ تبقى العلامات محايدة."),
    selectedFactory: copy(locale, "Selected factory", "المصنع المحدد"),
  };
  const dimensions = [
    ["region", copy(locale, "Region", "المنطقة")],
    ["city", copy(locale, "City", "المدينة")],
    ["sector", copy(locale, "Sector", "القطاع")],
    ["authority", copy(locale, "Authority", "الجهة")],
  ] as const;
  const decisionMix = findMetric(projection, "STR-KPI-004");
  const violation = findMetric(projection, "STR-KPI-003");

  return <div id="dashboard-strategic" role="tabpanel" aria-labelledby="dashboard-tab-strategic" className={styles.view}>
    {/* National assurance — the strongest available fact leads the surface.
        SAQEEL Executive Overview: the denominator is eligible ANSWERS, never
        factories, so it is stated beside the rate and never implied to be
        coverage. */}
    <section className={styles.assurance} aria-labelledby="ex-assurance-h">
      <h2 id="ex-assurance-h" className={styles.panelTitle}>
        {copy(locale, "National approved position", "الوضع الوطني المعتمد")}
      </h2>
      <div className={styles.assuranceGrid}>
        <div className={styles.assuranceLead}>
          <span className={styles.kpiLabel}>
            {copy(locale, "Compliance in approved inspections", "الالتزام في عمليات التفتيش المعتمدة")}
          </span>
          <strong className={styles.assuranceValue}>
            {strategic.complianceRate == null
              ? copy(locale, "Not available", "غير متاح")
              : `${strategic.complianceRate}%`}
          </strong>
          <span className={styles.assuranceDen}>
            {copy(
              locale,
              `${strategic.approvedCompliant} compliant of ${strategic.approvedAnsweredForCompliance} eligible answers`,
              `${strategic.approvedCompliant} إجابة مطابقة من ${strategic.approvedAnsweredForCompliance} إجابة مؤهلة`,
            )}
          </span>
          <span className={styles.assuranceNote}>
            {copy(
              locale,
              "The denominator is eligible answers, not factories. This is not a share of compliant factories.",
              "المقام هو الإجابات المؤهلة، وليس عدد المصانع. لا يُقرأ هذا الرقم كنسبة المصانع الملتزمة.",
            )}
          </span>
          {strip.methodology["STR-KPI-001"] && (
            <BasisDrawer
              entry={strip.methodology["STR-KPI-001"]}
              strings={{
                action: copy(locale, "Basis and source", "الأساس والمصدر"),
                close: copy(locale, "Close", "إغلاق"),
                sourceRecords: copy(locale, "Open source records", "فتح سجلات المصدر"),
              }}
            />
          )}
        </div>
        <div className={styles.assuranceFact}>
          <span className={styles.kpiLabel}>{copy(locale, "Linked violations recorded", "مخالفات مرتبطة مسجّلة")}</span>
          <strong className={styles.assuranceFactValue}>{strategic.scopedViolations.length}</strong>
          <a className={styles.linkAction} href="/enforcement">{copy(locale, "Open records", "عرض السجلات")}</a>
        </div>
        {/* The one recorded exception not already carried by Decision mix or
            Violation evidence: answers that failed inside work that was
            nonetheless approved. Derived, never fabricated — if the
            denominator is zero the tile shows the governed-absence badge. */}
        <div className={styles.assuranceFact}>
          <span className={styles.kpiLabel}>
            {copy(locale, "Non-compliant answers in approved work", "إجابات غير مطابقة في عمل معتمد")}
          </span>
          {strategic.approvedAnsweredForCompliance > 0 ? (
            <>
              <strong className={styles.assuranceFactValue}>
                {strategic.approvedAnsweredForCompliance - strategic.approvedCompliant}
                <span className={styles.assuranceOf}> / {strategic.approvedAnsweredForCompliance}</span>
              </strong>
              <span className={styles.assuranceNote}>
                {copy(locale, "eligible answers in scope", "من الإجابات المؤهلة ضمن النطاق")}
              </span>
            </>
          ) : (
            <span className="badge badge-pending">{copy(locale, "Not available", "غير متاح")}</span>
          )}
        </div>
        <div className={styles.assuranceFact}>
          <span className={styles.kpiLabel}>{copy(locale, "Approved of submitted", "قرارات معتمدة مقابل مُرسلة")}</span>
          <strong className={styles.assuranceFactValue}>
            {strategic.approvedScoped}<span className={styles.assuranceOf}> / {strategic.completedInspections}</span>
          </strong>
          <a className={styles.linkAction} href="/reviews">{copy(locale, "Review queue", "طابور المراجعة")}</a>
        </div>
      </div>
      {/* Governed absence consolidated into one register — repeated warning
          pills made disciplined absence read as a broken product. */}
      <div className={styles.governanceNote}>
        <span className="badge badge-pending">
          {copy(locale, "Measures awaiting governance", "قياسات بانتظار الحوكمة")}
        </span>
        <span>
          {copy(
            locale,
            "Risk and compliance thresholds, and coverage and repeat rules, are not configured. No substitute is used.",
            "عتبات المخاطر والامتثال وقواعد التغطية والتكرار غير مهيأة. ولم يُستخدم أي بديل.",
          )}
        </span>
      </div>
    </section>

    <MetricStrip metrics={strip.metrics} methodology={strip.methodology} strings={stripStrings(locale)} />

    {/* Queue above, geographic evidence below, one shared region selection.
        A point map proves location; it cannot carry a regional position while
        classification policy is unsupplied. */}
    <RegionalScope
      ranking={ranking}
      markers={markers}
      layers={layers}
      canvasStrings={canvasStrings}
      strings={{
        queueTitle: copy(locale, "Regions requiring examination", "مناطق تستدعي الفحص"),
        queueMeta: copy(locale, "worst first · unavailable last", "الأسوأ أولاً · غير المتاح في النهاية"),
        allRegions: copy(locale, "All regions", "كل المناطق"),
        noTargetNote: copy(
          locale,
          "Order is assurance triage, not a performance ranking. No governed target exists to compare against.",
          "الترتيب فحصٌ للضمان وليس تقييم أداء. لا يوجد مستهدف معتمد للمقارنة.",
        ),
      }}
    >
    <div className={styles.analyticGrid}>
      

      <Panel title={copy(locale, "Decision mix — Level 2", "مزيج القرار — المستوى الثاني")} meta={copy(locale, "approval is not compliance", "الاعتماد ليس امتثالاً")}>
        <Bars rows={(decisionMix?.breakdown ?? []).map(row => ({
          label: row.labelRef === "approve"
            ? copy(locale, "Approved", "معتمد")
            : row.labelRef === "reject"
              ? copy(locale, "Rejected", "مرفوض")
              : copy(locale, "Returned", "معاد"),
          value: row.value,
        }))} empty={copy(locale, "No decided Level-2 outcomes in scope.", "لا توجد قرارات مستوى ثانٍ ضمن النطاق.")} />
        <a className={`${styles.btn} ${styles.btnSecondary}`} href="/reviews">{copy(locale, "Open decisions", "فتح القرارات")}</a>
      </Panel>

      <Panel title={copy(locale, "Violation evidence", "أدلة المخالفات")} meta={copy(locale, "official issue-date trend blocked", "اتجاه تاريخ الإصدار الرسمي محجوب")}>
        <p className={styles.detail}>{copy(locale, "Regulation-linked counts are available. A formal time trend remains decision-required because official violation issue time is not stored.", "الأعداد المرتبطة باللوائح متاحة. يظل الاتجاه الزمني الرسمي بحاجة إلى قرار لأن وقت الإصدار الرسمي غير مخزن.")}</p>
        <Bars rows={(violation?.breakdown ?? []).map(row => ({ label: row.labelRef, value: row.value }))}
          empty={copy(locale, "No linked violations in scope.", "لا توجد مخالفات مرتبطة ضمن النطاق.")} />
        <a className={`${styles.btn} ${styles.btnSecondary}`} href="/enforcement">{copy(locale, "Open violations", "فتح المخالفات")}</a>
      </Panel>

      
    </div>

    </RegionalScope>

    {/* Sector comparison follows the geographic evidence, matching the
        .dc.html section order: assurance, queue, exceptions, geography,
        sector, governance. */}
    <div className={styles.analyticGrid}>
  <Panel title={copy(locale, "Compliance performance explorer", "مستكشف أداء الامتثال")} meta={copy(locale, "approved inspections only", "التفتيشات المعتمدة فقط")}>
          <nav className={styles.dimensions} aria-label={copy(locale, "Group compliance by", "تجميع الامتثال حسب")}>
            {dimensions.map(([id, label]) => <a key={id} href={paramsHref(params, { group: id })} className={styles.dimension} aria-current={group === id}>{label}</a>)}
          </nav>
          <Bars rows={grouped.map(row => ({ label: `${row.label} · ${row.compliant}/${row.total}`, value: row.rate ?? 0 }))}
            empty={copy(locale, "No eligible approved answers in scope.", "لا توجد إجابات معتمدة مؤهلة ضمن النطاق.")} suffix="%" />
        </Panel>
    </div>

    <div className={styles.analyticGrid}>
  <Panel title={copy(locale, "Governed boundaries", "الحدود المعتمدة")} meta={copy(locale, "Not configured", "غير مهيأ")}>
          <div className={styles.empty}>
            <strong>{copy(locale, "Not configured", "غير مهيأ")}</strong>
            <p>{copy(locale, "Health Score, risk classifications, licence exposure, inspection cycles and repeat-violation rules remain blocked. No substitute value is shown.", "تظل درجة الصحة وتصنيفات المخاطر وتعرّض التراخيص ودورات التفتيش وقواعد تكرار المخالفات محجوبة. لا تُعرض قيمة بديلة.")}</p>
          </div>
        </Panel>
    </div>

    <Panel title={copy(locale, "Strategic requirement coverage", "تغطية المتطلبات الاستراتيجية")} meta="STR-KPI-001..012">
      <MetricCoverage projection={projection} category="strategic" locale={locale} excluded={representedIds} partialSources={partialSources} />
    </Panel>

    <Panel title={copy(locale, "Traceable strategic summary", "ملخص استراتيجي قابل للتتبع")} meta={copy(locale, "deterministic · not AI", "حتمي · ليس ذكاءً اصطناعياً")}>
      <p className={styles.detail}>{copy(locale, "No generated narrative or forecast. Every statement below is a deterministic record summary with a real drill action.", "لا يوجد سرد أو توقع مُنشأ. كل عبارة أدناه ملخص حتمي للسجلات مع إجراء انتقال حقيقي.")}</p>
      <ul className={styles.summaryList}>
        <li><span className="dot" /><span>{copy(locale, `Approved compliance: ${strategic.complianceRate == null ? "unavailable" : `${strategic.complianceRate}%`} across ${strategic.approvedAnsweredForCompliance} eligible answers.`, `الامتثال المعتمد: ${strategic.complianceRate == null ? "غير متاح" : `${strategic.complianceRate}%`} عبر ${strategic.approvedAnsweredForCompliance} إجابة مؤهلة.`)}</span><a className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} href="/reports">{copy(locale, "Open records", "فتح السجلات")}</a></li>
        <li><span className="dot" /><span>{copy(locale, `${strategic.scopedViolations.length} linked violations; official issue-date trend is blocked.`, `${strategic.scopedViolations.length} مخالفة مرتبطة؛ اتجاه تاريخ الإصدار الرسمي محجوب.`)}</span><a className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} href="/enforcement">{copy(locale, "Open violations", "فتح المخالفات")}</a></li>
        <li><span className="dot" /><span>{copy(locale, `${strategic.approvedScoped} of ${strategic.completedInspections} submitted inspections have an approved latest decision.`, `${strategic.approvedScoped} من ${strategic.completedInspections} تفتيشاً مقدماً لديه أحدث قرار معتمد.`)}</span><a className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} href="/reviews">{copy(locale, "Open decisions", "فتح القرارات")}</a></li>
      </ul>
    </Panel>
  </div>;
}

export function OperationalView({ locale, metrics, projection, factoryCoords, partialSources }: {
  locale: Locale;
  metrics: DashboardMetrics;
  projection: DashboardKpiProjection;
  factoryCoords: Map<string, { lat: number; lng: number; radiusM: number | null }>;
  partialSources: string[];
}) {
  const requirementStrip = stripFor(
    projection,
    Array.from({ length: 9 }, (_, index) => `OPS-KPI-${String(index + 1).padStart(3, "0")}`),
    locale,
    partialSources,
  );
  return <RevampOperationalView locale={locale} metrics={metrics}
    requirementStrip={requirementStrip} requirementStripStrings={stripStrings(locale)} />;

  const operational = metrics.operational;
  const headlineIds = ["OPS-KPI-003", "OPS-KPI-002", "OPS-KPI-004", "OPS-KPI-007"];
  const representedIds = [...headlineIds, "OPS-KPI-001", "OPS-KPI-006", "OPS-KPI-008"];
  const strip = stripFor(projection, headlineIds, locale, partialSources);
  const pins: OpsPin[] = [];
  const seen = new Set<string>();
  for (const visit of [...operational.overdueRows, ...operational.todayVisits]) {
    const factoryId = visit.factories?.id;
    const coordinates = factoryId ? factoryCoords.get(factoryId!) : null;
    if (!factoryId || !coordinates || seen.has(visit.id)) continue;
    seen.add(visit.id);
    const tone: OpsPin["tone"] = visit.operational_state === "executing"
      ? "low"
      : visit.operational_state === "arrived"
        ? "medium"
        : "neutral";
    pins.push({
      id: `visit:${visit.id}`,
      kind: "visit",
      lat: coordinates!.lat,
      lng: coordinates!.lng,
      label: visit.factories?.name ?? visit.id.slice(0, 8),
      tone,
      radiusM: coordinates!.radiusM ?? undefined,
      href: `/visits/${visit.id}`,
    });
  }
  const mapStrings: OpsMapStrings = {
    loadingTitle: copy(locale, "Loading operations map", "جارٍ تحميل خريطة العمليات"),
    loadingBody: copy(locale, "Loading governed visit coordinates.", "جارٍ تحميل إحداثيات الزيارات المعتمدة."),
    open: copy(locale, "View visit", "عرض الزيارة"),
    selectHint: copy(locale, "Select a pin to inspect its source visit.", "حدد علامة لفحص الزيارة المصدرية."),
    legendExecuting: copy(locale, "Executing", "قيد التنفيذ"),
    legendEnRoute: copy(locale, "On the way", "في الطريق"),
    legendFactory: copy(locale, "Visit", "زيارة"),
  };
  const workloadMax = Math.max(1, ...operational.workload.map(row => row.active));
  const alerts = [
    ...operational.overdueRows.map((row: VisitRow) => ({
      key: `window-${row.id}`,
      condition: copy(locale, "Published visit is past its recorded window", "زيارة منشورة تجاوزت نافذتها المسجلة"),
      object: row.factories?.name ?? row.id.slice(0, 8),
      href: `/visits/${row.id}`,
    })),
    ...operational.overrides.map((row: GeoRow) => ({
      key: `override-${row.id}`,
      condition: copy(locale, "GPS override recorded", "تم تسجيل تجاوز GPS"),
      object: row.visits?.factories?.name ?? row.visit_id.slice(0, 8),
      href: `/visits/${row.visit_id}`,
    })),
    ...operational.overdueReviewRows.map((row: ReviewRow) => ({
      key: `review-${row.id}`,
      condition: copy(locale, "Review exceeds configured calendar", "المراجعة تتجاوز التقويم المهيأ"),
      object: row.inspections?.visits?.factories?.name ?? row.inspection_id.slice(0, 8),
      href: "/reviews",
    })),
  ];

  return <div id="dashboard-operational" role="tabpanel" aria-labelledby="dashboard-tab-operational" className={styles.view}>
    <div className={styles.statusRail}>
      <span className="exc-chip exc-info"><span className="exc-mark" />{copy(locale, `${operational.activeField} active executions`, `${operational.activeField} تنفيذ نشط`)}</span>
      <span className="exc-chip exc-warning"><span className="exc-mark" />{copy(locale, `${operational.overdueRows.length} visits past recorded window`, `${operational.overdueRows.length} زيارة تجاوزت النافذة المسجلة`)}</span>
      <span className="exc-chip exc-info"><span className="exc-mark" />{copy(locale, `${operational.awaitingRows.length} pending approvals`, `${operational.awaitingRows.length} اعتماداً معلقاً`)}</span>
    </div>

    <MetricStrip metrics={strip.metrics} methodology={strip.methodology} strings={stripStrings(locale)} />

    <div className={styles.canvasGrid}>
      <section className={`${styles.mapPanel} ${styles.operationalMapPanel}`} aria-label={copy(locale, "Live operations map", "خريطة العمليات المباشرة")}>
        <div className={styles.mapChrome}>
          <h3 className={styles.mapTitle}>{copy(locale, "Live operations map", "خريطة العمليات المباشرة")}</h3>
          <span className={styles.grow} />
          <span className={styles.idCode}>{copy(locale, "Map source: Mapbox · official coordinates", "مصدر الخريطة: Mapbox · إحداثيات رسمية")}</span>
        </div>
        <div className={styles.mapScene}>
          {pins.length
            ? <OpsMap pins={pins} strings={mapStrings} />
            : <div className={styles.empty} role="status">{copy(locale, "No scoped visit has official coordinates in this window.", "لا تحمل أي زيارة ضمن النطاق إحداثيات رسمية في هذه الفترة.")}</div>}
        </div>
      </section>
      <div className={styles.operationalActivity}>
        <Panel title={copy(locale, "Live activity", "النشاط المباشر")} meta={copy(locale, "append-only audit", "تدقيق للإضافة فقط")}>
          {operational.timeline.length
            ? <ul className={styles.timeline}>{operational.timeline.slice(0, 8).map(row => <li key={row.id}>
              <span className={styles.tlDot} aria-hidden="true" />
              <div>
                <div className={styles.tlTitle}>{auditLabel(locale, row.action)}</div>
                <div className={styles.tlMeta}><bdi>{row.object_type} · {row.object_id?.slice(0, 8)}</bdi> · {new Date(row.occurred_at).toLocaleString(locale === "ar" ? "ar-SA" : "en-GB", { timeZone: "Asia/Riyadh" })}</div>
              </div>
            </li>)}</ul>
            : <div className={styles.empty} role="status">{copy(locale, "No scoped audit events in this window.", "لا توجد أحداث تدقيق ضمن هذه الفترة.")}</div>}
        </Panel>
      </div>
    </div>

    <div className={styles.analyticGrid}>
      <Panel title={copy(locale, "Visit pipeline", "مسار الزيارات")} meta={copy(locale, "canonical stored states", "الحالات المخزنة المعتمدة")}>
        <div className={styles.pipeline}>
          <div className={styles.pipeCell}><div className={styles.pipeValue}>{operational.planned}</div><div className={styles.detail}>{copy(locale, "Published", "منشورة")}</div></div>
          <div className={styles.pipeCell}><div className={styles.pipeValue}>{operational.completed}</div><div className={styles.detail}>{copy(locale, "Submitted", "مقدمة")}</div></div>
          <div className={styles.pipeCell}><div className={styles.pipeValue}>{operational.returnedRows.length}</div><div className={styles.detail}>{copy(locale, "Returned", "معادة")}</div></div>
          <div className={styles.pipeCell}><div className={styles.pipeValue}>{operational.cancelled}</div><div className={styles.detail}>{copy(locale, "Cancelled", "ملغاة")}</div></div>
        </div>
      </Panel>

      <Panel title={copy(locale, "Today's schedule load", "حِمل جدول اليوم")} meta={copy(locale, "relative · not capacity", "نسبي · ليس سعة")}>
        {operational.workload.length
          ? <div className={styles.bars}>{operational.workload.slice(0, 8).map(row => <div className={styles.barRow} key={row.id}>
            <span className={styles.barLabel} dir="auto" title={row.name}>{row.name}</span>
            <progress className={styles.track} value={row.active} max={workloadMax}>{row.active}</progress>
            <strong className={styles.barValue}>{row.active}</strong>
          </div>)}</div>
          : <div className={styles.empty} role="status">{copy(locale, "No assignments are visible in this scope.", "لا توجد إسنادات ظاهرة ضمن هذا النطاق.")}</div>}
      </Panel>

      <Panel accent title={copy(locale, "Operational priorities", "الأولويات التشغيلية")} meta={copy(locale, "deterministic · not AI", "حتمية · ليست ذكاءً اصطناعياً")}>
        <p className={styles.detail}>{copy(locale, "These are record filters and links. No recommendation is generated and no action is executed automatically.", "هذه مرشحات وروابط للسجلات. لا يتم إنشاء توصية ولا تنفيذ أي إجراء تلقائياً.")}</p>
        <ul className={styles.nudgeList}>
          <li><span className="dot" /><span>{copy(locale, `${operational.overdueRows.length} published visits past their recorded window.`, `${operational.overdueRows.length} زيارة منشورة تجاوزت نافذتها المسجلة.`)}</span><a className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} href="/operations">{copy(locale, "Open operations", "فتح العمليات")}</a></li>
          <li><span className="dot" /><span>{copy(locale, `${operational.awaitingRows.length} reports await a Level-2 decision.`, `${operational.awaitingRows.length} تقريراً ينتظر قرار المستوى الثاني.`)}</span><a className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} href="/reviews">{copy(locale, "Open approvals", "فتح الاعتمادات")}</a></li>
        </ul>
      </Panel>
    </div>

    <Panel title={copy(locale, "Operational requirement coverage", "تغطية المتطلبات التشغيلية")} meta="OPS-KPI-001..009">
      <MetricCoverage projection={projection} category="operational" locale={locale} excluded={representedIds} partialSources={partialSources} />
    </Panel>

    <div className={styles.pairGrid}>
      <Panel title={copy(locale, "Deterministic alert board", "لوحة التنبيهات الحتمية")}>
        {alerts.length
          ? <div className={styles.tableWrap}><table className={styles.table}>
            <thead><tr><th scope="col">{copy(locale, "Condition", "الشرط")}</th><th scope="col">{copy(locale, "Object", "العنصر")}</th><th scope="col">{copy(locale, "Action", "الإجراء")}</th></tr></thead>
            <tbody>{alerts.slice(0, 12).map(alert => <tr key={alert.key}>
              <td>{alert.condition}</td>
              <td dir="auto">{alert.object}</td>
              <td><a className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} href={alert.href}>{copy(locale, "View details", "عرض التفاصيل")}</a></td>
            </tr>)}</tbody>
          </table></div>
          : <div className={styles.empty} role="status">{copy(locale, "No governed alert condition is active.", "لا يوجد شرط تنبيه معتمد نشط.")}</div>}
      </Panel>

      <Panel title={copy(locale, "Selected-window scorecard", "بطاقة أداء الفترة المحددة")} meta={copy(locale, "descriptive · no targets", "وصفي · بلا مستهدفات")}>
        <div className={styles.kpiMini}>
          <div><div className={styles.kpiMiniValue}>{operational.todayVisits.length}</div><div className={styles.detail}>{copy(locale, "Today published", "منشور اليوم")}</div></div>
          <div><div className={styles.kpiMiniValue}>{operational.todayCompletionRate == null ? "—" : `${operational.todayCompletionRate}%`}</div><div className={styles.detail}>{copy(locale, "Today submitted", "مقدم اليوم")}</div></div>
          <div><div className={styles.kpiMiniValue}>{operational.slaBreachRate == null ? "—" : `${operational.slaBreachRate}%`}</div><div className={styles.detail}>{copy(locale, "Recorded-window breach rate", "معدل تجاوز النافذة المسجلة")}</div></div>
          <div><div className={styles.kpiMiniValue}>{operational.activeInspectors}</div><div className={styles.detail}>{copy(locale, "Inspectors with active work", "مفتشون لديهم عمل نشط")}</div></div>
          <div><div className={styles.kpiMiniValue}>{operational.reviewSlaConfigured ? operational.overdueReviewRows.length : "—"}</div><div className={styles.detail}>{copy(locale, "Review calendar breaches", "تجاوزات تقويم المراجعة")}</div></div>
          <div><div className={styles.kpiMiniValue}>{formatDuration(operational.avgDurationMs, locale)}</div><div className={styles.detail}>{copy(locale, "Average execution duration", "متوسط مدة التنفيذ")}</div></div>
        </div>
      </Panel>
    </div>
  </div>;
}

export function SearchResults({ locale, query, factories, visits, inspections }: {
  locale: Locale;
  query: string;
  factories: FactoryRef[];
  visits: VisitRow[];
  inspections: { id: string; visits: { factories: FactoryRef | null } | null }[];
}) {
  const needle = query.trim().toLocaleLowerCase(locale);
  if (!needle) return null;
  const has = (...values: (string | null | undefined)[]) =>
    values.some(value => value?.toLocaleLowerCase(locale).includes(needle));
  const factoryMatches = factories.filter(row => has(row.name, row.factory_code, row.region, row.city)).slice(0, 6);
  const visitMatches = visits.filter(row => has(row.id, row.factories?.name, row.factories?.factory_code)).slice(0, 6);
  const inspectionMatches = inspections.filter(row => has(row.id, row.visits?.factories?.name, row.visits?.factories?.factory_code)).slice(0, 6);
  const total = factoryMatches.length + visitMatches.length + inspectionMatches.length;
  return <section className={styles.results} aria-labelledby="dashboard-search-results">
    <h3 id="dashboard-search-results">{copy(locale, `Search results for “${query}”`, `نتائج البحث عن «${query}»`)}</h3>
    {!total
      ? <p role="status">{copy(locale, "No RLS-visible factory, visit or inspection matched.", "لا يوجد مصنع أو زيارة أو تفتيش ظاهر حسب الصلاحيات يطابق البحث.")}</p>
      : <div className={styles.resultGrid}>
        <div className={styles.resultGroup}>
          <h4>{copy(locale, "Factories", "المصانع")}</h4>
          {factoryMatches.map(row => <a className={styles.result} href={`/factories/${row.id}`} key={row.id}><strong dir="auto">{row.name}</strong><br /><span className={styles.detail}><bdi>{row.factory_code ?? "—"}</bdi> · {[row.region, row.city].filter(Boolean).join(" · ")}</span></a>)}
        </div>
        <div className={styles.resultGroup}>
          <h4>{copy(locale, "Visits", "الزيارات")}</h4>
          {visitMatches.map(row => <a className={styles.result} href={`/visits/${row.id}`} key={row.id}><strong dir="auto">{row.factories?.name ?? copy(locale, "Visit", "زيارة")}</strong><br /><span className={styles.detail}><bdi>{row.id.slice(0, 8)}</bdi> · {row.operational_state}</span></a>)}
        </div>
        <div className={styles.resultGroup}>
          <h4>{copy(locale, "Inspections", "التفتيشات")}</h4>
          {inspectionMatches.map(row => <a className={styles.result} href={`/reports/inspection/${row.id}`} key={row.id}><strong dir="auto">{row.visits?.factories?.name ?? copy(locale, "Inspection", "تفتيش")}</strong><br /><span className={styles.detail}><bdi>{row.id.slice(0, 8)}</bdi></span></a>)}
        </div>
      </div>}
  </section>;
}
