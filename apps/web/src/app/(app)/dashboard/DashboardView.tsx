// SAQEEL Web Dashboard — approved-design composition (server component).
//
// Presentation only. Every KPI value comes from the shared dashboard-kpi
// projection (SharedMetric[]); this file never recomputes a formula. Blocked
// metrics are rendered honestly (Not configured / Unavailable / Decision
// required) via dashboard-format. All previously-reachable dashboard content is
// preserved and re-placed into the new hierarchy — see
// .implementation-pack/06_ACCEPTANCE preservation ledger.

import type { ReactNode } from "react";
import type { GeoTone } from "@/components/GeoMap";
import { findMetric, type DashboardKpiProjection, type SharedMetric } from "@/lib/dashboard-kpi/contract";
import {
  buildMethodology,
  metricDisplay,
  metricTitle,
  type Locale,
  type MetricDisplay,
  type MethodologyEntry,
} from "./dashboard-format";
import {
  complianceBreakdown,
  formatDuration,
  type FactoryRef,
  type GeoRow,
  type ResponseRow,
  type ReviewRow,
  type VisitRow,
} from "./metrics";
import MetricStrip, { type MetricStripStrings } from "./MetricStrip";
import DecisionCanvas, {
  type CanvasLayer,
  type CanvasMarker,
  type CanvasRankRow,
  type DecisionCanvasStrings,
} from "./DecisionCanvas";
import OpsMap, { type OpsMapStrings, type OpsPin } from "../operations/OpsMap";
import styles from "./dashboard.module.css";

type DashboardMetrics = ReturnType<typeof import("./metrics").buildDashboardMetrics>;
const copy = (locale: Locale, en: string, ar: string) => (locale === "ar" ? ar : en);

// ---------------------------------------------------------------- shared bits
function paramsHref(current: Record<string, string>, patch: Record<string, string>) {
  const params = new URLSearchParams({ ...current, ...patch });
  for (const [key, value] of [...params.entries()]) if (!value) params.delete(key);
  return `/dashboard?${params.toString()}`;
}

function Bars({ rows, empty, suffix = "" }: { rows: { label: string; value: number }[]; empty: string; suffix?: string }) {
  if (!rows.length) return <div className={styles.empty} role="status">{empty}</div>;
  const max = Math.max(1, ...rows.map((row) => row.value));
  return <div className={styles.bars}>{rows.slice(0, 8).map((row) => (
    <div className={styles.barRow} key={row.label}>
      <span className={styles.barLabel} title={row.label}>{row.label}</span>
      <span className={styles.track} aria-hidden="true"><span className={styles.fill} style={{ inlineSize: `${Math.max(3, (row.value / max) * 100)}%` }} /></span>
      <strong className={styles.barValue}>{row.value}{suffix}</strong>
    </div>
  ))}</div>;
}

function ExcChip({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`${styles.exc} ${styles[`tone_${tone}`]}`}><span className={styles.excMark} aria-hidden="true" />{children}</span>;
}

function Panel({ title, meta, children, accent }: { title: ReactNode; meta?: ReactNode; children: ReactNode; accent?: boolean }) {
  return <section className={`${styles.panel}${accent ? ` ${styles.panelAccent}` : ""}`}>
    <div className={styles.panelHeader}><h3 className={styles.panelTitle}>{title}</h3>{meta && <span className={styles.idCode}>{meta}</span>}</div>
    <div className={styles.panelBody}>{children}</div>
  </section>;
}

function BlockedPanel({ title, note, cta, ctaHref }: { title: string; note: string; cta?: string; ctaHref?: string }) {
  return <section className={`${styles.panel} ${styles.blockedPanel}`}>
    <div className={styles.blockedGlyph} aria-hidden="true">◫</div>
    <h3 className={styles.blockedTitle}>{title}</h3>
    <p className={styles.detail}>{note}</p>
    {cta && ctaHref && <a className={`${styles.btn} ${styles.btnSecondary}`} href={ctaHref}>{cta}</a>}
  </section>;
}

// ---------------------------------------------------------------- tone helpers
function complianceTone(rate: number | null): GeoTone {
  if (rate == null) return "neutral";
  if (rate >= 85) return "low";
  if (rate >= 75) return "medium";
  return "high";
}
function riskTone(band: string | null | undefined): GeoTone {
  if (band === "high") return "high";
  if (band === "medium") return "medium";
  if (band === "low") return "low";
  return "neutral";
}
function rankTone(rate: number | null): CanvasRankRow["tone"] {
  if (rate == null) return "neutral";
  if (rate >= 85) return "success";
  if (rate >= 75) return "warning";
  return "critical";
}

