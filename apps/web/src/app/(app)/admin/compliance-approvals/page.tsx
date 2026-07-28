import Link from "next/link";
import Shell from "@/app/(app)/admin/_components/AdminShell";
import { getLocale } from "@/lib/i18n";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string; request_number: string; title: string; request_type: string; owner_id: string;
  submitted_at: string | null; current_revision: number; status: string; correlation_id: string;
  audit_references: unknown; publication_audit_reference: number | null;
};
type ComponentRow = { request_id: string; revision_number: number; component_status: string; entity_kind: string };
type DependencyRow = { request_id: string; revision_number: number };

const FILTERS = {
  pending: { label: "Pending Review", statuses: ["pending_review"] },
  partial: { label: "Partially Approved", statuses: ["partially_approved"] },
  publish: { label: "Ready to Publish", statuses: ["approved"] },
} as const;

const statusLabel = (value: string, ar: boolean) => {
  if (ar) return ({
    pending_review: "قيد المراجعة", partially_approved: "مقبول جزئياً", approved: "معتمد",
    draft: "مسودة", returned: "مُعاد", rejected: "مرفوض", auto_rejected: "مرفوض تلقائياً",
    published: "منشور",
  } as Record<string, string>)[value] ?? value;
  return value.split("_").map(part => part[0]?.toUpperCase() + part.slice(1)).join(" ");
};

const entityLabel = (value: string, ar: boolean) => {
  if (ar) return ({
    regulation: "لائحة", inspection_item: "بند تفتيش", violation: "مخالفة", penalty: "عقوبة",
    evidence_rule: "قاعدة أدلة", package: "حزمة", package_item: "بند حزمة",
    template_assignment: "إسناد قالب", action_form_trigger: "مشغّل نموذج إجراء",
    section: "قسم", item_rule: "قاعدة بند", response_mapping: "ربط استجابة",
    compliance_mapping: "ربط نتيجة امتثال", conditional_visibility: "ظهور مشروط",
    conditional_mandatory: "إلزام مشروط", response_evidence_rule: "قاعدة أدلة حسب الاستجابة",
    violation_trigger: "مشغّل مخالفة", action_form_requirement: "اشتراط نموذج إجراء",
  } as Record<string, string>)[value] ?? value;
  return statusLabel(value, false);
};

const revisionKey = (requestId: string, revision: number) => `${requestId}:${revision}`;

const timestamp = (value: string | null, unavailable: string) => {
  if (!value) return unavailable;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? unavailable : parsed.toISOString();
};

