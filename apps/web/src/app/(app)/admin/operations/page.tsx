import Shell from "@/app/(app)/admin/_components/AdminShell";
import Mvp3ActionForm from "@/components/Mvp3ActionForm";
import { publishFeatureFlag, requestErrorRetry } from "../mvp3-actions";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PlatformOperationsPage() {
  const [{ t }, sb] = await Promise.all([useT(), supabaseServer()]);
  const [
    { data: errors, error: errorsError },
    { data: flags, error: flagsError },
    { data: endpoints, error: endpointsError },
  ] = await Promise.all([
    sb.from("mvp3_error_queue").select("id,source,operation,status,attempt_count,last_error_code,created_at").order("created_at", { ascending: false }).limit(50),
    sb.from("mvp3_feature_flags").select("id,flag_key,version,description,enabled,status,created_by,approved_by").order("flag_key"),
    sb.from("mvp3_integration_endpoints").select("id,status"),
  ]);
  const endpointRows = endpoints ?? [];
  const sourceFailures = [
    errorsError ? t("mvp3.operations.errors", "Error queue") : null,
    flagsError ? t("mvp3.operations.flags", "Feature flag versions") : null,
    endpointsError ? t("mvp3.operations.endpoints", "Endpoint contracts") : null,
  ].filter((value): value is string => Boolean(value));
  return (
    <Shell current="/admin/operations" title={t("mvp3.operations.title", "System operations and resilience")}
      context={<span className="badge badge-info">{"M3-00 · CD-050 · "}{t("mvp3.operations.badge", "blocks safely when something fails")}</span>}>
      {sourceFailures.length ? <div className="alert alert-warning" role="alert"><div><strong>{t("mvp3.operations.sourcesUnavailable", "Some data sources aren't available.")}</strong>{" "}{t("mvp3.operations.sourcesUnavailableBody", "Sources that aren't available are listed below. They're never shown as zero or empty.")}<span className="t-caption" style={{ display: "block", marginBlockStart: "var(--space-2)" }}>{sourceFailures.join(" · ")}</span></div></div> : null}
      <div className="sq-grid">
        <section className="panel" style={{ padding: "var(--space-6)" }}><p className="t-caption">{t("mvp3.operations.endpoints", "Endpoint contracts")}</p><strong className="kpi-value">{endpointsError ? t("common.unavailable", "Not available") : endpointRows.length}</strong>{!endpointsError ? <p>{endpointRows.filter(x => x.status === "configured").length} {t("mvp3.operations.configured", "configured")}</p> : null}</section>
        <section className="panel" style={{ padding: "var(--space-6)" }}><p className="t-caption">{t("mvp3.operations.openErrors", "Open error records")}</p><strong className="kpi-value">{errorsError ? t("common.unavailable", "Not available") : (errors ?? []).filter(x => !["resolved"].includes(x.status)).length}</strong>{!errorsError ? <p>{t("mvp3.operations.noThroughput", "No throughput claim is derived from this count.")}</p> : null}</section>
        <section className="panel" style={{ padding: "var(--space-6)" }}><p className="t-caption">{t("mvp3.operations.publishedFlags", "Published flag versions")}</p><strong className="kpi-value">{flagsError ? t("common.unavailable", "Not available") : (flags ?? []).filter(x => x.status === "published").length}</strong>{!flagsError ? <p>{t("mvp3.operations.sod", "Maker-checker enforced.")}</p> : null}</section>
      </div>
      <section className="panel stack" style={{ padding: "var(--space-6)", marginBlockStart: "var(--space-4)" }}><h3>{t("mvp3.operations.errors", "Error queue")}</h3>{errorsError ? <div className="alert alert-warning" role="status">{t("mvp3.operations.sourceUnavailable", "This source is not available. We don't claim it's empty.")}</div> : <div className="table-wrap"><table className="table"><thead><tr><th scope="col">{t("common.source", "Source")}</th><th scope="col">{t("common.operation", "Operation")}</th><th scope="col">{t("common.status", "Status")}</th><th scope="col">{t("mvp3.operations.attempts", "Attempts")}</th><th scope="col">{t("common.action", "Action")}</th></tr></thead><tbody>{(errors ?? []).map(row => <tr key={row.id}><th scope="row">{row.source}</th><td>{row.operation}</td><td><span className="badge badge-warning">{row.status}</span><div className="t-caption">{row.last_error_code ?? "—"}</div></td><td className="numeric">{row.attempt_count}</td><td>{["failed","dependency_blocked"].includes(row.status) ? <Mvp3ActionForm action={requestErrorRetry} submitLabel={t("mvp3.operations.retry", "Request idempotent retry")}><input type="hidden" name="errorId" value={row.id}/></Mvp3ActionForm> : "—"}</td></tr>)}{!(errors ?? []).length ? <tr><td colSpan={5}>{t("mvp3.operations.noErrors", "No error records visible to you. This isn't a claim about system health.")}</td></tr> : null}</tbody></table></div>}</section>
      <section className="panel stack" style={{ padding: "var(--space-6)", marginBlockStart: "var(--space-4)" }}><h3>{t("mvp3.operations.flags", "Feature flag versions")}</h3>{flagsError ? <div className="alert alert-warning" role="status">{t("mvp3.operations.sourceUnavailable", "This source is not available. We don't claim it's empty.")}</div> : <div className="table-wrap"><table className="table"><thead><tr><th scope="col">{t("common.name", "Flag")}</th><th scope="col">{t("common.version", "Version")}</th><th scope="col">{t("common.status", "State")}</th><th scope="col">{t("mvp3.operations.value", "Value")}</th><th scope="col">{t("common.action", "Checker action")}</th></tr></thead><tbody>{(flags ?? []).map(row => <tr key={row.id}><th scope="row">{row.flag_key}<div className="t-caption">{row.description}</div></th><td>{row.version}</td><td><span className="badge">{row.status}</span></td><td>{row.enabled ? t("common.enabled", "Enabled") : t("common.disabled", "Disabled")}</td><td>{row.status === "draft" ? <Mvp3ActionForm action={publishFeatureFlag} submitLabel={t("mvp3.operations.publish", "Approve and publish")}><input type="hidden" name="flagId" value={row.id}/></Mvp3ActionForm> : "—"}</td></tr>)}{!(flags ?? []).length ? <tr><td colSpan={5}>{t("mvp3.operations.noFlags", "No feature flag versions.")}</td></tr> : null}</tbody></table></div>}</section>
      <div className="alert alert-warning" style={{ marginBlockStart: "var(--space-4)" }}><div><strong>{t("mvp3.operations.policyHold", "Retention, backup target, and restore goals are held by policy.")}</strong> {t("mvp3.operations.policyHoldBody", "No purge or successful restore claim is turned on until approved values and evidence of the run exist.")}</div></div>
    </Shell>
  );
}