// ---------------------------------------------------------------- command header
export function CommandHeader({ locale, view, params, from, to, region, regions, query, refreshedAt, policyVersionId, partialSources }: {
  locale: Locale; view: "strategic" | "operational"; params: Record<string, string>;
  from: string; to: string; region: string; regions: string[]; query: string;
  refreshedAt: string; policyVersionId: string | null; partialSources: string[];
}) {
  return <header className={styles.command}>
    <nav className={styles.seg} role="tablist" aria-label={copy(locale, "Dashboard perspective", "منظور لوحة القيادة")} style={{ margin: "var(--ax-space-100) var(--ax-space-200) 0" }}>
      <a id="dashboard-tab-strategic" className={styles.segOpt} role="tab" aria-controls="dashboard-panel" aria-selected={view === "strategic"} href={paramsHref(params, { view: "strategic" })}>{copy(locale, "Strategic View", "المنظور الاستراتيجي")}</a>
      <a id="dashboard-tab-operational" className={styles.segOpt} role="tab" aria-controls="dashboard-panel" aria-selected={view === "operational"} href={paramsHref(params, { view: "operational" })}>{copy(locale, "Operational View", "المنظور التشغيلي")}</a>
    </nav>
    <form action="/dashboard" method="get" className={styles.commandRow} role="search" aria-label={copy(locale, "Search and filter dashboard", "البحث وتصفية لوحة القيادة")}>
      <input type="hidden" name="view" value={view} /><input type="hidden" name="group" value={params.group ?? "region"} />
      <div className={styles.commandSearch}>
        <span className={styles.searchIcon} aria-hidden="true">⌕</span>
        <input className={styles.searchInput} type="search" name="q" defaultValue={query} aria-label={copy(locale, "Search factories, visits and inspections", "البحث في المصانع والزيارات والتفتيشات")} placeholder={copy(locale, "Search CR, factory, visit…", "ابحث في السجل التجاري، المصنع، الزيارة…")} />
      </div>
      <details className={styles.dateWrap}>
        <summary className={`${styles.btn} ${styles.btnSecondary}`}>◫ {from} → {to}</summary>
        <div className={styles.datePanel}>
          <label>{copy(locale, "From", "من")}<input type="date" name="from" defaultValue={from} /></label>
          <label>{copy(locale, "To", "إلى")}<input type="date" name="to" defaultValue={to} /></label>
        </div>
      </details>
      <select className={styles.regionSelect} name="region" defaultValue={region} aria-label={copy(locale, "Region", "المنطقة")}>
        <option value="">{copy(locale, "All regions", "جميع المناطق")}</option>
        {regions.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">{copy(locale, "Apply", "تطبيق")}</button>
      <span className={styles.grow} />
      <span className={`${styles.badge} ${partialSources.length ? styles.tone_warning : styles.tone_success}`}>
        <span className={styles.dot} aria-hidden="true" />
        {partialSources.length
          ? copy(locale, `${partialSources.length} source partial`, `${partialSources.length} مصدر جزئي`)
          : copy(locale, `Live · refreshed ${refreshedAt}`, `مباشر · تم التحديث ${refreshedAt}`)}
      </span>
    </form>
    <div className={styles.scopeLine} role="status">
      <span className={styles.idCode}>
        {copy(locale, `Scope: ${from} → ${to} · Asia/Riyadh · ${policyVersionId ? `policy ${policyVersionId.slice(0, 8)}` : "no effective policy"} · ${region || "all regions"} · RLS scoped`,
          `النطاق: ${from} → ${to} · آسيا/الرياض · ${policyVersionId ? `السياسة ${policyVersionId.slice(0, 8)}` : "لا توجد سياسة فعّالة"} · ${region || "جميع المناطق"} · مقيّد حسب الصلاحيات`)}
      </span>
      <span className={styles.grow} />
      {partialSources.length > 0 && <ExcChip tone="warning">{copy(locale, "Partial:", "جزئي:")} {partialSources.join(" · ")}</ExcChip>}
    </div>
  </header>;
}

// ---------------------------------------------------------------- metric strip prep
function stripFor(projection: DashboardKpiProjection, ids: string[], locale: Locale) {
  const metrics: MetricDisplay[] = [];
  const methodology: Record<string, MethodologyEntry> = {};
  for (const id of ids) {
    const m = findMetric(projection, id);
    if (!m) continue;
    metrics.push(metricDisplay(m, locale));
    methodology[id] = buildMethodology(m, locale);
  }
  return { metrics, methodology };
}
function stripStrings(locale: Locale): MetricStripStrings {
  return {
    methodology: copy(locale, "ⓘ Methodology", "ⓘ المنهجية"),
    why: copy(locale, "ⓘ Why", "ⓘ لماذا"),
    close: copy(locale, "Close", "إغلاق"),
    advisory: copy(locale, "Advisory only · traceable", "استشاري فقط · قابل للتتبع"),
    blockedTitle: copy(locale, "Blocked", "محجوب"),
    drillFallback: copy(locale, "Open records", "فتح السجلات"),
  };
}

// ---------------------------------------------------------------- STRATEGIC
export function StrategicView({ locale, metrics, projection, factories, group, params }: {
  locale: Locale; metrics: DashboardMetrics; projection: DashboardKpiProjection; factories: FactoryRef[];
  group: "region" | "city" | "sector" | "authority"; params: Record<string, string>;
}) {
  const s = metrics.strategic;
  const unknown = copy(locale, "Not recorded", "غير مسجل");
  const regionBreakdown = complianceBreakdown(s.scopedResponses as ResponseRow[], "region", unknown);
  const regionRate = new Map(regionBreakdown.map((r) => [r.label, r.rate]));
  const strip = stripFor(projection, ["STR-KPI-001", "STR-KPI-011", "STR-KPI-005", "STR-KPI-007"], locale);

  // National Decision Canvas markers — real official coordinates only.
  const canvasMarkers: CanvasMarker[] = factories
    .filter((f) => f.official_lat != null && f.official_lng != null)
    .slice(0, 1200)
    .map((f) => ({
      id: f.id,
      lat: Number(f.official_lat),
      lng: Number(f.official_lng),
      label: f.name,
      region: f.region,
      href: `/factories/${f.id}`,
      toneRisk: riskTone(f.risk_band),
      toneCompliance: complianceTone(f.region ? regionRate.get(f.region) ?? null : null),
    }));
  const layers: CanvasLayer[] = [
    { id: "compliance", label: copy(locale, "Compliance", "الامتثال"), available: regionBreakdown.length > 0 },
    { id: "risk", label: copy(locale, "Risk band", "نطاق المخاطر"), available: factories.some((f) => f.risk_band) },
  ];
  const ranking: CanvasRankRow[] = regionBreakdown
    .slice()
    .sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101))
    .slice(0, 8)
    .map((r) => ({
      key: r.label,
      name: r.label,
      detail: copy(locale, `${r.compliant}/${r.total} answered`, `${r.compliant}/${r.total} مجاب`),
      value: r.rate == null ? "—" : `${r.rate}%`,
      tone: rankTone(r.rate),
    }));

  const canvasStrings: DecisionCanvasStrings = {
    panelTitle: copy(locale, "National decision canvas", "لوحة القرار الوطنية"),
    rankTitle: copy(locale, "Ranked intervention", "التدخل المُرتّب"),
    syncedToMap: copy(locale, "synced to map", "متزامن مع الخريطة"),
    provider: copy(locale, "Mapbox GL · shared GeoMap", "Mapbox GL · خريطة مشتركة"),
    loadingTitle: copy(locale, "Loading map…", "جارٍ تحميل الخريطة…"),
    loadingBody: copy(locale, "Loading governed factory coordinates.", "جارٍ تحميل إحداثيات المصانع المعتمدة."),
    emptyTitle: copy(locale, "No mapped factories in scope", "لا توجد مصانع على الخريطة ضمن النطاق"),
    emptyBody: copy(locale, "No RLS-visible factory in this region carries official coordinates.", "لا يوجد مصنع ظاهر حسب الصلاحيات في هذه المنطقة يحمل إحداثيات رسمية."),
    legendTitle: copy(locale, "Legend", "المفتاح"),
    legendHealthy: copy(locale, "≥ 85% healthy", "≥ 85% سليم"),
    legendAttention: copy(locale, "75–84% attention", "75–84% انتباه"),
    legendCritical: copy(locale, "< 75% critical", "< 75% حرج"),
    provenance: copy(locale, "Provenance: official coordinates", "المصدر: الإحداثيات الرسمية"),
    open: copy(locale, "Open", "فتح"),
    allRegions: copy(locale, "All regions", "جميع المناطق"),
    blockedLayer: copy(locale, "Layer source not configured", "مصدر الطبقة غير مهيأ"),
    selectedFactory: copy(locale, "Selected factory", "المصنع المحدد"),
  };

  const dimensions = [
    ["region", copy(locale, "Region", "المنطقة")],
    ["city", copy(locale, "City", "المدينة")],
    ["sector", copy(locale, "Sector", "القطاع")],
    ["authority", copy(locale, "Authority", "الجهة")],
  ] as const;
  const groupBreakdown = complianceBreakdown(s.scopedResponses as ResponseRow[], group, unknown);

  // Risk-band distribution (Risk engine — explicitly NOT Health Score, which is
  // unavailable in the live schema; STR-KPI-002 stays blocked).
  const bandCounts = { high: 0, medium: 0, low: 0, none: 0 };
  for (const f of factories) {
    if (f.risk_band === "high") bandCounts.high++;
    else if (f.risk_band === "medium") bandCounts.medium++;
    else if (f.risk_band === "low") bandCounts.low++;
    else bandCounts.none++;
  }
  const decisionMix = findMetric(projection, "STR-KPI-004");
  const violationMetric = findMetric(projection, "STR-KPI-003");

  return <div id="dashboard-panel" role="tabpanel" aria-labelledby="dashboard-tab-strategic" className={styles.view}>
    {/* STATUS RAIL */}
    <div className={styles.statusRail}>
      <ExcChip tone="critical">{copy(locale, `${s.criticalFactories.length} factories need intervention`, `${s.criticalFactories.length} مصانع تتطلب تدخلاً`)}</ExcChip>
      <ExcChip tone={s.violationDelta > 0 ? "warning" : "success"}>{copy(locale, `Violation movement ${s.violationDelta > 0 ? "+" : ""}${s.violationDelta}`, `حركة المخالفات ${s.violationDelta > 0 ? "+" : ""}${s.violationDelta}`)}</ExcChip>
      <ExcChip tone="warning">{copy(locale, "Licence exposure: source unavailable", "تعرّض التراخيص: المصدر غير متاح")}</ExcChip>
      <ExcChip tone="info">{copy(locale, "Coverage & uninspected: policy not configured", "التغطية وغير المفتشة: السياسة غير مهيأة")}</ExcChip>
    </div>

    <h2 className={styles.srOnly}>{copy(locale, "Strategic overview", "النظرة الاستراتيجية")}</h2>

    {/* METRIC STRIP */}
    <MetricStrip metrics={strip.metrics} methodology={strip.methodology} strings={stripStrings(locale)} />

    {/* MAP-LED DECISION CANVAS + RANKED INTERVENTION */}
    <DecisionCanvas markers={canvasMarkers} layers={layers} ranking={ranking} strings={canvasStrings} />

    {/* ANALYTIC FIELDS */}
    <div className={styles.analyticGrid}>
      <Panel title={copy(locale, "Compliance performance explorer", "مستكشف أداء الامتثال")}
        meta={copy(locale, "one denominator", "مقام واحد")}>
        <p className={styles.detail}>{copy(locale, "Compliant ÷ (compliant + non-compliant) · N/A excluded. Same eligible-answer denominator across all lenses.", "الممتثل ÷ (الممتثل + غير الممتثل) · مع استبعاد غير المنطبق. نفس مقام الإجابات المؤهلة في كل الزوايا.")}</p>
        <nav className={styles.dimensions} aria-label={copy(locale, "Group compliance by", "تجميع الامتثال حسب")}>
          {dimensions.map(([id, label]) => <a key={id} className={styles.dimension} aria-current={group === id} href={paramsHref(params, { group: id })}>{label}</a>)}
        </nav>
        <Bars rows={groupBreakdown.map((row) => ({ label: `${row.label} · ${row.compliant}/${row.total}`, value: row.rate ?? 0 }))} empty={copy(locale, "No eligible answers exist in this scope.", "لا توجد إجابات مؤهلة ضمن هذا النطاق.")} suffix="%" />
      </Panel>

      <Panel title={copy(locale, "Risk-band distribution", "توزيع نطاق المخاطر")} meta={copy(locale, "Risk engine", "محرك المخاطر")}>
        <p className={styles.detail}>{copy(locale, "Governed Risk band — distinct from Health Score. Health Score distribution (STR-KPI-002) has no source table and stays unavailable.", "نطاق المخاطر المعتمد — يختلف عن درجة الصحة. توزيع درجة الصحة (STR-KPI-002) بلا مصدر ويبقى غير متاح.")}</p>
        <Bars rows={[
          { label: copy(locale, "High", "مرتفع"), value: bandCounts.high },
          { label: copy(locale, "Medium", "متوسط"), value: bandCounts.medium },
          { label: copy(locale, "Low", "منخفض"), value: bandCounts.low },
          { label: copy(locale, "Unclassified", "غير مصنّف"), value: bandCounts.none },
        ]} empty={copy(locale, "No factories in scope.", "لا توجد مصانع ضمن النطاق.")} />
      </Panel>

      <Panel title={copy(locale, "Decision mix — Level 2", "مزيج القرار — المستوى الثاني")} meta={metricTitle(decisionMix!, locale) && `${decisionMix?.denominator ?? 0} ${copy(locale, "decided", "قرار")}`}>
        <p className={styles.detail}>{copy(locale, "Latest L2 outcome per submitted inspection — Approve / Return. This is a decision mix, NOT compliance.", "أحدث نتيجة للمستوى الثاني لكل تفتيش مقدم — اعتماد / إعادة. هذا مزيج قرار وليس امتثالاً.")}</p>
        <Bars rows={(decisionMix?.breakdown ?? []).map((b) => ({ label: b.labelRef === "approve" ? copy(locale, "Approved", "معتمد") : copy(locale, "Returned", "معاد"), value: b.value }))} empty={copy(locale, "No decided L2 outcomes in scope.", "لا توجد قرارات مستوى ثانٍ ضمن النطاق.")} />
      </Panel>

      <Panel title={copy(locale, "Violation trend", "اتجاه المخالفات")} meta={copy(locale, "by regulation", "حسب اللائحة")}>
        <p className={styles.detail}>{copy(locale, "By-regulation counts are live. Time-series by official issue date is decision-required (no violation issue-time column).", "الأعداد حسب اللائحة مباشرة. السلسلة الزمنية حسب تاريخ الإصدار الرسمي تتطلب قراراً (لا يوجد عمود لوقت إصدار المخالفة).")}</p>
        <Bars rows={(violationMetric?.breakdown ?? []).map((b) => ({ label: b.labelRef, value: b.value }))} empty={copy(locale, "No linked violations in scope.", "لا توجد مخالفات مرتبطة ضمن النطاق.")} />
      </Panel>

      <BlockedPanel title={copy(locale, "Risk-to-attention mismatch — decision required", "عدم تطابق المخاطر والاهتمام — يتطلب قراراً")}
        note={copy(locale, "Risk snapshots exist, but the snapshot-at-visit-vs-current-band rule and the minimum-denominator benchmark are unresolved governance decisions (DEC-DASH-010). No ratio is invented.", "لقطات المخاطر موجودة، لكن قاعدة اللقطة عند الزيارة مقابل النطاق الحالي والحد الأدنى للمقام قرارات حوكمة غير محسومة (DEC-DASH-010). لا تُختلق أي نسبة.")} />

      <BlockedPanel title={copy(locale, "Checklist items per authority — decision required", "بنود قائمة التحقق حسب الجهة — يتطلب قراراً")}
        note={copy(locale, "Computable from items → regulation → authority, but whether a reusable item counts once globally or once per package is undecided (DEC-DASH-009).", "قابل للحساب من البنود ← اللائحة ← الجهة، لكن احتساب البند القابل لإعادة الاستخدام مرة واحدة عالمياً أو لكل حزمة غير محسوم (DEC-DASH-009).")} />
    </div>

    {/* NOT-CONFIGURED */}
    <div className={styles.pairGrid}>
      <BlockedPanel title={copy(locale, "Inspection coverage — not configured", "تغطية التفتيش — غير مهيأة")}
        note={copy(locale, "The inspection-cycle policy (eligible factories, frequency, due rule, qualifying completion) must be published in Admin before coverage can be calculated. No value is invented.", "يجب نشر سياسة دورة التفتيش (المصانع المؤهلة، التكرار، قاعدة الاستحقاق، الإنجاز المؤهل) في الإدارة قبل حساب التغطية. لا تُختلق أي قيمة.")}
        cta={copy(locale, "Open cycle policy →", "فتح سياسة الدورة ←")} ctaHref="/admin" />
      <BlockedPanel title={copy(locale, "Uninspected factories — not configured", "المصانع غير المفتشة — غير مهيأة")}
        note={copy(locale, "Requires the published factory-eligibility rules and inspection cycle. Available as soon as the governing policy version is effective.", "يتطلب قواعد أهلية المصنع المنشورة ودورة التفتيش. يصبح متاحاً بمجرد سريان إصدار السياسة الحاكمة.")}
        cta={copy(locale, "Open eligibility policy →", "فتح سياسة الأهلية ←")} ctaHref="/admin" />
    </div>

    {/* STRATEGIC SUMMARY (AI deferred → deterministic evidence signals) */}
    <Panel accent title={copy(locale, "Strategic summary", "الملخص الاستراتيجي")} meta={copy(locale, "deterministic · AI not configured", "حتمي · الذكاء الاصطناعي غير مهيأ")}>
      <p className={styles.detail}>{copy(locale, "Evidence-grounded AI summary (STR-KPI-012) is deferred until its source/evidence policy is enabled. Deterministic, record-linked signals are shown instead — no generated narrative or forecast.", "الملخص الذكي المستند إلى الأدلة (STR-KPI-012) مؤجل حتى تفعيل سياسة المصدر/الأدلة. تُعرض بدلاً منه إشارات حتمية مرتبطة بالسجلات — دون سرد أو توقع مولّد.")}</p>
      <ul className={styles.summaryList}>
        <li><span className={`${styles.dot} ${styles.tone_critical}`} aria-hidden="true" />{copy(locale, `${s.criticalFactories.length} high-risk or L1-linked factories are visible in this scope.`, `${s.criticalFactories.length} مصانع عالية المخاطر أو مرتبطة بمخالفة L1 ظاهرة ضمن هذا النطاق.`)} <a href="/factories">{copy(locale, "Verify →", "تحقق ←")}</a></li>
        <li><span className={`${styles.dot} ${styles.tone_warning}`} aria-hidden="true" />{copy(locale, `Recorded violations moved ${s.violationDelta > 0 ? "+" : ""}${s.violationDelta} vs the previous equal window (${s.scopedViolations.length} vs ${s.previousViolations}).`, `تحركت المخالفات المسجلة ${s.violationDelta > 0 ? "+" : ""}${s.violationDelta} مقارنة بالفترة السابقة (${s.scopedViolations.length} مقابل ${s.previousViolations}).`)} <a href="/analytics/violations">{copy(locale, "Verify →", "تحقق ←")}</a></li>
        <li><span className={`${styles.dot} ${styles.tone_success}`} aria-hidden="true" />{copy(locale, `${s.compliant} compliant of ${s.answeredForCompliance} eligible answers${s.complianceRate == null ? "" : ` (${s.complianceRate}%)`}.`, `${s.compliant} ممتثل من ${s.answeredForCompliance} إجابة مؤهلة${s.complianceRate == null ? "" : ` (${s.complianceRate}%)`}.`)} <a href="/analytics/compliance">{copy(locale, "Verify →", "تحقق ←")}</a></li>
      </ul>
    </Panel>
  </div>;
}

