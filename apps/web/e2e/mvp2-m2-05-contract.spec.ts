import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  MVP2_M2_05_EXPECTED_EVENTS,
  completenessFor,
  reconstructAt,
  compareReconstructions,
  replayAt,
  type ReplayEvent,
} from "../src/lib/audit-replay";

const ROOT = path.resolve(__dirname, "../../..");
const migration = fs.readFileSync(path.join(ROOT, "supabase/migrations/20260717150000_mvp2_m2_05_semantic_audit_replay.sql"), "utf8");
const page = fs.readFileSync(path.join(ROOT, "apps/web/src/app/(app)/admin/audit/page.tsx"), "utf8");
const workspace = fs.readFileSync(path.join(ROOT, "apps/web/src/app/(app)/admin/audit/AuditReplayWorkspace.tsx"), "utf8");
const ontologyCsv = fs.readFileSync(path.join(ROOT, "product-contract/mvp2/m2-05/EVENT_ONTOLOGY.csv"), "utf8").trim().split("\n");
const wiringCsv = fs.readFileSync(path.join(ROOT, "product-contract/mvp2/m2-05/REQUIREMENT_WIRING_MAP.csv"), "utf8").trim().split("\n");

const event = (id: string, eventType: string, occurredAt: string): ReplayEvent => ({
  id, eventType, occurredAt, actor: "actor", aggregateType: "inspection", aggregateId: id,
  correlationId: "00000000-0000-0000-0000-000000000001", beforeState: null, afterState: { id },
  provenance: "semantic", integrityStatus: "not_assessed", chainStatus: "incomplete", ingestionStatus: "recorded",
});