export default async function ComplianceApprovalQueue({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ar = await getLocale() === "ar";
  const copy = ar ? {
    title: "قائمة الاعتماد", makerChecker: "فصل المُنشئ عن المُراجع",
    distinct: "منفصلة عن مراجعة تقارير التفتيش واعتمادها",
    boundaryTitle: "قرارات إعدادات الامتثال فقط.",
    boundaryBody: "تراجع هذه القائمة مكوّنات طلبات إعداد الامتثال وجاهزيتها للنشر. ولا تتضمن تقارير التفتيش أو مراجعات المستوى الثاني.",
    scoringHold: "قواعد أوزان البنود واستبعاد الدرجات (CR-471/472) غير مهيأة، ولا تقبلها دورة الطلبات الحالية.",
    workload: "عبء المراجعة", workloadHelp: "تُرتب الطلبات المتاحة وفق سياسات RLS حسب وقت التقديم. يُعرض العمر كحقيقة دون استنتاج مستوى خدمة أو أولوية غير معتمدة.",
    register: "سجل الطلبات", filterAria: "حالة قائمة الاعتماد",
    ownExcluded: "من طلباتك مستبعدة.", ownRule: "لا يجوز لمنشئ الطلب اتخاذ القرار بشأن طلبه أو نشره. وتفرض دالة قاعدة البيانات القاعدة نفسها.",
    degradedTitle: "بعض تفاصيل القائمة غير متاحة.", degradedBody: "تُعرض الطلبات المؤهلة من قراءة القائمة الناجحة والمقيّدة بسياسات RLS. تُحجب معلومات تقدم المكوّنات أو أعداد التبعيات عند فشل قراءتها المحكومة.",
    retryDetails: "إعادة محاولة تحميل التفاصيل", unavailableTitle: "قائمة الاعتماد غير متاحة",
    unavailableBody: "فشلت القراءة المحكومة للطلبات. لم يتم استنتاج عبء العمل أو الأهلية.", retryQueue: "إعادة محاولة تحميل القائمة",
    noPrefix: "لا توجد طلبات", noSuffix: "ضمن نطاق صلاحياتك",
    emptyBody: "نجحت القراءة المقيّدة بسياسات RLS ولم تُرجع أي إسنادات مؤهلة لفصل المُنشئ عن المُراجع في هذا العرض.",
    create: "إنشاء", modify: "تعديل", revision: "الإصدار", submitted: "تاريخ التقديم",
    components: "المكوّنات", progress: "تقدم القرار", dependencies: "التبعيات",
    unavailable: "غير متاح", noComponents: "لا توجد مكوّنات حالية", correlation: "معرّف الترابط",
    coverage: "النطاق", auditReceipts: "إيصالات التدقيق", publicationReceipt: "إيصال النشر",
    immutableRevision: "يفتح مساحة الإصدار الحالي غير القابل للتعديل، وتبقى القرارات محكومة بدوال قاعدة البيانات.",
    open: "فتح مساحة عمل المراجعة",
  } : {
    title: "Approval Queue", makerChecker: "CCR maker-checker",
    distinct: "Distinct from Inspection Review & Approval",
    boundaryTitle: "Compliance configuration decisions only.",
    boundaryBody: "This queue reviews CCR components and publication readiness. It does not contain inspection reports or Level 2 inspection reviews.",
    scoringHold: "Item-weight and score-exclusion rules (CR-471/472) are Not configured and are not accepted by the current request workflow.",
    workload: "Review workload", workloadHelp: "RLS-scoped requests are ordered by submitted time. Age is shown as a fact; no unapproved SLA or priority is inferred.",
    register: "Request register", filterAria: "Approval queue status",
    ownExcluded: "own requests excluded.", ownRule: "Makers cannot decide or publish their own requests. The database RPC enforces the same rule.",
    degradedTitle: "Queue details are partially unavailable.", degradedBody: "Eligible requests are shown from the successful RLS-scoped queue read. Component progress or dependency counts are withheld where their governed read failed.",
    retryDetails: "Retry details", unavailableTitle: "Approval Queue unavailable",
    unavailableBody: "The governed request read failed. Workload and eligibility have not been inferred.", retryQueue: "Retry queue",
    noPrefix: "No", noSuffix: "requests in your scope",
    emptyBody: "The RLS-scoped read succeeded and returned zero eligible maker-checker assignments for this view.",
    create: "Create", modify: "Modify", revision: "Revision", submitted: "Submitted",
    components: "Components", progress: "Decision progress", dependencies: "Dependencies",
    unavailable: "Unavailable", noComponents: "No current components", correlation: "Correlation",
    coverage: "Coverage", auditReceipts: "Audit receipts", publicationReceipt: "Publication receipt",
    immutableRevision: "Opens the current immutable submitted revision; decisions remain database-RPC guarded.",
    open: "Open review workspace",
  };
  const filterKey = typeof sp.view === "string" && sp.view in FILTERS ? sp.view as keyof typeof FILTERS : "pending";
  const filter = FILTERS[filterKey];
  const filterLabel = ar
    ? ({ pending: "قيد المراجعة", partial: "مقبول جزئياً", publish: "جاهز للنشر" } as const)[filterKey]
    : filter.label;
  const sb = await supabaseServer();
  const { data: { user }, error: userError } = await getServerUser();
  if (!user || userError) throw new Error("compliance_approval_queue_auth_unavailable");
  const requestRead = await sb.from("compliance_configuration_requests")
    .select("id,request_number,title,request_type,owner_id,submitted_at,current_revision,status,correlation_id,audit_references,publication_audit_reference")
    .in("status", [...filter.statuses]).order("submitted_at", { ascending: true });
  const scopedRows = (requestRead.data ?? []) as RequestRow[];
  const ownRows = scopedRows.filter(row => row.owner_id === user.id);
  const rows = scopedRows.filter(row => row.owner_id !== user.id);
  const ids = rows.map(row => row.id);
  const [componentRead, dependencyRead] = ids.length ? await Promise.all([
    sb.from("compliance_request_components").select("request_id,revision_number,component_status,entity_kind").in("request_id", ids),
    sb.from("compliance_request_component_dependencies").select("request_id,revision_number").in("request_id", ids),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  const queueReadFailed = !!requestRead.error;
  const enrichmentDegraded = !queueReadFailed && (!!componentRead.error || !!dependencyRead.error);
  const componentsAvailable = !componentRead.error;
  const dependenciesAvailable = !dependencyRead.error;
  const components = (componentRead.data ?? []) as ComponentRow[];
  const dependencies = (dependencyRead.data ?? []) as DependencyRow[];
  const componentsByRevision = components.reduce<Map<string, ComponentRow[]>>((map, component) => {
    const key = revisionKey(component.request_id, component.revision_number);
    const grouped = map.get(key);
    if (grouped) grouped.push(component);
    else map.set(key, [component]);
    return map;
  }, new Map());
  const dependencyCountByRevision = dependencies.reduce<Map<string, number>>((map, dependency) => {
    const key = revisionKey(dependency.request_id, dependency.revision_number);
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map());

  return (
    <Shell current="/admin/compliance-approvals" title={copy.title} context={<><span className="badge badge-info">{copy.makerChecker}</span><span className="t-caption">{copy.distinct}</span></>}>
      <div className="alert" role="note"><strong>{copy.boundaryTitle}</strong> {copy.boundaryBody}</div>
      <div className="alert alert-warning" role="note">{copy.scoringHold}</div>
      <div className="ccr-register-head"><div><h3>{copy.workload}</h3><p className="t-caption">{copy.workloadHelp}</p></div><Link className="btn btn-secondary btn-touch" href="/admin/compliance-requests">{copy.register}</Link></div>
      <nav className="cmp-approval-filters" aria-label={copy.filterAria}>
        {Object.entries(FILTERS).map(([key, entry]) => <Link key={key} className={`btn btn-touch ${filterKey === key ? "btn-primary btn-lg" : "btn-secondary"}`} aria-current={filterKey === key ? "page" : undefined} href={`/admin/compliance-approvals?view=${key}`}>{ar ? ({ pending: "قيد المراجعة", partial: "مقبول جزئياً", publish: "جاهز للنشر" } as Record<string, string>)[key] : entry.label}</Link>)}
      </nav>
      {ownRows.length ? <div className="alert alert-warning" role="status"><strong>{ownRows.length} {copy.ownExcluded}</strong> {copy.ownRule}</div> : null}
      {enrichmentDegraded ? <div className="alert alert-warning" role="alert"><strong>{copy.degradedTitle}</strong> {copy.degradedBody} <a className="sq-link" href={`/admin/compliance-approvals?view=${filterKey}`}>{copy.retryDetails}</a></div> : null}
      {queueReadFailed ? <div className="panel"><div className="saqeel-state" role="alert"><span className="saqeel-state__glyph" aria-hidden="true">⚠</span><h4>{copy.unavailableTitle}</h4><p className="t-caption">{copy.unavailableBody}</p><a className="sq-link" href={`/admin/compliance-approvals?view=${filterKey}`}>{copy.retryQueue}</a></div></div> : rows.length === 0 ? <div className="panel"><div className="saqeel-state" role="status"><span className="saqeel-state__glyph" aria-hidden="true">✓</span><h4>{copy.noPrefix} {filterLabel.toLocaleLowerCase(ar ? "ar" : "en")} {copy.noSuffix}</h4><p className="t-caption">{copy.emptyBody}</p></div></div> : <div className="cmp-approval-list">{rows.map(row => {
        const key = revisionKey(row.id, row.current_revision);
        const current = componentsByRevision.get(key) ?? [];
        const counts = current.reduce<Record<string, number>>((acc, component) => ({ ...acc, [component.component_status]: (acc[component.component_status] ?? 0) + 1 }), {});
        const dependencyCount = dependencyCountByRevision.get(key) ?? 0;
        const progress = Object.entries(counts).map(([status, count]) => `${statusLabel(status, ar)} ${count}`).join(" · ");
        const coverage = Array.from(new Set(current.map(component => entityLabel(component.entity_kind, ar)))).join(" · ");
        const auditCount = Array.isArray(row.audit_references) ? row.audit_references.length : null;
        return <article className="panel cmp-approval-card" key={row.id}><header><div><p className="sq-overline"><bdi>{row.request_number}</bdi> · {row.request_type === "create" ? copy.create : copy.modify} · {copy.revision} {row.current_revision}</p><h3>{row.title}</h3></div><span className={`badge ccr-status ccr-status--${row.status}`}>{statusLabel(row.status, ar)}</span></header><dl className="cmp-approval-facts"><div><dt>{copy.submitted}</dt><dd className="numeric">{timestamp(row.submitted_at, copy.unavailable)}</dd></div><div><dt>{copy.components}</dt><dd>{componentsAvailable ? current.length : copy.unavailable}</dd></div><div><dt>{copy.progress}</dt><dd>{componentsAvailable ? progress || copy.noComponents : copy.unavailable}</dd></div><div><dt>{copy.dependencies}</dt><dd>{dependenciesAvailable ? dependencyCount : copy.unavailable}</dd></div><div><dt>{copy.coverage}</dt><dd>{componentsAvailable ? coverage || copy.noComponents : copy.unavailable}</dd></div><div><dt>{copy.auditReceipts}</dt><dd>{auditCount ?? copy.unavailable}{row.publication_audit_reference ? <> · {copy.publicationReceipt} <bdi>{row.publication_audit_reference}</bdi></> : null}</dd></div></dl><footer><span className="t-caption">{copy.correlation} <bdi>{row.correlation_id}</bdi> · {copy.immutableRevision}</span><Link className="btn btn-primary btn-lg btn-touch" href={`/admin/compliance-requests/${row.id}?from=approval-queue`}>{copy.open}</Link></footer></article>;
      })}</div>}
    </Shell>
  );
}
