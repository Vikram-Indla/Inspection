export type ErrorQueueRow = {
  id: string;
  source: string;
  operation: string;
  status: string;
  attempt_count: number;
  last_error_code: string | null;
  created_at: string;
};

export type FeatureFlagRow = {
  id: string;
  flag_key: string;
  version: number;
  description: string;
  enabled: boolean;
  status: string;
  created_by: string | null;
  approved_by: string | null;
};

export type StatusCount = { key: string; count: number };

export type OperationsView = {
  errors: readonly ErrorQueueRow[];
  flags: readonly FeatureFlagRow[];
  endpointCount: number;
  configuredCount: number;
  openErrorCount: number;
  publishedFlagCount: number;
  errorStatusCounts: readonly StatusCount[];
  errorsError: boolean;
  flagsError: boolean;
  endpointsError: boolean;
};
