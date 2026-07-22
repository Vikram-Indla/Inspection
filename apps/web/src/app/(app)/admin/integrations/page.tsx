import Shell from "@/components/Shell";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const [{ t }, sb] = await Promise.all([useT(), supabaseServer()]);
  const [{ data: endpoints, error }, { data: events }, { data: exports }] = await Promise.all([
    sb.from("mvp3_integration_endpoints").select("id,endpoint_key,display_name,endpoint_kind,contract_version,status,updated_at").order("display_name"),
    sb.from("mvp3_api_events").select("id,event_kind,direction,outcome,correlation_id,occurred_at").order("occurred_at", { ascending: false }).limit(20),
    sb.from("mvp3_export_jobs").select("id,export_kind,purpose,status,artifact_hash,requested_at,completed_at").order("requested_at", { ascending: false }).limit(20),
  ]);
  return (
    <Shell current="/admin/integrations" title={t("mvp3.integrations.title", "Integration trust console")}
      context={<span className="badge badge-info">{"M3-00 · CD-050 · "}{t("mvp3.integrations.badge", "14 controlled rows")}</span>}>
      <div className="ax-banner"><div><strong>{t("mvp3.integrations.truth", "Configuration is not connectivity.")}</strong> {t("mvp3.integrations.truthBody", "An endpoint becomes configured only with an approved contract and runtime address. Secrets are never displayed here.")}</div></div>
      <div className="row" style={{ marginBlock: "var(--space-4)" }}><Link className="btn btn-secondary btn-touch" href="/admin/integrations/factory-data">Factory data integration and import</Link></div>
      {error ? <div className="ax-banner ax-banner--warning" role="alert">{t("mvp3.schema.pending", "MVP3 database contract is not applied in this environment. No data is inferred.")}</div> : null}
      <section className="panel stack" style={{ padding: "var(--space-6)" }} aria-labelledby="integration-registry">
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}><div><h3 id="integration-registry">{t("mvp3.integrations.registry", "Governed endpoint registry")}</h3><p className="t-caption">{t("mvp3.integrations.registryHelp", "Contract version, runtime state and dependency truth—not secret material.")}</p></div><span className="badge">{(endpoints ?? []).length} endpoints</span></div>
        <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th scope="col">{t("common.name", "Name")}</th><th scope="col">{t("common.type", "Type")}</th><th scope="col">{t("common.version", "Contract")}</th><th scope="col">{t("common.status", "Truth status")}</th></tr></thead><tbody>
          {(endpoints ?? []).map(row => <tr key={row.id}><th scope="row">{row.display_name}<div className="t-caption">{row.endpoint_key}</div></th><td>{row.endpoint_kind}</td><td><span className="ax-version">{row.contract_version}</span></td><td><span className={`ax-lozenge ${row.status === "configured" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{row.status.replaceAll("_", " ")}</span></td></tr>)}
          {!error && !(endpoints ?? []).length ? <tr><td colSpan={4}>{t("mvp3.integrations.empty", "No endpoints are registered. This is a verified empty read.")}</td></tr> : null}
        </tbody></table></div>
      </section>
      <div className="ax-grid" style={{ marginBlockStart: "var(--space-4)" }}>
        <section className="panel stack" style={{ padding: "var(--space-6)" }}><h3>{t("mvp3.integrations.events", "API and rule events")}</h3><p className="t-caption">{t("mvp3.integrations.eventsHelp", "Append-only outcomes linked by correlation ID.")}</p>{(events ?? []).slice(0, 8).map(e => <div className="row" key={e.id} style={{ justifyContent: "space-between" }}><span><strong>{e.event_kind}</strong><small className="t-caption"> · {e.direction}</small></span><span className="badge">{e.outcome}</span></div>)}{!(events ?? []).length ? <p className="t-caption">{t("mvp3.integrations.noEvents", "No RLS-visible events.")}</p> : null}</section>
        <section className="panel stack" style={{ padding: "var(--space-6)" }}><h3>{t("mvp3.integrations.exports", "Data-sharing exports")}</h3><p className="t-caption">{t("mvp3.integrations.exportsHelp", "Prepared is not delivered. Delivery requires an artifact hash and receipt.")}</p>{(exports ?? []).slice(0, 8).map(e => <div className="row" key={e.id} style={{ justifyContent: "space-between" }}><span><strong>{e.export_kind}</strong><small className="t-caption"> · {e.purpose}</small></span><span className="badge">{e.status}</span></div>)}{!(exports ?? []).length ? <p className="t-caption">{t("mvp3.integrations.noExports", "No RLS-visible export jobs.")}</p> : null}</section>
      </div>
    </Shell>
  );
}