// ---------------------------------------------------------------- OPERATIONAL
export function OperationalView({ locale, metrics, projection, factoryCoords }: {
  locale: Locale; metrics: DashboardMetrics; projection: DashboardKpiProjection;
  factoryCoords: Map<string, { lat: number; lng: number; radiusM: number | null }>;
}) {
  const o = metrics.operational;
  const action = copy(locale, "Open", "فتح");
  const strip = stripFor(projection, ["OPS-KPI-003", "OPS-KPI-002", "OPS-KPI-004", "OPS-KPI-007"], locale);
  const workloadMax = Math.max(1, ...o.workload.map((row) => row.active));

  // Operational live canvas — real factory coordinates of scoped visits, toned
  // by operational_state. No synthetic routes; reuses the Operations Center map.
  const seen = new Set<string>();
  const pins: OpsPin[] = [];
  const toneForState = (state: string): OpsPin["tone"] =>
    state === "executing" ? "low" : state === "arrived" ? "medium" : state === "on_the_way" ? "neutral" : "neutral";
  for (const v of [...o.overdueRows, ...o.highPriorityRows, ...o.todayVisits]) {
    const fid = v.factories?.id;
    if (!fid || seen.has(v.id)) continue;
    const c = factoryCoords.get(fid);
    if (!c) continue;
    seen.add(v.id);
    pins.push({ id: `v:${v.id}`, kind: "visit", lat: c.lat, lng: c.lng, label: v.factories?.name ?? v.id.slice(0, 8), tone: toneForState(v.operational_state), radiusM: c.radiusM ?? undefined, href: `/visits/${v.id}` });
  }
  const opsMapStrings: OpsMapStrings = {
    loadingTitle: copy(locale, "Loading operations map…", "جارٍ تحميل خريطة العمليات…"),
    loadingBody: copy(locale, "Loading governed visit coordinates.", "جارٍ تحميل إحداثيات الزيارات المعتمدة."),
    open: action,
    selectHint: copy(locale, "Select a pin to open its visit.", "حدد دبوساً لفتح زيارته."),
    legendExecuting: copy(locale, "Executing", "قيد التنفيذ"),
    legendEnRoute: copy(locale, "On the way", "في الطريق"),
    legendFactory: copy(locale, "Visit", "زيارة"),
  };

  const alerts = [
    ...o.overdueRows.map((row: VisitRow) => ({ key: `overdue-${row.id}`, tone: copy(locale, "Critical", "حرج"), label: copy(locale, "Visit window overdue", "نافذة الزيارة متأخرة"), detail: row.factories?.name ?? row.id.slice(0, 8), href: `/visits/${row.id}` })),
    ...o.overdueReviewRows.map((row: ReviewRow) => ({ key: `review-${row.id}`, tone: copy(locale, "Critical", "حرج"), label: copy(locale, "Review SLA overdue", "مراجعة متجاوزة لاتفاقية الخدمة"), detail: row.inspections?.visits?.factories?.name ?? row.inspection_id.slice(0, 8), href: "/operations" })),
    ...o.overrides.map((row: GeoRow) => ({ key: `override-${row.id}`, tone: copy(locale, "Warning", "تحذير"), label: copy(locale, "GPS override recorded", "تم تسجيل تجاوز GPS"), detail: row.visits?.factories?.name ?? row.visit_id.slice(0, 8), href: `/visits/${row.visit_id}` })),
    ...o.cancelledRows.map((row: VisitRow) => ({ key: `cancelled-${row.id}`, tone: copy(locale, "Information", "معلومة"), label: copy(locale, "Visit cancelled", "تم إلغاء الزيارة"), detail: `${row.factories?.name ?? row.id.slice(0, 8)} · ${row.cancellation_reason ?? copy(locale, "reason not recorded", "السبب غير مسجل")}`, href: `/visits/${row.id}` })),
  ];

  return <div id="dashboard-panel" role="tabpanel" aria-labelledby="dashboard-tab-operational" className={styles.view}>
    {/* STATUS RAIL */}
    <div className={styles.statusRail}>
      <ExcChip tone="critical">{copy(locale, `${o.overdueRows.length} visits overdue`, `${o.overdueRows.length} زيارات متأخرة`)}</ExcChip>
      <ExcChip tone="warning">{copy(locale, `${o.highPriorityRows.length} high-priority pending`, `${o.highPriorityRows.length} عالية الأولوية معلقة`)}</ExcChip>
      <ExcChip tone="warning">{copy(locale, `${o.overrides.length} GPS overrides today`, `${o.overrides.length} تجاوزات GPS اليوم`)}</ExcChip>
      <ExcChip tone="info">{copy(locale, `${o.awaitingRows.length} pending approvals`, `${o.awaitingRows.length} اعتمادات معلقة`)}</ExcChip>
    </div>

    <h2 className={styles.srOnly}>{copy(locale, "Operational overview", "النظرة التشغيلية")}</h2>

    {/* METRIC STRIP */}
    <MetricStrip metrics={strip.metrics} methodology={strip.methodology} strings={stripStrings(locale)} />

    {/* LIVE CANVAS + LIVE ACTIVITY */}
    <div className={styles.canvasGrid}>
      <section className={styles.mapPanel} aria-label={copy(locale, "Live operations", "العمليات المباشرة")}>
        <div className={styles.mapChrome}>
          <h3 className={styles.mapTitle}>{copy(locale, "Live operations", "العمليات المباشرة")}</h3>
          <span className={styles.grow} />
          <span className={styles.idCode}>{copy(locale, "Mapbox GL · immutable journeys only", "Mapbox GL · رحلات غير قابلة للتغيير فقط")}</span>
        </div>
        <div className={styles.mapScene}>
          {pins.length ? <OpsMap pins={pins} strings={opsMapStrings} /> : <div className={styles.empty} role="status">{copy(locale, "No scoped visit carries official coordinates in this window.", "لا تحمل أي زيارة ضمن النطاق إحداثيات رسمية في هذه الفترة.")}</div>}
        </div>
      </section>
      <Panel title={copy(locale, "Live activity", "النشاط المباشر")} meta={copy(locale, "immutable audit", "تدقيق غير قابل للتغيير")}>
        {o.timeline.length ? <ul className={styles.timeline}>{o.timeline.slice(0, 8).map((row) => (
          <li key={row.id}><span className={styles.tlDot} aria-hidden="true" /><div><div className={styles.tlTitle}>{row.action}</div><div className={styles.tlMeta}>{row.object_type} · {row.object_id?.slice(0, 8)} · {new Date(row.occurred_at).toISOString().slice(0, 16).replace("T", " ")}</div></div></li>
        ))}</ul> : <div className={styles.empty} role="status">{copy(locale, "No scoped audit events in the selected window.", "لا توجد أحداث تدقيق ضمن النطاق والفترة المحددين.")}</div>}
      </Panel>
    </div>

    {/* PIPELINE / SCHEDULE / NUDGES */}
    <div className={styles.analyticGrid}>
      <Panel title={copy(locale, "Visit pipeline", "مسار الزيارات")} meta={copy(locale, "planning states", "حالات التخطيط")}>
        <div className={styles.pipeline}>
          <div className={styles.pipeCell}><div className={styles.pipeValue}>{o.planned}</div><div className={styles.detail}>{copy(locale, "Published", "منشورة")}</div></div>
          <div className={styles.pipeCell}><div className={styles.pipeValue}>{o.completed}</div><div className={styles.detail}>{copy(locale, "Completed", "مكتملة")}</div></div>
          <div className={styles.pipeCell}><div className={styles.pipeValue}>{o.returnedRows.length}</div><div className={styles.detail}>{copy(locale, "Returned", "معادة")}</div></div>
          <div className={styles.pipeCell}><div className={styles.pipeValue}>{o.cancelled}</div><div className={styles.detail}>{copy(locale, "Cancelled", "ملغاة")}</div></div>
        </div>
      </Panel>

      <Panel title={copy(locale, "Today's schedule load", "حِمل جدول اليوم")} meta={copy(locale, "by inspector · relative", "حسب المفتش · نسبي")}>
        {o.workload.length ? <div className={styles.bars}>{o.workload.slice(0, 6).map((row) => (
          <div className={styles.barRow} key={row.id}><span className={styles.barLabel} title={row.name}>{row.name}</span><span className={styles.track} aria-hidden="true"><span className={styles.fill} style={{ inlineSize: `${(row.active / workloadMax) * 100}%` }} /></span><strong className={styles.barValue}>{row.active}</strong></div>
        ))}</div> : <div className={styles.empty} role="status">{copy(locale, "No assignments are visible in this scope.", "لا توجد إسنادات ظاهرة ضمن هذا النطاق.")}</div>}
      </Panel>

      <Panel accent title={copy(locale, "Operational priorities", "الأولويات التشغيلية")} meta={copy(locale, "deterministic · AI nudges not configured", "حتمي · تنبيهات الذكاء غير مهيأة")}>
        <p className={styles.detail}>{copy(locale, "Evidence-grounded AI nudges (OPS-KPI-009) are disabled until the nudge trigger/CTA policy is published. These deterministic priorities open pre-filtered records and never execute an action.", "تنبيهات الذكاء الاصطناعي المستندة للأدلة (OPS-KPI-009) معطلة حتى نشر سياسة المحفّز/الإجراء. تفتح هذه الأولويات الحتمية سجلات مُصفّاة مسبقاً ولا تنفذ أي إجراء.")}</p>
        <ul className={styles.nudgeList}>
          <li><span className={`${styles.dot} ${styles.tone_critical}`} aria-hidden="true" /><span>{copy(locale, `${o.overdueRows.length} overdue published visits.`, `${o.overdueRows.length} زيارات منشورة متأخرة.`)}</span><a className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} href="/operations">{action}</a></li>
          <li><span className={`${styles.dot} ${styles.tone_warning}`} aria-hidden="true" /><span>{copy(locale, `${o.awaitingRows.length} reports awaiting L2 decision.`, `${o.awaitingRows.length} تقارير بانتظار قرار المستوى الثاني.`)}</span><a className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} href="/reviews">{action}</a></li>
          <li><span className={`${styles.dot} ${styles.tone_warning}`} aria-hidden="true" /><span>{copy(locale, `${o.highPriorityRows.length} high-priority visits pending execution.`, `${o.highPriorityRows.length} زيارات عالية الأولوية بانتظار التنفيذ.`)}</span><a className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} href="/visits">{action}</a></li>
        </ul>
      </Panel>
    </div>

    {/* DETAILED OPERATIONS (preserved scorecard + tables) */}
    <div className={styles.analyticGrid}>
      <Panel title={copy(locale, "Selected-window scorecard", "بطاقة أداء الفترة المحددة")} meta="M08-016">
        <div className={styles.kpiMini}>
          <div><div className={styles.kpiMiniValue}>{o.todayVisits.length}</div><div className={styles.detail}>{copy(locale, "Today planned", "مخطط اليوم")}</div></div>
          <div><div className={styles.kpiMiniValue}>{o.todayCompletionRate == null ? "—" : `${o.todayCompletionRate}%`}</div><div className={styles.detail}>{copy(locale, "Today completion", "إنجاز اليوم")}</div></div>
          <div><div className={styles.kpiMiniValue}>{o.activeField}</div><div className={styles.detail}>{copy(locale, "Active field", "ميداني نشط")}</div></div>
          <div><div className={styles.kpiMiniValue}>{o.activeInspectors}</div><div className={styles.detail}>{copy(locale, "Active inspectors", "مفتشون نشطون")}</div></div>
          <div><div className={styles.kpiMiniValue}>{o.slaBreachRate == null ? "—" : `${o.slaBreachRate}%`}</div><div className={styles.detail}>{copy(locale, "SLA breach", "تجاوز الخدمة")}</div></div>
          <div><div className={styles.kpiMiniValue}>{formatDuration(o.avgDurationMs, locale)}</div><div className={styles.detail}>{copy(locale, "Avg duration", "متوسط المدة")}</div></div>
        </div>
      </Panel>
      <Panel title={copy(locale, "Cancellation reasons", "أسباب الإلغاء")}>
        <Bars rows={o.cancellationReasons} empty={copy(locale, "No cancelled visits in the selected window.", "لا توجد زيارات ملغاة في الفترة المحددة.")} />
      </Panel>
    </div>

    <div className={styles.pairGrid}>
      <Panel title={copy(locale, "Deterministic alert board", "لوحة التنبيهات الحتمية")}>
        {alerts.length ? <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th scope="col">{copy(locale, "Severity", "الشدة")}</th><th scope="col">{copy(locale, "Condition", "الشرط")}</th><th scope="col">{copy(locale, "Object", "العنصر")}</th><th scope="col" /></tr></thead>
          <tbody>{alerts.slice(0, 12).map((alert) => <tr key={alert.key}><td><strong>{alert.tone}</strong></td><td>{alert.label}</td><td>{alert.detail}</td><td><a className={styles.linkAction} href={alert.href}>{action}</a></td></tr>)}</tbody>
        </table></div> : <div className={styles.empty} role="status">{copy(locale, "No governed alert condition is active in this scope.", "لا يوجد شرط تنبيه معتمد نشط ضمن هذا النطاق.")}</div>}
      </Panel>
      <Panel title={copy(locale, "Alert source coverage", "تغطية مصادر التنبيه")}>
        <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th scope="col">{copy(locale, "Condition", "الشرط")}</th><th scope="col">{copy(locale, "Runtime state", "حالة التشغيل")}</th></tr></thead>
          <tbody>
            <tr><td>{copy(locale, "Missed / overdue visit", "زيارة فائتة / متأخرة")}</td><td>{o.overdueRows.length}</td></tr>
            <tr><td>{copy(locale, "Cancelled visit", "زيارة ملغاة")}</td><td>{o.cancelledRows.length}</td></tr>
            <tr><td>{copy(locale, "GPS override", "تجاوز GPS")}</td><td>{o.overrides.length}</td></tr>
            <tr><td>{copy(locale, "Overdue review", "مراجعة متأخرة")}</td><td>{o.reviewSlaConfigured ? o.overdueReviewRows.length : copy(locale, "SLA not configured", "اتفاقية الخدمة غير مهيأة")}</td></tr>
            <tr><td>{copy(locale, "Offline inspector", "مفتش غير متصل")}</td><td>{copy(locale, "Unavailable — no presence source", "غير متاح — لا يوجد مصدر حضور")}</td></tr>
            <tr><td>{copy(locale, "Stuck execution", "تنفيذ متوقف")}</td><td>{copy(locale, "Unavailable — no stuck-duration policy", "غير متاح — لا توجد سياسة مدة التوقف")}</td></tr>
          </tbody>
        </table></div>
      </Panel>
    </div>

    <div className={styles.pairGrid}>
      <Panel title={copy(locale, "GPS overrides — planned vs observed", "تجاوزات GPS — المخطط مقابل المرصود")}>
        {o.overrides.length ? <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th scope="col">{copy(locale, "Visit / factory", "الزيارة / المصنع")}</th><th scope="col">{copy(locale, "Planned", "المخطط")}</th><th scope="col">{copy(locale, "Observed", "المرصود")}</th><th scope="col">{copy(locale, "Reason", "السبب")}</th><th scope="col">{copy(locale, "At", "الوقت")}</th></tr></thead>
          <tbody>{o.overrides.slice(0, 10).map((row: GeoRow) => <tr key={row.id}>
            <td><a className={styles.linkAction} href={`/visits/${row.visit_id}`}>{row.visits?.factories?.name ?? row.visit_id.slice(0, 8)}</a></td>
            <td className={styles.numeric}>{row.visits?.planner_lat != null && row.visits?.planner_lng != null ? `${row.visits.planner_lat}, ${row.visits.planner_lng}` : "—"}</td>
            <td className={styles.numeric}>{row.observed_lat}, {row.observed_lng}</td>
            <td>{row.override_reason ?? copy(locale, "Not recorded", "غير مسجل")}</td>
            <td className={styles.numeric}>{new Date(row.occurred_at).toISOString().slice(0, 16).replace("T", " ")}</td>
          </tr>)}</tbody>
        </table></div> : <div className={styles.empty} role="status">{copy(locale, "No GPS overrides in the selected scope.", "لا توجد تجاوزات GPS ضمن النطاق المحدد.")}</div>}
      </Panel>
      <Panel title={copy(locale, "Inspector workload — relative", "عبء عمل المفتشين — نسبي")}>
        <p className={styles.detail}>{copy(locale, "No capacity threshold or presence timeout is configured. Bars compare active assigned visits only.", "لا توجد عتبة سعة أو مهلة حضور مهيأة. تقارن الأشرطة الزيارات النشطة المسندة فقط.")}</p>
        {o.workload.length ? <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th scope="col">{copy(locale, "Inspector", "المفتش")}</th><th scope="col">{copy(locale, "Assigned", "المسند")}</th><th scope="col">{copy(locale, "Active", "النشط")}</th><th scope="col">{copy(locale, "Completed", "المكتمل")}</th><th scope="col">{copy(locale, "Overdue", "المتأخر")}</th></tr></thead>
          <tbody>{o.workload.slice(0, 10).map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td className={styles.numeric}>{row.assigned}</td><td className={styles.numeric}>{row.active}</td><td className={styles.numeric}>{row.completed}</td><td className={styles.numeric}>{row.overdue}</td></tr>)}</tbody>
        </table></div> : <div className={styles.empty} role="status">{copy(locale, "No assignments are visible in this scope.", "لا توجد إسنادات ظاهرة ضمن هذا النطاق.")}</div>}
      </Panel>
    </div>
  </div>;
}

