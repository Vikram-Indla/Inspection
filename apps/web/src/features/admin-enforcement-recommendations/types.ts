export type PendingFactory = {
  name: string;
  factory_code: string | null;
  city: string | null;
  region: string | null;
} | null;

export type PendingRow = {
  id: string;
  factory_id: string;
  visit_id: string | null;
  recommended_action: string;
  recommendation_notes: string | null;
  recommended_by: string;
  recommended_at: string;
  factory: PendingFactory;
};

export type DecidedRow = {
  id: string;
  factoryName: string | null;
  recommended_action: string;
  status: string;
  decided_at: string | null;
  decision_reason: string | null;
};

export type EnforcementView = {
  roleError: boolean;
  isReader: boolean;
  isDecider: boolean;
  canDecide: boolean;
  pending: readonly PendingRow[];
  decided: readonly DecidedRow[];
  pendingError: boolean;
  decidedError: boolean;
};
