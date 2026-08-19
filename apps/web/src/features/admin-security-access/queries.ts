import { supabaseServer } from "@/lib/supabase-server";
import type { AccessReviewRow, EvidenceGrantRow, GrantState, SecurityAccessView } from "./types";

function grantState(row: { revoked_at: string | null; expires_at: string }, now: number): GrantState {
  if (row.revoked_at) return "revoked";
  return new Date(row.expires_at).getTime() > now ? "active" : "expired";
}

export async function loadSecurityAccess(): Promise<SecurityAccessView> {
  const sb = await supabaseServer();
  const [reviewsRead, grantsRead, rolesRead] = await Promise.all([
    sb.from("mvp3_access_reviews").select("id,subject_user_id,scope,purpose,status,due_at,reviewed_at").order("due_at"),
    sb.from("mvp3_evidence_access_grants").select("id,grantee_user_id,purpose,granted_at,expires_at,revoked_at").order("expires_at"),
    sb.from("user_roles").select("user_id", { count: "exact", head: true }),
  ]);

  const now = Date.now();
  const reviews = (reviewsRead.data ?? []) as AccessReviewRow[];
  const grants: EvidenceGrantRow[] = (grantsRead.data ?? []).map(row => ({
    ...(row as Omit<EvidenceGrantRow, "state">),
    state: grantState(row, now),
  }));

  return {
    reviews,
    grants,
    roleCount: rolesRead.count ?? 0,
    openReviewCount: reviews.filter(row => row.status === "open").length,
    overdueCount: reviews.filter(row => row.status === "open" && new Date(row.due_at).getTime() < now).length,
    activeGrantCount: grants.filter(row => row.state === "active").length,
    error: Boolean(reviewsRead.error),
  };
}
