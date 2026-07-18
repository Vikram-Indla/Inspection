import { test, expect } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildSemanticEvent,
  toAppendRpcArgs,
  supabaseEventEmitter,
  disabledEventEmitter,
  type SemanticEvent,
} from "../src/lib/workflow/events";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-002 · MVP2-REQ-0027..0031 · reconciliation R-001.
// Pure source-contract test (no browser, no DB). Proves the M2-02→M2-05 adapter
// targets the LANDED canonical RPC `append_semantic_audit_event`, never a phantom
// `semantic_events` table, and never promotes a generic transition to a milestone.

const OCCURRED = "2026-07-17T10:00:00.000Z";

function genericTransitionEvent(): SemanticEvent {
  return buildSemanticEvent({
    eventType: "workflow.visit.transitioned",
    aggregate: { type: "visit", id: "11111111-1111-1111-1111-111111111111", version: 3 },
    actor: "actor-1",
    occurredAt: OCCURRED,
    correlationId: "22222222-2222-2222-2222-222222222222",
    idempotencyKey: "visit:1:v3:a->b",
    payload: { from: "a", to: "b" },
    sourceAction: "runGovernedTransition",
  });
}

function milestoneEvent(): SemanticEvent {
  return {
    ...buildSemanticEvent({
      eventType: "WorkflowActivated",
      aggregate: { type: "config_versions", id: "33333333-3333-3333-3333-333333333333", version: 7 },
      actor: "actor-1",
      occurredAt: OCCURRED,
      correlationId: "44444444-4444-4444-4444-444444444444",
      idempotencyKey: "config_versions:33333333:WorkflowActivated",
      payload: { workflow_version: "7", approval_id: "ap-1" },
      sourceAction: "publish_workflow_version",
    }),
    milestone: {
      caseType: "workflow",
      caseRef: "33333333-3333-3333-3333-333333333333",
      sourceAuditEventId: 9876,
      afterState: { status: "published" },
    },
  };
}

test("R-001: a generic transition never maps to the canonical append RPC", () => {
  expect(toAppendRpcArgs(genericTransitionEvent())).toBeNull();
});

test("R-001: a registered milestone maps to the exact append_semantic_audit_event arg shape", () => {
  const args = toAppendRpcArgs(milestoneEvent());
  expect(args).not.toBeNull();
  expect(args).toMatchObject({
    p_event_type: "WorkflowActivated",
    p_schema_version: 1,
    p_occurred_at: OCCURRED,
    p_aggregate_type: "config_versions",
    p_aggregate_id: "33333333-3333-3333-3333-333333333333",
    p_aggregate_version: "7", // bigint text per RPC contract
    p_case_type: "workflow",
    p_case_ref: "33333333-3333-3333-3333-333333333333",
    p_source_system: "audit_events", // RPC rejects any other source system
    p_source_action: "publish_workflow_version",
    p_source_audit_event_id: 9876, // proven audit_events row is mandatory
  });
});

test("R-001: disabled emitter (flag off) records nothing and reports honestly", async () => {
  const res = await disabledEventEmitter.emit(milestoneEvent());
  expect(res).toEqual({ emitted: false, reason: "m2_05_adapter_disabled" });
});

test("R-001: enabled emitter calls the RPC for milestones and skips generic transitions", async () => {
  const prev = process.env.FEATURE_M2_05_EVENT_ADAPTER;
  process.env.FEATURE_M2_05_EVENT_ADAPTER = "shared";
  try {
    const calls: Array<{ fn: string; args: unknown }> = [];
    const fakeSb = {
      rpc: async (fn: string, args: unknown) => {
        calls.push({ fn, args });
        return { data: "aaaaaaaa-0000-0000-0000-000000000000", error: null };
      },
    } as unknown as SupabaseClient;

    const emitter = supabaseEventEmitter(fakeSb);

    const milestoneRes = await emitter.emit(milestoneEvent());
    expect(milestoneRes.emitted).toBe(true);
    expect(milestoneRes.id).toBe("aaaaaaaa-0000-0000-0000-000000000000");
    expect(calls).toHaveLength(1);
    expect(calls[0].fn).toBe("append_semantic_audit_event");

    const genericRes = await emitter.emit(genericTransitionEvent());
    expect(genericRes).toEqual({ emitted: false, reason: "not_a_registered_milestone" });
    expect(calls).toHaveLength(1); // no extra RPC call for the generic transition
  } finally {
    if (prev === undefined) delete process.env.FEATURE_M2_05_EVENT_ADAPTER;
    else process.env.FEATURE_M2_05_EVENT_ADAPTER = prev;
  }
});
