// Presentation adapter for the shared Dashboard KPI contract.
//
// This file NEVER computes a KPI. It only turns an already-computed
// SharedMetric (produced server-side by the shared dashboard-kpi projection)
// into localized, serializable display props for the SAQEEL dashboard. Blocked
// metrics (unavailable / not_configured / decision_required / stale / partial)
// are rendered as honest status chips — never a fabricated number, %, or trend.
//
// Pure and client-safe (no server-only, no I/O, no Date.now).

import type { MetricSourceStatus, SharedMetric } from "@/lib/dashboard-kpi/contract";
import { kpiDefinition } from "@/lib/dashboard-kpi/registry";
import { formatCount, formatPercent } from "@/i18n/numbers";

export type Locale = "en" | "ar";
export type DisplayTone = "critical" | "warning" | "success" | "info" | "neutral";

const t = (locale: Locale, en: string, ar: string) => (locale === "ar" ? ar : en);

/** Metric titles carry EN always and AR when governed; fall back for AR here. */
const AR_TITLES: Record<string, string> = {
  "STR-KPI-001": "معدل الامتثال",
  "STR-KPI-002": "توزيع درجة الصحة",
  "STR-KPI-003": "اتجاه المخالفات",
  "STR-KPI-004": "مزيج قرار المستوى الثاني",
  "STR-KPI-005": "تعرّض التراخيص",
  "STR-KPI-006": "معدل الإلغاء",
  "STR-KPI-007": "تغطية التفتيش",
  "STR-KPI-008": "المصانع غير المفتشة",
  "STR-KPI-009": "بنود قائمة التحقق حسب الجهة",
  "STR-KPI-010": "عدم تطابق المخاطر والاهتمام",
  "STR-KPI-011": "معدل تكرار المخالفات",
  "STR-KPI-012": "الملخص الاستراتيجي",
  "OPS-KPI-001": "مسار الزيارات",
  "OPS-KPI-002": "قريبة الانتهاء",
  "OPS-KPI-003": "التنفيذات النشطة",
  "OPS-KPI-004": "الاعتمادات المعلقة",
  "OPS-KPI-005": "بانتظار النشر",
  "OPS-KPI-006": "حِمل جدول اليوم",
  "OPS-KPI-007": "تجاوزات GPS اليوم",
  "OPS-KPI-008": "النشاط المباشر",
  "OPS-KPI-009": "التنبيهات التشغيلية",
};

export function metricTitle(metric: SharedMetric, locale: Locale): string {
  if (locale === "ar") return metric.label.ar ?? AR_TITLES[metric.metricId] ?? metric.label.en;
  return metric.label.en;
}

/** Is the metric blocked (cannot show a live/real value)? */
export function isBlocked(status: MetricSourceStatus): boolean {
  return status === "unavailable"
    || status === "not_configured"
    || status === "decision_required"
    || status === "stale"
    || status === "offline";
}

/** Honest, localized status label for a non-live source status. */
export function statusLabel(status: MetricSourceStatus, locale: Locale): string {
  switch (status) {
    case "not_configured": return t(locale, "Not configured", "غير مهيأ");
    case "unavailable": return t(locale, "Unavailable", "غير متاح");
    case "decision_required": return t(locale, "Decision required", "قرار مطلوب");
    case "stale": return t(locale, "Stale", "قديم");
    case "partial": return t(locale, "Partial", "جزئي");
    case "cached": return t(locale, "Cached", "مخزّن مؤقتاً");
    case "offline": return t(locale, "Offline", "غير متصل");
    case "live": default: return t(locale, "Live", "مباشر");
  }
}

export function statusTone(status: MetricSourceStatus): DisplayTone {
  switch (status) {
    // Absent data is not a breach. Critical is reserved for real severity so it
    // stays legible when it appears.
    case "unavailable": return "neutral";
    case "decision_required":
    case "not_configured":
    case "stale":
    case "partial": return "warning";
    case "live": return "success";
    default: return "neutral";
  }
}

/** Format a live numeric value by unit. Returns null when there is no value. */
export function formatValue(metric: SharedMetric, locale: Locale): string | null {
  if (metric.value == null) return null;
  switch (metric.unit) {
    case "percent": return formatPercent(metric.value, locale);
    case "ratio": return metric.value.toFixed(2);
    case "count": return formatCount(metric.value, locale);
    default: return String(metric.value);
  }
}

export type MetricDisplay = {
  metricId: string;
  title: string;
  /** "status" => render the status chip; "value" => render text as the value. */
  kind: "value" | "status";
  text: string;
  tone: DisplayTone;
  naMuted?: boolean;
  /** Small secondary line (delta / context), already localized. */
  sub: string | null;
};

