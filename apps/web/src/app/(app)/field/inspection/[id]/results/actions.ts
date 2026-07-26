"use server";

/**
 * Server actions for Visit Report · Results (Step 3 of 4).
 * Design of record: designs/pwa/pwa/SAQEEL PWA-Field Visit Results.dc.html
 *
 * Persistence targets the tables added in 20260726042050_visit_result_reports:
 * visit_result_reports plus the visit_result_samples / visit_result_seized_products
 * repeaters. Authorization is RLS, not these functions — every statement below
 * runs as the caller. The database also carries guard_submitted_inspection, so
 * once the inspection reaches submitted/under_review/approved/rejected every
 * write here fails with IMMUTABLE and the screen reports it rather than
 * pretending the edit landed. That is the design's "Final version — not
 * editable" state, enforced server-side.
 */

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type SampleRow = { id?: string; ordinal: number; sample_name: string | null };
export type SeizedRow = { id?: string; ordinal: number; product_name: string | null; quantity: string | null };

export type ResultsDraft = {
  /** null = unanswered. Never coerced to false — see the migration comment. */
  specialty_visit_needed: boolean | null;
  competent_department: string | null;
  specialty_notes: string | null;
  samples_taken: boolean | null;
  products_seized: boolean | null;
  pending_document_type: string | null;
  inspector_notes: string | null;
  samples: SampleRow[];
  seized: SeizedRow[];
};

export type SaveResult =
  | { kind: "ok"; reportId: string }
  | { kind: "immutable" }
  | { kind: "signed_out" }
  | { kind: "error"; message: string };

/** Postgres raises this from guard_submitted_inspection once the inspection locks. */
function isImmutable(message: string | undefined): boolean {
  return Boolean(message && message.includes("IMMUTABLE"));
}

export async function saveResults(inspectionId: string, draft: ResultsDraft): Promise<SaveResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return { kind: "signed_out" };

  // visit_id is a denormalised anchor; read it rather than trusting the client.
  const { data: inspection, error: insErr } = await sb
    .from("inspections").select("id, visit_id").eq("id", inspectionId).maybeSingle();
  if (insErr) return { kind: "error", message: insErr.message };
  if (!inspection) return { kind: "error", message: "inspection not found" };

  const { data: report, error: upsertErr } = await sb
    .from("visit_result_reports")
    .upsert({
      inspection_id: inspectionId,
      visit_id: inspection.visit_id,
      specialty_visit_needed: draft.specialty_visit_needed,
      competent_department: draft.competent_department,
      specialty_notes: draft.specialty_notes,
      samples_taken: draft.samples_taken,
      products_seized: draft.products_seized,
      pending_document_type: draft.pending_document_type,
      inspector_notes: draft.inspector_notes,
    }, { onConflict: "inspection_id" })
    .select("id")
    .maybeSingle();

  if (upsertErr) {
    return isImmutable(upsertErr.message)
      ? { kind: "immutable" }
      : { kind: "error", message: upsertErr.message };
  }
  if (!report) return { kind: "error", message: "report not returned" };

  // Repeater rows are replaced wholesale per save. The ordinal uniques are
  // DEFERRABLE, so the delete-then-insert below cannot trip a transient
  // collision even when rows are reordered or removed from the middle.
  const replace = async (
    table: "visit_result_samples" | "visit_result_seized_products",
    rows: Record<string, unknown>[],
  ): Promise<string | null> => {
    const { error: delErr } = await sb.from(table).delete().eq("report_id", report.id);
    if (delErr) return delErr.message;
    if (!rows.length) return null;
    const { error: insErr2 } = await sb.from(table).insert(rows);
    return insErr2?.message ?? null;
  };

  // Only rows the gate actually admits are persisted. Answering "No" clears the
  // repeater rather than leaving orphans behind a closed gate.
  const sampleRows = draft.samples_taken === true
    ? draft.samples.map((s, i) => ({
        report_id: report.id, inspection_id: inspectionId,
        ordinal: i + 1, sample_name: s.sample_name?.trim() || null,
      }))
    : [];
  const seizedRows = draft.products_seized === true
    ? draft.seized.map((s, i) => ({
        report_id: report.id, inspection_id: inspectionId,
        ordinal: i + 1,
        product_name: s.product_name?.trim() || null,
        quantity: s.quantity?.trim() || null,
      }))
    : [];

  const sampleErr = await replace("visit_result_samples", sampleRows);
  if (sampleErr) {
    return isImmutable(sampleErr) ? { kind: "immutable" } : { kind: "error", message: sampleErr };
  }
  const seizedErr = await replace("visit_result_seized_products", seizedRows);
  if (seizedErr) {
    return isImmutable(seizedErr) ? { kind: "immutable" } : { kind: "error", message: seizedErr };
  }

  revalidatePath(`/field/inspection/${inspectionId}/results`);
  return { kind: "ok", reportId: report.id };
}

export type ContinueResult =
  | { kind: "ok" }
  | { kind: "immutable" }
  | { kind: "signed_out" }
  | { kind: "error"; message: string };

/**
 * Persist Step 3 and let the caller advance to Step 4.
 *
 * This screen deliberately does NOT submit the inspection. The canonical
 * submit is submit_inspection(p_inspection, p_snapshot, p_idempotency_key,
 * p_acknowledgement) — a four-part ceremony that assigns the version under a
 * row lock and is driven through the offline outbox in lib/offline.ts, which
 * builds the snapshot, the idempotency key and the acknowledgement from the
 * Workspace's own state. Reconstructing those here would duplicate the
 * submission contract and risk certifying a snapshot this screen cannot see.
 *
 * So Step 3 saves its own record and hands off. The design's success state is
 * reached by the real submission, not manufactured here — see the `locked`
 * branch in ResultsClient, which renders it only once the inspection has
 * genuinely reached a submitted state.
 */
export async function saveAndContinue(inspectionId: string, draft: ResultsDraft): Promise<ContinueResult> {
  const saved = await saveResults(inspectionId, draft);
  if (saved.kind === "immutable") return { kind: "immutable" };
  if (saved.kind === "signed_out") return { kind: "signed_out" };
  if (saved.kind === "error") return { kind: "error", message: saved.message };
  return { kind: "ok" };
}
