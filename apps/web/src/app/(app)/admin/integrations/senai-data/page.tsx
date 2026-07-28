// SENAI data management console — built to
// designs/admin/admin/SAQEEL Admin SENAI Data.dc.html (Sources · Endpoints ·
// Field mapping · Sync & reconcile).
//
// Truth rules applied here:
//  * FND-007 — SAQEEL reads and reconciles SENAI; it never writes establishment
//    or factory master data back. The banner is not a slogan: the write-back
//    assertion is derived from the governed endpoint registry at render time.
//  * Documented is not connected. Endpoint rows show the contract from
//    lib/integrations/senaei/contract.ts and the live-call verification state
//    from recorded `senaei_sync_calls` rows only. Where no call is recorded the
//    row says so — it never implies health.
//  * No policy value, threshold, SLA, record count or freshness figure is
//    invented. Anything without a governed source renders "Not configured".
import Link from "next/link";
import Shell from "@/app/(app)/admin/_components/AdminShell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import {
  SENAEI_CONTRACT_ENDPOINTS,
  SENAEI_MASTER_DATA_WRITE_BACK_ENDPOINTS,
  type SenaeiContractEndpoint,
} from "@/lib/integrations/senaei/contract";
import styles from "./senai-data.module.css";

export const dynamic = "force-dynamic";

const TABS = ["sources", "endpoints", "mapping", "reconcile"] as const;
type Tab = (typeof TABS)[number];

type SyncCall = {
  id: string;
  endpoint_key: string;
  http_method: string;
  outcome: string;
  http_status: number | null;
  safe_error_code: string | null;
  occurred_at: string;
};

const NOT_CONFIGURED = "Not configured";

function outcomeBadge(outcome: string): string {
  if (outcome === "accepted") return "badge badge-compliant";
  if (outcome === "rejected" || outcome === "dependency_blocked") return "badge badge-warning";
  return "badge badge-critical";
}

function statusBadge(status: string): string {
  if (status === "validated") return "badge badge-compliant";
  if (status === "configured") return "badge badge-warning";
  return "badge badge-disabled";
}

function runBadge(status: string): string {
  if (status === "completed") return "badge badge-compliant";
  if (status === "partial" || status === "queued" || status === "running") return "badge badge-warning";
  return "badge badge-critical";
}

function stamp(value: string | null): string {
  return value ? new Date(value).toISOString().slice(0, 16).replace("T", " ") : "—";
}

