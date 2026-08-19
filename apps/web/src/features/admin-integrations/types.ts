export type EndpointRow = {
  readonly id: string;
  readonly endpoint_key: string;
  readonly display_name: string;
  readonly endpoint_kind: string;
  readonly contract_version: string | null;
  readonly status: string;
  readonly updated_at: string;
};

export type ApiEventRow = {
  readonly id: string;
  readonly event_kind: string;
  readonly direction: string;
  readonly outcome: string;
  readonly correlation_id: string | null;
  readonly occurred_at: string;
};

export type ExportJobRow = {
  readonly id: string;
  readonly export_kind: string;
  readonly purpose: string;
  readonly status: string;
  readonly artifact_hash: string | null;
  readonly requested_at: string;
  readonly completed_at: string | null;
};

export type IntegrationsView = {
  readonly endpoints: readonly EndpointRow[];
  readonly events: readonly ApiEventRow[];
  readonly exports: readonly ExportJobRow[];
  readonly configuredCount: number;
  readonly endpointsFailed: boolean;
  readonly eventsFailed: boolean;
  readonly exportsFailed: boolean;
};
