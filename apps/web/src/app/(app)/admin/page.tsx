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
        "What is waiting on you, and what changed recently. Move between areas from the side navigation. Only the areas your roles authorize are shown.",
        "ما ينتظر إجراءً منك، وما تغيّر مؤخراً. تنقّل بين المجالات من الشريط الجانبي. وتُعرض المجالات المصرّح بها لأدوارك فقط.",
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
