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
  return status === "unavailable" || status === "not_configured" || status === "decision_required";
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
    case "unavailable":
    case "decision_required": return "critical";
    case "not_configured":
    case "stale":
    case "partial": return "warning";
    case "live": return "success";
    default: return "neutral";
  }
}

/** Format a live numeric value by unit. Returns "—" when value is null. */
export function formatValue(metric: SharedMetric, locale: Locale): string {
  if (metric.value == null) return "—";
  switch (metric.unit) {
    case "percent": return locale === "ar" ? `٪${metric.value}` : `${metric.value}%`;
    case "ratio": return metric.value.toFixed(2);
    case "count": return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US").format(metric.value);
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
  /** Small secondary line (delta / context), already localized. */
  sub: string | null;
};

/** Build the primary display for a metric strip / status tile. */
export function metricDisplay(metric: SharedMetric, locale: Locale): MetricDisplay {
  const title = metricTitle(metric, locale);
  if (isBlocked(metric.sourceStatus)) {
    return {
      metricId: metric.metricId,
      title,
      kind: "status",
      text: statusLabel(metric.sourceStatus, locale),
      tone: statusTone(metric.sourceStatus),
      sub: metric.metricId === "STR-KPI-007"
        ? t(locale, "Needs cycle policy", "يتطلب سياسة الدورة")
        : t(locale, "Governance blocked", "محجوب بالحوكمة"),
    };
  }
  // Live value + optional comparison sub-line.
  let sub: string | null = null;
  if (metric.comparison && metric.comparison.direction !== "unknown" && metric.comparison.previousValue != null) {
    const arrow = metric.comparison.direction === "up" ? "▲" : metric.comparison.direction === "down" ? "▼" : "—";
    sub = t(locale, `${arrow} vs previous window`, `${arrow} مقارنة بالفترة السابقة`);
  } else if (metric.numerator != null && metric.denominator != null) {
    sub = t(locale, `${metric.numerator} of ${metric.denominator}`, `${metric.numerator} من ${metric.denominator}`);
  }
  return { metricId: metric.metricId, title, kind: "value", text: formatValue(metric, locale), tone: "neutral", sub };
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
  const dash = (v: string | number | null | undefined) =>
    v === null || v === undefined || v === "" ? "—" : String(v);
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
    { label: t(locale, "Formula", "المعادلة"), value: dash(def?.formula) },
    { label: t(locale, "Numerator", "البسط"), value: metric.numerator != null ? String(metric.numerator) : "—" },
    { label: t(locale, "Denominator", "المقام"), value: metric.denominator != null ? String(metric.denominator) : dash(def?.denominatorRule) },
    { label: t(locale, "Exclusions", "الاستثناءات"), value: metric.exclusions.length ? metric.exclusions.join(", ") : t(locale, "None", "لا يوجد") },
    { label: t(locale, "Time basis", "الأساس الزمني"), value: scopeText },
    { label: t(locale, "Formula version", "إصدار المعادلة"), value: dash(metric.formulaVersion) },
    { label: t(locale, "Policy version", "إصدار السياسة"), value: metric.policyVersionId ?? t(locale, "No effective policy", "لا توجد سياسة فعّالة") },
    { label: t(locale, "Source freshness", "حداثة المصدر"), value: freshness },
    // DEC-032. This is a statement about what every count MEANS, so it belongs
    // on the number's lineage rather than as a page-level alert: the dashboard
    // reports stored records the reader is permitted to see, which is not the
    // same claim as a verified end-to-end submission. Stated in reading terms,
    // with the decision ID kept because a basis drawer is an audit surface and
    // the reference is what makes the caveat checkable.
    {
      label: t(locale, "Verification", "\u0627\u0644\u062a\u062d\u0642\u0642"),
      value: t(
        locale,
        "Counts describe stored records visible under your access scope. Independent end-to-end submission proof is pending (DEC-032).",
        "\u062a\u0635\u0641 \u0627\u0644\u0623\u0639\u062f\u0627\u062f \u0627\u0644\u0633\u062c\u0644\u0627\u062a \u0627\u0644\u0645\u062e\u0632\u0646\u0629 \u0627\u0644\u0638\u0627\u0647\u0631\u0629 \u0636\u0645\u0646 \u0646\u0637\u0627\u0642 \u0635\u0644\u0627\u062d\u064a\u062a\u0643. \u0644\u0627 \u064a\u0632\u0627\u0644 \u0625\u062b\u0628\u0627\u062a \u0627\u0644\u062a\u0642\u062f\u064a\u0645 \u0627\u0644\u0645\u0633\u062a\u0642\u0644 \u0645\u0646 \u0627\u0644\u0628\u062f\u0627\u064a\u0629 \u0625\u0644\u0649 \u0627\u0644\u0646\u0647\u0627\u064a\u0629 \u0645\u0639\u0644\u0642\u0627\u064b (DEC-032).",
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
