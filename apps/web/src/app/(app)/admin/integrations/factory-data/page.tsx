import Link from "next/link";
import Shell from "@/app/(app)/admin/_components/AdminShell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import CsvImportForm from "./CsvImportForm";
import MasterDataForms from "./MasterDataForms";

export const dynamic = "force-dynamic";

function rawLabel(value: string): string {
  return value.replaceAll("_", " ");
}

export default async function FactoryDataPage({ searchParams }: { searchParams: Promise<{ factory?: string }> }) {
  const [sb, { t }] = await Promise.all([supabaseServer(), useT()]);
  const selectedFactory = (await searchParams).factory ?? "";
  const [factoriesRead, runsRead, batchesRead, rowsRead, reconciliationRead, representativesRead] = await Promise.all([
    sb.from("factories").select("id,name,factory_code,cr_number,license_number").order("name").limit(250),
    sb.from("senaei_sync_runs").select("id,mode,status,correlation_id,contract_version,source_file_name,rows_received,rows_accepted,rows_rejected,created_at").order("created_at", { ascending: false }).limit(20),
    sb.from("factory_import_batches").select("id,sync_run_id,file_name,file_sha256,schema_version,status,uploaded_at").order("uploaded_at", { ascending: false }).limit(20),
    sb.from("factory_import_rows").select("id,batch_id,row_number,status,safe_error_codes").in("status", ["rejected"]).order("row_number").limit(50),
    sb.from("senaei_reconciliation_records").select("id,sync_run_id,entity_type,external_id,outcome,safe_reason_codes,reconciled_at").order("reconciled_at", { ascending: false }).limit(30),
    selectedFactory ? sb.from("factory_representatives").select("id,full_name,active").eq("factory_id", selectedFactory).order("full_name") : Promise.resolve({ data: [], error: null }),
  ]);
  const factories = factoriesRead.data ?? [];
  const selected = factories.find(factory => factory.id === selectedFactory);
  const batchByRun = new Map((batchesRead.data ?? []).map(batch => [batch.sync_run_id, batch]));

  const statusLabel = (value: string) => t(`admin.factoryData.status.${value}`, rawLabel(value));

  return <Shell current="/admin/integrations" title={t("admin.factoryData.title", "Factory data integration")} context={<span className="badge badge-info">TASK-FACTORY-360-COMPLETE-010 · P12</span>}>
    <div className="sq-banner"><div><strong>{t("admin.factoryData.controlPlane", "Control plane only.")}</strong> {t("admin.factoryData.truth", "Factory 360 profiles are read-only. Provider configuration does not prove connectivity, CSV rows remain staged until a separately governed reconciliation, and source identifiers cannot be silently replaced.")}</div></div>

    <div className="sq-grid" style={{ marginBlock: "var(--space-4)" }}>
      <section className="panel stack" style={{ padding: "var(--space-6)", minWidth: 0 }} aria-labelledby="provider-state"><h3 id="provider-state">{t("admin.factoryData.provider", "Senaei provider")}</h3>
        <span className="badge badge-warning">{t("admin.factoryData.notVerified", "Not configured / not verified here")}</span><p className="t-caption">{t("admin.factoryData.noRemoteCall", "No remote call is made from this page. Undocumented provider domains remain")} <bdi dir="ltr">SENAEI_API_CONTRACT_NOT_SUPPLIED</bdi>.</p>
        <p className="t-caption">{t("admin.factoryData.providerHelp", "The governed endpoint contract and its recorded live-call verification state are shown in")} <Link href="/admin/integrations/senai-data?tab=endpoints">{t("admin.factoryData.senaiLink", "SENAI data management")}</Link>. {t("admin.factoryData.configNotConnectivity", "Configuration is not connectivity.")}</p>
      </section>
      <section className="panel stack" style={{ padding: "var(--space-6)", minWidth: 0 }} aria-labelledby="csv-stage"><h3 id="csv-stage">{t("admin.factoryData.csv", "CSV staging and validation")}</h3><CsvImportForm /></section>
    </div>

    <section className="panel stack" style={{ padding: "var(--space-6)", marginBlockEnd: "var(--space-4)", minWidth: 0 }} aria-labelledby="master-data"><h3 id="master-data">{t("admin.factoryData.masterData", "Governed factory master-data controls")}</h3>
      <p className="t-caption">{t("admin.factoryData.masterDataHelp", "These retained operations are audit-triggered and RLS-enforced. They do not edit external CR, license, or plant identifiers.")}</p>
      <p className="t-caption"><strong>{t("admin.factoryData.noWriteback", "FND-007 — no write-back.")}</strong> {t("admin.factoryData.noWritebackHelp", "Everything saved here is recorded in SAQEEL only. No establishment or factory master-data change is forwarded to SENAI: the governed endpoint contract contains no master-data write endpoint, so there is no path for one. Where SENAI remains the source of truth, this screen holds SAQEEL-side metadata as pending-integration scaffolding until a governed reconciliation runs — it does not amend the source.")}</p>
      {factoriesRead.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("admin.factoryData.factoriesError", "The factory registry could not be read. Import and reconciliation history below may still be available.")}</div> : null}
      <form method="get" className="row" style={{ flexWrap: "wrap" }}><label className="sq-field" style={{ flex: "1 1 16rem", minWidth: 0 }}><span className="sq-field__label">{t("admin.factoryData.factory", "Factory")}</span><select className="sq-select" name="factory" defaultValue={selectedFactory}><option value="">{t("admin.factoryData.selectFactory", "Select a factory")}</option>{factories.map(factory => <option key={factory.id} value={factory.id}>{factory.name} · {factory.factory_code ?? factory.cr_number ?? "—"}</option>)}</select></label><button className="btn btn-secondary btn-touch">{t("admin.factoryData.openControls", "Open controls")}</button></form>
      {selected ? <><p style={{ overflowWrap: "anywhere" }}><strong>{selected.name}</strong> · CR <bdi dir="ltr">{selected.cr_number ?? "—"}</bdi> · {t("admin.factoryData.license", "License")} <bdi dir="ltr">{selected.license_number ?? "—"}</bdi> · <Link href={`/factories/${selected.id}`}>{t("admin.factoryData.openDossier", "Open read-only dossier")}</Link></p>{representativesRead.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("admin.factoryData.representativesError", "Representatives could not be read for this factory. Other factory facts remain available.")}</div> : <MasterDataForms factoryId={selected.id} representatives={representativesRead.data ?? []} />}</> : null}
    </section>

    <section className="panel stack" style={{ padding: "var(--space-6)", minWidth: 0 }} aria-labelledby="sync-history"><h3 id="sync-history">{t("admin.factoryData.history", "Sync and import history")}</h3>
      {runsRead.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("admin.factoryData.runsError", "Sync runs could not be read. Rejected rows and reconciliation records remain independently readable below.")}</div> : null}
      {batchesRead.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("admin.factoryData.batchesError", "Batch custody metadata could not be read. Available sync-run facts are preserved without inferred file provenance.")}</div> : null}
      <div className="sq-tablewrap"><table className="sq-table"><thead><tr><th>{t("admin.factoryData.created", "Created")}</th><th>{t("admin.factoryData.modeSource", "Mode / source")}</th><th>{t("common.status", "Status")}</th><th>{t("admin.factoryData.custody", "Custody")}</th><th>{t("admin.factoryData.counts", "Received / accepted / rejected")}</th></tr></thead><tbody>{(runsRead.data ?? []).map(run => { const batch = batchByRun.get(run.id); return <tr key={run.id}><td><time dateTime={run.created_at}>{new Date(run.created_at).toLocaleString()}</time></td><td>{statusLabel(run.mode)}<div className="t-caption"><bdi dir="ltr">{run.mode}</bdi> · {run.source_file_name ?? t("admin.factoryData.providerSource", "provider")}</div></td><td><span className="badge">{statusLabel(run.status)}</span><div className="t-caption"><bdi dir="ltr">{run.status}</bdi></div>{batch ? <div className="t-caption">{t("admin.factoryData.batch", "batch")} {statusLabel(batch.status)} · <bdi dir="ltr">{batch.status}</bdi></div> : null}</td><td className="t-caption" style={{ overflowWrap: "anywhere" }}><bdi dir="ltr">{run.correlation_id}</bdi>{batch ? <div>SHA-256 <bdi dir="ltr">{batch.file_sha256.slice(0, 12)}…</bdi></div> : <div>{t("admin.factoryData.noBatchProvenance", "No batch provenance recorded")}</div>}</td><td className="numeric">{run.rows_received} / {run.rows_accepted} / {run.rows_rejected}</td></tr>})}{!runsRead.error && !(runsRead.data ?? []).length ? <tr><td colSpan={5}>{t("admin.factoryData.noRuns", "No RLS-visible sync or import runs. This is a verified empty read.")}</td></tr> : null}</tbody></table></div>
    </section>

    <div className="sq-grid" style={{ marginBlockStart: "var(--space-4)" }}>
      <section className="panel stack" style={{ padding: "var(--space-6)", minWidth: 0 }}><h3>{t("admin.factoryData.rejected", "Rejected staged rows")}</h3>{rowsRead.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("admin.factoryData.rowsError", "Rejected staged rows could not be read. This is unavailable data, not an empty rejection set.")}</div> : null}{(rowsRead.data ?? []).map(row => <div key={row.id} style={{ overflowWrap: "anywhere" }}><strong>{t("admin.factoryData.row", "Row")} {row.row_number}</strong> <span className="badge badge-critical">{statusLabel(row.status)}</span><div className="t-caption"><bdi dir="ltr">{row.status}</bdi></div><p className="t-caption"><bdi dir="ltr">{row.safe_error_codes.join(", ")}</bdi></p></div>)}{!rowsRead.error && !(rowsRead.data ?? []).length ? <p className="t-caption">{t("admin.factoryData.noRejected", "No rejected staged rows. This is a verified empty read.")}</p> : null}</section>
      <section className="panel stack" style={{ padding: "var(--space-6)", minWidth: 0 }}><h3>{t("admin.factoryData.reconciliation", "Reconciliation history")}</h3>{reconciliationRead.error ? <div className="sq-banner sq-banner--warning" role="alert">{t("admin.factoryData.reconciliationError", "Reconciliation history could not be read. This is unavailable data, not an empty history.")}</div> : null}{(reconciliationRead.data ?? []).map(row => <div key={row.id} style={{ overflowWrap: "anywhere" }}><strong>{statusLabel(row.entity_type)}</strong><div className="t-caption"><bdi dir="ltr">{row.entity_type}</bdi> · <bdi dir="ltr">{row.external_id ?? "—"}</bdi></div><span className="badge">{statusLabel(row.outcome)}</span><div className="t-caption"><bdi dir="ltr">{row.outcome}</bdi> · <time dateTime={row.reconciled_at}>{new Date(row.reconciled_at).toLocaleString()}</time></div><p className="t-caption"><bdi dir="ltr">{row.safe_reason_codes.join(", ") || t("admin.factoryData.noReason", "No reason code")}</bdi></p></div>)}{!reconciliationRead.error && !(reconciliationRead.data ?? []).length ? <p className="t-caption">{t("admin.factoryData.noReconciliation", "No RLS-visible reconciliation records. This is a verified empty read. Staged does not mean imported.")}</p> : null}</section>
    </div>
  </Shell>;
}
