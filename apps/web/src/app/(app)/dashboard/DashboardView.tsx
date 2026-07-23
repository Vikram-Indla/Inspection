import type { ReactNode } from "react";
import type { FactoryRef, GeoRow, ReviewRow, ResponseRow, VisitRow } from "./metrics";
import { complianceBreakdown, formatDuration } from "./metrics";
import KpiGrid, { type Kpi, type Methodology } from "./KpiGrid";
import styles from "./dashboard.module.css";

type Locale = "en" | "ar";
type DashboardMetrics = ReturnType<typeof import("./metrics").buildDashboardMetrics>;

const copy = (locale: Locale, en: string, ar: string) => locale === "ar" ? ar : en;

function paramsHref(current: Record<string, string>, patch: Record<string, string>) {
  const params = new URLSearchParams({ ...current, ...patch });
  for (const [key, value] of [...params.entries()]) if (!value) params.delete(key);
  return `/dashboard?${params.toString()}`;
}

/** Titled surface panel using the shared component layer (`.panel`). */
function Panel({ title, meta, children, style, className }: {
  title?: ReactNode; meta?: ReactNode; children: ReactNode; style?: React.CSSProperties; className?: string;
}) {
  return <div className={`panel${className ? ` ${className}` : ""}`} style={style}>
    {(title || meta) && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px" }}>
      {title && <span className="panel-title" style={{ fontSize: "13.5px" }}>{title}</span>}
      {meta && <span className="id-code" style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{meta}</span>}
    </div>}
    {children}
  </div>;
}

