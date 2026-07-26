import Shell from "@/components/Shell";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function rawLabel(value: string): string {
  return value.replaceAll("_", " ");
}

export default async function IntegrationsPage() {
  const [{ t }, sb] = await Promise.all([useT(), supabaseServer()]);
  const [endpointsRead, eventsRead, exportsRead] = await Promise.all([
    sb.from("mvp3_integration_endpoints").select("id,endpoint_key,display_name,endpoint_kind,contract_version,status,updated_at").order("display_name"),
    sb.from("mvp3_api_events").select("id,event_kind,direction,outcome,correlation_id,occurred_at").order("occurred_at", { ascending: false }).limit(20),
    sb.from("mvp3_export_jobs").select("id,export_kind,purpose,status,artifact_hash,requested_at,completed_at").order("requested_at", { ascending: false }).limit(20),
  ]);
  const endpoints = endpointsRead.data ?? [];
  const events = eventsRead.data ?? [];
  const exports = exportsRead.data ?? [];

  const statusLabel = (value: string) =>
    t(`mvp3.integrations.status.${value}`, rawLabel(value));
  const kindLabel = (value: string) =>
    t(`mvp3.integrations.kind.${value}`, rawLabel(value));

  return (
    <Shell current="/admin/integrations" title={t("mvp3.integrations.title", "Integration trust console")}
      context={<span className="badge badge-info">M3-00 · CD-050</span>}>
      <div className="sq-banner"><div><strong>{t("mvp3.integrations.truth", "Configuration is not connectivity.")}</strong> {t("mvp3.integrations.truthBody", "An endpoint becomes configured only with an approved contract and runtime address. Secrets are never displayed here.")}</div></div>
      <div className="row" style={{ marginBlock: "var(--space-4)", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <Link className="btn btn-secondary btn-touch" href="/admin/integrations/senai-data">{t("mvp3.integrations.senaiData", "SENAI data management")}</Link>
        <Link className="btn btn-secondary btn-touch" href="/admin/integrations/factory-data">{t("mvp3.integrations.factoryData", "Factory data integration and import")}</Link>
      </div>
      <section className="panel stack" style={{ padding: "var(--space-6)" }} aria-labelledby="integration-registry">
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}><div><h3 id="integration-registry">{t("mvp3.integrations.registry", "Governed endpoint registry")}</h3><p className="t-caption">{t("mvp3.integrations.registryHelp", "Contract version, runtime state and dependency truth—not secret material.")}</p></div><span className="badge">{(endpoints ?? []).length} endpoints</span></div>
        {endpointsRead.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("mvp3.integrations.registryError", "The endpoint registry could not be read. Event and export data below may still be available.")}</div> : null}
        <div className="sq-tablewrap"><table className="sq-table"><thead><tr><th scope="col">{t("common.name", "Name")}</th><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.version", "Contract")}</th><th scope="col">{t("common.status", "Truth status")}</th></tr></thead><tbody>
          {endpoints.map(row => <tr key={row.id}><th scope="row">{row.display_name}<div className="t-caption"><bdi dir="ltr">{row.endpoint_key}</bdi></div></th><td>{kindLabel(row.endpoint_kind)}<div className="t-caption"><bdi dir="ltr">{row.endpoint_kind}</bdi></div></td><td><span className="sq-version"><bdi dir="ltr">{row.contract_version}</bdi></span></td><td><span className={`sq-lozenge ${row.status === "configured" ? "sq-lozenge--success" : "sq-lozenge--warning"}`}>{statusLabel(row.status)}</span><div className="t-caption"><bdi dir="ltr">{row.status}</bdi> · {t("mvp3.integrations.updated", "recorded")} <time dateTime={row.updated_at}>{new Date(row.updated_at).toLocaleString()}</time></div></td></tr>)}
          {!endpointsRead.error && endpoints.length === 0 ? <tr><td colSpan={4}>{t("mvp3.integrations.empty", "No endpoints are registered. This is a verified empty read.")}</td></tr> : null}
        </tbody></table></div>
      </section>
      <div className="sq-grid" style={{ marginBlockStart: "var(--space-4)" }}>
        <section className="panel stack" style={{ padding: "var(--space-6)", minWidth: 0 }}><h3>{t("mvp3.integrations.events", "API and rule events")}</h3><p className="t-caption">{t("mvp3.integrations.eventsHelp", "Append-only outcomes linked by correlation ID.")}</p>{eventsRead.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("mvp3.integrations.eventsError", "API events could not be read. This is unavailable data, not an empty event history.")}</div> : null}{events.slice(0, 8).map(e => <div className="row" key={e.id} style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", overflowWrap: "anywhere" }}><span><strong>{kindLabel(e.event_kind)}</strong><small className="t-caption"> · {kindLabel(e.direction)}</small><small className="t-caption" style={{ display: "block" }}><bdi dir="ltr">{e.event_kind}</bdi> · <bdi dir="ltr">{e.direction}</bdi> · <time dateTime={e.occurred_at}>{new Date(e.occurred_at).toLocaleString()}</time></small></span><span><span className="badge">{statusLabel(e.outcome)}</span><small className="t-caption" style={{ display: "block" }}><bdi dir="ltr">{e.outcome}</bdi></small></span></div>)}{!eventsRead.error && events.length === 0 ? <p className="t-caption">{t("mvp3.integrations.noEvents", "No RLS-visible events. This is a verified empty read.")}</p> : null}</section>
        <section className="panel stack" style={{ padding: "var(--space-6)", minWidth: 0 }}><h3>{t("mvp3.integrations.exports", "Data-sharing exports")}</h3><p className="t-caption">{t("mvp3.integrations.exportsHelp", "Prepared is not delivered. Delivery requires an artifact hash and receipt.")}</p>{exportsRead.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("mvp3.integrations.exportsError", "Export jobs could not be read. This is unavailable data, not an empty export history.")}</div> : null}{exports.slice(0, 8).map(e => <div className="row" key={e.id} style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", overflowWrap: "anywhere" }}><span><strong>{kindLabel(e.export_kind)}</strong><small className="t-caption"> · {e.purpose}</small><small className="t-caption" style={{ display: "block" }}><bdi dir="ltr">{e.export_kind}</bdi> · <time dateTime={e.requested_at}>{new Date(e.requested_at).toLocaleString()}</time></small></span><span><span className="badge">{statusLabel(e.status)}</span><small className="t-caption" style={{ display: "block" }}><bdi dir="ltr">{e.status}</bdi></small></span></div>)}{!exportsRead.error && exports.length === 0 ? <p className="t-caption">{t("mvp3.integrations.noExports", "No RLS-visible export jobs. This is a verified empty read.")}</p> : null}</section>
      </div>
    </Shell>
  );
}
