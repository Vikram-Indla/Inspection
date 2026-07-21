import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { KPI_DEFINITIONS } from "@/lib/dashboard-kpi/registry";
import ActionForm from "./ActionForm";
import { createConfigDraft, publishConfigDraft, returnConfigDraft, submitConfigDraft } from "./actions";

export const dynamic = "force-dynamic";

type KpiRow = { metric_key: string; title_en: string; owner_role: string; status: string; retention_status: string };
type HeadRow = { config_key: string; current_version_id: string; activated_at: string };
type VersionRow = { id: string; config_key: string; version_number: number; effective_from: string };
type ParamRow = { id: string; config_key: string; title: string; status: string; revision: number; owner_id: string; return_reason: string | null };

const CONFIG_DOMAINS = [
  "kpi_parameters", "factory_eligibility", "inspection_cycle_policy", "sla_urgency_policy",
  "health_risk_presentation", "health_risk_engine_refs", "layout_visibility", "map_profile",
  "strategic_summary_policy", "operational_nudge_policy", "freshness_offline_policy",
  "localization", "masking_export", "pre_inspection_pack",
] as const;

const statusLozenge: Record<string, string> = {
  implemented: "ax-lozenge--success", not_configured: "ax-lozenge--warning",
  decision_required: "ax-lozenge--warning", unavailable: "ax-lozenge--removed", deferred: "ax-lozenge--info",
};

