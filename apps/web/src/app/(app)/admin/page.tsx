import Link from "next/link";
import Shell from "@/components/Shell";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import styles from "./admin-home.module.css";

// CD-004 / SCR-ADM-001 · client correction C-01.
// The rail is the navigation surface. This landing contains governed work only:
// maker-checker requests the caller may review and immutable published changes.
export const dynamic = "force-dynamic";

type RequestRow = {
  id: string;
  request_number: string;
  title: string;
  owner_id: string;
  submitted_at: string | null;
  current_revision: number;
  status: string;
};

type ComponentRow = {
  request_id: string;
  revision_number: number;
  entity_kind: string;
};

type AuditRow = {
  id: number;
  actor: string | null;
  object_id: string | null;
  action: string;
  occurred_at: string | null;
};

type ControlCard = {
  glyph: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  href: string;
  roles?: readonly string[];
};

type ControlGroup = {
  titleEn: string;
  titleAr: string;
  cards: readonly ControlCard[];
};

// WA-DES-020 / DEC-037 — the approved Control Panel directory. Unauthorized
// cards are removed server-side; each destination still enforces its own guard.
const CONTROL_GROUPS: readonly ControlGroup[] = [
  {
    titleEn: "People & access",
    titleAr: "المستخدمون والصلاحيات",
    cards: [
      { glyph: "Us", titleEn: "Users", titleAr: "المستخدمون", descEn: "Assign people to governed roles and review access.", descAr: "إسناد المستخدمين إلى الأدوار المحكومة ومراجعة الوصول.", href: "/admin/access", roles: ["security_admin"] },
      { glyph: "Ro", titleEn: "Roles", titleAr: "الأدوار", descEn: "Review role capabilities and governed grants.", descAr: "مراجعة قدرات الأدوار والمنح المحكومة.", href: "/admin/access?view=roles", roles: ["security_admin"] },
      { glyph: "Ac", titleEn: "Security & Access Review", titleAr: "مراجعة الأمن والوصول", descEn: "Purpose-bound grants and access oversight.", descAr: "المنح محددة الغرض والرقابة على الوصول.", href: "/admin/security-access", roles: ["security_admin"] },
    ],
  },
  {
    titleEn: "Inspection rules & forms",
    titleAr: "قواعد ونماذج التفتيش",
    cards: [
      { glyph: "Ru", titleEn: "Inspection Rules", titleAr: "قواعد التفتيش", descEn: "Regulations, clauses and linked inspection items.", descAr: "اللوائح والبنود وعناصر التفتيش المرتبطة.", href: "/admin/regulations", roles: ["compliance_admin"] },
      { glyph: "It", titleEn: "Inspection Items", titleAr: "بنود التفتيش", descEn: "Response, evidence and violation rules.", descAr: "قواعد الاستجابة والأدلة والمخالفات.", href: "/admin/items", roles: ["compliance_admin", "form_admin"] },
      { glyph: "Fm", titleEn: "Inspection Forms", titleAr: "نماذج التفتيش", descEn: "Checklist packages and immutable published versions.", descAr: "حزم قوائم التحقق والإصدارات المنشورة غير القابلة للتغيير.", href: "/admin/packages", roles: ["form_admin", "compliance_admin"] },
      { glyph: "Vn", titleEn: "Violations & Penalties", titleAr: "المخالفات والعقوبات", descEn: "Violation codes and governed penalty mappings.", descAr: "رموز المخالفات وربط العقوبات المحكوم.", href: "/admin/violations", roles: ["compliance_admin"] },
    ],
  },
  {
    titleEn: "Scoring & intelligence",
    titleAr: "التقييم والذكاء",
    cards: [
      { glyph: "Rk", titleEn: "Risk Settings", titleAr: "إعدادات المخاطر", descEn: "Versioned risk models and policy-held settings.", descAr: "نماذج مخاطر ذات إصدارات وإعدادات خاضعة للسياسة.", href: "/admin/risk", roles: ["risk_owner"] },
      { glyph: "AI", titleEn: "AI Insights", titleAr: "رؤى الذكاء الاصطناعي", descEn: "Advisory dockets with mandatory human disposition.", descAr: "ملفات استشارية تتطلب قراراً بشرياً.", href: "/ai/suggestions" },
      { glyph: "KP", titleEn: "Dashboard KPIs", titleAr: "مؤشرات لوحة القيادة", descEn: "Metric definitions, formulae and delivery state.", descAr: "تعريفات المؤشرات وصيغها وحالة إتاحتها.", href: "/admin/dashboard-config", roles: ["compliance_admin"] },
    ],
  },
  {
    titleEn: "Operations setup",
    titleAr: "إعداد العمليات",
    cards: [
      { glyph: "Wf", titleEn: "Workflow Settings", titleAr: "إعدادات سير العمل", descEn: "Versioned lifecycle transitions and guarded publication.", descAr: "انتقالات دورة الحياة ذات الإصدارات والنشر المحكوم.", href: "/admin/workflows", roles: ["workflow_admin"] },
      { glyph: "Ex", titleEn: "Execution Settings", titleAr: "إعدادات التنفيذ", descEn: "Capacity, visit modes, evidence and offline policy.", descAr: "السعة وأنماط الزيارة وسياسة الأدلة والعمل دون اتصال.", href: "/admin/execution" },
      { glyph: "Nt", titleEn: "Notification Settings", titleAr: "إعدادات الإشعارات", descEn: "Channels, rule versions and delivery testing.", descAr: "القنوات وإصدارات القواعد واختبار التسليم.", href: "/admin/notifications" },
      { glyph: "Mp", titleEn: "Map Settings", titleAr: "إعدادات الخريطة", descEn: "Governed geofence settings and spatial layers.", descAr: "إعدادات السياج الجغرافي والطبقات المكانية المحكومة.", href: "/admin/gis", roles: ["gis_admin"] },
      { glyph: "Cx", titleEn: "System Connections", titleAr: "اتصالات النظام", descEn: "Endpoint contracts and fail-closed dependency truth.", descAr: "عقود نقاط التكامل وحقيقة الاعتماد الآمنة.", href: "/admin/integrations", roles: ["security_admin", "workflow_admin"] },
      { glyph: "Dv", titleEn: "Trusted Devices", titleAr: "الأجهزة الموثوقة", descEn: "Registered field devices and trust status.", descAr: "أجهزة الميدان المسجلة وحالة الثقة.", href: "/admin/devices", roles: ["security_admin"] },
    ],
  },
  {
    titleEn: "Records & oversight",
    titleAr: "السجلات والرقابة",
    cards: [
      { glyph: "Ap", titleEn: "Awaiting Approval", titleAr: "بانتظار الاعتماد", descEn: "Configuration changes pending maker-checker review.", descAr: "تغييرات التهيئة بانتظار مراجعة المُعدّ والمراجع.", href: "/admin/compliance-approvals" },
      { glyph: "Rq", titleEn: "Configuration Requests", titleAr: "طلبات التهيئة", descEn: "Change envelopes and their review workspace.", descAr: "حزم التغيير ومساحة عمل مراجعتها.", href: "/admin/compliance-requests" },
      { glyph: "Lg", titleEn: "Activity Log", titleAr: "سجل النشاط", descEn: "Append-only audit of governed changes.", descAr: "سجل تدقيق إلحاقي للتغييرات المحكومة.", href: "/admin/audit" },
      { glyph: "Op", titleEn: "System Operations", titleAr: "عمليات النظام", descEn: "Error queue, endpoint state and feature flags.", descAr: "قائمة الأخطاء وحالة نقاط التكامل وميزات النظام.", href: "/admin/operations", roles: ["security_admin", "workflow_admin"] },
      { glyph: "Ln", titleEn: "Language & Translations", titleAr: "اللغة والترجمة", descEn: "Reference strings, coverage and revision history.", descAr: "النصوص المرجعية والتغطية وسجل المراجعات.", href: "/admin/localization", roles: ["compliance_admin", "security_admin", "workflow_admin"] },
      { glyph: "Bv", titleEn: "Issue Multiple Violations", titleAr: "إصدار عدة مخالفات", descEn: "Bulk issuance behind a permanent-write gate.", descAr: "إصدار جماعي خلف بوابة كتابة دائمة.", href: "/admin/bulk-violations", roles: ["compliance_admin"] },
      { glyph: "Er", titleEn: "Enforcement Recommendations", titleAr: "توصيات الإنفاذ", descEn: "Human decisions for enforcement recommendations.", descAr: "قرارات بشرية لتوصيات الإنفاذ.", href: "/admin/enforcement-recommendations", roles: ["compliance_admin"] },
      { glyph: "Ca", titleEn: "Violation Cases", titleAr: "قضايا المخالفات", descEn: "Case lifecycle from inspections and violations.", descAr: "دورة حياة القضايا الناتجة عن التفتيش والمخالفات.", href: "/enforcement", roles: ["compliance_admin"] },
    ],
  },
];

