import { supabaseServer } from "@/lib/supabase-server";
import type {
  FactoryDataView,
  FactoryReconciliationRow,
  FactoryRow,
  ImportBatchRow,
  ImportRunRow,
  RejectedRow,
  RepresentativeRow,
} from "./types";

export async function loadFactoryData(selectedFactoryId: string): Promise<FactoryDataView> {
  const sb = await supabaseServer();
  const [factoriesRead, runsRead, batchesRead, rowsRead, reconciliationRead, representativesRead] = await Promise.all([
    sb.from("factories").select("id,name,factory_code,cr_number,license_number").order("name").limit(250),
    sb.from("senaei_sync_runs").select("id,mode,status,correlation_id,contract_version,source_file_name,rows_received,rows_accepted,rows_rejected,created_at").order("created_at", { ascending: false }).limit(20),
    sb.from("factory_import_batches").select("id,sync_run_id,file_name,file_sha256,schema_version,status,uploaded_at").order("uploaded_at", { ascending: false }).limit(20),
    sb.from("factory_import_rows").select("id,batch_id,row_number,status,safe_error_codes").in("status", ["rejected"]).order("row_number").limit(50),
    sb.from("senaei_reconciliation_records").select("id,sync_run_id,entity_type,external_id,outcome,safe_reason_codes,reconciled_at").order("reconciled_at", { ascending: false }).limit(30),
    selectedFactoryId
      ? sb.from("factory_representatives").select("id,full_name,active").eq("factory_id", selectedFactoryId).order("full_name")
      : Promise.resolve({ data: [], error: null }),
  ]);

  const factories = (factoriesRead.data ?? []) as FactoryRow[];
  const runs = (runsRead.data ?? []) as ImportRunRow[];
  const batches = (batchesRead.data ?? []) as ImportBatchRow[];
  const batchByRun = new Map(batches.map(batch => [batch.sync_run_id, batch]));

  return {
    factories,
    selected: factories.find(factory => factory.id === selectedFactoryId) ?? null,
    runs: runs.map(run => ({ run, batch: batchByRun.get(run.id) ?? null })),
    rejectedRows: (rowsRead.data ?? []) as RejectedRow[],
    reconciliations: (reconciliationRead.data ?? []) as FactoryReconciliationRow[],
    representatives: (representativesRead.data ?? []) as RepresentativeRow[],
    factoriesFailed: Boolean(factoriesRead.error),
    runsFailed: Boolean(runsRead.error),
    batchesFailed: Boolean(batchesRead.error),
    rejectedFailed: Boolean(rowsRead.error),
    reconciliationFailed: Boolean(reconciliationRead.error),
    representativesFailed: Boolean(representativesRead.error),
  };
}
