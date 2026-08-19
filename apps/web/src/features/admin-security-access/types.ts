export type AccessReviewRow = {
  id: string;
  subject_user_id: string;
  scope: string;
  purpose: string;
  status: string;
  due_at: string;
  reviewed_at: string | null;
};

export type GrantState = "active" | "revoked" | "expired";

export type EvidenceGrantRow = {
  id: string;
  grantee_user_id: string;
  purpose: string;
  granted_at: string;
  expires_at: string;
  revoked_at: string | null;
  state: GrantState;
};

export type SecurityAccessView = {
  reviews: readonly AccessReviewRow[];
  grants: readonly EvidenceGrantRow[];
  roleCount: number;
  openReviewCount: number;
  overdueCount: number;
  activeGrantCount: number;
  error: boolean;
};
