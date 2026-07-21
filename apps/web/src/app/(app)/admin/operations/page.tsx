import Shell from "@/components/Shell";
import Mvp3ActionForm from "@/components/Mvp3ActionForm";
import { publishFeatureFlag, requestErrorRetry } from "../mvp3-actions";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export default async function PlatformOperationsPage() {
  const [{ t }, sb] = await Promise.all([useT(), supabaseServer()]);
  const [{ data: errors, error }, { data: flags }, { data: endpoints }] = await Promise.all([
    sb.from("mvp3_error_queue").select("id,source,operation,status,attempt_count,last_error_code,created_at").order("created_at", { ascending: false }).limit(50),
    sb.from("mvp3_feature_flags").select("id,flag_key,version,description,enabled,status,created_by,approved_by").order("flag_key"),
    sb.from("mvp3_integration_endpoints").select("id,status"),
  ]);
  const endpointRows = endpoints ?? [];
  return (
    <Shell current="/admin/operations" title={t("mvp3.operations.title", "System operations and resilience")}
      context={<span className="ax-lozenge ax-lozenge--info">{"M3-00 · CD-050 · "}{t("mvp3.operations.badge", "fail-closed operations")}</span>}>
      {error ? <div className="ax-banner ax-banner--warning" role="alert">{t("mvp3.schema.pending", "MVP3 database contract is not applied in this environment. No data is inferred.")}</div> : null}
      <div className="ax-grid">
        <section className="ax-surface" style={{ padding: "var(--ax-space-300)" }}><p className="ax-caption">{t("mvp3.operations.endpoints", "Endpoint contracts")}</p><strong className="ax-display">{endpointRows.length}</strong><p>{endpointRows.filter(x => x.status === "configured").length} {t("mvp3.operations.configured", "configured")}</p></section>
        <section className="ax-surface" style={{ padding: "var(--ax-space-300)" }}><p className="ax-caption">{t("mvp3.operations.openErrors", "Open error records")}</p><strong className="ax-display">{(errors ?? []).filter(x => !["resolved"].includes(x.status)).length}</strong><p>{t("mvp3.operations.noThroughput", "No throughput claim is derived from this count.")}</p></section>
        <section className="ax-surface" style={{ padding: "var(--ax-space-300)" }}><p className="ax-caption">{t("mvp3.operations.publishedFlags", "Published flag versions")}</p><strong className="ax-display">{(flags ?? []).filter(x => x.status === "published").length}</strong><p>{t("mvp3.operations.sod", "Maker-checker enforced.")}</p></section>
      </div>
      <section className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", marginBlockStart: "var(--ax-space-200)" }}><h3>{t("mvp3.operations.errors", "Error queue")}</h3><div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.source", "Source")}</th><th scope="col">{t("common.operation", "Operation")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("mvp3.operations.attempts", "Attempts")}</th><th scope="col">{t("common.action", "Governed action")}</th></tr></thead><tbody>{(errors ?? []).map(row => <tr key={row.id}><th scope="row">{row.source}</th><td>{row.operation}</td><td><span className="ax-lozenge ax-lozenge--warning">{row.status}</span><div className="ax-caption">{row.last_error_code ?? "—"}</div></td><td className="ax-numeric">{row.attempt_count}</td><td>{["failed","dependency_blocked"].includes(row.status) ? <Mvp3ActionForm action={requestErrorRetry} submitLabel={t("mvp3.operations.retry", "Request idempotent retry")}><input type="hidden" name="errorId" value={row.id}/></Mvp3ActionForm> : "—"}</td></tr>)}{!error && !(errors ?? []).length ? <tr><td colSpan={5}>{t("mvp3.operations.noErrors", "No RLS-visible error records. This is not a platform-health assertion.")}</td></tr> : null}</tbody></table></div></section>
      <section className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", marginBlockStart: "var(--ax-space-200)" }}><h3>{t("mvp3.operations.flags", "Feature flag versions")}</h3><div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.name", "Flag")}</th><th scope="col">{t("common.version", "Version")}</th><th scope="col">{t("common.status", "State")}</th><th scope="col">{t("mvp3.operations.value", "Value")}</th><th scope="col">{t("common.action", "Checker action")}</th></tr></thead><tbody>{(flags ?? []).map(row => <tr key={row.id}><th scope="row">{row.flag_key}<div className="ax-caption">{row.description}</div></th><td>{row.version}</td><td><span className="ax-lozenge">{row.status}</span></td><td>{row.enabled ? t("common.enabled", "Enabled") : t("common.disabled", "Disabled")}</td><td>{row.status === "draft" ? <Mvp3ActionForm action={publishFeatureFlag} submitLabel={t("mvp3.operations.publish", "Approve and publish")}><input type="hidden" name="flagId" value={row.id}/></Mvp3ActionForm> : "—"}</td></tr>)}{!(flags ?? []).length ? <tr><td colSpan={5}>{t("mvp3.operations.noFlags", "No feature flag versions.")}</td></tr> : null}</tbody></table></div></section>
      <div className="ax-banner ax-banner--warning" style={{ marginBlockStart: "var(--ax-space-200)" }}><div><strong>{t("mvp3.operations.policyHold", "Retention, backup target and restore objectives remain policy-held.")}</strong> {t("mvp3.operations.policyHoldBody", "No purge or successful restore claim is enabled until approved values and executed evidence exist.")}</div></div>
    </Shell>
  );
}
