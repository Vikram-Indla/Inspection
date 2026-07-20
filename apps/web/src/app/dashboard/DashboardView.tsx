import type { ReactNode } from "react";
import type { FactoryRef, GeoRow, ReviewRow, ResponseRow, VisitRow } from "./metrics";
import { complianceBreakdown, formatDuration } from "./metrics";
import { formatDateTime } from "@/lib/dates";
import styles from "./dashboard.module.css";

type Locale = "en" | "ar";
type DashboardMetrics = ReturnType<typeof import("./metrics").buildDashboardMetrics>;

const copy = (locale: Locale, en: string, ar: string) => locale === "ar" ? ar : en;

function MetricCard({ question, title, value, formula, detail, href, action, unavailable = false }: {
  question: string; title: string; value: ReactNode; formula: string; detail: string;
  href?: string; action?: string; unavailable?: boolean;
}) {
  return <article className={`${styles.card}${unavailable ? ` ${styles.unavailable}` : ""}`}>
    <span className={styles.question}>{question}</span>
    <h4>{title}</h4>
    <div className={styles.value}>{value}</div>
    <div className={styles.formula}>{formula}</div>
    <p className={styles.detail}>{detail}</p>
    {href && action && <a className={styles.action} href={href}>{action}</a>}
  </article>;
}

function Bars({ rows, empty, suffix = "" }: { rows: { label: string; value: number }[]; empty: string; suffix?: string }) {
  if (!rows.length) return <div className={styles.empty} role="status">{empty}</div>;
  const max = Math.max(1, ...rows.map(row => row.value));
  return <div className={styles.bars}>{rows.slice(0, 8).map(row => <div className={styles.barRow} key={row.label}>
    <span className={styles.barLabel} title={row.label}>{row.label}</span>
    <span className={styles.track} aria-hidden="true"><span className={styles.fill} style={{ inlineSize: `${Math.max(3, (row.value / max) * 100)}%` }} /></span>
    <strong className={styles.barValue}>{row.value}{suffix}</strong>
  </div>)}</div>;
}

function paramsHref(current: Record<string, string>, patch: Record<string, string>) {
  const params = new URLSearchParams({ ...current, ...patch });
  for (const [key, value] of [...params.entries()]) if (!value) params.delete(key);
  return `/dashboard?${params.toString()}`;
}

export function DashboardTabs({ locale, view, params }: { locale: Locale; view: "strategic" | "operational"; params: Record<string, string> }) {
  return <nav className={styles.tabs} role="tablist" aria-label={copy(locale, "Dashboard perspective", "منظور لوحة القيادة")}>
    <a id="dashboard-tab-strategic" className={styles.tab} role="tab" aria-controls="dashboard-strategic" aria-selected={view === "strategic"} href={paramsHref(params, { view: "strategic" })}>
      {copy(locale, "Strategic View", "المنظور الاستراتيجي")}
    </a>
    <a id="dashboard-tab-operational" className={styles.tab} role="tab" aria-controls="dashboard-operational" aria-selected={view === "operational"} href={paramsHref(params, { view: "operational" })}>
      {copy(locale, "Operational View", "المنظور التشغيلي")}
    </a>
  </nav>;
}

