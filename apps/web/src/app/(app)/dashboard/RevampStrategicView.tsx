import type { FactoryRef, ResponseRow } from "./metrics";
import { complianceBreakdown } from "./metrics";
import type { MetricDisplay, MethodologyEntry } from "./dashboard-format";
import MetricStrip, { type MetricStripStrings } from "./MetricStrip";

type Locale = "en" | "ar";
type DashboardMetrics = ReturnType<typeof import("./metrics").buildDashboardMetrics>;

const copy = (locale: Locale, en: string, ar: string) => locale === "ar" ? ar : en;
const percentOrNull = (value: number | null, suffix = "%") => value == null ? null : `${value}${suffix}`;

function MetricCard({ locale, question, title, value, valueKind = "number", emptyText, definition, example, interpretation, href, action }: {
  locale: Locale;
  question: string;
  title: string;
  /** null renders the governed absence state, de-ranked below the value ramp. */
  value: string | null;
  /** "text" keeps prose values (a regulation name) out of the numeric ramp. */
  valueKind?: "number" | "text";
  emptyText?: string;
  definition: string;
  example: string;
  interpretation: string;
  href: string;
  action: string;
}) {
  return (
    <article className="panel kpi">
      <span className="tl-meta">{question}</span>
      <h3>{title}</h3>
      {value == null
        ? <span className="badge badge-pending">{emptyText ?? copy(locale, "Unavailable", "غير متاح")}</span>
        : <strong className={valueKind === "text" ? "id-code" : "kpi-value"}>{value}</strong>}
      <p className="desc"><b>{copy(locale, "Definition", "التعريف")}</b> {definition}</p>
      <p className="tl-meta">{example}</p>
      <p>{interpretation}</p>
      <a className="btn btn-secondary" href={href}>{action}</a>
    </article>
  );
}

