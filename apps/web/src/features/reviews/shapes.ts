import type { Shape } from "@/lib/postgrest/shape";
import type { JoinedReview, JoinedVisit, SubmissionVersion } from "./types";

export type SubmittedInspection = {
  id: string;
  status: string;
  submitted_at: string | null;
  visits: JoinedVisit | null;
  submission_versions: SubmissionVersion[];
  violations: { violation_codes: { level: string } | null }[] | null;
  evidence: { id: string }[] | null;
};

const answerSnapshot: Shape<{ answers?: Record<string, string> }> = f => {
  const answers = f.optionalRecord("answers");
  if (!answers) return {};
  return {
    answers: Object.fromEntries(Object.entries(answers)
      .flatMap(([key, value]) => typeof value === "string" ? [[key, value] as const] : [])),
  };
};

const submissionVersion: Shape<SubmissionVersion> = f => ({
  version_number: f.number("version_number"),
  submitted_at: f.text("submitted_at"),
  acknowledgement: f.raw("acknowledgement"),
  snapshot: f.toOne("snapshot", answerSnapshot),
});

const joinedVisit: Shape<JoinedVisit> = f => ({
  visit_type: f.text("visit_type"),
  execution_mode: f.text("execution_mode"),
  priority: f.optionalText("priority"),
  factories: f.toOne("factories", factory => ({
    name: factory.text("name"),
    factory_code: factory.text("factory_code"),
    risk_band: factory.optionalText("risk_band"),
  })),
  assignments: f.optionalToMany("assignments", assignment => ({
    profiles: assignment.toOne("profiles", profile => ({ full_name: profile.text("full_name") })),
  })),
});

const violationLevels: Shape<{ violation_codes: { level: string } | null }> = f => ({
  violation_codes: f.toOne("violation_codes", code => ({ level: code.text("level") })),
});

const evidenceId: Shape<{ id: string }> = f => ({ id: f.text("id") });

export const joinedReviewRow: Shape<JoinedReview> = f => ({
  id: f.text("id"),
  status: f.text("status"),
  decided_at: f.optionalText("decided_at"),
  reviewer_id: f.optionalText("reviewer_id"),
  submission_versions: f.toOne("submission_versions", submissionVersion),
  inspections: f.toOne("inspections", inspection => ({
    id: inspection.text("id"),
    status: inspection.text("status"),
    submitted_at: inspection.optionalText("submitted_at"),
    visits: inspection.toOne("visits", joinedVisit),
    violations: inspection.optionalToMany("violations", violationLevels),
    evidence: inspection.optionalToMany("evidence", evidenceId),
  })),
});

export const submittedInspectionRow: Shape<SubmittedInspection> = f => ({
  id: f.text("id"),
  status: f.text("status"),
  submitted_at: f.optionalText("submitted_at"),
  visits: f.toOne("visits", joinedVisit),
  submission_versions: f.toMany("submission_versions", submissionVersion),
  violations: f.optionalToMany("violations", violationLevels),
  evidence: f.optionalToMany("evidence", evidenceId),
});