export default async function DashboardConfigPage() {
  const { t } = await useT();
  const sb = await supabaseServer();

  const [kpiRead, headRead, versionRead, paramRead, roleRead, userRead] = await Promise.all([
    sb.from("mvp3_kpi_definitions").select("metric_key,title_en,owner_role,status,retention_status").order("metric_key"),
    sb.from("dashboard_config_heads").select("config_key,current_version_id,activated_at"),
    sb.from("dashboard_config_versions").select("id,config_key,version_number,effective_from"),
    sb.from("dashboard_config_parameters").select("id,config_key,title,status,revision,owner_id,return_reason").order("updated_at", { ascending: false }),
    sb.from("user_roles").select("role_key"),
    sb.auth.getUser(),
  ]);

  const migrationApplied = !kpiRead.error && !headRead.error && !paramRead.error;
  const kpiRows = (kpiRead.data ?? []) as KpiRow[];
  const heads = (headRead.data ?? []) as HeadRow[];
  const versions = (versionRead.data ?? []) as VersionRow[];
  const params = (paramRead.data ?? []) as ParamRow[];
  const roleKeys = new Set((roleRead.data ?? []).map((r: { role_key: string }) => r.role_key));
  const userId = userRead.data.user?.id ?? null;

  const canWrite = ["compliance_admin", "ops", "security_admin"].some((r) => roleKeys.has(r));
  const canReview = ["compliance_admin", "leadership", "security_admin"].some((r) => roleKeys.has(r));

  const versionById = new Map(versions.map((v) => [v.id, v]));
  const headByKey = new Map(heads.map((h) => [h.config_key, h]));

  const implementedCount = KPI_DEFINITIONS.filter((d) => d.implementation === "implemented").length;

  return (
    <Shell current="/admin/dashboard-config" title={t("admin.dashcfg.title", "Dashboard Configuration")}
      context={<><span className="ax-lozenge ax-lozenge--info">ADM-DASH-001..018</span><span className="ax-caption">Governed KPI catalogue &amp; policy · RLS-scoped · maker-checker</span></>}>

      {!migrationApplied ? (
        <div className="ax-surface"><div className="ax-state" role="alert">
          <span className="ax-state__glyph" aria-hidden="true">⚠</span>
          <h4>Foundation migration not yet applied</h4>
          <p className="ax-caption">The dashboard KPI/configuration tables are not readable. Apply migration
            <code> 20260721010000_dashboard_kpi_admin_foundation.sql</code> and reload. The catalogue below is shown from the code registry.</p>
        </div></div>
      ) : null}

      {/* ---- KPI catalogue (system-seeded, formula immutable to admins) ---- */}
      <section className="ax-surface" aria-labelledby="dashcfg-catalogue">
        <h3 id="dashcfg-catalogue">KPI catalogue</h3>
        <p className="ax-caption">Formula and metric id are system-seeded and immutable to ordinary admins; {implementedCount} of {KPI_DEFINITIONS.length} metrics have a live formula today.</p>
        <div className="ax-tablewrap"><table className="ax-table"><caption className="ax-sr-only">Governed KPI catalogue</caption>
          <thead><tr><th scope="col">Metric</th><th scope="col">Category</th><th scope="col">Unit</th><th scope="col">Owner</th><th scope="col">Delivery</th><th scope="col">Seed</th></tr></thead>
          <tbody>
            {KPI_DEFINITIONS.map((d) => {
              const seeded = kpiRows.find((k) => k.metric_key === d.metricKey);
              return (
                <tr key={d.metricId}>
                  <th scope="row"><strong>{d.metricId}</strong><div className="ax-caption">{d.titleEn}</div></th>
                  <td>{d.category}</td>
                  <td>{d.unit}</td>
                  <td>{d.ownerRole}</td>
                  <td><span className={`ax-lozenge ${statusLozenge[d.implementation] ?? "ax-lozenge--default"}`}>{d.implementation}</span>
                    {d.decisionRef ? <div className="ax-caption">{d.decisionRef}</div> : null}</td>
                  <td>{seeded ? seeded.status : migrationApplied ? "—" : "n/a"}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </section>

      {/* ---- Configuration domains (published versions + effective date) ---- */}
      <section className="ax-surface" aria-labelledby="dashcfg-domains">
        <h3 id="dashcfg-domains">Configuration domains</h3>
        <p className="ax-caption">Each domain publishes an immutable, effective-dated version. Admin configuration may narrow visibility but never widens RLS.</p>
        <div className="ax-tablewrap"><table className="ax-table"><caption className="ax-sr-only">Dashboard configuration domains</caption>
          <thead><tr><th scope="col">Domain</th><th scope="col">Active version</th><th scope="col">Effective from</th><th scope="col">Draft in flight</th></tr></thead>
          <tbody>
            {CONFIG_DOMAINS.map((key) => {
              const head = headByKey.get(key);
              const active = head ? versionById.get(head.current_version_id) : undefined;
              const inFlight = params.find((p) => p.config_key === key && ["draft", "pending_review", "returned"].includes(p.status));
              return (
                <tr key={key}>
                  <th scope="row">{key}</th>
                  <td className="ax-numeric">{active ? `v${active.version_number}` : <span className="ax-lozenge ax-lozenge--warning">Not configured</span>}</td>
                  <td className="ax-numeric">{active ? new Date(active.effective_from).toISOString().slice(0, 10) : "—"}</td>
                  <td>{inFlight ? <span className={`ax-lozenge ax-lozenge--info`}>{inFlight.status} · R{inFlight.revision}</span> : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </section>

      {/* ---- Draft workspace (maker-checker) ---- */}
      <section className="ax-surface" aria-labelledby="dashcfg-drafts">
        <h3 id="dashcfg-drafts">Draft workspace</h3>
        {!canWrite && !canReview ? (
          <p className="ax-caption" role="note">Dashboard configuration authoring requires Compliance/Ops/Security Admin authority; review/publish requires Compliance/Leadership/Security Admin.</p>
        ) : null}

        {canWrite ? (
          <ActionForm action={createConfigDraft} className="dashcfg-create">
            <fieldset><legend>Create configuration draft</legend>
              <label>Domain
                <select name="config_key" required defaultValue="kpi_parameters">
                  {CONFIG_DOMAINS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
              <label>Title<input name="title" type="text" required maxLength={120} /></label>
              <label>Payload (JSON object)<textarea name="payload" rows={3} placeholder='{"expiring_soon_lead_hours": 48}' /></label>
              <button className="ax-btn ax-btn--prominent" type="submit">Create draft</button>
            </fieldset>
          </ActionForm>
        ) : null}

        {params.length === 0 ? (
          <p className="ax-caption" role="status">No configuration drafts in flight.</p>
        ) : (
          <div className="ax-tablewrap"><table className="ax-table"><caption className="ax-sr-only">Configuration drafts</caption>
            <thead><tr><th scope="col">Draft</th><th scope="col">Domain</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
            <tbody>
              {params.map((p) => {
                const isOwner = p.owner_id === userId;
                return (
                  <tr key={p.id}>
                    <th scope="row">{p.title}{p.return_reason ? <div className="ax-caption">Returned: {p.return_reason}</div> : null}</th>
                    <td>{p.config_key}</td>
                    <td><span className="ax-lozenge ax-lozenge--info">{p.status} · R{p.revision}</span></td>
                    <td className="dashcfg-actions">
                      {canWrite && isOwner && ["draft", "returned"].includes(p.status) ? (
                        <ActionForm action={submitConfigDraft}><input type="hidden" name="id" value={p.id} /><button className="ax-btn ax-btn--secondary" type="submit">Submit</button></ActionForm>
                      ) : null}
                      {canReview && !isOwner && p.status === "pending_review" ? (
                        <>
                          <ActionForm action={publishConfigDraft}><input type="hidden" name="id" value={p.id} /><button className="ax-btn ax-btn--prominent" type="submit">Publish</button></ActionForm>
                          <ActionForm action={returnConfigDraft}><input type="hidden" name="id" value={p.id} /><input name="reason" type="text" placeholder="Return reason" required /><button className="ax-btn" type="submit">Return</button></ActionForm>
                        </>
                      ) : null}
                      {p.status === "pending_review" && isOwner ? <span className="ax-caption" role="note">Awaiting an independent reviewer (maker-checker).</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </section>
    </Shell>
  );
}