export default function RevampStrategicView({ locale, metrics, factories, group, params, requirementStrip, requirementStripStrings }: {
  locale: Locale;
  metrics: DashboardMetrics;
  factories: FactoryRef[];
  group: "region" | "city" | "sector" | "authority";
  params: Record<string, string>;
  requirementStrip: { metrics: MetricDisplay[]; methodology: Record<string, MethodologyEntry> };
  requirementStripStrings: MetricStripStrings;
}) {
  const strategic = metrics.strategic;
  const grouped = complianceBreakdown(
    strategic.approvedScopedResponses as ResponseRow[],
    group,
    copy(locale, "Not recorded", "غير مسجل"),
  );
  const topViolation = strategic.violationByRegulation[0];
  const paramsHref = (nextGroup: string) => {
    const query = new URLSearchParams({ ...params, group: nextGroup });
    return `/dashboard?${query.toString()}`;
  };

  return (
    <div className="stack">
      <section className="panel stack" aria-labelledby="national-performance">
        <div className="panel-row">
          <h2 id="national-performance">{copy(locale, "National performance", "الأداء الوطني")}</h2>
        </div>
        <div className="panel-body">
        <div className="kpi-grid">
          <MetricCard
            locale={locale}
            question={copy(locale, "Are we achieving the national inspection strategy?", "هل نحقق استراتيجية التفتيش الوطنية؟")}
            title={copy(locale, "Inspection coverage against annual target", "تغطية التفتيش مقابل المستهدف السنوي")}
            value={null}
            emptyText={copy(locale, "Not configured", "غير مهيأ")}
            definition={copy(locale, "(Completed inspections ÷ annual inspection target) × 100", "(التفتيشات المكتملة ÷ المستهدف السنوي) × 100")}
            example={copy(locale, `${strategic.completedInspections} completed inspections; no governed annual target is configured.`, `${strategic.completedInspections} تفتيشاً مكتملاً؛ لا يوجد مستهدف سنوي معتمد.`)}
            interpretation={copy(locale, "Coverage remains withheld until Administration publishes the governed inspection-cycle target.", "تبقى التغطية محجوبة حتى تنشر الإدارة مستهدف دورة التفتيش المعتمد.")}
            href="/planning" action={copy(locale, "Open Planning", "فتح التخطيط")}
          />
          <MetricCard
            locale={locale}
            question={copy(locale, "How compliant is the industrial sector?", "ما مستوى امتثال القطاع الصناعي؟")}
            title={copy(locale, "National compliance rate", "معدل الامتثال الوطني")}
            value={percentOrNull(strategic.complianceRate)}
            definition={copy(locale, "(Compliant answered items ÷ total eligible answered items) × 100", "(البنود المطابقة ÷ إجمالي البنود المؤهلة المجابة) × 100")}
            example={copy(locale, `${strategic.approvedCompliant} compliant of ${strategic.approvedAnsweredForCompliance} eligible answers.`, `${strategic.approvedCompliant} إجابة مطابقة من ${strategic.approvedAnsweredForCompliance} إجابة مؤهلة.`)}
            interpretation={copy(locale, "Calculated only from approved inspection work; pending reports are excluded.", "يُحسب من أعمال التفتيش المعتمدة فقط؛ وتُستبعد التقارير المعلقة.")}
            href="/analytics" action={copy(locale, "Open Analytics", "فتح التحليلات")}
          />
          <MetricCard
            locale={locale}
            question={copy(locale, "Are inspection reports approved without excessive rework?", "هل تعتمد تقارير التفتيش دون إعادة عمل مفرطة؟")}
            title={copy(locale, "Inspection approval rate", "معدل اعتماد التفتيش")}
            value={percentOrNull(strategic.decisionApprovalRate)}
            definition={copy(locale, "Approved Level-2 decisions ÷ all decided Level-2 outcomes", "قرارات المستوى الثاني المعتمدة ÷ جميع نتائج المستوى الثاني المحسومة")}
            example={copy(locale, `${strategic.approvedScoped} approved of ${strategic.decidedScoped} decided outcomes.`, `${strategic.approvedScoped} نتيجة معتمدة من ${strategic.decidedScoped} نتيجة محسومة.`)}
            interpretation={copy(locale, "Approval is a review outcome and is not presented as compliance.", "الاعتماد نتيجة مراجعة ولا يُعرض على أنه امتثال.")}
            href="/reviews" action={copy(locale, "Open Review & Approval", "فتح المراجعة والاعتماد")}
          />
        </div>
        </div>
      </section>

      <section className="panel stack">
        <div className="panel-row">
          <div>
            <h2>{copy(locale, "Compliance performance explorer", "مستكشف أداء الامتثال")}</h2>
            <p>{copy(locale, "One compliance-rate formula, four lenses. Every row drills to the factories behind it.", "صيغة امتثال واحدة وأربع عدسات. كل صف ينتقل إلى المصانع المرتبطة به.")}</p>
          </div>
          <nav className="seg" aria-label={copy(locale, "Lens", "العدسة")}>
            {[
              ["region", "Region", "المنطقة"],
              ["city", "City", "المدينة"],
              ["sector", "Sector", "القطاع"],
              ["authority", "Authority", "الجهة"],
            ].map(([id, en, ar]) => (
              <a className="seg-opt" key={id} href={paramsHref(id)} aria-current={group === id}>{copy(locale, en, ar)}</a>
            ))}
          </nav>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">{copy(locale, "Lens value", "قيمة العدسة")}</th><th scope="col" className="cell-num">{copy(locale, "Compliance", "الامتثال")}</th><th scope="col">{copy(locale, "Records", "السجلات")}</th></tr></thead>
            <tbody>
            {grouped.length ? grouped.slice(0, 8).map(row => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td className="cell-num">{row.rate == null ? "—" : `${row.rate}%`}</td>
                <td><a className="btn btn-ghost btn-sm" href={`/factories?${group}=${encodeURIComponent(row.label)}`}>{copy(locale, "Open factories", "فتح المصانع")}</a></td>
              </tr>
            )) : <tr><td colSpan={3}>{copy(locale, "No eligible approved answers in scope.", "لا توجد إجابات معتمدة مؤهلة ضمن النطاق.")}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack" aria-labelledby="strategic-intervention">
        <div className="panel-row">
          <h2 id="strategic-intervention">{copy(locale, "Strategic intervention", "التدخل الاستراتيجي")}</h2>
        </div>
        <div className="panel-body">
        <div className="kpi-grid">
          <MetricCard
            locale={locale}
            question={copy(locale, "Which regulations generate the most violations?", "ما اللوائح التي تولد أكبر عدد من المخالفات؟")}
            title={copy(locale, "Top violated regulation", "اللائحة الأكثر مخالفة")}
            value={topViolation?.label ?? null}
            valueKind="text"
            definition={copy(locale, "Count of violations grouped by regulation", "عدد المخالفات مجمعة حسب اللائحة")}
            example={topViolation ? copy(locale, `${topViolation.value} linked violations in the current scope.`, `${topViolation.value} مخالفة مرتبطة ضمن النطاق الحالي.`) : copy(locale, "No regulation-linked violations in scope.", "لا توجد مخالفات مرتبطة بلوائح ضمن النطاق.")}
            interpretation={copy(locale, "Only violations carrying a governed regulation relationship are counted.", "تُحتسب فقط المخالفات ذات العلاقة المعتمدة بلائحة.")}
            href="/admin/regulations" action={copy(locale, "Open the regulation", "فتح اللائحة")}
          />
          <MetricCard
            locale={locale}
            question={copy(locale, "Which factories require immediate intervention?", "ما المصانع التي تتطلب تدخلاً فورياً؟")}
            title={copy(locale, "Critical factories requiring intervention", "المصانع الحرجة التي تتطلب التدخل")}
            value={String(strategic.criticalFactories.length)}
            definition={copy(locale, "Factories carrying a recorded high-risk band or active critical violation", "المصانع ذات نطاق مخاطر مرتفع مسجل أو مخالفة حرجة نشطة")}
            example={copy(locale, `${strategic.criticalFactories.length} factories match the governed recorded conditions.`, `${strategic.criticalFactories.length} مصنعاً يطابق الشروط المسجلة المعتمدة.`)}
            interpretation={copy(locale, "No substitute threshold is introduced by this screen.", "لا تضيف هذه الشاشة أي عتبة بديلة.")}
            href="/factories" action={copy(locale, "Open Factory 360", "فتح المصنع 360")}
          />
          <MetricCard
            locale={locale}
            question={copy(locale, "Which factories still require inspection this year?", "ما المصانع التي لا تزال تتطلب تفتيشاً هذا العام؟")}
            title={copy(locale, "Factories pending annual inspection", "المصانع بانتظار التفتيش السنوي")}
            value={null}
            emptyText={copy(locale, "Not configured", "غير مهيأ")}
            definition={copy(locale, "Active factories with no completed inspection in the governed inspection year", "المصانع النشطة دون تفتيش مكتمل في سنة التفتيش المعتمدة")}
            example={copy(locale, `${factories.length} factories are visible, but the annual-cycle policy is not configured.`, `${factories.length} مصنعاً ظاهراً، لكن سياسة الدورة السنوية غير مهيأة.`)}
            interpretation={copy(locale, "The screen withholds a count until the inspection-year policy is published.", "تحجب الشاشة العدد حتى نشر سياسة سنة التفتيش.")}
            href="/planning" action={copy(locale, "Open Planning", "فتح التخطيط")}
          />
        </div>
        </div>
      </section>

      <section className="sq-grid-2">
        <article className="panel stack">
          <div className="panel-body stack">
            <h2>{copy(locale, "Enforcement action trend", "اتجاه إجراءات الإنفاذ")}</h2>
            <div className="alert alert-warning">
              <div>
              <strong>{copy(locale, "Trend unavailable", "الاتجاه غير متاح")}</strong>
              <p>{copy(locale, "The repository does not store a governed official violation issue date. No quarterly series is inferred.", "لا يخزن المستودع تاريخ إصدار رسمي معتمد للمخالفة. ولا تُستنتج سلسلة ربع سنوية.")}</p>
              </div>
            </div>
            <a className="btn btn-secondary" href="/enforcement-library">{copy(locale, "Open Enforcement Library", "فتح مكتبة الإنفاذ")}</a>
          </div>
        </article>
        <article className="panel stack">
          <div className="panel-body stack">
            <span className="tl-meta">{copy(locale, "Executive AI brief", "موجز الذكاء الاصطناعي التنفيذي")}</span>
            <h2>{copy(locale, "Provider output withheld", "تم حجب مخرجات المزود")}</h2>
            <p>{copy(locale, "No generated claim is shown until a configured provider returns evidence-linked output for this scope.", "لا يُعرض أي ادعاء مولد حتى يعيد مزود مهيأ مخرجات مرتبطة بالأدلة لهذا النطاق.")}</p>
            <span className="badge badge-pending">{copy(locale, "Not configured", "غير مهيأ")}</span>
            <span className="tl-meta">{copy(locale, "Authoritative dashboard records remain available.", "تظل سجلات لوحة القيادة المعتمدة متاحة.")}</span>
          </div>
        </article>
      </section>

      <section className="panel stack" aria-labelledby="strategic-requirement-coverage">
        <div className="panel-row">
          <div>
            <h2 id="strategic-requirement-coverage">{copy(locale, "Strategic requirement coverage", "تغطية المتطلبات الاستراتيجية")}</h2>
            <p>{copy(locale, "Decision required: approved description pending.", "قرار مطلوب: الوصف المعتمد لم يُحدد بعد.")}</p>
          </div>
        </div>
        <div className="panel-body">
          <MetricStrip metrics={requirementStrip.metrics} methodology={requirementStrip.methodology} strings={requirementStripStrings} />
        </div>
      </section>
    </div>
  );
}