const REVIEW_ROLES = new Set(["compliance_admin", "reviewer"]);
const AUDIT_ROLES = new Set([
  "auditor",
  "ops",
  "security_admin",
  "leadership",
  "reviewer",
  "planner",
  "compliance_admin",
]);

export default async function AdminHome() {
  const [{ locale }, sb] = await Promise.all([useT(), supabaseServer()]);
  const text = (en: string, ar: string) => locale === "ar" ? ar : en;
  const { data: { user } } = await getVerifiedUser(sb);

  const roleRead = user
    ? await sb.from("user_roles").select("role_key").eq("user_id", user.id)
    : { data: [] as { role_key: string }[], error: null };
  const roles = new Set((roleRead.data ?? []).map(row => row.role_key));
  const canReview = !roleRead.error && [...roles].some(role => REVIEW_ROLES.has(role));
  const canAudit = !roleRead.error && [...roles].some(role => AUDIT_ROLES.has(role));
  const authorizedControlGroups = roleRead.error
    ? []
    : CONTROL_GROUPS
      .map(group => ({
        ...group,
        cards: group.cards.filter(card => !card.roles?.length || card.roles.some(role => roles.has(role))),
      }))
      .filter(group => group.cards.length > 0);

  const requestRead = canReview && user
    ? await sb.from("compliance_configuration_requests")
      .select("id,request_number,title,owner_id,submitted_at,current_revision,status")
      .in("status", ["pending_review", "partially_approved", "approved"])
      .neq("owner_id", user.id)
      .order("submitted_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(8)
    : { data: [] as RequestRow[], error: null };
  const requests = (requestRead.data ?? []) as RequestRow[];
  const requestIds = requests.map(row => row.id);
  const componentRead = requestIds.length
    ? await sb.from("compliance_request_components")
      .select("request_id,revision_number,entity_kind")
      .in("request_id", requestIds)
    : { data: [] as ComponentRow[], error: null };
  const components = (componentRead.data ?? []) as ComponentRow[];

  const auditRead = canAudit
    ? await sb.from("audit_events")
      .select("id,actor,object_id,action,occurred_at")
      .eq("object_type", "compliance_configuration_request")
      .eq("action", "CCR_PUBLISHED")
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(8)
    : { data: [] as AuditRow[], error: null };
  const auditRows = (auditRead.data ?? []) as AuditRow[];

  const notConfigured = text("Not configured", "غير مُهيّأ");
  const areaLabel = (row: RequestRow) => {
    if (componentRead.error) return text("Unavailable", "غير متاح");
    const kinds = Array.from(new Set(
      components
        .filter(component => component.request_id === row.id && component.revision_number === row.current_revision)
        .map(component => component.entity_kind),
    ));
    if (!kinds.length) return notConfigured;
    const labels: Record<string, string> = {
      regulation: text("Regulations", "اللوائح"),
      inspection_item: text("Inspection items", "بنود التفتيش"),
      violation: text("Violations", "المخالفات"),
      penalty: text("Penalties", "العقوبات"),
    };
    return kinds.map(kind => labels[kind] ?? kind).join(text(", ", "، "));
  };
  const waitingLabel = (submittedAt: string | null) => {
    if (!submittedAt) return notConfigured;
    const milliseconds = Date.now() - new Date(submittedAt).getTime();
    if (!Number.isFinite(milliseconds) || milliseconds < 0) return notConfigured;
    const hours = Math.floor(milliseconds / 3_600_000);
    if (hours < 24) return text(`${hours}h`, `${hours} س`);
    const days = Math.floor(hours / 24);
    return text(`${days}d`, `${days} ي`);
  };

  const noAuthorizedPanels = !roleRead.error && !canReview && !canAudit;

  return (
    <Shell
      current="/admin"
      title={text("Control Panel", "لوحة التحكم")}
      context={<span className="t-caption">{text(
        "Choose an authorized area, review what is waiting on you, and see what changed recently.",
        "اختر مجالاً مصرحاً به، وراجع ما ينتظر إجراءً منك، واطلع على ما تغيّر مؤخراً.",
      )}</span>}
    >
      {roleRead.error ? (
        <div className="sq-banner sq-banner--warning" role="alert">
          <div>
            <strong>{text("Authorization could not be verified.", "تعذّر التحقق من الصلاحيات.")}</strong>{" "}
            {text("No approval or audit workload is shown.", "لن يتم عرض أعمال الاعتماد أو التدقيق.")}
          </div>
        </div>
      ) : null}

      {noAuthorizedPanels ? (
        <div className="sq-state panel" role="status">
          <span className="sq-state__glyph" aria-hidden="true">✓</span>
          <h3>{text("No administration work panels are assigned to this role", "لا توجد لوحات عمل إدارية مخصصة لهذا الدور")}</h3>
          <p className="t-caption">{text("Use the authorized destinations in the navigation rail.", "استخدم الوجهات المصرّح بها في شريط التنقل.")}</p>
        </div>
      ) : null}

      <section
        className={styles.directory}
        aria-labelledby="admin-control-panel-heading"
        data-saqeel-design="WA-DES-020"
      >
        <header className={styles.directoryHeader}>
          <div>
            <h3 id="admin-control-panel-heading">{text("Platform configuration", "إعدادات المنصة")}</h3>
            <p className="t-caption">{text(
              "Only destinations authorized for your verified roles are listed. Opening a destination grants nothing; its own server and data guards still apply.",
              "تُعرض فقط الوجهات المصرح بها لأدوارك المتحقق منها. فتح الوجهة لا يمنح أي صلاحية؛ وتظل ضوابط الخادم والبيانات الخاصة بها مطبقة.",
            )}</p>
          </div>
          <span className="sq-lozenge sq-lozenge--info">
            {text(
              `${authorizedControlGroups.reduce((count, group) => count + group.cards.length, 0)} authorized tools`,
              `${authorizedControlGroups.reduce((count, group) => count + group.cards.length, 0).toLocaleString("ar-SA")} أداة مصرح بها`,
            )}
          </span>
        </header>
        {authorizedControlGroups.map(group => (
          <section className={styles.controlGroup} key={group.titleEn}>
            <header className={styles.controlGroupHeader}>
              <h4>{locale === "ar" ? group.titleAr : group.titleEn}</h4>
              <span className="t-caption" lang={locale === "ar" ? "en" : "ar"} dir={locale === "ar" ? "ltr" : "rtl"}>
                {locale === "ar" ? group.titleEn : group.titleAr}
              </span>
            </header>
            <div className={styles.controlGrid}>
              {group.cards.map(card => (
                <Link
                  className={`panel sq-link ${styles.controlCard}`}
                  data-control-card
                  href={card.href}
                  key={`${group.titleEn}-${card.titleEn}`}
                >
                  <span className={styles.controlTitle}>
                    <span className="badge badge-info" aria-hidden="true">{card.glyph}</span>
                    <strong>{locale === "ar" ? card.titleAr : card.titleEn}</strong>
                  </span>
                  <span className="t-caption" lang={locale === "ar" ? "en" : "ar"} dir={locale === "ar" ? "ltr" : "rtl"}>
                    {locale === "ar" ? card.titleEn : card.titleAr}
                  </span>
                  <span className="t-caption">{locale === "ar" ? card.descAr : card.descEn}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </section>

      <div className={styles.panels}>
        {canReview ? (
          <section className={`panel ${styles.panel}`} aria-labelledby="waiting-on-you-title">
            <header className={styles.panelHeader}>
              <div>
                <h3 id="waiting-on-you-title">{text("Waiting on you", "بانتظار إجراء منك")}</h3>
                <p className="t-caption">{text(
                  "Submitted configuration requests you are authorized to approve. Your own requests never appear here; decisions remain protected by maker-checker guards.",
                  "طلبات التهيئة المُرسَلة التي تملك صلاحية اعتمادها. لا يظهر هنا ما طلبتَه بنفسك؛ وتظل القرارات محمية بضوابط فصل المُنشئ عن المعتمد.",
                )}</p>
              </div>
              <Link className="btn btn-secondary btn-touch" href="/admin/compliance-approvals?view=pending">
                {text("Open approval queue", "فتح قائمة الاعتماد")}
              </Link>
            </header>
            {requestRead.error || componentRead.error ? (
              <div className="sq-banner sq-banner--warning" role="alert">
                <div>
                  <strong>{text("Approval workload is partially unavailable.", "أعمال الاعتماد غير متاحة جزئياً.")}</strong>{" "}
                  {requestRead.error
                    ? text("The request source could not be read; no empty-queue claim is made.", "تعذّرت قراءة مصدر الطلبات؛ لن يتم الادعاء بأن القائمة فارغة.")
                    : text("Request areas could not be read; the returned requests remain visible.", "تعذّرت قراءة مجالات الطلبات؛ وتظل الطلبات المسترجعة ظاهرة.")}
                </div>
              </div>
            ) : null}
            {!requestRead.error && requests.length === 0 ? (
              <div className="sq-state" role="status" aria-live="polite">
                <span className="sq-state__glyph" aria-hidden="true">✓</span>
                <h4>{text("No requests are waiting on your approval", "لا توجد طلبات بانتظار اعتمادك")}</h4>
              </div>
            ) : null}
            {!requestRead.error && requests.length > 0 ? (
              <div className="sq-tablewrap">
                <table className={`sq-table ${styles.workTable}`}>
                  <thead><tr>
                    <th scope="col">{text("Request", "الطلب")}</th>
                    <th scope="col">{text("Area", "المجال")}</th>
                    <th scope="col">{text("Requested by", "مقدم الطلب")}</th>
                    <th scope="col">{text("Waiting", "مدة الانتظار")}</th>
                    <th scope="col">{text("Next action", "الإجراء التالي")}</th>
                  </tr></thead>
                  <tbody>{requests.map(row => (
                    <tr key={row.id}>
                      <th scope="row"><strong>{row.title}</strong><span className="t-caption"><bdi dir="ltr">{row.request_number}</bdi></span></th>
                      <td>{areaLabel(row)}</td>
                      <td><bdi dir="ltr">{row.owner_id}</bdi></td>
                      <td><bdi dir="ltr">{waitingLabel(row.submitted_at)}</bdi></td>
                      <td><Link className="btn btn-primary btn-touch" href={`/admin/compliance-requests/${row.id}?from=approval-queue`}>{text("Review", "مراجعة")}</Link></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : null}
          </section>
        ) : null}

        {canAudit ? (
          <section className={`panel ${styles.panel}`} aria-labelledby="recent-changes-title">
            <header className={styles.panelHeader}>
              <div>
                <h3 id="recent-changes-title">{text("Recent configuration changes", "آخر تغييرات التهيئة")}</h3>
                <p className="t-caption">{text(
                  "Approved changes inside your authorized scope, read from the append-only Activity Log. No event is summarized or inferred here.",
                  "تغييرات معتمدة داخل نطاقك المصرّح به، مقروءة من سجل النشاط غير القابل للتعديل. لا يُختصر أي حدث ولا يُستنتج.",
                )}</p>
              </div>
              <Link className="btn btn-secondary btn-touch" href="/admin/audit?view=recorder&q=compliance_configuration_request">
                {text("Open Activity Log", "فتح سجل النشاط")}
              </Link>
            </header>
            {auditRead.error ? (
              <div className="sq-banner sq-banner--warning" role="alert">
                <div>
                  <strong>{text("Recent changes are unavailable.", "أحدث التغييرات غير متاحة.")}</strong>{" "}
                  {text("The append-only audit source could not be read; no empty-state claim is made.", "تعذّرت قراءة مصدر التدقيق غير القابل للتعديل؛ لن يتم الادعاء بعدم وجود تغييرات.")}
                </div>
              </div>
            ) : auditRows.length === 0 ? (
              <div className="sq-state" role="status" aria-live="polite">
                <span className="sq-state__glyph" aria-hidden="true">✓</span>
                <h4>{text("No changes returned for this scope", "لم تُعَد أي تغييرات لهذا النطاق")}</h4>
              </div>
            ) : (
              <div className="sq-tablewrap">
                <table className={`sq-table ${styles.workTable}`}>
                  <thead><tr>
                    <th scope="col">{text("Change", "التغيير")}</th>
                    <th scope="col">{text("Area", "المجال")}</th>
                    <th scope="col">{text("Actor", "المنفذ")}</th>
                    <th scope="col">{text("When", "الوقت")}</th>
                  </tr></thead>
                  <tbody>{auditRows.map(row => (
                    <tr key={row.id}>
                      <th scope="row">
                        <strong>{text("Configuration published", "تم نشر التهيئة")}</strong>
                        <span className="t-caption"><bdi dir="ltr">{row.action}</bdi> · <bdi dir="ltr">{row.object_id ?? notConfigured}</bdi> · <bdi dir="ltr">#{row.id}</bdi></span>
                      </th>
                      <td>{text("Compliance configuration", "تهيئة الامتثال")}</td>
                      <td><bdi dir="ltr">{row.actor ?? text("System", "النظام")}</bdi></td>
                      <td><bdi dir="ltr">{row.occurred_at ? new Date(row.occurred_at).toLocaleString(locale === "ar" ? "ar-SA" : "en-GB") : notConfigured}</bdi></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </Shell>
  );
}
