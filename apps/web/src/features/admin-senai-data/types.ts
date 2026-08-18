import type { SenaeiContractEndpoint } from "@/lib/integrations/senaei/contract";

export type ConnectionRow = {
  readonly id: string;
  readonly provider_key: string;
  readonly environment: string;
  readonly contract_version: string | null;
  readonly base_url_origin: string | null;
  readonly auth_mode: string | null;
  readonly configuration_status: string;
  readonly enabled: boolean;
  readonly last_validated_at: string | null;
};

export type RunRow = {
  readonly id: string;
  readonly connection_id: string | null;
  readonly mode: string;
  readonly status: string;
  readonly correlation_id: string | null;
  readonly contract_version: string | null;
  readonly rows_received: number | null;
  readonly rows_accepted: number | null;
  readonly rows_rejected: number | null;
  readonly started_at: string | null;
  readonly completed_at: string | null;
  readonly created_at: string;
};

export type CallRow = {
  readonly id: string;
  readonly endpoint_key: string;
  readonly http_method: string;
  readonly outcome: string;
  readonly http_status: number | null;
  readonly safe_error_code: string | null;
  readonly occurred_at: string;
};

export type ReconciliationRow = {
  readonly id: string;
  readonly entity_type: string;
  readonly external_id: string | null;
  readonly outcome: string;
  readonly safe_reason_codes: readonly string[] | null;
  readonly reconciled_at: string;
};

export type ConnectionView = {
  readonly row: ConnectionRow;
  readonly latestRun: RunRow | null;
  readonly callCount: number;
};

export type EndpointView = {
  readonly endpoint: SenaeiContractEndpoint;
  readonly call: CallRow | null;
};

export type SenaiDataView = {
  readonly connections: readonly ConnectionView[];
  readonly endpoints: readonly EndpointView[];
  readonly divergences: readonly ReconciliationRow[];
  readonly verifiedEndpoints: number;
  readonly totalEndpoints: number;
  readonly writeBackEndpoints: number;
  readonly latestRun: RunRow | null;
  readonly reconciledRows: number;
  readonly receivedRows: number;
  readonly rejectedRows: number;
  readonly partialConnections: number;
  readonly totalConnections: number;
  readonly connectionsFailed: boolean;
  readonly runsFailed: boolean;
  readonly callsFailed: boolean;
  readonly reconciliationFailed: boolean;
};
