import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { getVerifiedUser } from "@/lib/verified-user";
import { getUserRoles } from "@/lib/persona";
import { isAdminOnlyPersona } from "@/lib/shell-navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { getLocale, type Locale } from "@/lib/i18n";
import RevampExecutionWorkspace from "./RevampExecutionWorkspace";
import { parseExecutionWorkspaceRead } from "./read-model";

export const dynamic = "force-dynamic";

const EXECUTION_READ_ROLES = new Set(["inspector", "planner", "supervisor", "admin"]);

export default async function ExecutionPage() {
  const sb = await supabaseServer();
  const locale = await getLocale();
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const [{ data: roleRows, error: roleError }, { data: executionPayload, error: executionError }] = await Promise.all([
    getUserRoles(user.id),
    sb.rpc("execution_workspace_read" as never, { p_limit: 1000 } as never),
  ]);
  const roleKeys = (roleRows ?? []).map(row => row.role_key);
  const canReadExecution = roleKeys.some(role => EXECUTION_READ_ROLES.has(role));

  if (!roleError && (isAdminOnlyPersona(roleKeys) || !canReadExecution)) {
    return (
      <Shell current="/execution" title="">
        <section className="panel panel-body" role="alert">
          <span aria-hidden="true">🔒</span>
          <h1>{copy("You do not have access to this destination", "ليس لديك صلاحية الوصول إلى هذه الوجهة")}</h1>
          <p>{copy("The destination stays visible so the platform remains legible, and access is refused here, at the boundary.", "تظل الوجهة ظاهرة لسهولة فهم المنصة، ويُرفض الوصول هنا عند حد الصلاحية.")}</p>
          <div>
            <a className="btn btn-primary" href="/profile">{copy("Request access", "طلب الوصول")}</a>
            <a className="btn btn-secondary" href="/dashboard">{copy("Back to default state", "العودة إلى الصفحة الافتراضية")}</a>
          </div>
          <small>{copy("Execution is refused for an Administrator-only persona. Backend RLS remains authoritative.", "يُرفض التنفيذ لحساب يقتصر على دور المسؤول. وتظل سياسات أمان الصفوف في قاعدة البيانات هي المرجع.")}</small>
        </section>
      </Shell>
    );
  }

  if (executionError || roleError) {
    return (
      <Shell current="/execution" title="">
        <div className="alert alert-critical" role="alert">
          <div><strong>{copy("Execution data is temporarily unavailable.", "بيانات التنفيذ غير متاحة مؤقتاً.")}</strong> {copy("Nothing was changed; retry this destination.", "لم يتم تغيير أي شيء؛ أعد محاولة فتح هذه الوجهة.")}</div>
        </div>
      </Shell>
    );
  }

  const read = parseExecutionWorkspaceRead(executionPayload, locale);
  if (read.status === "invalid") {
    return (
      <Shell current="/execution" title="">
        <div className="alert alert-critical" role="alert">
          <div><strong>{copy("Execution data is temporarily unavailable.", "بيانات التنفيذ غير متاحة مؤقتاً.")}</strong> {copy("The governed response could not be verified. Nothing was changed.", "تعذّر التحقق من الاستجابة المعتمدة. لم يتم تغيير أي شيء.")}</div>
        </div>
      </Shell>
    );
  }
  const rows = read.rows.filter(row => !isTestFixtureEstablishment({
    name: row.factory,
    factory_code: row.factoryCode,
  }));

  return (
    <Shell current="/execution" title="">
      {read.status === "degraded" ? (
        <div className="alert alert-info" role="status">
          <div><strong>{copy("Some execution records are unavailable.", "بعض سجلات التنفيذ غير متاحة.")}</strong> {copy(`${read.omittedRows} malformed record${read.omittedRows === 1 ? "" : "s"} were withheld rather than shown as verified data.`, `تم حجب ${read.omittedRows} من السجلات غير الصالحة بدلاً من عرضها كبيانات موثقة.`)}</div>
        </div>
      ) : null}
      <RevampExecutionWorkspace rows={rows} currentUserId={user.id} locale={locale satisfies Locale} totalVisibleRows={read.visibleCount} />
    </Shell>
  );
}