/** Build the primary display for a metric strip / status tile. */
export function metricDisplay(metric: SharedMetric, locale: Locale): MetricDisplay {
  const title = metricTitle(metric, locale);
  if (isBlocked(metric.sourceStatus)) {
    const notConfigured = metric.sourceStatus === "not_configured";
    return {
      metricId: metric.metricId,
      title,
      kind: "status",
      text: notConfigured ? t(locale, "N/A", "لا ينطبق") : statusLabel(metric.sourceStatus, locale),
      tone: statusTone(metric.sourceStatus),
      naMuted: notConfigured,
      // The status chip above (statusLabel) already names the precise reason
      // (Not configured / Decision required / Unavailable / Stale / Offline).
      // A blanket "Governance blocked" sub-line restated that under one word
      // that was often wrong — "governance" implies a policy hold, but stale/
      // offline are data-freshness/connectivity states, not policy blocks.
      // Only keep a sub-line where it adds real, metric-specific information
      // the chip doesn't already carry.
      sub: metric.metricId === "STR-KPI-007"
        ? t(locale, "Needs cycle policy", "يتطلب سياسة الدورة")
        : null,
    };
  }
  // Live value + optional comparison sub-line.
  let sub: string | null = null;
  if (metric.comparison && metric.comparison.direction !== "unknown" && metric.comparison.previousValue != null) {
    const arrow = metric.comparison.direction === "up" ? "▲" : metric.comparison.direction === "down" ? "▼" : "—";
    sub = t(locale, `${arrow} vs previous window`, `${arrow} مقارنة بالفترة السابقة`);
  } else if (metric.numerator != null && metric.denominator != null) {
    const numerator = formatCount(metric.numerator, locale);
    const denominator = formatCount(metric.denominator, locale);
    sub = t(locale, `${numerator} of ${denominator}`, `${numerator} من ${denominator}`);
  }
  if (metric.sourceStatus === "partial") {
    sub = t(
      locale,
      sub ? `Partial source data · ${sub}` : "Partial source data",
      sub ? `بيانات مصدر جزئية · ${sub}` : "بيانات مصدر جزئية",
    );
  } else if (metric.sourceStatus === "cached") {
    sub = t(
      locale,
      sub ? `Cached data · ${sub}` : "Cached data",
      sub ? `بيانات مخزنة مؤقتاً · ${sub}` : "بيانات مخزنة مؤقتاً",
    );
  }
  // A live source that carries no value is still an absence. It renders in the
  // governed absence vocabulary ("Unavailable"), never as a bare dash.
  const text = formatValue(metric, locale);
  if (text == null) {
    return {
      metricId: metric.metricId,
      title,
      kind: "status",
      text: statusLabel("unavailable", locale),
      tone: "neutral",
      sub,
    };
  }
  return {
    metricId: metric.metricId,
    title,
    kind: "value",
    text,
    tone: statusTone(metric.sourceStatus),
    sub,
  };
}

export type MethodologyRow = { label: string; value: string };
export type MethodologyEntry = {
  metricId: string;
  formulaId: string;
  title: string;
  rows: MethodologyRow[];
  /** Governance note when the metric is blocked; null when live. */
  blockedNote: string | null;
  drillRoute: string | null;
  drillLabel: string;
};

/**
 * Build the full metric-lineage entry shown in the methodology drawer:
 * formula version, numerator, denominator, policy, exclusions, freshness,
 * scope and drill — sourced entirely from the shared contract + the immutable
 * registry definition (never recomputed here).
 */
export function buildMethodology(metric: SharedMetric, locale: Locale): MethodologyEntry {
  const def = kpiDefinition(metric.metricId);
  const orAbsent = (v: string | number | null | undefined) =>
    v === null || v === undefined || v === "" ? statusLabel("unavailable", locale) : String(v);
  const scope = metric.scope;
  const scopeText = scope.fromDate && scope.toDate
    ? `${scope.fromDate} → ${scope.toDate} · ${scope.timezone}${scope.region ? ` · ${scope.region}` : ""}`
    : scope.timezone;
  const freshness = isBlocked(metric.sourceStatus)
    ? statusLabel(metric.sourceStatus, locale)
    : `${statusLabel(metric.sourceStatus, locale)}${
        metric.refreshedAt
          ? ` · ${t(locale, "page generated", "أُنشئت الصفحة")} ${metric.refreshedAt.slice(0, 16).replace("T", " ")}`
          : ""
      }`;

  const rows: MethodologyRow[] = [
    { label: t(locale, "Formula", "المعادلة"), value: orAbsent(def?.formula) },
    { label: t(locale, "Numerator", "البسط"), value: metric.numerator != null ? String(metric.numerator) : orAbsent(null) },
    { label: t(locale, "Denominator", "المقام"), value: metric.denominator != null ? String(metric.denominator) : orAbsent(def?.denominatorRule) },
    { label: t(locale, "Exclusions", "الاستثناءات"), value: metric.exclusions.length ? metric.exclusions.join(", ") : t(locale, "None", "لا يوجد") },
    { label: t(locale, "Time basis", "الأساس الزمني"), value: scopeText },
    { label: t(locale, "Formula version", "إصدار المعادلة"), value: orAbsent(metric.formulaVersion) },
    { label: t(locale, "Policy version", "إصدار السياسة"), value: metric.policyVersionId ?? t(locale, "No effective policy", "لا توجد سياسة فعّالة") },
    { label: t(locale, "Source freshness", "حداثة المصدر"), value: freshness },
    // DEC-032. This is a statement about what every count MEANS, so it belongs
    // on the number's lineage rather than as a page-level alert: the dashboard
    // reports stored records the reader is permitted to see, which is not the
    // same claim as a verified end-to-end submission. Stated in reading terms,
    // with the decision ID kept because a basis drawer is an audit surface and
    // the reference is what makes the caveat checkable.
    {
      label: t(locale, "Verification", "التحقق"),
      value: t(
        locale,
        "Counts describe stored records visible under your access scope. Independent end-to-end submission proof is pending.",
        "تصف الأعداد السجلات المخزنة الظاهرة ضمن نطاق صلاحيتك. لا يزال إثبات التقديم المستقل من البداية إلى النهاية معلقاً.",
      ),
    },
  ];

  return {
    metricId: metric.metricId,
    formulaId: `${metric.metricId} · v${metric.formulaVersion}`,
    title: metricTitle(metric, locale),
    rows,
    blockedNote: isBlocked(metric.sourceStatus)
      ? t(
          locale,
          metric.unavailableReason ?? "This measure is blocked until its policy or data contract is approved.",
          "هذا المؤشر محجوب إلى أن تتم الموافقة على سياسته أو عقد بياناته.",
        )
      : null,
    drillRoute: metric.drill.route,
    drillLabel: t(locale, "Open records", "فتح السجلات"),
  };
}