// ---------------------------------------------------------------- SEARCH (preserved)
export function SearchResults({ locale, query, factories, visits, inspections }: {
  locale: Locale; query: string; factories: FactoryRef[]; visits: VisitRow[]; inspections: { id: string; visits: { factories: FactoryRef | null } | null }[];
}) {
  const needle = query.trim().toLocaleLowerCase(locale);
  if (!needle) return null;
  const has = (...values: (string | null | undefined)[]) => values.some((value) => value?.toLocaleLowerCase(locale).includes(needle));
  const f = factories.filter((row) => has(row.name, row.factory_code, row.region, row.city)).slice(0, 6);
  const v = visits.filter((row) => has(row.id, row.factories?.name, row.factories?.factory_code)).slice(0, 6);
  const i = inspections.filter((row) => has(row.id, row.visits?.factories?.name, row.visits?.factories?.factory_code)).slice(0, 6);
  const total = f.length + v.length + i.length;
  return <section className={styles.results} aria-labelledby="dashboard-search-results">
    <h3 id="dashboard-search-results">{copy(locale, `Search results for “${query}”`, `نتائج البحث عن «${query}»`)}</h3>
    {!total ? <p role="status">{copy(locale, "No RLS-visible factory, visit or inspection matched.", "لا يوجد مصنع أو زيارة أو تفتيش ظاهر حسب الصلاحيات يطابق البحث.")}</p> : <div className={styles.resultGrid}>
      <div className={styles.resultGroup}><h4>{copy(locale, "Factories", "المصانع")}</h4>{f.length ? f.map((row) => <a className={styles.result} href={`/factories/${row.id}`} key={row.id}><strong>{row.name}</strong><br /><span className={styles.detail}>{row.factory_code ?? "—"} · {[row.region, row.city].filter(Boolean).join(" · ")}</span></a>) : <span className={styles.detail}>—</span>}</div>
      <div className={styles.resultGroup}><h4>{copy(locale, "Visits", "الزيارات")}</h4>{v.length ? v.map((row) => <a className={styles.result} href={`/visits/${row.id}`} key={row.id}><strong>{row.factories?.name ?? row.id.slice(0, 8)}</strong><br /><span className={styles.detail}>{row.id.slice(0, 8)} · {row.operational_state}</span></a>) : <span className={styles.detail}>—</span>}</div>
      <div className={styles.resultGroup}><h4>{copy(locale, "Inspections", "التفتيشات")}</h4>{i.length ? i.map((row) => <a className={styles.result} href={`/reports/inspection/${row.id}`} key={row.id}><strong>{row.visits?.factories?.name ?? row.id.slice(0, 8)}</strong><br /><span className={styles.detail}>{row.id.slice(0, 8)}</span></a>) : <span className={styles.detail}>—</span>}</div>
    </div>}
  </section>;
}
