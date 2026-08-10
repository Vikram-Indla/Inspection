import { readRows, type ReadResult } from "@/lib/postgrest/read";
import type { Shape } from "@/lib/postgrest/shape";
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

const namedFactory: Shape<{ name: string; region: string | null; city: string | null; factory_code: string | null }> = f => ({
  name: f.text("name"),
  region: f.optionalText("region"),
  city: f.optionalText("city"),
  factory_code: f.optionalText("factory_code"),
});

const cancellationRequestRow: Shape<CancellationRequestRow> = f => ({
  id: f.text("id"),
  visit_id: f.text("visit_id"),
  phase: f.text("phase"),
  reason_key: f.text("reason_key"),
  comment: f.optionalText("comment"),
  evidence_id: f.optionalText("evidence_id"),
  requested_at: f.text("requested_at"),
  status: f.text("status"),
  decided_at: f.optionalText("decided_at"),
  decision_reason: f.optionalText("decision_reason"),
  visits: f.toOne("visits", visit => ({
    factories: visit.toOne("factories", namedFactory),
    assignments: visit.optionalToMany("assignments", assignment => ({
      profiles: assignment.toOne("profiles", profile => ({ full_name: profile.text("full_name") })),
    })),
  })),
});

const returnedInspectionRow: Shape<ReturnedInspectionRow> = f => ({
  id: f.text("id"),
  visit_id: f.text("visit_id"),
  reviews: f.optionalToMany("reviews", review => ({
    decision: review.optionalText("decision"),
    decided_at: review.optionalText("decided_at"),
  })),
  visits: f.toOne("visits", visit => ({
    factories: visit.toOne("factories", namedFactory),
  })),
});

const cancellationEvidenceRow: Shape<CancellationEvidenceRow> = f => ({
  id: f.text("id"),
  storage_path: f.optionalText("storage_path"),
});

export async function loadCancellationRequests(sb: OperationsClient): Promise<ReadResult<CancellationRequestRow>> {
  const response = await sb.from("cancellation_requests")
    .select("id, visit_id, phase, reason_key, comment, evidence_id, requested_at, status, decided_at, decision_reason, visits(factories(name, region, city, factory_code), assignments(profiles(full_name)))")
    .order("requested_at", { ascending: false })
    .limit(CANCELLATION_LIMIT);
  return readRows(response, cancellationRequestRow, "operations.cancellation_requests");
}

export async function loadReturnedInspections(sb: OperationsClient): Promise<ReadResult<ReturnedInspectionRow>> {
  const response = await sb.from("inspections")
    .select("id, visit_id, reviews(decision, decided_at), visits(factories(name, region, city, factory_code))")
    .eq("status", "returned");
  return readRows(response, returnedInspectionRow, "operations.returned_inspections");
}

export async function loadCancellationEvidence(
  sb: OperationsClient,
  evidenceIds: readonly string[],
): Promise<ReadResult<CancellationEvidenceRow>> {
  const response = await sb.from("evidence")
    .select("id, storage_path")
    .in("id", [...evidenceIds]);
  return readRows(response, cancellationEvidenceRow, "operations.cancellation_evidence");
}
