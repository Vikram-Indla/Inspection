export type FactoryRow = {
  readonly id: string;
  readonly name: string;
  readonly factory_code: string | null;
  readonly cr_number: string | null;
  readonly license_number: string | null;
};

export type ImportRunRow = {
  readonly id: string;
  readonly mode: string;
  readonly status: string;
  readonly correlation_id: string | null;
  readonly contract_version: string | null;
  readonly source_file_name: string | null;
  readonly rows_received: number | null;
  readonly rows_accepted: number | null;
  readonly rows_rejected: number | null;
  readonly created_at: string;
};

export type ImportBatchRow = {
  readonly id: string;
  readonly sync_run_id: string | null;
  readonly file_name: string;
  readonly file_sha256: string;
  readonly schema_version: string;
  readonly status: string;
  readonly uploaded_at: string;
};

export type RejectedRow = {
  readonly id: string;
  readonly batch_id: string | null;
  readonly row_number: number;
  readonly status: string;
  readonly safe_error_codes: readonly string[];
};

export type FactoryReconciliationRow = {
  readonly id: string;
  readonly sync_run_id: string | null;
  readonly entity_type: string;
  readonly external_id: string | null;
  readonly outcome: string;
  readonly safe_reason_codes: readonly string[];
  readonly reconciled_at: string;
};

export type RepresentativeRow = {
  readonly id: string;
  readonly full_name: string;
  readonly active: boolean;
};

export type RunWithBatch = {
  readonly run: ImportRunRow;
  readonly batch: ImportBatchRow | null;
};

export type FactoryDataView = {
  readonly factories: readonly FactoryRow[];
  readonly selected: FactoryRow | null;
  readonly runs: readonly RunWithBatch[];
  readonly rejectedRows: readonly RejectedRow[];
  readonly reconciliations: readonly FactoryReconciliationRow[];
  readonly representatives: readonly RepresentativeRow[];
  readonly factoriesFailed: boolean;
  readonly runsFailed: boolean;
  readonly batchesFailed: boolean;
  readonly rejectedFailed: boolean;
  readonly reconciliationFailed: boolean;
  readonly representativesFailed: boolean;
};
