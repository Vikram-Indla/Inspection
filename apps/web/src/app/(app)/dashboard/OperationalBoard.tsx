import type { MetricDisplay, MethodologyEntry } from "./dashboard-format";
import MetricStrip, { type MetricStripStrings } from "./MetricStrip";

type Locale = "en" | "ar";
type DashboardMetrics = ReturnType<typeof import("./metrics").buildDashboardMetrics>;

const copy = (locale: Locale, en: string, ar: string) => locale === "ar" ? ar : en;

function OperationalCard({ locale, question, title, value, definition, href, action }: {
  locale: Locale;
  question: string;
  title: string;
  value: string;
  definition: string;
  href: string;
  action: string;
}) {
  return (
    <article className="panel kpi">
      <span className="tl-meta">{question}</span>
      <h3>{title}</h3>
      <strong className="kpi-value">{value}</strong>
      <p className="desc"><b>{copy(locale, "Definition", "التعريف")}</b> {definition}</p>
      <a className="btn btn-secondary" href={href}>{action}</a>
    </article>
  );
}

export default function OperationalBoard({ locale, metrics, requirementStrip, requirementStripStrings }: {
  locale: Locale;
  metrics: DashboardMetrics;
  requirementStrip: { metrics: MetricDisplay[]; methodology: Record<string, MethodologyEntry> };
  requirementStripStrings: MetricStripStrings;
}) {
  const operational = metrics.operational;
  const todaysOperations = [
    {
      question: copy(locale, "What needs to be executed today?", "ما الذي يجب تنفيذه اليوم؟"),
      title: copy(locale, "Today's planned visits", "زيارات اليوم المخططة"),
      value: String(operational.todayVisits.length),
      definition: copy(locale, "Count of visits scheduled for today", "عدد الزيارات المجدولة لليوم"),
      href: "/execution",
      action: copy(locale, "Open Execution", "فتح التنفيذ"),
    },
    {
      question: copy(locale, "How much work has been completed today?", "ما مقدار العمل المكتمل اليوم؟"),
      title: copy(locale, "Today's visit completion rate", "معدل إكمال زيارات اليوم"),
      value: operational.todayCompletionRate == null ? copy(locale, "Unavailable", "غير متاح") : `${operational.todayCompletionRate}%`,
      definition: copy(locale, "(Completed visits today ÷ planned visits today) × 100", "(زيارات اليوم المكتملة ÷ زيارات اليوم المخططة) × 100"),
      href: "/execution",
      action: copy(locale, "Open Execution", "فتح التنفيذ"),
    },
    {
      question: copy(locale, "What inspections are currently active?", "ما التفتيشات النشطة حالياً؟"),
      title: copy(locale, "Active field inspections", "التفتيشات الميدانية النشطة"),
      value: String(operational.activeField),
      definition: copy(locale, "Count of inspections with operational state = executing", "عدد التفتيشات التي تكون حالتها التشغيلية = قيد التنفيذ"),
      href: "/operations",
      action: copy(locale, "Open Operations Center", "فتح مركز العمليات"),
    },
    {
      question: copy(locale, "Which visits are delayed?", "ما الزيارات المتأخرة؟"),
      title: copy(locale, "Overdue planned visits", "الزيارات المخططة المتأخرة"),
      value: String(operational.overdueRows.length),
      definition: copy(locale, "Planned date earlier than today and status not completed or cancelled", "تاريخ مخطط يسبق اليوم والحالة ليست مكتملة أو ملغاة"),
      href: "/planning",
      action: copy(locale, "Open Planning", "فتح التخطيط"),
    },
    {
      question: copy(locale, "Which inspection reports require review?", "ما تقارير التفتيش التي تتطلب المراجعة؟"),
      title: copy(locale, "Inspection reports awaiting approval", "تقارير التفتيش بانتظار الاعتماد"),
      value: String(operational.pendingApprovalsCount),
      definition: copy(locale, "Count of submitted reports awaiting a review decision", "عدد التقارير المقدمة بانتظار قرار المراجعة"),
      href: "/reviews",
      action: copy(locale, "Open Review & Approval", "فتح المراجعة والاعتماد"),
    },
    {
      question: copy(locale, "Which inspections require rework?", "ما التفتيشات التي تتطلب إعادة عمل؟"),
      title: copy(locale, "Returned inspection reports", "تقارير التفتيش المعادة"),
      value: String(operational.returnedRows.length),
      definition: copy(locale, "Count of reports returned to inspectors", "عدد التقارير المعادة إلى المفتشين"),
      href: "/execution",
      action: copy(locale, "Open Execution", "فتح التنفيذ"),
    },
    {
      question: copy(locale, "Which factories should be inspected next?", "ما المصانع التي يجب تفتيشها تالياً؟"),
      title: copy(locale, "High-priority visits pending execution", "الزيارات عالية الأولوية بانتظار التنفيذ"),
      value: String(operational.highPriorityRows.length),
      definition: copy(locale, "Planned visits at high or critical risk, not yet executed", "زيارات مخططة بمخاطر عالية أو حرجة لم تُنفذ بعد"),
      href: "/planning",
      action: copy(locale, "Open Planning", "فتح التخطيط"),
    },
  ];
  return (
    <div className="stack" id="dashboard-operational" role="tabpanel" aria-labelledby="dashboard-tab-operational">
      <section className="panel">
        <div className="panel-body stack">
          <strong>{copy(locale, "Operational priorities", "الأولويات التشغيلية")}</strong>
          <p>{copy(
            locale,
            `${operational.highPriorityRows.length} high-priority visits are pending execution; ${operational.overdueRows.length} published visits are past their recorded window.`,
            `${operational.highPriorityRows.length} زيارة عالية الأولوية بانتظار التنفيذ؛ و${operational.overdueRows.length} زيارة منشورة تجاوزت نافذتها المسجلة.`,
          )}</p>
          <span className="tl-meta">{copy(
            locale,
            "Based on current records only. No AI-generated recommendation.",
            "استناداً إلى السجلات الحالية فقط. لا توجد توصية مولدة بالذكاء الاصطناعي.",
          )}</span>
        </div>
      </section>

      <section className="panel stack" aria-labelledby="todays-operations">
        <div className="panel-row">
          <h2 id="todays-operations">{copy(locale, "Today's operations", "عمليات اليوم")}</h2>
        </div>
        <div className="panel-body">
          <div className="kpi-grid">
            {todaysOperations.map(metric => <OperationalCard key={metric.title} locale={locale} {...metric} />)}
          </div>
        </div>
      </section>

      <section className="panel stack" aria-labelledby="operational-requirement-coverage">
        <div className="panel-row">
          <div>
            <h2 id="operational-requirement-coverage">{copy(locale, "Operational requirement coverage", "تغطية المتطلبات التشغيلية")}</h2>
            <p>{copy(locale, "Every governed operational measure, shown with its current live or blocked state.", "كل مقياس تشغيلي معتمد، معروض بحالته الحالية سواء كانت مباشرة أو محجوبة.")}</p>
          </div>
        </div>
        <div className="panel-body">
          <MetricStrip metrics={requirementStrip.metrics} methodology={requirementStrip.methodology} strings={requirementStripStrings} />
        </div>
      </section>

      <section className="panel stack" aria-labelledby="inspector-capacity-heading">
        <div className="panel-row">
          <h2 id="inspector-capacity-heading">{copy(locale, "Inspector capacity", "طاقة المفتشين")}</h2>
          <span id="inspector-capacity-note" className="tl-meta">{copy(locale, "Planned + in progress; declared daily capacity is not configured", "المخطط + قيد التنفيذ؛ الطاقة اليومية المعلنة غير مهيأة")}</span>
        </div>
        <div className="panel-body stack">
          <div className="table-wrap">
            <table className="table" aria-describedby="inspector-capacity-note">
              <thead><tr><th scope="col">{copy(locale, "Inspector", "المفتش")}</th><th scope="col" className="cell-num">{copy(locale, "Active workload", "عبء العمل النشط")}</th><th scope="col">{copy(locale, "Daily capacity", "الطاقة اليومية")}</th></tr></thead>
              <tbody>
            {operational.workload.length ? operational.workload.slice(0, 8).map(row => (
              <tr key={row.id}>
                <th scope="row">{row.nameResolved ? row.name : <span className="badge badge-pending">{copy(locale, "Unresolved identity", "هوية غير محلولة")}</span>}</th>
                <td className="cell-num">{row.active}</td>
                <td><span className="badge badge-pending">{copy(locale, "N/A", "لا ينطبق")}</span></td>
              </tr>
            )) : <tr><td colSpan={3}>{copy(locale, "No inspector assignments are visible in this scope.", "لا توجد إسنادات مفتشين ظاهرة ضمن هذا النطاق.")}</td></tr>}
              </tbody>
            </table>
          </div>
          <a className="btn btn-secondary" href="/execution">{copy(locale, "Open Execution", "فتح التنفيذ")}</a>
        </div>
      </section>
    </div>
  );
}