export default async function SenaiDataPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ t }, sb, params] = await Promise.all([useT(), supabaseServer(), searchParams]);
  const requested = params.tab;
  const tab: Tab = TABS.includes(requested as Tab) ? (requested as Tab) : "sources";

  const [connectionsRead, runsRead, callsRead, reconciliationRead] = await Promise.all([
    sb.from("external_source_connections")
      .select("id,provider_key,environment,contract_version,base_url_origin,auth_mode,configuration_status,enabled,last_validated_at")
      .order("provider_key"),
    sb.from("senaei_sync_runs")
      .select("id,connection_id,mode,status,correlation_id,contract_version,rows_received,rows_accepted,rows_rejected,started_at,completed_at,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    sb.from("senaei_sync_calls")
      .select("id,endpoint_key,http_method,outcome,http_status,safe_error_code,occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(200),
    sb.from("senaei_reconciliation_records")
      .select("id,entity_type,external_id,outcome,safe_reason_codes,reconciled_at")
      .in("outcome", ["conflict", "rejected", "dependency_blocked"])
      .order("reconciled_at", { ascending: false })
      .limit(30),
  ]);

  const connections = connectionsRead.data ?? [];
  const runs = runsRead.data ?? [];
  const calls = (callsRead.data ?? []) as SyncCall[];
  const conflicts = reconciliationRead.data ?? [];

  // Latest recorded call per endpoint key. Reads are ordered newest-first, so the
  // first sighting of a key is its latest call. Absence stays absence.
  const latestCall = new Map<string, SyncCall>();
  for (const call of calls) if (!latestCall.has(call.endpoint_key)) latestCall.set(call.endpoint_key, call);

  const callsByConnection = new Map<string, number>();
  for (const run of runs) if (run.connection_id) callsByConnection.set(run.connection_id, (callsByConnection.get(run.connection_id) ?? 0) + 1);
  const latestRunByConnection = new Map<string, (typeof runs)[number]>();
  for (const run of runs) if (run.connection_id && !latestRunByConnection.has(run.connection_id)) latestRunByConnection.set(run.connection_id, run);

  const latestRun = runs[0] ?? null;
  const reconciledRows = runs.reduce((total, run) => total + (run.rows_accepted ?? 0), 0);
  const receivedRows = runs.reduce((total, run) => total + (run.rows_received ?? 0), 0);
  const rejectedRows = runs.reduce((total, run) => total + (run.rows_rejected ?? 0), 0);
  const partialConnections = connections.filter(row => row.configuration_status !== "validated").length;
  const verifiedEndpoints = SENAEI_CONTRACT_ENDPOINTS.filter(endpoint => latestCall.has(endpoint.key)).length;
  const writeBackEndpoints = SENAEI_MASTER_DATA_WRITE_BACK_ENDPOINTS.length;

  const tabLabels: Record<Tab, string> = {
    sources: t("admin.senai.tab.sources", "Sources"),
    endpoints: t("admin.senai.tab.endpoints", "Endpoints"),
    mapping: t("admin.senai.tab.mapping", "Field mapping"),
    reconcile: t("admin.senai.tab.reconcile", "Sync & reconcile"),
  };
  const enumLabel = (value: string) =>
    t(`admin.senai.value.${value}`, value.replaceAll("_", " "));

  return (
    <Shell
      current="/admin/integrations"
      title={t("admin.senai.title", "SENAI data management")}
      context={
        <span className="row" style={{ gap: "var(--space-3)" }}>
          <span className="t-caption">
            {t("admin.senai.subtitle", "Upstream source registry, endpoint contract, mapping, sync & reconciliation — read-only source of truth")}
          </span>
          <Link className="btn btn-secondary btn-sm" href="/admin/integrations">{t("admin.senai.back", "System Connections")}</Link>
        </span>
      }
      topbar={
        <nav className={styles.tabs} aria-label={t("admin.senai.tabsLabel", "SENAI data sections")}>
          {TABS.map(key => (
            <Link
              key={key}
              className={`${styles.tab} ${key === tab ? styles.tabActive : ""}`}
              href={`/admin/integrations/senai-data?tab=${key}`}
              aria-current={key === tab ? "page" : undefined}
            >
              {tabLabels[key]}
            </Link>
          ))}
        </nav>
      }
    >
      <div className={styles.body}>
        {/* FND-007. The claim is derived, not asserted: it holds only while the
            governed registry contains no master-data write-back endpoint. */}
        <div className={`panel ${styles.note}`} role="note">
          <span className="t-compact" style={{ color: "var(--text-secondary)" }}>
            {t("admin.senai.fnd007", "SENAI is the source of truth for factory identity, licences and industrial data. SAQEEL reads and reconciles — it never writes back.")}{" "}
            <strong>
              {writeBackEndpoints === 0
                ? t("admin.senai.fnd007.derived", "holds: the governed endpoint contract contains no establishment master-data write-back.")
                : t("admin.senai.fnd007.breach", "breach: the governed endpoint contract now contains a master-data write endpoint. Stop and escalate.")}
            </strong>{" "}
            {t("admin.senai.fnd007.snapshot", "Observed-on-inspection snapshots are captured separately and never overwrite the source.")}
          </span>
        </div>

        {tab === "sources" ? (
          <>
            <div className={styles.actionRow}>
              <span className="t-caption">
                {t("admin.senai.sources.help", "Source data is read-only; this registry records which connections SAQEEL consumes. Configuration is not connectivity.")}
              </span>
            </div>
            {connectionsRead.error ? (
              <div className={`panel ${styles.note}`} role="alert">
                <span className="t-compact">{t("admin.senai.sources.error", "Source connections could not be read. Endpoint contract and recorded calls remain independently available.")}</span>
              </div>
            ) : null}
            {runsRead.error ? (
              <div className={`panel ${styles.note}`} role="alert">
                <span className="t-compact">{t("admin.senai.sources.runsError", "Recorded runs could not be read. Available connection configuration is preserved without inferred freshness or counts.")}</span>
              </div>
            ) : null}
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">{t("admin.senai.sources.caption", "Registered upstream source connections")}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t("admin.senai.sources.col.system", "Source system")}</th>
                    <th scope="col">{t("admin.senai.sources.col.env", "Environment")}</th>
                    <th scope="col">{t("admin.senai.sources.col.contract", "Contract")}</th>
                    <th scope="col">{t("admin.senai.sources.col.runs", "Recorded runs")}</th>
                    <th scope="col">{t("admin.senai.sources.col.freshness", "Last recorded run")}</th>
                    <th scope="col">{t("admin.senai.sources.col.status", "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map(row => {
                    const run = latestRunByConnection.get(row.id);
                    return (
                      <tr key={row.id}>
                        <th scope="row">
                          <strong><bdi dir="ltr">{row.provider_key}</bdi></strong>
                          <div className="t-caption"><bdi dir="ltr">{row.base_url_origin ?? NOT_CONFIGURED}</bdi></div>
                        </th>
                        <td>{enumLabel(row.environment)}<div className="t-caption"><bdi dir="ltr">{row.environment}</bdi></div></td>
                        <td><span className="id-code">{row.contract_version ?? NOT_CONFIGURED}</span></td>
                        <td className="cell-num numeric">{runsRead.error ? t("admin.senai.unavailable", "Unavailable") : callsByConnection.get(row.id) ?? 0}</td>
                        <td><span className="id-code">{runsRead.error ? t("admin.senai.unavailable", "Unavailable") : run ? <time dateTime={run.created_at}>{stamp(run.created_at)}</time> : t("admin.senai.sources.noRun", "No run recorded")}</span></td>
                        <td>
                          <span className={statusBadge(row.configuration_status)}>{enumLabel(row.configuration_status)}</span>
                          <div className="t-caption"><bdi dir="ltr">{row.configuration_status}</bdi></div>
                          {!row.enabled ? <div className="t-caption">{t("admin.senai.sources.disabled", "disabled")}</div> : null}
                        </td>
                      </tr>
                    );
                  })}
                  {!connectionsRead.error && connections.length === 0 ? (
                    <tr><td colSpan={6}>{t("admin.senai.sources.empty", "No source connection is registered. This is a verified empty read, not a failure.")}</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <p className="t-caption" style={{ margin: 0 }}>
              {runsRead.error
                ? t("admin.senai.sources.footerUnavailable", "Run freshness and counts are unavailable because the run source failed. Connection facts above remain readable.")
                : t("admin.senai.sources.footer", "Record counts and freshness are shown only where a sync run recorded them. Nothing on this screen is estimated.")}
            </p>
          </>
        ) : null}

        {tab === "endpoints" ? (
          <>
            <div className={styles.actionRow}>
              <span className="t-caption">
                {t("admin.senai.endpoints.help", "The documented read contract SAQEEL is permitted to call. This is the same allow-list the runtime client enforces.")}
              </span>
              <span className="grow" />
              <span className="badge badge-info">
                {callsRead.error
                  ? t("admin.senai.endpoints.verificationUnavailableShort", "Live-call verification unavailable")
                  : <>{verifiedEndpoints}/{SENAEI_CONTRACT_ENDPOINTS.length} {t("admin.senai.endpoints.verified", "with a recorded live call")}</>}
              </span>
            </div>
            {callsRead.error ? (
              <div className={`panel ${styles.note}`} role="alert">
                <span className="t-compact">{t("admin.senai.endpoints.callsError", "Recorded live calls could not be read. The governed endpoint allow-list remains visible, but live-call verification is unavailable—not unverified.")}</span>
              </div>
            ) : null}
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">{t("admin.senai.endpoints.caption", "Governed SENAI endpoint contract and recorded call verification")}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t("admin.senai.endpoints.col.method", "Method")}</th>
                    <th scope="col">{t("admin.senai.endpoints.col.endpoint", "Endpoint")}</th>
                    <th scope="col">{t("admin.senai.endpoints.col.purpose", "Purpose")}</th>
                    <th scope="col">{t("admin.senai.endpoints.col.lastCall", "Last recorded call")}</th>
                    <th scope="col">{t("admin.senai.endpoints.col.verification", "Live-call verification")}</th>
                  </tr>
                </thead>
                <tbody>
                  {SENAEI_CONTRACT_ENDPOINTS.map((endpoint: SenaeiContractEndpoint) => {
                    const call = latestCall.get(endpoint.key);
                    return (
                      <tr key={endpoint.key}>
                        <td><span className="badge badge-info">{endpoint.method}</span></td>
                        <th scope="row">
                          <span className="id-code"><bdi dir="ltr">{endpoint.template}</bdi></span>
                          <div className="t-caption">
                            {endpoint.authFamily === "public_v3"
                              ? t("admin.senai.endpoints.publicRoot", "public v3 root")
                              : t("admin.senai.endpoints.gatedRoot", "credential-gated root")}
                          </div>
                        </th>
                        <td>
                          {endpoint.purpose}
                          {endpoint.governanceBlock ? (
                            <div className="t-caption">
                              <span className="badge badge-warning">{endpoint.governanceBlock}</span>{" "}
                              {t("admin.senai.endpoints.blocked", "forwarding is governed off; nothing is sent")}
                            </div>
                          ) : null}
                        </td>
                        <td><span className="id-code">{callsRead.error ? t("admin.senai.unavailable", "Unavailable") : call ? <time dateTime={call.occurred_at}>{stamp(call.occurred_at)}</time> : "—"}</span></td>
                        <td>
                          {callsRead.error ? (
                            <>
                              <span className="badge badge-warning">{t("admin.senai.unavailable", "Unavailable")}</span>
                              <div className="t-caption">{t("admin.senai.endpoints.verificationUnavailable", "Live-call history could not be read.")}</div>
                            </>
                          ) : call ? (
                            <>
                              <span className={outcomeBadge(call.outcome)}>{enumLabel(call.outcome)}</span>
                              <div className="t-caption">
                                <bdi dir="ltr">{call.outcome}</bdi> ·{" "}
                                {call.http_status !== null ? <>HTTP <bdi dir="ltr" className="numeric">{call.http_status}</bdi></> : t("admin.senai.endpoints.noStatus", "no HTTP status recorded")}
                                {call.safe_error_code ? <> · <span className="id-code"><bdi dir="ltr">{call.safe_error_code}</bdi></span></> : null}
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="badge badge-disabled">{t("admin.senai.endpoints.unverified", "not verified")}</span>
                              <div className="t-caption">{t("admin.senai.endpoints.noCall", "No live call recorded. Documented is not connected.")}</div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="t-caption" style={{ margin: 0 }}>
              {t("admin.senai.endpoints.footer", "Verification comes only from recorded senaei_sync_calls rows. A non-success response degrades the dependent Factory 360 section with an honest “temporarily unavailable” — never a fabricated value. Endpoints outside this contract are refused by the client before any request leaves the server.")}
            </p>
          </>
        ) : null}

        {tab === "mapping" ? (
          <>
            <div className={styles.actionRow}>
              <span className="t-caption">
                {t("admin.senai.mapping.help", "How SENAI fields map to internal fields, with transform and status.")}
              </span>
            </div>
            <section className="panel" style={{ padding: "var(--space-6)" }} aria-labelledby="senai-mapping-h">
              <h3 id="senai-mapping-h" style={{ marginBlockStart: 0 }}>{t("admin.senai.mapping.heading", "Field mapping registry")}</h3>
              <p className="t-caption" style={{ margin: 0 }}>
                <span className="badge badge-warning">{NOT_CONFIGURED}</span>{" "}
                {t("admin.senai.mapping.body", "No governed field-mapping registry exists in the applied schema, so no mapping rule can be shown. Inventing SENAI-to-internal field mappings, transforms or enum maps here is prohibited: they change how source data is interpreted downstream. Until a mapping registry is approved and applied, the adapters in lib/integrations/senaei/adapters remain the only mapping authority and unmapped fields surface downstream as “not configured”.")}
              </p>
            </section>
          </>
        ) : null}

        {tab === "reconcile" ? (
          <>
            <div className={styles.kpis}>
              <div className="kpi">
                <div className="kpi-label">{t("admin.senai.kpi.lastSync", "Last recorded sync")}</div>
                <div className="kpi-value numeric">{runsRead.error ? t("admin.senai.unavailable", "Unavailable") : latestRun ? stamp(latestRun.created_at) : "—"}</div>
                <div className="kpi-delta">{runsRead.error ? t("admin.senai.unavailable", "Unavailable") : latestRun ? <>{enumLabel(latestRun.status)} · <bdi dir="ltr">{latestRun.status}</bdi></> : t("admin.senai.kpi.noRun", "no run recorded")}</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">{t("admin.senai.kpi.accepted", "Rows accepted")}</div>
                <div className="kpi-value numeric">{runsRead.error ? t("admin.senai.unavailable", "Unavailable") : reconciledRows}</div>
                <div className="kpi-delta">{runsRead.error ? t("admin.senai.kpi.sourceUnavailable", "Run source unavailable") : <>{t("admin.senai.kpi.of", "of")} {receivedRows} {t("admin.senai.kpi.received", "received")}</>}</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">{t("admin.senai.kpi.rejected", "Rows rejected")}</div>
                <div className={`kpi-value numeric ${styles.warnValue}`}>{runsRead.error ? t("admin.senai.unavailable", "Unavailable") : rejectedRows}</div>
                <div className="kpi-delta">{runsRead.error ? t("admin.senai.kpi.sourceUnavailable", "Run source unavailable") : t("admin.senai.kpi.staged", "staged is not imported")}</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">{t("admin.senai.kpi.unvalidated", "Sources not validated")}</div>
                <div className="kpi-value numeric">{connectionsRead.error ? t("admin.senai.unavailable", "Unavailable") : partialConnections}</div>
                <div className="kpi-delta">{connectionsRead.error ? t("admin.senai.kpi.sourceUnavailable", "Source registry unavailable") : <>{t("admin.senai.kpi.ofConnections", "of")} {connections.length}</>}</div>
              </div>
            </div>

            {runsRead.error ? (
              <div className={`panel ${styles.note}`} role="alert">
                <span className="t-compact">{t("admin.senai.recon.runsError", "Sync runs could not be read. Aggregate row counts and freshness are unavailable; reconciliation divergences below remain independent.")}</span>
              </div>
            ) : null}
            {connectionsRead.error ? (
              <div className={`panel ${styles.note}`} role="alert">
                <span className="t-compact">{t("admin.senai.recon.connectionsError", "Source connections could not be read. The source-validation count is unavailable; recorded run and divergence facts are preserved.")}</span>
              </div>
            ) : null}
            {reconciliationRead.error ? (
              <div className={`panel ${styles.note}`} role="alert">
                <span className="t-compact">{t("admin.senai.recon.error", "Reconciliation divergences could not be read. This is unavailable data, not a verified empty divergence set.")}</span>
              </div>
            ) : null}
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">{t("admin.senai.recon.caption", "Recorded reconciliation divergences")}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t("admin.senai.recon.col.entity", "Entity")}</th>
                    <th scope="col">{t("admin.senai.recon.col.external", "Source identifier")}</th>
                    <th scope="col">{t("admin.senai.recon.col.outcome", "Outcome")}</th>
                    <th scope="col">{t("admin.senai.recon.col.reason", "Reason codes")}</th>
                    <th scope="col">{t("admin.senai.recon.col.at", "Recorded")}</th>
                  </tr>
                </thead>
                <tbody>
                  {conflicts.map(row => (
                    <tr key={row.id}>
                      <th scope="row">{enumLabel(row.entity_type)}<div className="t-caption"><bdi dir="ltr">{row.entity_type}</bdi></div></th>
                      <td><span className="id-code"><bdi dir="ltr">{row.external_id ?? "—"}</bdi></span></td>
                      <td><span className="badge badge-warning">{enumLabel(row.outcome)}</span><div className="t-caption"><bdi dir="ltr">{row.outcome}</bdi></div></td>
                      <td className="t-caption"><bdi dir="ltr">{(row.safe_reason_codes ?? []).join(", ") || t("admin.senai.recon.noReason", "No reason code recorded")}</bdi></td>
                      <td><span className="id-code"><time dateTime={row.reconciled_at}>{stamp(row.reconciled_at)}</time></span></td>
                    </tr>
                  ))}
                  {!reconciliationRead.error && conflicts.length === 0 ? (
                    <tr><td colSpan={5}>{t("admin.senai.recon.empty", "No unresolved divergence is recorded. This is a verified empty read.")}</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <p className="t-caption" style={{ margin: 0 }}>
              {t("admin.senai.recon.footer", "Resolution is a governed reconciliation action, not an edit on this screen. SAQEEL never silently overwrites a divergence in either direction, and never writes the resolution back to SENAI.")}
            </p>
            <div className="row" style={{ gap: "var(--space-3)" }}>
              <Link className="btn btn-secondary btn-touch" href="/admin/integrations/factory-data">
                {t("admin.senai.recon.openHistory", "Open sync, staging and reconciliation history")}
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </Shell>
  );
}