export function StrategicView({ locale, metrics, group, params }: {
  locale: Locale; metrics: DashboardMetrics; group: "region" | "city" | "sector" | "authority"; params: Record<string, string>;
}) {
  const s = metrics.strategic;
  const unknown = copy(locale, "Not recorded", "غير مسجل");
  const breakdown = complianceBreakdown(s.scopedResponses as ResponseRow[], group, unknown);
  const action = copy(locale, "Open", "فتح");
  const dimensions = [
    ["region", copy(locale, "Region", "المنطقة")],
    ["city", copy(locale, "City", "المدينة")],
    ["sector", copy(locale, "Sector", "القطاع")],
    ["authority", copy(locale, "Authority", "الجهة")],
  ] as const;
  const movementDirection = s.violationDelta > 0 ? copy(locale, "increase", "زيادة") : s.violationDelta < 0 ? copy(locale, "decrease", "انخفاض") : copy(locale, "no change", "دون تغيير");

  return <div id="dashboard-strategic" role="tabpanel" aria-labelledby="dashboard-tab-strategic" className={styles.section}>
    <div className={styles.sectionHead}><div><div className={styles.eyebrow}>{copy(locale, "National performance", "الأداء الوطني")}</div><h3>{copy(locale, "Are inspection outcomes moving in the right direction?", "هل تتحرك نتائج التفتيش في الاتجاه الصحيح؟")}</h3></div></div>
    <div className={styles.cards}>
      <MetricCard
        question={copy(locale, "Are we achieving the national inspection strategy?", "هل نحقق استراتيجية التفتيش الوطنية؟")}
        title={copy(locale, "Inspection completion against annual target", "إنجاز التفتيش مقابل المستهدف السنوي")}
        value={copy(locale, "Target not configured", "المستهدف غير مهيأ")}
        formula={copy(locale, "Completed inspections ÷ governed annual target", "التفتيشات المكتملة ÷ المستهدف السنوي المعتمد")}
        detail={copy(locale, `${s.completedInspections} submitted inspections are visible in this scope. No annual target exists in governed configuration.`, `${s.completedInspections} تفتيشات مقدمة ظاهرة ضمن هذا النطاق. لا يوجد مستهدف سنوي معتمد في التهيئة.`)}
        unavailable />
      <MetricCard
        question={copy(locale, "How compliant are answered inspection items?", "ما مدى امتثال بنود التفتيش المجابة؟")}
        title={copy(locale, "National compliance rate", "معدل الامتثال الوطني")}
        value={s.complianceRate == null ? "—" : `${s.complianceRate}%`}
        formula={copy(locale, "Compliant ÷ (compliant + non-compliant)", "الممتثل ÷ (الممتثل + غير الممتثل)")}
        detail={copy(locale, `${s.compliant} compliant of ${s.answeredForCompliance} eligible answered items; N/A and unknown answers excluded.`, `${s.compliant} ممتثل من ${s.answeredForCompliance} إجابات مؤهلة؛ تم استبعاد غير المنطبق والإجابات غير المعروفة.`)}
        />
      <MetricCard
        question={copy(locale, "Are submitted inspections being approved?", "هل يتم اعتماد التفتيشات المقدمة؟")}
        title={copy(locale, "Inspection approval rate", "معدل اعتماد التفتيش")}
        value={s.approvalRate == null ? "—" : `${s.approvalRate}%`}
        formula={copy(locale, "Approved scoped inspections ÷ submitted scoped inspections", "التفتيشات المعتمدة ضمن النطاق ÷ التفتيشات المقدمة ضمن النطاق")}
        detail={copy(locale, `${s.approvedScoped} approved of ${s.completedInspections} submitted inspections.`, `${s.approvedScoped} معتمدة من أصل ${s.completedInspections} تفتيشات مقدمة.`)}
        />
    </div>

    <div className={styles.sectionHead}><div><div className={styles.eyebrow}>{copy(locale, "Strategic intelligence", "المؤشرات الاستراتيجية")}</div><h3>{copy(locale, "Compliance performance explorer", "مستكشف أداء الامتثال")}</h3></div></div>
    <section className={styles.explorer} aria-labelledby="compliance-explorer-title">
      <div className={styles.explorerHead}>
        <div><h4 id="compliance-explorer-title">{copy(locale, "One formula, four governed lenses", "معادلة واحدة وأربع زوايا معتمدة")}</h4><p className={styles.detail}>{copy(locale, "Every bar uses the same eligible-answer denominator.", "يستخدم كل شريط مقام الإجابات المؤهلة نفسه.")}</p></div>
        <nav className={styles.dimensions} aria-label={copy(locale, "Group compliance by", "تجميع الامتثال حسب")}>
          {dimensions.map(([id, label]) => <a key={id} className={styles.dimension} aria-current={group === id} href={paramsHref(params, { group: id })}>{label}</a>)}
        </nav>
      </div>
      <Bars rows={breakdown.map(row => ({ label: `${row.label} · ${row.compliant}/${row.total}`, value: row.rate ?? 0 }))} empty={copy(locale, "No eligible answers exist in this scope.", "لا توجد إجابات مؤهلة ضمن هذا النطاق.")} suffix="%" />
    </section>

    <div className={styles.cards}>
      <MetricCard
        question={copy(locale, "Which regulations generate the most recorded violations?", "ما اللوائح التي تسجل أكبر عدد من المخالفات؟")}
        title={copy(locale, "Top violated regulation", "أكثر اللوائح مخالفة")}
        value={s.violationByRegulation[0]?.label ?? "—"}
        formula={copy(locale, "Count of violations linked to submitted inspections", "عدد المخالفات المرتبطة بالتفتيشات المقدمة")}
        detail={copy(locale, s.violationByRegulation[0] ? `${s.violationByRegulation[0].value} linked violations in scope.` : "No linked violations in scope.", s.violationByRegulation[0] ? `${s.violationByRegulation[0].value} مخالفات مرتبطة ضمن النطاق.` : "لا توجد مخالفات مرتبطة ضمن النطاق.")}
        />
      <MetricCard
        question={copy(locale, "Which factories require immediate attention?", "ما المصانع التي تتطلب اهتماماً فورياً؟")}
        title={copy(locale, "High-risk or L1 factories", "المصانع عالية المخاطر أو ذات مخالفات L1")}
        value={s.criticalFactories.length}
        formula={copy(locale, "High risk band OR linked L1 violation", "نطاق مخاطر مرتفع أو مخالفة L1 مرتبطة")}
        detail={copy(locale, "This is a deterministic record filter, not an AI recommendation.", "هذه تصفية حتمية للسجلات وليست توصية ذكاء اصطناعي.")}
        href="/factories" action={action} />
      <MetricCard
        question={copy(locale, "Which factories still require inspection this inspection year?", "ما المصانع التي ما زالت تتطلب تفتيشاً خلال سنة التفتيش؟")}
        title={copy(locale, "Factories pending annual inspection", "المصانع بانتظار التفتيش السنوي")}
        value={copy(locale, "Definition not configured", "التعريف غير مهيأ")}
        formula={copy(locale, "Active factories without a completed inspection in the governed inspection year", "المصانع النشطة دون تفتيش مكتمل في سنة التفتيش المعتمدة")}
        detail={copy(locale, "The schema has no active-factory eligibility or inspection-year boundary; no substitute count is shown.", "لا يحتوي المخطط على أهلية المصنع النشط أو بداية سنة التفتيش؛ لذلك لا يعرض عدداً بديلاً.")}
        unavailable />
    </div>

    <div className={styles.sectionHead}><div><div className={styles.eyebrow}>{copy(locale, "National movement", "الحركة الوطنية")}</div><h3>{copy(locale, "Submission-linked violation movement", "حركة المخالفات المرتبطة بالتقديم")}</h3></div></div>
    <div className={styles.cards2}>
      <MetricCard
        question={copy(locale, "How did recorded violations move against the previous equal window?", "كيف تغيرت المخالفات المسجلة مقارنة بالفترة السابقة المماثلة؟")}
        title={copy(locale, "Violation movement", "حركة المخالفات")}
        value={`${s.violationDelta > 0 ? "+" : ""}${s.violationDelta}`}
        formula={copy(locale, "Current-window violations − previous-window violations", "مخالفات الفترة الحالية − مخالفات الفترة السابقة")}
        detail={copy(locale, `${s.scopedViolations.length} current versus ${s.previousViolations} previous: ${movementDirection}. Uses inspection submission time because violation issuance time is not stored.`, `${s.scopedViolations.length} حالياً مقابل ${s.previousViolations} سابقاً: ${movementDirection}. يستخدم وقت تقديم التفتيش لعدم تخزين وقت إصدار المخالفة.`)} />
      <div className={styles.signal}>
        <span className={styles.signalGlyph} aria-hidden="true">≠AI</span>
        <div><h4>{copy(locale, "Deterministic executive signals", "إشارات تنفيذية حتمية")}</h4><p>{copy(locale, `${s.criticalFactories.length} high-risk/L1 factories and ${s.scopedViolations.length} linked violations are visible. No generated recommendation or forecast is presented.`, `يوجد ${s.criticalFactories.length} مصانع عالية المخاطر/ذات مخالفات L1 و${s.scopedViolations.length} مخالفات مرتبطة ظاهرة. لا يتم عرض توصية أو توقع مولد.`)}</p></div>
      </div>
    </div>
  </div>;
}