/** Horizontal bars driven only by real record counts. */
function Bars({ rows, empty, suffix = "" }: { rows: { label: string; value: number; tone?: string }[]; empty: string; suffix?: string }) {
  if (!rows.length) return <div className="empty" role="status" style={{ padding: "18px 0" }}><p>{empty}</p></div>;
  const max = Math.max(1, ...rows.map(row => row.value));
  return <div style={{ marginBlockStart: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
    {rows.slice(0, 8).map(row => <div className="row" style={{ gap: "10px" }} key={row.label}>
      <span style={{ width: "140px", fontSize: "12px", color: "var(--text-secondary)" }} title={row.label}>{row.label}</span>
      <div className="progress grow"><i style={{ inlineSize: `${Math.max(3, (row.value / max) * 100)}%`, ...(row.tone ? { background: `var(--status-${row.tone})` } : {}) }} /></div>
      <span className="id-code" style={{ fontSize: "11px", color: "var(--text-muted)" }}>{row.value}{suffix}</span>
    </div>)}
  </div>;
}

/* ── Controls: view toggle + governed scope readout ─────────────── */
export function DashboardControls({ locale, view, params, from, to, region, refreshedAt, partialSources }: {
  locale: Locale; view: "strategic" | "operational"; params: Record<string, string>;
  from: string; to: string; region: string; refreshedAt: string; partialSources: string[];
}) {
  const seg = (id: "strategic" | "operational", label: string) =>
    <a className="seg-opt" role="tab" aria-selected={view === id} aria-pressed={view === id}
      id={`dashboard-tab-${id}`} aria-controls={`dashboard-${id}`} href={paramsHref(params, { view: id })}>{label}</a>;
  return <div className="panel" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
    <div className="seg" role="tablist" aria-label={copy(locale, "Dashboard perspective", "منظور لوحة القيادة")} style={{ alignSelf: "flex-start" }}>
      {seg("strategic", copy(locale, "Strategic View", "المنظور الاستراتيجي"))}
      {seg("operational", copy(locale, "Operational View", "المنظور التشغيلي"))}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", borderBlockStart: "1px solid var(--border-subtle)", paddingBlockStart: "10px" }} role="status">
      <span className="id-code" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
        {copy(locale, `Scope: ${from} → ${to} · Asia/Riyadh · ${region || "all regions"} · RLS scoped`, `النطاق: ${from} → ${to} · آسيا/الرياض · ${region || "جميع المناطق"} · مقيّد حسب الصلاحيات`)}
      </span>
      <span className="grow" />
      <span className="badge badge-compliant"><span className="dot" />{copy(locale, `Live · refreshed ${refreshedAt}`, `مباشر · تم التحديث ${refreshedAt}`)}</span>
      {partialSources.length > 0 && <span className="badge badge-warning"><span className="dot" />{copy(locale, `${partialSources.length} source partial: ${partialSources.join(", ")}`, `${partialSources.length} مصدر جزئي: ${partialSources.join("، ")}`)}</span>}
    </div>
  </div>;
}

/* ── Strategic view ─────────────────────────────────────────────── */
export function StrategicView({ locale, metrics, group, params, refreshedAt }: {
  locale: Locale; metrics: DashboardMetrics; group: "region" | "city" | "sector" | "authority"; params: Record<string, string>; refreshedAt: string;
}) {
  const s = metrics.strategic;
  const unknown = copy(locale, "Not recorded", "غير مسجل");
  const fresh = copy(locale, `Live · refreshed ${refreshedAt} · RLS scoped`, `مباشر · تم التحديث ${refreshedAt} · مقيّد حسب الصلاحيات`);
  const na = copy(locale, "—", "—");
  const notStored = copy(locale, "Not stored in governed schema", "غير مخزّن في المخطط المعتمد");

  const method = (m: Partial<Methodology> & { id: string; label: string }): Methodology => ({
    q: "", value: "", num: "", den: "", excl: "", time: "", formulaV: notStored, policyV: notStored, fresh, drill: "", ...m,
  });

  const kpis: Kpi[] = [
    {
      key: "compliance",
      label: copy(locale, "National compliance rate — approved", "معدل الامتثال الوطني — المعتمدة"),
      value: s.complianceRate == null ? na : `${s.complianceRate}`,
      unit: s.complianceRate == null ? undefined : "%",
      deltaText: copy(locale, `${s.approvedCompliant} of ${s.approvedAnsweredForCompliance} eligible answers · approved inspections only`, `${s.approvedCompliant} من ${s.approvedAnsweredForCompliance} إجابة مؤهلة · التفتيشات المعتمدة فقط`),
      method: method({
        id: "STR-COMP-RATE", label: copy(locale, "National compliance rate — approved", "معدل الامتثال الوطني — المعتمدة"),
        q: copy(locale, "How compliant are answered inspection items in approved inspections?", "ما مدى امتثال بنود التفتيش المجابة في التفتيشات المعتمدة؟"),
        value: s.complianceRate == null ? na : `${s.complianceRate}%`,
        num: copy(locale, `Compliant answers in approved inspections (${s.approvedCompliant})`, `الإجابات الممتثلة في التفتيشات المعتمدة (${s.approvedCompliant})`),
        den: copy(locale, `Compliant + non-compliant in approved inspections (${s.approvedAnsweredForCompliance})`, `الممتثل + غير الممتثل في التفتيشات المعتمدة (${s.approvedAnsweredForCompliance})`),
        excl: copy(locale, "N/A, unknown and incomplete answers; not-yet-approved work is reported separately as pending", "غير المنطبق وغير المعروف والإجابات غير المكتملة؛ الأعمال غير المعتمدة بعد تُعرض منفصلة كمعلّقة"),
        time: copy(locale, `${params.from} → ${params.to} · Asia/Riyadh`, `${params.from} → ${params.to} · آسيا/الرياض`),
        drill: copy(locale, "Compliance explorer", "مستكشف الامتثال"), drillHref: "/reports",
      }),
    },
    {
      key: "pending-compliance",
      label: copy(locale, "Pending compliance rate — not yet approved", "معدل الامتثال المعلّق — غير معتمدة بعد"),
      value: s.pendingComplianceRate == null ? na : `${s.pendingComplianceRate}`,
      unit: s.pendingComplianceRate == null ? undefined : "%",
      deltaText: copy(locale, `${s.pendingCompliant} of ${s.pendingAnsweredForCompliance} eligible answers · submitted / under review / returned`, `${s.pendingCompliant} من ${s.pendingAnsweredForCompliance} إجابة مؤهلة · مقدمة / قيد المراجعة / مُعادة`),
      method: method({
        id: "STR-COMP-PENDING", label: copy(locale, "Pending compliance rate", "معدل الامتثال المعلّق"),
        q: copy(locale, "How compliant is submitted work that is not yet approved?", "ما مدى امتثال الأعمال المقدمة التي لم تُعتمد بعد؟"),
        value: s.pendingComplianceRate == null ? na : `${s.pendingComplianceRate}%`,
        num: copy(locale, `Compliant answers in not-yet-approved inspections (${s.pendingCompliant})`, `الإجابات الممتثلة في تفتيشات غير معتمدة بعد (${s.pendingCompliant})`),
        den: copy(locale, `Compliant + non-compliant in not-yet-approved inspections (${s.pendingAnsweredForCompliance})`, `الممتثل + غير الممتثل في تفتيشات غير معتمدة بعد (${s.pendingAnsweredForCompliance})`),
        excl: copy(locale, "Pending ≠ official — only the approved rate above is the authoritative figure (same basis as Factory 360)", "المعلّق ≠ الرسمي — المعدل المعتمد أعلاه فقط هو الرقم المعتمد (نفس أساس المصنع 360)"),
        time: copy(locale, `${params.from} → ${params.to} · Asia/Riyadh`, `${params.from} → ${params.to} · آسيا/الرياض`),
        drill: copy(locale, "Review & approval queue", "قائمة المراجعة والاعتماد"), drillHref: "/reviews",
      }),
    },
    {
      key: "approval",
      label: copy(locale, "Inspection approval rate", "معدل اعتماد التفتيش"),
      value: s.approvalRate == null ? na : `${s.approvalRate}`,
      unit: s.approvalRate == null ? undefined : "%",
      deltaText: copy(locale, `${s.approvedScoped} of ${s.completedInspections} submitted`, `${s.approvedScoped} من ${s.completedInspections} مقدمة`),
      method: method({
        id: "STR-APPROVAL-RATE", label: copy(locale, "Inspection approval rate", "معدل اعتماد التفتيش"),
        q: copy(locale, "Are submitted inspections being approved?", "هل يتم اعتماد التفتيشات المقدمة؟"),
        value: s.approvalRate == null ? na : `${s.approvalRate}%`,
        num: copy(locale, `Approved scoped inspections (${s.approvedScoped})`, `التفتيشات المعتمدة ضمن النطاق (${s.approvedScoped})`),
        den: copy(locale, `Submitted scoped inspections (${s.completedInspections})`, `التفتيشات المقدمة ضمن النطاق (${s.completedInspections})`),
        excl: copy(locale, "Approval ≠ compliance — distinct governed concepts", "الاعتماد ≠ الامتثال — مفهومان معتمدان منفصلان"),
        time: copy(locale, `${params.from} → ${params.to} · Asia/Riyadh`, `${params.from} → ${params.to} · آسيا/الرياض`),
        drill: copy(locale, "Review & approval queue", "قائمة المراجعة والاعتماد"), drillHref: "/reviews",
      }),
    },
    {
      key: "violations",
      label: copy(locale, "Linked violations", "المخالفات المرتبطة"),
      value: `${s.scopedViolations.length}`,
      valueTone: s.scopedViolations.length > 0 ? "critical" : undefined,
      deltaChip: s.violationDelta !== 0 ? { text: `${s.violationDelta > 0 ? "▲" : "▼"} ${Math.abs(s.violationDelta)}`, dir: s.violationDelta > 0 ? "down" : "up" } : undefined,
      deltaText: copy(locale, "vs previous equal window", "مقارنة بالفترة السابقة المماثلة"),
      method: method({
        id: "STR-VIOL-MOVEMENT", label: copy(locale, "Linked violation movement", "حركة المخالفات المرتبطة"),
        q: copy(locale, "How did recorded violations move against the previous window?", "كيف تغيرت المخالفات المسجلة مقارنة بالفترة السابقة؟"),
        value: copy(locale, `${s.scopedViolations.length} current vs ${s.previousViolations} previous`, `${s.scopedViolations.length} حالياً مقابل ${s.previousViolations} سابقاً`),
        num: copy(locale, "Violations linked to submitted inspections in window", "المخالفات المرتبطة بالتفتيشات المقدمة في الفترة"),
        den: copy(locale, "n/a (count and window-over-window delta)", "غير منطبق (عدد وفرق فترة مقابل فترة)"),
        excl: copy(locale, "Uses inspection submission time — violation issuance time is not stored", "يستخدم وقت تقديم التفتيش — وقت إصدار المخالفة غير مخزّن"),
        time: copy(locale, `${params.from} → ${params.to} · Asia/Riyadh`, `${params.from} → ${params.to} · آسيا/الرياض`),
        drill: copy(locale, "Enforcement register", "سجل الإنفاذ"), drillHref: "/enforcement",
      }),
    },
    {
      key: "coverage",
      label: copy(locale, "Inspection coverage", "تغطية التفتيش"),
      badge: { text: copy(locale, "Not configured", "غير مهيأ"), tone: "badge-pending" },
      deltaText: copy(locale, "Needs cycle policy", "يتطلب سياسة الدورة"),
      method: method({
        id: "STR-COVERAGE", label: copy(locale, "Inspection coverage", "تغطية التفتيش"),
        q: copy(locale, "Are we meeting the national inspection target?", "هل نحقق مستهدف التفتيش الوطني؟"),
        value: copy(locale, "Not configured", "غير مهيأ"),
        num: copy(locale, "Qualifying completed inspections", "التفتيشات المكتملة المؤهلة"),
        den: copy(locale, "Eligible factories due in cycle", "المصانع المؤهلة المستحقة في الدورة"),
        excl: copy(locale, "Requires published eligibility and cycle policy — no value is invented", "يتطلب أهلية ودورة منشورتين — لا يتم اختلاق أي قيمة"),
        time: copy(locale, "Per published cycle", "حسب الدورة المنشورة"),
        policyV: copy(locale, "no effective cycle policy", "لا توجد سياسة دورة فعّالة"),
        fresh: copy(locale, "Unavailable until policy is published", "غير متاح حتى نشر السياسة"),
        drill: copy(locale, "Admin → inspection-cycle policy", "الإدارة ← سياسة دورة التفتيش"), drillHref: "/admin",
      }),
    },
  ];

  // Ranked intervention — real region compliance, lowest (worst) first.
  const regionRows = complianceBreakdown(s.scopedResponses as ResponseRow[], "region", unknown)
    .slice().sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101));
  const tone = (rate: number | null) => rate == null ? "info" : rate < 75 ? "critical" : rate < 85 ? "warning" : "compliant";

  const dimensions = [
    ["region", copy(locale, "Region", "المنطقة")],
    ["city", copy(locale, "City", "المدينة")],
    ["sector", copy(locale, "Sector", "القطاع")],
    ["authority", copy(locale, "Authority", "الجهة")],
  ] as const;
  const breakdown = complianceBreakdown(s.scopedResponses as ResponseRow[], group, unknown);
  const submittedRemainder = Math.max(0, s.completedInspections - s.approvedScoped);
  const movementDir = s.violationDelta > 0 ? copy(locale, "increase", "زيادة") : s.violationDelta < 0 ? copy(locale, "decrease", "انخفاض") : copy(locale, "no change", "دون تغيير");

  return <div id="dashboard-strategic" role="tabpanel" aria-labelledby="dashboard-tab-strategic" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
    {/* status rail */}
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      {s.criticalFactories.length > 0 && <span className="exc-chip exc-critical"><span className="exc-mark" />{copy(locale, `${s.criticalFactories.length} factories need intervention`, `${s.criticalFactories.length} مصنعاً يتطلب تدخلاً`)}</span>}
      {s.violationDelta > 0 && <span className="exc-chip exc-warning"><span className="exc-mark" />{copy(locale, `Linked violations +${s.violationDelta} vs previous window`, `المخالفات المرتبطة +${s.violationDelta} مقارنة بالفترة السابقة`)}</span>}
      <span className="exc-chip exc-pending"><span className="exc-mark" />{copy(locale, "Coverage & uninspected: policy not configured", "التغطية وغير المفتشة: السياسة غير مهيأة")}</span>
    </div>

    <KpiGrid kpis={kpis} locale={locale} methodologyLabel={copy(locale, "Methodology", "المنهجية")} />

    {/* decision canvas + ranked intervention */}
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", alignItems: "stretch" }}>
      <div className="map-panel" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: "520px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderBlockEnd: "1px solid var(--border-subtle)" }}>
          <span style={{ fontWeight: 600, fontSize: "13px" }}>{copy(locale, "National decision canvas", "لوحة القرار الوطنية")}</span>
          <span className="grow" />
          <span className="id-code" style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>Mapbox GL · GeoMap</span>
        </div>
        <div style={{ position: "relative", flex: 1, background: "var(--surface-sunken)" }}>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>{copy(locale, "Live basemap (Mapbox GL / shared GeoMap)", "خريطة أساس مباشرة (Mapbox GL / GeoMap مشتركة)")}</div>
              <div className="t-caption" style={{ maxWidth: "46ch", marginBlockStart: "6px" }}>{copy(locale, "Region choropleth, factory clusters and provenance-tagged pins. Selection cross-filters the metrics and ranked list. No synthetic roads or routes are drawn.", "تلوين المناطق وتجمعات المصانع ودبابيس موسومة بالمصدر. يقوم التحديد بالتصفية المتقاطعة للمؤشرات والقائمة المرتبة. لا تُرسم طرق أو مسارات مصطنعة.")}</div>
            </div>
          </div>
          <div className="map-panel" style={{ position: "absolute", top: "12px", insetInlineStart: "12px", padding: "10px 12px", width: "180px" }}>
            <div className="t-label" style={{ marginBlockEnd: "6px" }}>{copy(locale, "Legend · Compliance", "المفتاح · الامتثال")}</div>
            <div className="stack" style={{ gap: "5px" }}>
              <div className="map-legend-row"><span className="swatch" style={{ background: "var(--status-compliant)" }} />{copy(locale, "≥ 85% healthy", "≥ 85% سليم")}</div>
              <div className="map-legend-row"><span className="swatch" style={{ background: "var(--status-warning)" }} />{copy(locale, "75–84% attention", "75–84% انتباه")}</div>
              <div className="map-legend-row"><span className="swatch" style={{ background: "var(--status-critical)" }} />{copy(locale, "< 75% critical", "< 75% حرج")}</div>
            </div>
            <div className="t-caption" style={{ marginBlockStart: "8px" }}>{copy(locale, "Provenance: official · planner · observed", "المصدر: رسمي · مخطِّط · مرصود")}</div>
          </div>
          <div style={{ position: "absolute", bottom: "10px", insetInlineEnd: "12px" }}>
            <span className="id-code" style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--map-panel)", padding: "3px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>© Mapbox © OpenStreetMap</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="panel-header"><div className="panel-title">{copy(locale, "Ranked intervention", "التدخل المرتّب")}</div><span className="id-code" style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{copy(locale, "by region compliance", "حسب امتثال المنطقة")}</span></div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {regionRows.length ? regionRows.map(row => <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 16px", borderBlockEnd: "1px solid var(--border-subtle)" }}>
            <span className={`exc exc-${tone(row.rate)}`}><span className="exc-mark" /></span>
            <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontWeight: 600, fontSize: "13px" }}>{row.label}</span><span className="t-caption">{copy(locale, `${row.compliant}/${row.total} compliant`, `${row.compliant}/${row.total} ممتثل`)}</span></span>
            <span className="id-code" style={{ fontSize: "12px", color: `var(--status-${tone(row.rate)})` }}>{row.rate == null ? "—" : `${row.rate}%`}</span>
          </div>) : <div className="empty" style={{ padding: "24px" }} role="status"><p>{copy(locale, "No eligible answers in this scope.", "لا توجد إجابات مؤهلة ضمن هذا النطاق.")}</p></div>}
        </div>
      </div>
    </div>

    {/* analytic panels — real data only */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "16px" }}>
      <Panel title={copy(locale, "Compliance explorer", "مستكشف الامتثال")} meta={copy(locale, "one formula · four lenses", "معادلة واحدة · أربع زوايا")}>
        <div className="t-caption" style={{ marginBlockStart: "2px" }}>{copy(locale, "Compliant ÷ eligible answered · same denominator", "الممتثل ÷ الإجابات المؤهلة · المقام نفسه")}</div>
        <nav className="seg" aria-label={copy(locale, "Group compliance by", "تجميع الامتثال حسب")} style={{ marginBlockStart: "10px", flexWrap: "wrap" }}>
          {dimensions.map(([id, label]) => <a key={id} className="seg-opt" aria-pressed={group === id} aria-current={group === id} href={paramsHref(params, { group: id })}>{label}</a>)}
        </nav>
        <Bars rows={breakdown.map(row => ({ label: `${row.label} · ${row.compliant}/${row.total}`, value: row.rate ?? 0 }))} empty={copy(locale, "No eligible answers in this scope.", "لا توجد إجابات مؤهلة ضمن هذا النطاق.")} suffix="%" />
      </Panel>

      <Panel title={copy(locale, "Violations by regulation", "المخالفات حسب اللائحة")} meta={copy(locale, `${s.scopedViolations.length} linked`, `${s.scopedViolations.length} مرتبطة`)}>
        <div className="t-caption" style={{ marginBlockStart: "2px" }}>{copy(locale, "Count of violations linked to submitted inspections", "عدد المخالفات المرتبطة بالتفتيشات المقدمة")}</div>
        <Bars rows={s.violationByRegulation.map(row => ({ label: row.label, value: row.value, tone: "critical" }))} empty={copy(locale, "No linked violations in this scope.", "لا توجد مخالفات مرتبطة ضمن هذا النطاق.")} />
      </Panel>

      <Panel title={copy(locale, "Approval outcomes", "نتائج الاعتماد")} meta={copy(locale, `${s.completedInspections} submitted`, `${s.completedInspections} مقدمة`)}>
        <div className="t-caption" style={{ marginBlockStart: "2px" }}>{copy(locale, "Approved vs not-yet-approved of submitted inspections", "المعتمدة مقابل غير المعتمدة بعد من التفتيشات المقدمة")}</div>
        <div style={{ display: "flex", height: "14px", borderRadius: "7px", overflow: "hidden", gap: "2px", marginBlock: "16px 12px" }}>
          <div style={{ width: `${s.completedInspections ? (s.approvedScoped / s.completedInspections) * 100 : 0}%`, background: "var(--status-compliant)" }} />
          <div style={{ width: `${s.completedInspections ? (submittedRemainder / s.completedInspections) * 100 : 100}%`, background: "var(--status-warning)" }} />
        </div>
        <div style={{ display: "flex", gap: "14px", fontSize: "11.5px", color: "var(--text-secondary)" }}>
          <span>{copy(locale, "Approved", "معتمدة")} <b>{s.approvedScoped}</b></span>
          <span>{copy(locale, "Not yet approved", "غير معتمدة بعد")} <b>{submittedRemainder}</b></span>
        </div>
      </Panel>

      <Panel title={copy(locale, "Violation movement", "حركة المخالفات")} meta={<span style={{ color: s.violationDelta > 0 ? "var(--status-critical-text)" : "var(--text-muted)" }}>{`${s.violationDelta > 0 ? "+" : ""}${s.violationDelta}`}</span>}>
        <div className="t-caption" style={{ marginBlockStart: "2px" }}>{copy(locale, "Current window versus previous equal window", "الفترة الحالية مقابل الفترة السابقة المماثلة")}</div>
        <div style={{ display: "flex", gap: "24px", marginBlockStart: "16px" }}>
          <div><div className="t-metric" style={{ fontSize: "26px" }}>{s.scopedViolations.length}</div><div className="t-caption">{copy(locale, "Current", "الحالية")}</div></div>
          <div><div className="t-metric" style={{ fontSize: "26px", color: "var(--text-muted)" }}>{s.previousViolations}</div><div className="t-caption">{copy(locale, "Previous", "السابقة")}</div></div>
          <div style={{ alignSelf: "center" }}><span className={`delta${s.violationDelta !== 0 ? (s.violationDelta > 0 ? " down" : " up") : ""}`}>{movementDir}</span></div>
        </div>
      </Panel>
    </div>

    {/* not-configured pair — governed empty states */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      <div className="panel empty" style={{ padding: "24px" }}>
        <div className="empty-title">{copy(locale, "Coverage — not configured", "التغطية — غير مهيأة")}</div>
        <p>{copy(locale, "Inspection-cycle policy (eligible factories, frequency, due rule, qualifying completion) must be published in Admin before coverage can be calculated. No value is invented.", "يجب نشر سياسة دورة التفتيش (المصانع المؤهلة، التكرار، قاعدة الاستحقاق، الإنجاز المؤهِّل) في الإدارة قبل احتساب التغطية. لا يتم اختلاق أي قيمة.")}</p>
        <a className="btn btn-secondary btn-sm" href="/admin">{copy(locale, "Open cycle policy →", "فتح سياسة الدورة ←")}</a>
      </div>
      <div className="panel empty" style={{ padding: "24px" }}>
        <div className="empty-title">{copy(locale, "Factories pending annual inspection — not configured", "المصانع بانتظار التفتيش السنوي — غير مهيأة")}</div>
        <p>{copy(locale, "Requires published factory-eligibility rules and the inspection-year boundary. The schema stores neither, so no substitute count is shown.", "يتطلب قواعد أهلية منشورة وحدود سنة التفتيش. لا يخزّن المخطط أياً منهما، لذلك لا يُعرض عدد بديل.")}</p>
        <a className="btn btn-secondary btn-sm" href="/admin">{copy(locale, "Open eligibility policy →", "فتح سياسة الأهلية ←")}</a>
      </div>
    </div>

    {/* advisory summary */}
    <div className="panel" style={{ borderInlineStart: "3px solid var(--action-primary)", padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px", borderBlockEnd: "1px solid var(--border-subtle)" }}>
        <span style={{ fontWeight: 600, fontSize: "13.5px" }}>{copy(locale, "Strategic summary", "الملخص الاستراتيجي")}</span>
        <span className="badge badge-info" style={{ marginInlineStart: "auto" }}>{copy(locale, "Advisory only · traceable", "استرشادي فقط · قابل للتتبع")}</span>
      </div>
      <div>
        <SummaryRow tone="info" href="#compliance" verify={copy(locale, "Verify records →", "تحقق من السجلات ←")}
          text={copy(locale, `National compliance rate (approved inspections only) is ${s.complianceRate == null ? "not computable" : `${s.complianceRate}%`} across ${s.approvedAnsweredForCompliance} eligible answers; not-yet-approved work stands at ${s.pendingComplianceRate == null ? "not computable" : `${s.pendingComplianceRate}%`} across ${s.pendingAnsweredForCompliance} answers (pending).`, `معدل الامتثال الوطني (التفتيشات المعتمدة فقط) ${s.complianceRate == null ? "غير قابل للحساب" : `${s.complianceRate}%`} عبر ${s.approvedAnsweredForCompliance} إجابة مؤهلة؛ والأعمال غير المعتمدة بعد عند ${s.pendingComplianceRate == null ? "غير قابل للحساب" : `${s.pendingComplianceRate}%`} عبر ${s.pendingAnsweredForCompliance} إجابة (معلّقة).`)} />
        <SummaryRow tone={s.violationDelta > 0 ? "warning" : "compliant"} href="#violations" verify={copy(locale, "Verify records →", "تحقق من السجلات ←")}
          text={copy(locale, `Linked violations show a ${movementDir} (${s.scopedViolations.length} vs ${s.previousViolations}).`, `تُظهر المخالفات المرتبطة ${movementDir} (${s.scopedViolations.length} مقابل ${s.previousViolations}).`)} />
        <SummaryRow tone="compliant" href="#decisions" last verify={copy(locale, "Verify records →", "تحقق من السجلات ←")}
          text={copy(locale, `Approval rate is ${s.approvalRate == null ? "not computable" : `${s.approvalRate}%`} (${s.approvedScoped} of ${s.completedInspections} submitted).`, `معدل الاعتماد ${s.approvalRate == null ? "غير قابل للحساب" : `${s.approvalRate}%`} (${s.approvedScoped} من ${s.completedInspections} مقدمة).`)} />
      </div>
    </div>
  </div>;
}

function SummaryRow({ tone, text, href, verify, last }: { tone: string; text: string; href: string; verify: string; last?: boolean }) {
  return <div style={{ display: "flex", gap: "12px", padding: "11px 18px", alignItems: "baseline", ...(last ? {} : { borderBlockEnd: "1px solid var(--border-subtle)" }) }}>
    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: `var(--status-${tone})`, flex: "none", position: "relative", top: "5px" }} />
    <span style={{ flex: 1, fontSize: "13px", lineHeight: 1.55, color: "var(--text-secondary)" }}>{text}</span>
    <a href={href} style={{ fontSize: "11.5px", fontWeight: 600, whiteSpace: "nowrap" }}>{verify}</a>
  </div>;
}

