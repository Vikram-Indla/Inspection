import type { Shape } from "@/lib/postgrest/shape";
import type {
  EnforcementActionForm, EnforcementFactory, EnforcementPenaltyRow, EnforcementViolationRow,
} from "./queries";

const enforcementFactory: Shape<EnforcementFactory> = f => ({
  id: f.text("id"),
  name: f.text("name"),
  factory_code: f.optionalText("factory_code"),
  license_number: f.optionalText("license_number"),
  region: f.optionalText("region"),
  city: f.optionalText("city"),
});

const enforcementActionForm: Shape<EnforcementActionForm> = f => ({
  id: f.text("id"),
  violation_id: f.optionalText("violation_id"),
  form_type: f.text("form_type"),
  status: f.text("status"),
  due_at: f.optionalText("due_at"),
  owner_name: f.optionalText("owner_name"),
  owner_role: f.optionalText("owner_role"),
  required_correction: f.optionalText("required_correction"),
  is_blocking: f.flag("is_blocking"),
});

export const enforcementViolationRow: Shape<EnforcementViolationRow> = f => ({
  id: f.text("id"),
  mapping_version: f.text("mapping_version"),
  invalidated_at: f.optionalText("invalidated_at"),
  violation_codes: f.toOne("violation_codes", code => ({
    title: code.text("title"),
    code: code.text("code"),
    level: code.text("level"),
    corrective_action: code.optionalText("corrective_action"),
  })),
  inspections: f.toOne("inspections", inspection => ({
    id: inspection.text("id"),
    inspection_no: inspection.optionalText("inspection_no"),
    status: inspection.text("status"),
    started_at: inspection.optionalText("started_at"),
    submitted_at: inspection.optionalText("submitted_at"),
    visits: inspection.toOne("visits", visit => ({
      id: visit.text("id"),
      visit_reference: visit.optionalText("visit_reference"),
      factories: visit.toOne("factories", enforcementFactory),
      assignments: visit.toMany("assignments", assignment => ({
        status: assignment.text("status"),
        profiles: assignment.toOne("profiles", profile => ({ full_name: profile.text("full_name") })),
      })),
    })),
    action_forms: inspection.toMany("action_forms", enforcementActionForm),
    evidence: inspection.toMany("evidence", evidence => ({
      id: evidence.text("id"),
      linked_id: evidence.text("linked_id"),
      content_sha256: evidence.optionalText("content_sha256"),
    })),
  })),
});

export const enforcementPenaltyRow: Shape<EnforcementPenaltyRow> = f => ({
  violation_id: f.text("violation_id"),
  status: f.text("status"),
  issued_at: f.optionalText("issued_at"),
  mapping_snapshot: f.raw("mapping_snapshot"),
});