export function OperationalView({ locale, metrics }: { locale: Locale; metrics: DashboardMetrics }) {
  const o = metrics.operational;
  const action = copy(locale, "Open", "فتح");
  const workloadMax = Math.max(1, ...o.workload.map(row => row.active));
  const alerts = [
    ...o.overdueRows.map((row: VisitRow) => ({ key: `overdue-${row.id}`, tone: copy(locale, "Critical", "حرج"), label: copy(locale, "Visit window overdue", "نافذة الزيارة متأخرة"), detail: row.factories?.name ?? row.id.slice(0, 8), href: `/visits/${row.id}` })),
    ...o.overdueReviewRows.map((row: ReviewRow) => ({ key: `review-${row.id}`, tone: copy(locale, "Critical", "حرج"), label: copy(locale, "Review SLA overdue", "مراجعة متجاوزة لاتفاقية الخدمة"), detail: row.inspections?.visits?.factories?.name ?? row.inspection_id.slice(0, 8), href: "/operations" })),
    ...o.overrides.map((row: GeoRow) => ({ key: `override-${row.id}`, tone: copy(locale, "Warning", "تحذير"), label: copy(locale, "GPS override recorded", "تم تسجيل تجاوز GPS"), detail: row.visits?.factories?.name ?? row.visit_id.slice(0, 8), href: `/visits/${row.visit_id}` })),
    ...o.cancelledRows.map((row: VisitRow) => ({ key: `cancelled-${row.id}`, tone: copy(locale, "Information", "معلومة"), label: copy(locale, "Visit cancelled", "تم إلغاء الزيارة"), detail: `${row.factories?.name ?? row.id.slice(0, 8)} · ${row.cancellation_reason ?? copy(locale, "reason not recorded", "السبب غير مسجل")}`, href: `/visits/${row.id}` })),
  ];
  return <div id="dashboard-operational" role="tabpanel" aria-labelledby="dashboard-tab-operational" className={styles.section}>
    <div className={styles.signal}>
      <span className={styles.signalGlyph} aria-hidden="true">!</span>
      <div><h4>{copy(locale, "Operational priorities from governed conditions", "الأولويات التشغيلية من الشروط المعتمدة")}</h4><p>{copy(locale, `${o.highPriorityRows.length} high-priority pending visits, ${o.overdueRows.length} overdue visits and ${o.awaitingRows.length} reports awaiting review. These are record filters, not AI recommendations.`, `${o.highPriorityRows.length} زيارات عالية الأولوية معلقة، و${o.overdueRows.length} زيارات متأخرة، و${o.awaitingRows.length} تقارير بانتظار المراجعة. هذه تصفيات سجلات وليست توصيات ذكاء اصطناعي.`)}</p></div>
    </div>

    <div className={styles.sectionHead}><div><div className={styles.eyebrow}>{copy(locale, "Today's operations · Asia/Riyadh", "عمليات اليوم · آسيا/الرياض")}</div><h3>{copy(locale, "What must move today?", "ما الذي يجب إنجازه اليوم؟")}</h3></div></div>
    <div className={styles.cards2}>
      <MetricCard question={copy(locale, "What is planned today?", "ما المخطط لليوم؟")} title={copy(locale, "Today's planned visits", "زيارات اليوم المخططة")} value={o.todayVisits.length} formula={copy(locale, "Published visits with window start today", "الزيارات المنشورة التي تبدأ نافذتها اليوم")} detail={copy(locale, "Uses Asia/Riyadh calendar boundaries.", "يستخدم حدود اليوم حسب توقيت آسيا/الرياض.")} href="/visits/calendar" action={action} />
      <MetricCard question={copy(locale, "How much of today's plan is submitted?", "كم تم تقديمه من خطة اليوم؟")} title={copy(locale, "Today's visit completion rate", "معدل إنجاز زيارات اليوم")} value={o.todayCompletionRate == null ? "—" : `${o.todayCompletionRate}%`} formula={copy(locale, "Submitted today-planned visits ÷ today-planned visits", "زيارات اليوم المقدمة ÷ زيارات اليوم المخططة")} detail={copy(locale, `${o.todayCompleted} submitted of ${o.todayVisits.length} planned.`, `${o.todayCompleted} مقدمة من أصل ${o.todayVisits.length} مخططة.`)} href="/visits" action={action} />
    </div>

    <div className={styles.sectionHead}><div><div className={styles.eyebrow}>{copy(locale, "Execution and approvals", "التنفيذ والاعتمادات")}</div><h3>{copy(locale, "Where is work accumulating?", "أين يتراكم العمل؟")}</h3></div></div>
    <div className={styles.cards}>
      <MetricCard question={copy(locale, "What inspections are active in the field?", "ما التفتيشات النشطة ميدانياً؟")} title={copy(locale, "Active field inspections", "التفتيشات الميدانية النشطة")} value={o.activeField} formula={copy(locale, "Inspections with status = in_progress", "التفتيشات بحالة in_progress")} detail={copy(locale, "Canonical inspection status; not inferred from workflow status.", "حالة تفتيش معتمدة وليست مستنتجة من حالة سير العمل.")} href="/operations" action={action} />
      <MetricCard question={copy(locale, "Which visit windows have lapsed?", "ما نوافذ الزيارات التي انقضت؟")} title={copy(locale, "Overdue planned visits", "الزيارات المخططة المتأخرة")} value={o.overdueRows.length} formula={copy(locale, "Published, non-submitted visits with window end before now", "زيارات منشورة غير مقدمة انتهت نافذتها قبل الآن")} detail={copy(locale, `${o.slaBreachRate ?? "—"}% of ${o.slaEligible} eligible visits.`, `${o.slaBreachRate ?? "—"}% من ${o.slaEligible} زيارات مؤهلة.`)} href="/operations" action={action} />
      <MetricCard question={copy(locale, "Which reports require review?", "ما التقارير التي تتطلب المراجعة؟")} title={copy(locale, "Reports awaiting approval", "التقارير بانتظار الاعتماد")} value={o.awaitingRows.length} formula={copy(locale, "Latest review pending_review or under_review", "آخر مراجعة بحالة pending_review أو under_review")} detail={copy(locale, "Latest review state per inspection.", "أحدث حالة مراجعة لكل تفتيش.")} href="/operations" action={action} />
      <MetricCard question={copy(locale, "Which reports require correction?", "ما التقارير التي تتطلب التصحيح؟")} title={copy(locale, "Returned inspection reports", "تقارير التفتيش المعادة")} value={o.returnedRows.length} formula={copy(locale, "Latest review status = returned", "أحدث حالة مراجعة = returned")} detail={copy(locale, "Historical returns are not double-counted as current work.", "لا يتم احتساب الإعادات التاريخية مرتين كعمل حالي.")} href="/operations" action={action} />
      <MetricCard question={copy(locale, "Which high-priority visits are pending?", "ما الزيارات عالية الأولوية المعلقة؟")} title={copy(locale, "High-priority pending execution", "عالية الأولوية بانتظار التنفيذ")} value={o.highPriorityRows.length} formula={copy(locale, "Record priority high/critical and not submitted", "أولوية السجل مرتفعة/حرجة وغير مقدمة")} detail={copy(locale, "Priority comes from the visit record; the dashboard does not score it.", "تأتي الأولوية من سجل الزيارة ولا تقوم لوحة القيادة بحسابها.")} href="/visits" action={action} />
      <MetricCard question={copy(locale, "How long do completed executions take?", "كم تستغرق عمليات التنفيذ المكتملة؟")} title={copy(locale, "Average execution duration", "متوسط مدة التنفيذ")} value={formatDuration(o.avgDurationMs, locale)} formula={copy(locale, "Average submitted_at − started_at", "متوسط submitted_at − started_at")} detail={copy(locale, "Only valid, non-negative intervals in the selected scope.", "الفترات الصحيحة وغير السالبة فقط ضمن النطاق المحدد.")} />
    </div>

    <div className={styles.sectionHead}><div><div className={styles.eyebrow}>{copy(locale, "M08-016 operating scorecard", "بطاقة الأداء التشغيلي M08-016")}</div><h3>{copy(locale, "Selected-window KPI completeness", "اكتمال مؤشرات الفترة المحددة")}</h3></div></div>
    <div className={styles.cards}>
      <MetricCard question={copy(locale, "How many visits were planned?", "كم زيارة تم التخطيط لها؟")} title={copy(locale, "Planned visits", "الزيارات المخططة")} value={o.planned} formula={copy(locale, "Published visits whose window starts in scope", "الزيارات المنشورة التي تبدأ نافذتها ضمن النطاق")} detail={copy(locale, "Date and region filters applied.", "تم تطبيق مرشحات التاريخ والمنطقة.")} />
      <MetricCard question={copy(locale, "How many visits reached submitted?", "كم زيارة وصلت إلى المقدمة؟")} title={copy(locale, "Completed visits", "الزيارات المكتملة")} value={o.completed} formula={copy(locale, "Scoped visits with operational_state = submitted", "الزيارات ضمن النطاق بحالة تشغيلية submitted")} detail={copy(locale, "Operational state remains separate from planning status.", "تبقى الحالة التشغيلية منفصلة عن حالة التخطيط.")} />
      <MetricCard question={copy(locale, "How many visits were cancelled?", "كم زيارة ألغيت؟")} title={copy(locale, "Cancelled visits", "الزيارات الملغاة")} value={o.cancelled} formula={copy(locale, "Scoped visits with planning_status = cancelled", "الزيارات ضمن النطاق بحالة تخطيط cancelled")} detail={copy(locale, "Cancellation reasons are summarized below.", "تم تلخيص أسباب الإلغاء أدناه.")} />
      <MetricCard question={copy(locale, "How many inspectors carry active assigned work?", "كم مفتشاً لديه عمل مسند نشط؟")} title={copy(locale, "Active inspectors", "المفتشون النشطون")} value={o.activeInspectors} formula={copy(locale, "Distinct inspectors on published, non-submitted visits", "المفتشون الفريدون في زيارات منشورة غير مقدمة")} detail={copy(locale, "This is workload activity, not online presence.", "هذا نشاط عبء عمل وليس حالة اتصال.")} />
      <MetricCard question={copy(locale, "What share of eligible visits is overdue?", "ما نسبة الزيارات المؤهلة المتأخرة؟")} title={copy(locale, "SLA breach rate", "معدل تجاوز اتفاقية الخدمة")} value={o.slaBreachRate == null ? "—" : `${o.slaBreachRate}%`} formula={copy(locale, "Overdue eligible visits ÷ eligible visits", "الزيارات المؤهلة المتأخرة ÷ الزيارات المؤهلة")} detail={copy(locale, `${o.overdueRows.length} breached of ${o.slaEligible} eligible.`, `${o.overdueRows.length} متجاوزة من أصل ${o.slaEligible} مؤهلة.`)} />
      <MetricCard question={copy(locale, "Which GPS overrides were recorded?", "ما تجاوزات GPS المسجلة؟")} title={copy(locale, "GPS override events", "أحداث تجاوز GPS")} value={o.overrides.length} formula={copy(locale, "Immutable geo events with kind/result = override", "أحداث موقع غير قابلة للتغيير بنوع/نتيجة override")} detail={copy(locale, "Observed coordinates and reasons remain available in Operations Center.", "تظل الإحداثيات المرصودة والأسباب متاحة في مركز العمليات.")} href="/operations" action={action} />
    </div>

    <div className={styles.sectionHead}><div><div className={styles.eyebrow}>{copy(locale, "Operational alerts and exceptions", "التنبيهات والاستثناءات التشغيلية")}</div><h3>{copy(locale, "What requires attention now?", "ما الذي يتطلب الانتباه الآن؟")}</h3></div></div>
    <div className={styles.panelGrid}>
      <section className={styles.panel} aria-labelledby="alerts-heading">
        <h4 id="alerts-heading">{copy(locale, "Deterministic alert board", "لوحة التنبيهات الحتمية")}</h4>
        <p className={styles.detail}>{copy(locale, "Conditions are computed from records and accepted SLA configuration; use Operations Center notifications for persisted acknowledgement.", "يتم احتساب الشروط من السجلات وتهيئة اتفاقية الخدمة المعتمدة؛ استخدم إشعارات مركز العمليات للإقرار المحفوظ.")}</p>
        {alerts.length ? <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th scope="col">{copy(locale, "Severity", "الشدة")}</th><th scope="col">{copy(locale, "Condition", "الشرط")}</th><th scope="col">{copy(locale, "Object", "العنصر")}</th><th scope="col"></th></tr></thead>
          <tbody>{alerts.slice(0, 12).map(alert => <tr key={alert.key}><td><strong>{alert.tone}</strong></td><td>{alert.label}</td><td>{alert.detail}</td><td><a className={styles.action} href={alert.href}>{action}</a></td></tr>)}</tbody>
        </table></div> : <div className={styles.empty} role="status">{copy(locale, "No governed alert condition is active in this scope.", "لا يوجد شرط تنبيه معتمد نشط ضمن هذا النطاق.")}</div>}
      </section>
      <section className={styles.panel} aria-labelledby="coverage-heading">
        <h4 id="coverage-heading">{copy(locale, "Alert source coverage", "تغطية مصادر التنبيه")}</h4>
        <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th scope="col">{copy(locale, "Condition", "الشرط")}</th><th scope="col">{copy(locale, "Runtime state", "حالة التشغيل")}</th></tr></thead>
          <tbody>
            <tr><td>{copy(locale, "Missed / overdue visit", "زيارة فائتة / متأخرة")}</td><td>{o.overdueRows.length}</td></tr>
            <tr><td>{copy(locale, "Cancelled visit", "زيارة ملغاة")}</td><td>{o.cancelledRows.length}</td></tr>
            <tr><td>{copy(locale, "GPS override", "تجاوز GPS")}</td><td>{o.overrides.length}</td></tr>
            <tr><td>{copy(locale, "Overdue review", "مراجعة متأخرة")}</td><td>{o.reviewSlaConfigured ? o.overdueReviewRows.length : copy(locale, "SLA not configured", "اتفاقية الخدمة غير مهيأة")}</td></tr>
            <tr><td>{copy(locale, "Offline inspector", "مفتش غير متصل")}</td><td>{copy(locale, "Unavailable — no presence source/timeout", "غير متاح — لا يوجد مصدر حضور/مهلة")}</td></tr>
            <tr><td>{copy(locale, "Stuck execution", "تنفيذ متوقف")}</td><td>{copy(locale, "Unavailable — no stuck-duration policy", "غير متاح — لا توجد سياسة مدة التوقف")}</td></tr>
          </tbody>
        </table></div>
      </section>
    </div>

    <div className={styles.panelGrid}>
      <section className={styles.panel} aria-labelledby="override-heading">
        <h4 id="override-heading">{copy(locale, "GPS override records — planned versus observed", "سجلات تجاوز GPS — المخطط مقابل المرصود")}</h4>
        {o.overrides.length ? <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th scope="col">{copy(locale, "Visit / factory", "الزيارة / المصنع")}</th><th scope="col">{copy(locale, "Planned", "المخطط")}</th><th scope="col">{copy(locale, "Observed", "المرصود")}</th><th scope="col">{copy(locale, "Reason", "السبب")}</th><th scope="col">{copy(locale, "Inspector confirmation", "تأكيد المفتش")}</th><th scope="col">{copy(locale, "At", "الوقت")}</th></tr></thead>
          <tbody>{o.overrides.slice(0, 10).map((row: GeoRow) => <tr key={row.id}>
            <td><a className={styles.action} href={`/visits/${row.visit_id}`}>{row.visits?.factories?.name ?? row.visit_id.slice(0, 8)}</a></td>
            <td className={styles.numeric}>{row.visits?.planner_lat != null && row.visits?.planner_lng != null ? `${row.visits.planner_lat}, ${row.visits.planner_lng}` : "—"}</td>
            <td className={styles.numeric}>{row.observed_lat}, {row.observed_lng}</td>
            <td>{row.override_reason ?? copy(locale, "Not recorded", "غير مسجل")}</td>
            <td>{copy(locale, "Unavailable — no confirmation field", "غير متاح — لا يوجد حقل تأكيد")}</td>
            <td className={styles.numeric}>{formatDateTime(row.occurred_at, locale === "ar" ? "ar" : "en")}</td>
          </tr>)}</tbody>
        </table></div> : <div className={styles.empty} role="status">{copy(locale, "No GPS overrides in the selected scope.", "لا توجد تجاوزات GPS ضمن النطاق المحدد.")}</div>}
      </section>
      <section className={styles.panel} aria-labelledby="timeline-heading">
        <h4 id="timeline-heading">{copy(locale, "Planning-to-review operational timeline", "الخط الزمني التشغيلي من التخطيط إلى المراجعة")}</h4>
        {o.timeline.length ? <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th scope="col">{copy(locale, "Event", "الحدث")}</th><th scope="col">{copy(locale, "Object", "العنصر")}</th><th scope="col">{copy(locale, "At", "الوقت")}</th></tr></thead>
          <tbody>{o.timeline.slice(0, 12).map(row => <tr key={row.id}><td><strong>{row.action}</strong>{row.requirement_refs?.length ? <><br /><span className={styles.detail}>{row.requirement_refs.join(" · ")}</span></> : null}</td><td>{row.object_type} · {row.object_id?.slice(0, 8)}</td><td className={styles.numeric}>{formatDateTime(row.occurred_at, locale === "ar" ? "ar" : "en")}</td></tr>)}</tbody>
        </table></div> : <div className={styles.empty} role="status">{copy(locale, "No scoped audit events in the selected window.", "لا توجد أحداث تدقيق ضمن النطاق والفترة المحددين.")}</div>}
      </section>
    </div>

    <div className={styles.panelGrid}>
      <section className={styles.panel} aria-labelledby="workload-heading">
        <h4 id="workload-heading">{copy(locale, "Inspector workload — relative, not absolute capacity", "عبء عمل المفتشين — نسبي وليس سعة مطلقة")}</h4>
        <p className={styles.detail}>{copy(locale, "No capacity threshold or online/offline timeout is configured. Bars compare active assigned visits only.", "لا توجد عتبة سعة أو مهلة اتصال/عدم اتصال مهيأة. تقارن الأشرطة الزيارات النشطة المسندة فقط.")}</p>
        {o.workload.length ? <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th scope="col">{copy(locale, "Inspector", "المفتش")}</th><th scope="col">{copy(locale, "Assigned", "المسند")}</th><th scope="col">{copy(locale, "Active", "النشط")}</th><th scope="col">{copy(locale, "Completed", "المكتمل")}</th><th scope="col">{copy(locale, "Overdue", "المتأخر")}</th><th scope="col">{copy(locale, "Relative active load", "العبء النشط النسبي")}</th></tr></thead>
          <tbody>{o.workload.slice(0, 10).map(row => <tr key={row.id}><td><strong>{row.name}</strong></td><td className={styles.numeric}>{row.assigned}</td><td className={styles.numeric}>{row.active}</td><td className={styles.numeric}>{row.completed}</td><td className={styles.numeric}>{row.overdue}</td><td><span className={styles.track} aria-label={copy(locale, `${row.active} active visits`, `${row.active} زيارات نشطة`)}><span className={styles.fill} style={{ inlineSize: `${(row.active / workloadMax) * 100}%` }} /></span></td></tr>)}</tbody>
        </table></div> : <div className={styles.empty} role="status">{copy(locale, "No assignments are visible in this scope.", "لا توجد إسنادات ظاهرة ضمن هذا النطاق.")}</div>}
      </section>
      <section className={styles.panel} aria-labelledby="cancellation-heading">
        <h4 id="cancellation-heading">{copy(locale, "Cancellation reasons", "أسباب الإلغاء")}</h4>
        <Bars rows={o.cancellationReasons} empty={copy(locale, "No cancelled visits in the selected window.", "لا توجد زيارات ملغاة في الفترة المحددة.")} />
      </section>
    </div>
  </div>;
}

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