/* ── Operational view ───────────────────────────────────────────── */
export function OperationalView({ locale, metrics, refreshedAt }: { locale: Locale; metrics: DashboardMetrics; refreshedAt: string }) {
  const o = metrics.operational;
  const fresh = copy(locale, `Live · refreshed ${refreshedAt} · RLS scoped`, `مباشر · تم التحديث ${refreshedAt} · مقيّد حسب الصلاحيات`);
  const method = (m: Partial<Methodology> & { id: string; label: string }): Methodology => ({
    q: "", value: "", num: "", den: "", excl: "", time: "", formulaV: "—", policyV: "—", fresh, drill: "", ...m,
  });

  const kpis: Kpi[] = [
    { key: "active", label: copy(locale, "Active field inspections", "التفتيشات الميدانية النشطة"), value: `${o.activeField}`,
      deltaText: copy(locale, "status = in_progress", "الحالة = in_progress"),
      method: method({ id: "OPS-ACTIVE-FIELD", label: copy(locale, "Active field inspections", "التفتيشات الميدانية النشطة"), q: copy(locale, "What inspections are active in the field?", "ما التفتيشات النشطة ميدانياً؟"), value: `${o.activeField}`, num: copy(locale, "Inspections with canonical status in_progress", "التفتيشات بحالة معتمدة in_progress"), den: copy(locale, "n/a (count)", "غير منطبق (عدد)"), excl: copy(locale, "Not inferred from workflow status", "غير مستنتج من حالة سير العمل"), drill: copy(locale, "Operations Center", "مركز العمليات"), drillHref: "/operations" }) },
    { key: "overdue", label: copy(locale, "Overdue planned visits", "الزيارات المخططة المتأخرة"), value: `${o.overdueRows.length}`, valueTone: o.overdueRows.length ? "critical" : undefined,
      deltaChip: o.slaBreachRate != null ? { text: `${o.slaBreachRate}%`, dir: "down" } : undefined,
      deltaText: copy(locale, `of ${o.slaEligible} eligible`, `من ${o.slaEligible} مؤهلة`),
      method: method({ id: "OPS-OVERDUE", label: copy(locale, "Overdue planned visits", "الزيارات المخططة المتأخرة"), q: copy(locale, "Which visit windows have lapsed?", "ما نوافذ الزيارات التي انقضت؟"), value: `${o.overdueRows.length}`, num: copy(locale, "Published non-submitted visits with window end before now", "زيارات منشورة غير مقدمة انتهت نافذتها قبل الآن"), den: copy(locale, `Eligible published visits (${o.slaEligible})`, `الزيارات المنشورة المؤهلة (${o.slaEligible})`), excl: copy(locale, "Submitted or cancelled visits", "الزيارات المقدمة أو الملغاة"), drill: copy(locale, "Operations Center", "مركز العمليات"), drillHref: "/operations" }) },
    { key: "awaiting", label: copy(locale, "Reports awaiting approval", "التقارير بانتظار الاعتماد"), value: `${o.awaitingRows.length}`,
      deltaText: copy(locale, "latest review pending / under review", "أحدث مراجعة معلّقة / قيد المراجعة"),
      method: method({ id: "OPS-AWAITING", label: copy(locale, "Reports awaiting approval", "التقارير بانتظار الاعتماد"), q: copy(locale, "Which reports require review?", "ما التقارير التي تتطلب المراجعة؟"), value: `${o.awaitingRows.length}`, num: copy(locale, "Latest review = pending_review or under_review", "أحدث مراجعة = pending_review أو under_review"), den: copy(locale, "n/a (count, latest state per inspection)", "غير منطبق (عدد، أحدث حالة لكل تفتيش)"), excl: copy(locale, "Superseded historical reviews", "المراجعات التاريخية المتجاوَزة"), drill: copy(locale, "Review queue", "قائمة المراجعة"), drillHref: "/reviews" }) },
    { key: "gps", label: copy(locale, "GPS override events", "أحداث تجاوز GPS"), value: `${o.overrides.length}`, valueTone: o.overrides.length ? "warning" : undefined,
      deltaText: copy(locale, "immutable geo events", "أحداث موقع غير قابلة للتغيير"),
      method: method({ id: "OPS-GPS-OVERRIDE", label: copy(locale, "GPS override events", "أحداث تجاوز GPS"), q: copy(locale, "Which GPS overrides were recorded?", "ما تجاوزات GPS المسجلة؟"), value: `${o.overrides.length}`, num: copy(locale, "Immutable geo events with kind/result = override", "أحداث موقع غير قابلة للتغيير بنوع/نتيجة override"), den: copy(locale, "n/a (count)", "غير منطبق (عدد)"), excl: copy(locale, "Events outside the selected window", "الأحداث خارج الفترة المحددة"), drill: copy(locale, "Operations Center", "مركز العمليات"), drillHref: "/operations" }) },
  ];

  const nudges: { tone: string; text: string; action: string; href: string }[] = [];
  if (o.overdueRows.length) nudges.push({ tone: "critical", text: copy(locale, `${o.overdueRows.length} published visits are past their window.`, `${o.overdueRows.length} زيارات منشورة تجاوزت نافذتها.`), action: copy(locale, "Open", "فتح"), href: "/operations" });
  if (o.highPriorityRows.length) nudges.push({ tone: "warning", text: copy(locale, `${o.highPriorityRows.length} high-priority visits pending execution.`, `${o.highPriorityRows.length} زيارات عالية الأولوية بانتظار التنفيذ.`), action: copy(locale, "Assign", "إسناد"), href: "/visits" });
  if (o.awaitingRows.length) nudges.push({ tone: "warning", text: copy(locale, `${o.awaitingRows.length} reports awaiting an L2 decision.`, `${o.awaitingRows.length} تقارير بانتظار قرار المستوى الثاني.`), action: copy(locale, "Review", "مراجعة"), href: "/reviews" });

  const pipeline = [
    { label: copy(locale, "Active", "نشطة"), value: o.activeField, tone: "info" },
    { label: copy(locale, "Planned", "مخططة"), value: o.planned, tone: "compliant" },
    { label: copy(locale, "Awaiting", "بانتظار"), value: o.awaitingRows.length, tone: "warning" },
    { label: copy(locale, "Returned", "معادة"), value: o.returnedRows.length, tone: "critical" },
    { label: copy(locale, "Cancelled", "ملغاة"), value: o.cancelled, tone: "disabled" },
  ];
  const workloadMax = Math.max(1, ...o.workload.map(row => row.active));

  return <div id="dashboard-operational" role="tabpanel" aria-labelledby="dashboard-tab-operational" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      {o.overdueRows.length > 0 && <span className="exc-chip exc-critical"><span className="exc-mark" />{copy(locale, `${o.overdueRows.length} overdue visits`, `${o.overdueRows.length} زيارات متأخرة`)}</span>}
      {o.highPriorityRows.length > 0 && <span className="exc-chip exc-major"><span className="exc-mark" />{copy(locale, `${o.highPriorityRows.length} high-priority pending`, `${o.highPriorityRows.length} عالية الأولوية معلّقة`)}</span>}
      {o.overrides.length > 0 && <span className="exc-chip exc-warning"><span className="exc-mark" />{copy(locale, `${o.overrides.length} GPS overrides`, `${o.overrides.length} تجاوزات GPS`)}</span>}
      {o.awaitingRows.length > 0 && <span className="exc-chip exc-pending"><span className="exc-mark" />{copy(locale, `${o.awaitingRows.length} pending approvals`, `${o.awaitingRows.length} اعتمادات معلّقة`)}</span>}
    </div>

    <KpiGrid kpis={kpis} locale={locale} methodologyLabel={copy(locale, "Methodology", "المنهجية")} />

    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
      <div className="map-panel" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: "460px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderBlockEnd: "1px solid var(--border-subtle)" }}>
          <span style={{ fontWeight: 600, fontSize: "13px" }}>{copy(locale, "Live operations", "العمليات المباشرة")}</span>
          <span className="grow" />
          <span className="id-code" style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>{copy(locale, "Mapbox GL · live & projected distinct", "Mapbox GL · المباشر والمتوقع منفصلان")}</span>
        </div>
        <div style={{ position: "relative", flex: 1, background: "var(--surface-sunken)", display: "grid", placeItems: "center", textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>{copy(locale, "Live inspector & visit layer (Mapbox GL / GeoMap)", "طبقة المفتشين والزيارات المباشرة (Mapbox GL / GeoMap)")}</div>
            <div className="t-caption" style={{ maxWidth: "44ch", marginBlockStart: "6px" }}>{copy(locale, "Actual immutable journey path only; a planned route appears only when a routing provider returns geometry. Live and projected positions are labelled distinctly.", "مسار الرحلة الفعلي غير القابل للتغيير فقط؛ يظهر المسار المخطط فقط عندما يُرجع مزوّد التوجيه هندسة. تُوسم المواقع المباشرة والمتوقعة بوضوح.")}</div>
          </div>
        </div>
      </div>
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div className="panel-header"><div className="panel-title">{copy(locale, "Live activity", "النشاط المباشر")}</div></div>
        {o.timeline.length ? <ul className="timeline" style={{ padding: "16px 18px" }}>
          {o.timeline.slice(0, 8).map(row => <li key={row.id}>
            <span className="tl-dot" />
            <div className="tl-title">{row.action}</div>
            <div className="tl-meta"><span className="id-code">{row.object_type} · {row.object_id?.slice(0, 8)}</span> · {new Date(row.occurred_at).toISOString().slice(0, 16).replace("T", " ")}</div>
          </li>)}
        </ul> : <div className="empty" style={{ padding: "24px" }} role="status"><p>{copy(locale, "No scoped audit events in the selected window.", "لا توجد أحداث تدقيق ضمن النطاق والفترة المحددين.")}</p></div>}
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "16px" }}>
      <Panel title={copy(locale, "Visit pipeline", "مسار الزيارات")}>
        <div className="t-caption" style={{ marginBlockStart: "2px" }}>{copy(locale, "Active / Planned / Awaiting / Returned / Cancelled — in scope", "نشطة / مخططة / بانتظار / معادة / ملغاة — ضمن النطاق")}</div>
        <div style={{ display: "flex", gap: "8px", marginBlockStart: "14px" }}>
          {pipeline.map(cell => <div key={cell.label} style={{ flex: 1, textAlign: "center", borderTop: `3px solid var(--status-${cell.tone})`, paddingBlockStart: "8px" }}>
            <div className="t-metric" style={{ fontSize: "22px" }}>{cell.value}</div><div className="t-caption">{cell.label}</div>
          </div>)}
        </div>
      </Panel>

      <Panel title={copy(locale, "Schedule load by inspector", "حمل الجدول حسب المفتش")}>
        <div className="t-caption" style={{ marginBlockStart: "2px" }}>{copy(locale, "Active assigned visits · relative, not absolute capacity", "الزيارات النشطة المسندة · نسبي وليس سعة مطلقة")}</div>
        {o.workload.length ? <div style={{ marginBlockStart: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {o.workload.slice(0, 6).map(row => <div className="row" style={{ gap: "10px" }} key={row.id}>
            <span style={{ width: "110px", fontSize: "12px", color: "var(--text-secondary)" }} title={row.name}>{row.name}</span>
            <div className="progress grow"><i style={{ inlineSize: `${(row.active / workloadMax) * 100}%`, ...(row.active >= workloadMax && workloadMax > 1 ? { background: "var(--status-warning)" } : {}) }} /></div>
            <span className="id-code" style={{ fontSize: "11px", color: row.active ? "var(--text-primary)" : "var(--text-muted)" }}>{row.active}</span>
          </div>)}
        </div> : <div className="empty" style={{ padding: "18px 0" }} role="status"><p>{copy(locale, "No assignments visible in this scope.", "لا توجد إسنادات ظاهرة ضمن هذا النطاق.")}</p></div>}
      </Panel>

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div className="panel-header" style={{ borderInlineStart: "3px solid var(--action-primary)" }}><div className="panel-title" style={{ fontSize: "13.5px" }}>{copy(locale, "Operational nudges", "التنبيهات التشغيلية")}</div><span className="badge badge-info">{copy(locale, "record filters, not AI", "تصفية سجلات وليست ذكاءً اصطناعياً")}</span></div>
        {nudges.length ? <div>
          {nudges.map((nudge, index) => <div key={index} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "11px 16px", ...(index < nudges.length - 1 ? { borderBlockEnd: "1px solid var(--border-subtle)" } : {}) }}>
            <span className="dot" style={{ width: "8px", height: "8px", borderRadius: "50%", background: `var(--status-${nudge.tone})` }} />
            <span style={{ flex: 1, fontSize: "12.5px" }}>{nudge.text}</span>
            <a className="btn btn-primary btn-sm" href={nudge.href}>{nudge.action}</a>
          </div>)}
        </div> : <div className="empty" style={{ padding: "24px" }} role="status"><p>{copy(locale, "No governed nudge condition is active in this scope.", "لا يوجد شرط تنبيه معتمد نشط ضمن هذا النطاق.")}</p></div>}
      </div>
    </div>

    <div className="t-caption" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <span aria-hidden="true">≠AI</span>
      {copy(locale, `Average execution duration in scope: ${formatDuration(o.avgDurationMs, locale)}. All panels are deterministic record filters, not AI recommendations.`, `متوسط مدة التنفيذ ضمن النطاق: ${formatDuration(o.avgDurationMs, locale)}. جميع اللوحات تصفية سجلات حتمية وليست توصيات ذكاء اصطناعي.`)}
    </div>
  </div>;
}

