export const DELEGATION_VIEWS = ["active", "received", "new", "history"] as const;

export type DelegationViewKey = typeof DELEGATION_VIEWS[number];

export type PersonRef = { full_name: string; email: string | null } | null;

export type EffectiveStatus = "active" | "expired" | "revoked";

export type DelegationRow = {
  id: string;
  delegator_id: string;
  delegate_id: string;
  scope: string;
  reason: string;
  starts_at: string;
  ends_at: string;
  status: "active" | "revoked";
  created_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  delegator: PersonRef;
  delegate: PersonRef;
};

export type ScopeOption = { key: string; title: string };

export type DelegationView = {
  activeRows: readonly DelegationRow[];
  receivedRows: readonly DelegationRow[];
  historyRows: readonly DelegationRow[];
  availableScopes: readonly ScopeOption[];
  delegatorName: string;
  readFailed: boolean;
};