test.describe("MVP2-CD-031-M2-05 semantic audit contract", () => {
  test("binds every requirement and acceptance row 0137..0172 exactly once", () => {
    expect(MVP2_M2_05_EXPECTED_EVENTS).toHaveLength(36);
    const reqs = new Set(MVP2_M2_05_EXPECTED_EVENTS.map(row => row.requirementId));
    const acs = new Set(MVP2_M2_05_EXPECTED_EVENTS.map(row => row.acceptanceId));
    expect(reqs.size).toBe(36); expect(acs.size).toBe(36);
    for (let n = 137; n <= 172; n++) {
      const id = String(n).padStart(4, "0");
      expect(reqs.has(`MVP2-REQ-${id}` as never)).toBeTruthy();
      expect(acs.has(`MVP2-AC-${id}` as never)).toBeTruthy();
    }
    expect(ontologyCsv).toHaveLength(37);
    expect(wiringCsv).toHaveLength(37);
    expect(new Set(ontologyCsv.map(line => line.split(",").length))).toEqual(new Set([9]));
    expect(new Set(wiringCsv.map(line => line.split(",").length))).toEqual(new Set([10]));
  });

  test("preserves mandatory event distinctions and ontology aliases", () => {
    const types = MVP2_M2_05_EXPECTED_EVENTS.map(row => row.eventType);
    for (const required of ["PackageCompiled","OfflinePackageLocked","AnswerSaved","FormAnswerChanged","SyncCompleted","InspectionSubmitted","SyncConflictResolved","NoticeIssued","DigitalSignatureCaptured","SignatureRefused","CorrectionOrObjectionEvent"]) {
      expect(types).toContain(required);
    }
    expect(MVP2_M2_05_EXPECTED_EVENTS.find(row => row.requirementId === "MVP2-REQ-0140")?.aliases).toContain("GeoCheckIn");
  });

  test("derives completeness from the selected ontology instead of a universal fraction", () => {
    const events = [event("1","VisitPlanCreated","2026-07-17T01:00:00Z")];
    expect(completenessFor(events).expected).toBe(36);
    expect(completenessFor(events, MVP2_M2_05_EXPECTED_EVENTS.slice(0, 4))).toEqual(expect.objectContaining({ found: 1, expected: 4 }));
    const orderedExpectation = [{ ...MVP2_M2_05_EXPECTED_EVENTS[3], requiredFields: [], mustFollowEventTypes: ["VisitPlanCreated"] }];
    const reversed = [event("field","GeofenceCheckIn","2026-07-17T01:00:00Z"),event("plan","VisitPlanCreated","2026-07-17T02:00:00Z")];
    expect(completenessFor(reversed,orderedExpectation).found).toBe(0);
  });

  test("reconstructs deterministically and never selects facts after the boundary", () => {
    const events = [event("b","InspectionSubmitted","2026-07-17T03:00:00Z"),event("a","InspectionStarted","2026-07-17T02:00:00Z"),event("c","ReviewDecisionRecorded","2026-07-17T04:00:00Z")];
    expect(replayAt(events,"2026-07-17T03:00:00Z").map(row => row.id)).toEqual(["a","b"]);
    expect(replayAt(events,null).map(row => row.id)).toEqual(["a","b","c"]);
    const multi = [
      { ...event("a1","InspectionStarted","2026-07-17T02:00:00Z"), aggregateId: "inspection-1", afterState: { status: "executing" } },
      { ...event("r1","AnswerSaved","2026-07-17T02:10:00Z"), aggregateType: "response", aggregateId: "response-1", afterState: { answer: "yes" } },
      { ...event("a2","InspectionSubmitted","2026-07-17T03:00:00Z"), aggregateId: "inspection-1", afterState: { status: "submitted" } },
    ];
    const before = reconstructAt(multi,"2026-07-17T02:30:00Z");
    const after = reconstructAt(multi,"2026-07-17T03:30:00Z");
    expect(before).toHaveLength(2);
    expect(before.find(row => row.key === "inspection:inspection-1")?.state).toEqual({ status: "executing" });
    expect(compareReconstructions(before,after).find(row => row.key === "inspection:inspection-1")?.changed).toBeTruthy();
    const stale = reconstructAt([
      { ...event("s1","AnswerSaved","2026-07-17T01:00:00Z"), afterState: { answer: "yes" } },
      { ...event("s2","FormAnswerChanged","2026-07-17T02:00:00Z"), aggregateId: "s1", beforeState: { answer: "no" }, afterState: { answer: "maybe" } },
    ],null);
    expect(stale[0].conflicts.some(conflict => conflict.startsWith("stale-before:"))).toBeTruthy();
  });

  test("keeps both audit stores immutable and semantic append idempotent", () => {
    expect(migration).toContain("trg_semantic_audit_immutable");
    expect(migration).toContain("before update or delete on public.audit_semantic_events");
    expect(migration).toContain("unique (source_system, idempotency_key)");
    expect(migration).toContain("on conflict (source_system, idempotency_key) do nothing");
    expect(migration).not.toMatch(/alter table public\.audit_events\s+(drop|rename)/i);
  });

  test("enforces least privilege, zero direct writes and bounded keyset reads", () => {
    expect(migration).toContain("revoke insert, update, delete on public.audit_semantic_events from anon, authenticated");
    expect(migration).toContain("has_any_role(array['auditor','ops','security_admin','leadership','reviewer','planner','compliance_admin'])");
    expect(migration).not.toMatch(/'inspector'.*audit_semantic_read/);
    expect(migration).toContain("(e.occurred_at, e.id) < (p_before_occurred_at, p_before_id)");
    expect(migration).toContain("least(coalesce(p_limit,100), 250)");
    expect(migration).toContain("not authorized to emit field semantic event");
    expect(migration).toContain("not authorized to emit review semantic event");
    expect(migration).toContain("'region',v_region,'org_scope',v_org_scope");
    expect(migration).toContain("source audit event does not prove actor/object/action scope");
    expect(migration).toContain("source object/action is not contracted for semantic event type");
    expect(migration).toContain("audit_event_source_contracts");
    expect(migration).toContain("caller-supplied fact fields must match server-derived source facts");
    expect(migration).toContain("material answer update must map to FormAnswerChanged");
    expect(migration).toContain("source does not prove acknowledgement");
    expect(migration).toContain("format('audit:%s:%s:v%s',p_source_audit_event_id,p_event_type,p_schema_version)");
    expect(migration).toContain("callers cannot assert integrity or chain verification");
    expect(migration).toContain("missing required semantic field");
    expect(migration).toContain("idempotency key reused with different semantic fact");
    expect(migration).toContain("md5(coalesce(v_before");
    expect(migration).toContain("on conflict (ontology_version_id,requirement_ref) do nothing");
    expect((migration.match(/'MVP2-REQ-0(?:13[7-9]|14\d|15\d|16\d|17[0-2])'/g) ?? []).length).toBeGreaterThanOrEqual(36);
  });

  test("never promotes generic trigger rows to canonical events", () => {
    expect(page).toContain("GENERIC:${row.object_type}.${row.action}");
    expect(page).toContain('provenance: "generic"');
    expect(page).toContain('ingestionStatus: "generic_only"');
    expect(workspace).toContain('generic: "Generic only"');
    expect(workspace).toContain('generic: "عام فقط"');
  });

  test("wires only proven source emitters and keeps acknowledgement distinct from PKI", () => {
    const sources = ["visit_plans","geo_events","inspections","checklist_responses","evidence","findings","submission_versions","reviews","regulations","package_versions"];
    expect(migration).toContain("foreach t in array array['visit_plans','geo_events','inspections','checklist_responses','evidence','findings','submission_versions','reviews','regulations','package_versions']");
    for (const source of sources) expect(migration).toContain(`tg_table_name = '${source}'`);
    expect(migration).toContain("'SignatureRecorded'");
    expect(migration).toContain("'verification_status','unverified'");
    expect(migration).toContain("not promoted to");
    expect(migration).not.toContain("'verification_status','verified'");
  });

  test("renders policy/provider truth and accessible focus recovery", () => {
    expect(workspace).toContain('policyHeldTag:"POLICY_HELD"');
    expect(workspace).toContain("held by policy");
    expect(workspace).toContain("closeRef.current?.focus()");
    expect(workspace).toContain("triggerRefs.current.get(id)?.focus()");
    expect(workspace).toContain('role="dialog"');
    expect(workspace).not.toContain("verified by EBDA");
  });
});
