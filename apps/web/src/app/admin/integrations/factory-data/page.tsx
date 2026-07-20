import Link from "next/link";
import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import CsvImportForm from "./CsvImportForm";
import MasterDataForms from "./MasterDataForms";

export const dynamic = "force-dynamic";

export default async function FactoryDataPage({ searchParams }: { searchParams: Promise<{ factory?: string }> }) {
  const sb = await supabaseServer();
  const selectedFactory = (await searchParams).factory ?? "";
  const [factoriesRead, runsRead, batchesRead, rowsRead, reconciliationRead, representativesRead] = await Promise.all([
    sb.from("factories").select("id,name,factory_code,cr_number,license_number").order("name").limit(250),
    sb.from("senaei_sync_runs").select("id,mode,status,correlation_id,contract_version,source_file_name,rows_received,rows_accepted,rows_rejected,created_at").order("created_at", { ascending: false }).limit(20),
    sb.from("factory_import_batches").select("id,sync_run_id,file_name,file_sha256,schema_version,status,uploaded_at").order("uploaded_at", { ascending: false }).limit(20),
    sb.from("factory_import_rows").select("id,batch_id,row_number,status,safe_error_codes").in("status", ["rejected"]).order("row_number").limit(50),
    sb.from("senaei_reconciliation_records").select("id,sync_run_id,entity_type,external_id,outcome,safe_reason_codes,reconciled_at").order("reconciled_at", { ascending: false }).limit(30),
    selectedFactory ? sb.from("factory_representatives").select("id,full_name,active").eq("factory_id", selectedFactory).order("full_name") : Promise.resolve({ data: [], error: null }),
  ]);
  const schemaUnavailable = [runsRead, batchesRead, rowsRead, reconciliationRead].some(result => result.error);
  const factories = factoriesRead.data ?? [];
  const selected = factories.find(factory => factory.id === selectedFactory);
  const batchByRun = new Map((batchesRead.data ?? []).map(batch => [batch.sync_run_id, batch]));

  return <Shell current="/admin/integrations" title="Factory data integration" context={<span className="ax-lozenge ax-lozenge--info">TASK-FACTORY-360-COMPLETE-010 · P12</span>}>
    <div className="ax-banner"><div><strong>Control plane only.</strong> Factory 360 dossiers are read-only. Provider configuration does not prove connectivity, CSV rows remain staged until a separately governed reconciliation, and source identifiers cannot be silently replaced.</div></div>
    {schemaUnavailable ? <div className="ax-banner ax-banner--warning" role="alert"><div>Factory 360 integration schema is not available in this environment. No provider or history state is inferred.</div></div> : null}

    <div className="ax-grid" style={{ marginBlock: "var(--ax-space-200)" }}>
      <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)" }} aria-labelledby="provider-state"><h3 id="provider-state">Senaei provider</h3>
        <span className="ax-lozenge ax-lozenge--warning">Not configured / not verified here</span><p className="ax-caption">No remote call is made from this page. Undocumented provider domains remain <bdi>SENAEI_API_CONTRACT_NOT_SUPPLIED</bdi>.</p>
      </section>
      <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)" }} aria-labelledby="csv-stage"><h3 id="csv-stage">CSV staging and validation</h3><CsvImportForm /></section>
    </div>

    <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)", marginBlockEnd: "var(--ax-space-200)" }} aria-labelledby="master-data"><h3 id="master-data">Governed factory master-data controls</h3>
      <p className="ax-caption">These retained operations are audit-triggered and RLS-enforced. They do not edit external CR, license, or plant identifiers.</p>
      <form method="get" className="ax-row"><label className="ax-field" style={{ flex: 1 }}><span className="ax-field__label">Factory</span><select className="ax-select" name="factory" defaultValue={selectedFactory}><option value="">Select a factory</option>{factories.map(factory => <option key={factory.id} value={factory.id}>{factory.name} · {factory.factory_code ?? factory.cr_number ?? "—"}</option>)}</select></label><button className="ax-btn ax-btn--secondary">Open controls</button></form>
      {selected ? <><p><strong>{selected.name}</strong> · CR <bdi>{selected.cr_number ?? "—"}</bdi> · License <bdi>{selected.license_number ?? "—"}</bdi> · <Link href={`/factories/${selected.id}`}>Open read-only dossier</Link></p><MasterDataForms factoryId={selected.id} representatives={representativesRead.data ?? []} /></> : null}
    </section>

    <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)" }} aria-labelledby="sync-history"><h3 id="sync-history">Sync and import history</h3>
      <div className="ax-tablewrap"><table className="ax-table"><thead><tr><th>Created</th><th>Mode / source</th><th>Status</th><th>Custody</th><th>Counts</th></tr></thead><tbody>{(runsRead.data ?? []).map(run => { const batch = batchByRun.get(run.id); return <tr key={run.id}><td>{new Date(run.created_at).toLocaleString()}</td><td>{run.mode}<div className="ax-caption">{run.source_file_name ?? "provider"}</div></td><td><span className="ax-lozenge">{run.status}</span>{batch ? <div className="ax-caption">batch {batch.status}</div> : null}</td><td className="ax-caption"><bdi>{run.correlation_id}</bdi>{batch ? <div>SHA-256 <bdi>{batch.file_sha256.slice(0, 12)}…</bdi></div> : null}</td><td>{run.rows_received} / {run.rows_accepted} / {run.rows_rejected}</td></tr>})}{!schemaUnavailable && !(runsRead.data ?? []).length ? <tr><td colSpan={5}>No RLS-visible sync or import runs.</td></tr> : null}</tbody></table></div>
    </section>

    <div className="ax-grid" style={{ marginBlockStart: "var(--ax-space-200)" }}>
      <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)" }}><h3>Rejected staged rows</h3>{(rowsRead.data ?? []).map(row => <div key={row.id}><strong>Row {row.row_number}</strong> <span className="ax-lozenge ax-lozenge--critical">{row.status}</span><p className="ax-caption">{row.safe_error_codes.join(", ")}</p></div>)}{!schemaUnavailable && !(rowsRead.data ?? []).length ? <p className="ax-caption">No rejected staged rows.</p> : null}</section>
      <section className="ax-surface stack" style={{ padding: "var(--ax-space-300)" }}><h3>Reconciliation history</h3>{(reconciliationRead.data ?? []).map(row => <div key={row.id}><strong>{row.entity_type}</strong> · <bdi>{row.external_id ?? "—"}</bdi> <span className="ax-lozenge">{row.outcome}</span><p className="ax-caption">{row.safe_reason_codes.join(", ") || "No reason code"}</p></div>)}{!schemaUnavailable && !(reconciliationRead.data ?? []).length ? <p className="ax-caption">No RLS-visible reconciliation records. Staged does not mean imported.</p> : null}</section>
    </div>
  </Shell>;
}
