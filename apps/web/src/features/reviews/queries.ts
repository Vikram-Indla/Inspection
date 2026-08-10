import type { supabaseServer } from "@/lib/supabase-server";
import { readRows, readSingle } from "@/lib/postgrest/read";
import type { Shape } from "@/lib/postgrest/shape";
import { workingDays } from "./sla";
import { joinedReviewRow, submittedInspectionRow } from "./shapes";
import type { JoinedReview, LoadedQueue, QueueEntry, ReadinessFact } from "./types";

export type ReviewsClient = Awaited<ReturnType<typeof supabaseServer>>;

type SlaSettings = { review_business_days?: number; calendar?: { days?: string } };

const slaSettings: Shape<SlaSettings> = f => ({
  review_business_days: f.optionalNumber("review_business_days") ?? undefined,
  calendar: f.toOne("calendar", calendar => ({
    days: calendar.optionalText("days") ?? undefined,
  })) ?? undefined,
});

const factoryCheckRow: Shape<{ inspection_id: string; status: string }> = f => ({
  inspection_id: f.text("inspection_id"),
  status: f.text("status"),
});

function factoryFact(check: { updated: boolean } | undefined): ReadinessFact {
  if (!check) return "missing";
  return check.updated ? "updated" : "verified";
}

export async function loadReviewQueue(sb: ReviewsClient): Promise<LoadedQueue> {
  const [{ data: allReviews, error: reviewsErr }, { data: slaRow }, { data: undiscovered, error: undiscoveredErr }] = await Promise.all([
    sb.from("reviews")
      .select(`id, status, decided_at, reviewer_id,
        submission_versions(version_number, submitted_at, acknowledgement, snapshot),
        inspections(id, status, submitted_at,
          visits(visit_type, execution_mode, priority,
            factories(name, factory_code, risk_band),
            assignments(profiles(full_name))),
          violations(violation_codes(level)),
          evidence(id))`)
      .order("decided_at", { ascending: false, nullsFirst: true }),
    sb.from("engine_settings").select("settings").eq("engine", "sla").maybeSingle(),
    sb.from("inspections")
      .select(`id, status, submitted_at,
        visits(visit_type, execution_mode, priority,
          factories(name, factory_code, risk_band),
          assignments(profiles(full_name))),
        submission_versions(id, version_number, submitted_at, acknowledgement, snapshot),
        violations(violation_codes(level)),
        evidence(id)`)
      .eq("status", "submitted"),
  ]);

  const sla = readSingle({ data: slaRow?.settings ?? null, error: null }, slaSettings, "reviews.sla").row;
  const rows: JoinedReview[] = readRows({ data: allReviews, error: reviewsErr }, joinedReviewRow, "reviews.reviews").rows;

  const submitted = readRows({ data: undiscovered, error: undiscoveredErr }, submittedInspectionRow, "reviews.submitted_inspections");
  for (const inspection of submitted.rows) {
    const latest = inspection.submission_versions.slice().sort((a, b) => b.version_number - a.version_number)[0];
    if (!latest) continue;
    rows.push({
      id: `virtual:${inspection.id}`,
      status: "pending_review",
      decided_at: null,
      reviewer_id: null,
      submission_versions: latest,
      inspections: {
        id: inspection.id,
        status: inspection.status,
        submitted_at: inspection.submitted_at,
        visits: inspection.visits,
        violations: inspection.violations,
        evidence: inspection.evidence,
      },
    });
  }

  const inspectionIds = [...new Set(rows.map(row => row.inspections?.id).filter((id): id is string => !!id))];
  const { data: factoryChecks, error: factoryChecksErr } = inspectionIds.length
    ? await sb.from("inspection_factory_checks").select("inspection_id, status").in("inspection_id", inspectionIds)
    : { data: [], error: null };
  const checks = readRows({ data: factoryChecks, error: factoryChecksErr }, factoryCheckRow, "reviews.factory_checks");
  const factoryCheckMap = new Map<string, { updated: boolean }>();
  for (const check of checks.rows) {
    const current = factoryCheckMap.get(check.inspection_id);
    factoryCheckMap.set(check.inspection_id, { updated: current?.updated === true || check.status === "updated" });
  }
  const factoryChecksReadable = !checks.failed;

  const readinessFor = (review: JoinedReview): QueueEntry => {
    const inspection = review.inspections;
    const readable = !!inspection;
    const version = review.submission_versions;
    const checklist: ReadinessFact = !version ? "unavailable" : Object.keys(version.snapshot?.answers ?? {}).length > 0 ? "present" : "missing";
    const acknowledgement: ReadinessFact = !version ? "unavailable" : version.acknowledgement != null ? "present" : "missing";
    const evidence: ReadinessFact = !inspection ? "unavailable" : (inspection.evidence?.length ?? 0) > 0 ? "present" : "missing";
    const factory: ReadinessFact = !inspection || !factoryChecksReadable
      ? "unavailable"
      : factoryFact(factoryCheckMap.get(inspection.id));
    return { review, readiness: { checklist, evidence, ack: acknowledgement, factory }, readable };
  };

  const entries = rows.map(readinessFor);
  const degraded = !!reviewsErr || !!undiscoveredErr || !factoryChecksReadable || entries.some(entry => !entry.readable);
  return {
    entries,
    reviewDays: sla?.review_business_days ?? null,
    workDays: workingDays(sla?.calendar?.days),
    degraded,
  };
}