/* ── Global search results (unchanged surface) ──────────────────── */
export function SearchResults({ locale, query, factories, visits, inspections }: {
  locale: Locale; query: string; factories: FactoryRef[]; visits: VisitRow[]; inspections: { id: string; visits: { factories: FactoryRef | null } | null }[];
}) {
  const needle = query.trim().toLocaleLowerCase(locale);
  if (!needle) return null;
  const has = (...values: (string | null | undefined)[]) => values.some(value => value?.toLocaleLowerCase(locale).includes(needle));
  const f = factories.filter(row => has(row.name, row.factory_code, row.region, row.city)).slice(0, 6);
  const v = visits.filter(row => has(row.id, row.factories?.name, row.factories?.factory_code)).slice(0, 6);
  const i = inspections.filter(row => has(row.id, row.visits?.factories?.name, row.visits?.factories?.factory_code)).slice(0, 6);
  const total = f.length + v.length + i.length;
  return <section className={styles.results} aria-labelledby="dashboard-search-results">
    <h3 id="dashboard-search-results">{copy(locale, `Search results for “${query}”`, `نتائج البحث عن «${query}»`)}</h3>
    {!total ? <p role="status">{copy(locale, "No RLS-visible factory, visit or inspection matched.", "لا يوجد مصنع أو زيارة أو تفتيش ظاهر حسب الصلاحيات يطابق البحث.")}</p> : <div className={styles.resultGrid}>
      <div className={styles.resultGroup}><h4>{copy(locale, "Factories", "المصانع")}</h4>{f.length ? f.map(row => <a className={styles.result} href={`/factories/${row.id}`} key={row.id}><strong>{row.name}</strong><br /><span className={styles.detail}>{row.factory_code ?? "—"} · {[row.region, row.city].filter(Boolean).join(" · ")}</span></a>) : <span className={styles.detail}>—</span>}</div>
      <div className={styles.resultGroup}><h4>{copy(locale, "Visits", "الزيارات")}</h4>{v.length ? v.map(row => <a className={styles.result} href={`/visits/${row.id}`} key={row.id}><strong>{row.factories?.name ?? row.id.slice(0, 8)}</strong><br /><span className={styles.detail}>{row.id.slice(0, 8)} · {row.operational_state}</span></a>) : <span className={styles.detail}>—</span>}</div>
      <div className={styles.resultGroup}><h4>{copy(locale, "Inspections", "التفتيشات")}</h4>{i.length ? i.map(row => <a className={styles.result} href={`/reports/inspection/${row.id}`} key={row.id}><strong>{row.visits?.factories?.name ?? row.id.slice(0, 8)}</strong><br /><span className={styles.detail}>{row.id.slice(0, 8)}</span></a>) : <span className={styles.detail}>—</span>}</div>
    </div>}
  </section>;
}
