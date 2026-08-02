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

const BADGE_BY_STATUS: Record<string, string> = {
  implemented: "badge-compliant",
  not_configured: "badge-warning",
  decision_required: "badge-warning",
  unavailable: "badge-disabled",
  deferred: "badge-info",
};

/** Honest label for what a sponsor must supply to unblock a KPI. */
function unblockNote(def: (typeof KPI_DEFINITIONS)[number]): string | null {
  if (def.implementation === "implemented") return null;
  const parts: string[] = [];
  if (def.decisionRef) parts.push(`Open decision: ${def.decisionRef}`);
  if (def.note) parts.push(def.note);
  if (parts.length === 0) return "Pending governance approval.";
  return parts.join(" · ");
}

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

  const canWrite = ["admin", "supervisor"].some((r) => roleKeys.has(r));
  const canReview = roleKeys.has("admin");

  const versionById = new Map(versions.map((v) => [v.id, v]));
  const headByKey = new Map(heads.map((h) => [h.config_key, h]));

  const implementedCount = KPI_DEFINITIONS.filter((d) => d.implementation === "implemented").length;

  return (
    <Shell current="/admin/dashboard-config" title={t("admin.dashcfg.title", "Dashboard Configuration")}
      context={<><span className="badge badge-info">ADM-DASH-001..018</span><span className="t-caption">Governed KPI catalogue &amp; policy · filtered to your access · maker-checker</span></>}>

      <div style={{ maxWidth: 1040, width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>

        {!migrationApplied ? (
          <div className="panel" style={{ padding: 18 }} role="alert">
            <div className="alert alert-warning" style={{ margin: 0 }}>
              <strong>Foundation migration not yet applied</strong>
              <p className="t-caption" style={{ margin: "4px 0 0" }}>The dashboard KPI/configuration tables are not readable. Apply migration
                <code className="id-code"> 20260721010000_dashboard_kpi_admin_foundation.sql</code> and reload. The catalogue below is shown from the code registry.</p>
            </div>
          </div>
        ) : null}

        {/* ---- KPI catalogue (system-seeded, formula immutable to admins) ---- */}
        <section className="panel" style={{ padding: 18 }} aria-labelledby="dashcfg-catalogue">
          <h3 id="dashcfg-catalogue" style={{ fontSize: "var(--type-heading-size)", fontWeight: 600, margin: "0 0 4px" }}>KPI catalogue</h3>
          <p className="t-caption" style={{ margin: "0 0 12px" }}>Formula and metric id are system-seeded and immutable to ordinary admins; <strong>{implementedCount} of {KPI_DEFINITIONS.length}</strong> metrics have a live formula today.</p>
          <div className="table-wrap"><table className="table"><caption className="sr-only">Governed KPI catalogue</caption>
            <thead><tr><th scope="col">Metric</th><th scope="col">Category</th><th scope="col">Unit</th><th scope="col">Owner</th><th scope="col">Delivery</th><th scope="col">Seed</th></tr></thead>
            <tbody>
              {KPI_DEFINITIONS.map((d) => {
                const seeded = kpiRows.find((k) => k.metric_key === d.metricKey);
                const badge = BADGE_BY_STATUS[d.implementation] ?? "badge-outline";
                const note = unblockNote(d);
                return (
                  <tr key={d.metricId}>
                    <th scope="row">
                      <span className="id-code" style={{ fontWeight: 600, fontSize: 12 }}>{d.metricId}</span>
                      <div className="t-caption">{d.titleEn}</div>
                      {note ? <div className="t-caption" style={{ color: "var(--status-warning-text)", maxWidth: 320 }}>{note}</div> : null}
                    </th>
                    <td>{d.category}</td>
                    <td>{d.unit}</td>
                    <td className="t-caption">{d.ownerRole}</td>
                    <td>
                      <span className={`badge ${badge}`}><span className="dot" aria-hidden="true" />{d.implementation}</span>
                      {d.decisionRef ? <div className="t-caption">{d.decisionRef}</div> : null}
                    </td>
                    <td className="t-caption">{seeded ? "seeded" : migrationApplied ? "—" : "n/a"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </section>

        {/* ---- Configuration domains (published versions + effective date) ---- */}
        <section className="panel" style={{ padding: 18 }} aria-labelledby="dashcfg-domains">
          <h3 id="dashcfg-domains" style={{ fontSize: "var(--type-heading-size)", fontWeight: 600, margin: "0 0 4px" }}>Configuration domains</h3>
          <p className="t-caption" style={{ margin: "0 0 12px" }}>Each domain publishes an immutable, effective-dated version. Admin configuration may narrow visibility but never widens RLS.</p>
          <div className="table-wrap"><table className="table"><caption className="sr-only">Dashboard configuration domains</caption>
            <thead><tr><th scope="col">Domain</th><th scope="col">Active version</th><th scope="col">Effective from</th><th scope="col">Draft in flight</th></tr></thead>
            <tbody>
              {CONFIG_DOMAINS.map((key) => {
                const head = headByKey.get(key);
                const active = head ? versionById.get(head.current_version_id) : undefined;
                const inFlight = params.find((p) => p.config_key === key && ["draft", "pending_review", "returned"].includes(p.status));
                return (
                  <tr key={key}>
                    <th scope="row"><span className="id-code">{key}</span></th>
                    <td className="cell-num">{active ? <span className="badge badge-compliant"><span className="dot" aria-hidden="true" />v{active.version_number}</span> : <span className="badge badge-warning"><span className="dot" aria-hidden="true" />Not configured</span>}</td>
                    <td className="cell-num">{active ? <span className="id-code">{new Date(active.effective_from).toISOString().slice(0, 10)}</span> : "—"}</td>
                    <td>{inFlight ? <span className="badge badge-info">{inFlight.status} · R{inFlight.revision}</span> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </section>

        {/* ---- Draft workspace (maker-checker) ---- */}
        <section className="panel" style={{ padding: 18 }} aria-labelledby="dashcfg-drafts">
          <h3 id="dashcfg-drafts" style={{ fontSize: "var(--type-heading-size)", fontWeight: 600, margin: "0 0 12px" }}>Drafts <span className="t-caption" style={{ fontWeight: 400 }}>maker-checker</span></h3>

          {!canWrite && !canReview ? (
            <p className="t-caption" role="note">Dashboard configuration authoring requires Compliance/Ops/Security Admin authority; review/publish requires Compliance/Leadership/Security Admin.</p>
          ) : null}

          {canWrite ? (
            <ActionForm action={createConfigDraft}>
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr auto", gap: 12, alignItems: "end", padding: 12, background: "var(--surface-sunken)", borderRadius: 8, marginBlockEnd: 16 }}>
                <label className="stack" style={{ gap: 4 }}>
                  <span className="t-label">Domain</span>
                  <select name="config_key" required defaultValue="kpi_parameters" className="select">
                    {CONFIG_DOMAINS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </label>
                <label className="stack" style={{ gap: 4 }}>
                  <span className="t-label">Title</span>
                  <input name="title" type="text" required maxLength={120} className="input" placeholder="Draft title" />
                </label>
                <button className="btn btn-primary" type="submit">Create draft</button>
              </div>
            </ActionForm>
          ) : null}

          {params.length === 0 ? (
            <p className="t-caption" role="status">No configuration drafts in flight.</p>
          ) : (
            <div className="table-wrap"><table className="table"><caption className="sr-only">Configuration drafts</caption>
              <thead><tr><th scope="col">Draft</th><th scope="col">Domain</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
              <tbody>
                {params.map((p) => {
                  const isOwner = p.owner_id === userId;
                  return (
                    <tr key={p.id}>
                      <th scope="row">{p.title}{p.return_reason ? <div className="t-caption" style={{ color: "var(--status-critical-text)" }}>Returned: {p.return_reason}</div> : null}</th>
                      <td><span className="id-code">{p.config_key}</span></td>
                      <td><span className="badge badge-info">{p.status} · R{p.revision}</span></td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {canWrite && isOwner && ["draft", "returned"].includes(p.status) ? (
                          <ActionForm action={submitConfigDraft}><input type="hidden" name="id" value={p.id} /><button className="btn btn-secondary btn-sm" type="submit">Submit</button></ActionForm>
                        ) : null}
                        {canReview && !isOwner && p.status === "pending_review" ? (
                          <span style={{ display: "inline-flex", gap: 6 }}>
                            <ActionForm action={publishConfigDraft}><input type="hidden" name="id" value={p.id} /><button className="btn btn-primary btn-sm" type="submit">Publish</button></ActionForm>
                            <ActionForm action={returnConfigDraft}><input type="hidden" name="id" value={p.id} /><input name="reason" type="text" placeholder="Return reason" required className="input" style={{ width: 160 }} /><button className="btn btn-ghost btn-sm" type="submit">Return</button></ActionForm>
                          </span>
                        ) : null}
                        {p.status === "pending_review" && isOwner ? <span className="t-caption" role="note">Awaiting an independent reviewer (maker-checker).</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          )}
          <p className="t-caption" style={{ margin: "12px 0 0" }}>Authoring requires Compliance/Ops/Security Admin; review/publish requires Compliance/Leadership/Security Admin — and never the same person (maker ≠ checker).</p>
        </section>
      </div>
    </Shell>
  );
}