export function DashboardScope({ locale, from, to, region, refreshedAt }: { locale: Locale; from: string; to: string; region: string; refreshedAt: string }) {
  return <div className={styles.scopeLine} role="status">
    <span>{copy(locale, `Scope: ${from} to ${to} · ${region || "All regions"}`, `النطاق: ${from} إلى ${to} · ${region || "جميع المناطق"}`)}</span>
    <span>{copy(locale, `Source refreshed ${refreshedAt} · RLS scoped`, `تم تحديث المصدر ${refreshedAt} · مقيّد حسب صلاحيات الصفوف`)}</span>
  </div>;
}

export function DashboardToolbar({ locale, query, from, to, dateLabel, region, regions, view, group }: {
  locale: Locale; query: string; from: string; to: string; dateLabel: string; region: string; regions: string[]; view: string; group: string;
}) {
  return <form action="/dashboard" method="get" className={styles.topbar} role="search" aria-label={copy(locale, "Search and filter dashboard", "البحث وتصفية لوحة القيادة")}>
    <input type="hidden" name="view" value={view} /><input type="hidden" name="group" value={group} />
    <div className={styles.searchWrap}><span className={styles.searchIcon} aria-hidden="true">⌕</span><input className={styles.search} type="search" name="q" defaultValue={query} aria-label={copy(locale, "Search factories, visits and inspections", "البحث في المصانع والزيارات والتفتيشات")} placeholder={copy(locale, "Search factories, visits, inspections…", "ابحث في المصانع والزيارات والتفتيشات…")} /></div>
    <details className={styles.date}><summary className={styles.dateSummary}>◫ {dateLabel}</summary><div className={styles.datePanel}>
      <label>{copy(locale, "From", "من")}<input type="date" name="from" defaultValue={from} /></label>
      <label>{copy(locale, "To", "إلى")}<input type="date" name="to" defaultValue={to} /></label>
      <button className={styles.apply} type="submit">{copy(locale, "Apply date range", "تطبيق نطاق التاريخ")}</button>
    </div></details>
    <select className={styles.filter} name="region" defaultValue={region} aria-label={copy(locale, "Region", "المنطقة")}>
      <option value="">{copy(locale, "All Regions", "جميع المناطق")}</option>{regions.map(value => <option key={value} value={value}>{value}</option>)}
    </select>
    <button className={styles.apply} type="submit">{copy(locale, "Apply", "تطبيق")}</button>
  </form>;
}
