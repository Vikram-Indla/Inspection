import type { PostgrestPage } from "@/lib/supabase-pagination";
import type { OperationsClient } from "./client-type";

export type CancellationRequestRow = {
  id: string; visit_id: string; phase: string; reason_key: string; comment: string | null;
  evidence_id: string | null; requested_at: string; status: string;
  decided_at: string | null; decision_reason: string | null;
  visits: { factories: {
    name: string; region: string | null; city: string | null; factory_code: string | null;
  } | null; assignments: { profiles: { full_name: string } | null }[] | null } | null;
};

export type ReturnedInspectionRow = {
  id: string; visit_id: string;
  reviews: { decision: string | null; decided_at: string | null }[] | null;
  visits: { factories: {
    name: string; region: string | null; city: string | null; factory_code: string | null;
  } | null } | null;
};

export type CancellationEvidenceRow = { id: string; storage_path: string | null };

const CANCELLATION_LIMIT = 200;

export function loadCancellationRequests(sb: OperationsClient) {
  return sb.from("cancellation_requests")
    .select("id, visit_id, phase, reason_key, comment, evidence_id, requested_at, status, decided_at, decision_reason, visits(factories(name, region, city, factory_code), assignments(profiles(full_name)))")
    .order("requested_at", { ascending: false })
    .limit(CANCELLATION_LIMIT) as unknown as PromiseLike<PostgrestPage<CancellationRequestRow>>;
}

export function loadReturnedInspections(sb: OperationsClient) {
  return sb.from("inspections")
    .select("id, visit_id, reviews(decision, decided_at), visits(factories(name, region, city, factory_code))")
    .eq("status", "returned") as unknown as PromiseLike<PostgrestPage<ReturnedInspectionRow>>;
}

export function loadCancellationEvidence(sb: OperationsClient, evidenceIds: readonly string[]) {
  return sb.from("evidence")
    .select("id, storage_path")
    .in("id", [...evidenceIds]) as unknown as PromiseLike<PostgrestPage<CancellationEvidenceRow>>;
}
