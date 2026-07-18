// M2-02 → M2-05 semantic-event adapter.
// TASK-MVP2-M2-02-WORKFLOW-STUDIO-002 · shared contract with MVP2-CD-031-M2-05.
// Reconciliation decision R-001 (product-contract/mvp2/RECONCILIATION_LEDGER.md):
//
// The LANDED M2-05 migration (20260717150000) exposes the canonical append
// boundary as the SECURITY DEFINER RPC `append_semantic_audit_event`, which:
//   - accepts only event types registered in `audit_event_registry`;
//   - requires a proven `source_audit_event_id` (a real `audit_events` row whose
//     actor/object_type/action match the append) and `source_system='audit_events'`;
//   - requires a contracted (source_object_type, source_action) pair.
// There is NO general `semantic_events` table — the earlier adapter targeted a
// phantom table and would have errored at runtime if ever enabled.
//
// Per Prompt 07, generic workflow transitions stay GENERIC in `audit_events` and
// are NEVER promoted to canonical facts. So this adapter emits through the RPC
// ONLY for genuine registered milestones that carry a proven source audit id;
// for everything else it returns an honest `{emitted:false}` and writes nothing.
// No competing event table is created here.

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";

// Versioned semantic event envelope (fields per the M2-02/M2-05 shared contract).
// The `milestone` block is present only when the event is a genuine registered
// M2-05 milestone with a proven source audit row — its absence keeps the event
// generic and unemitted through the canonical RPC.
export type SemanticEvent = {
  eventType: string;
  eventVersion: number;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number;
  actor: string | null;
  scope: Record<string, unknown>;
  occurredAt: string;
  recordedAt: string;
  correlationId: string;
  causationId: string | null;
  idempotencyKey: string;
  payload: Record<string, unknown>;   // semantic payload or before/after
  sourceAction: string;
  // Canonical-milestone binding to the landed M2-05 RPC. Optional: only set for
  // registry-backed milestone facts (e.g. WorkflowActivated, AssignmentAccepted,
  // NoticeIssued), never for generic transitions.
  milestone?: {
    caseType: string;
    caseRef: string;
    sourceAuditEventId: number;   // proven audit_events.id (bigint)
    aggregateRef?: string;
    beforeState?: Record<string, unknown> | null;
    afterState?: Record<string, unknown> | null;
  };
};

export type EmitResult = { emitted: boolean; reason?: string; id?: string };

export interface EventEmitter {
  emit(event: SemanticEvent): Promise<EmitResult>;
}

export function buildSemanticEvent(input: {
  eventType: string;
  aggregate: { type: string; id: string; version: number };
  actor: string | null;
  scope?: Record<string, unknown>;
  occurredAt: string;
  correlationId: string;
  causationId?: string | null;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
  sourceAction: string;
  eventVersion?: number;
}): SemanticEvent {
  return {
    eventType: input.eventType,
    eventVersion: input.eventVersion ?? 1,
    aggregateType: input.aggregate.type,
    aggregateId: input.aggregate.id,
    aggregateVersion: input.aggregate.version,
    actor: input.actor,
    scope: input.scope ?? {},
    occurredAt: input.occurredAt,
    recordedAt: input.occurredAt,     // recorded == occurred for a synchronous emit; M2-05 may override on ingest
    correlationId: input.correlationId,
    causationId: input.causationId ?? null,
    idempotencyKey: input.idempotencyKey,
    payload: input.payload ?? {},
    sourceAction: input.sourceAction,
  };
}

// Disabled emitter — used until the M2-05 shared migration lands. Honest no-op.
export const disabledEventEmitter: EventEmitter = {
  async emit(): Promise<EmitResult> {
    return { emitted: false, reason: "m2_05_adapter_disabled" };
  },
};

const EVENT_ADAPTER_MODES = ["off", "shared"] as const;

// Maps a milestone SemanticEvent to the landed `append_semantic_audit_event`
// RPC argument shape. Returns null when the event is not a registered milestone
// (no `milestone` block) — the honest signal to NOT emit through the RPC.
export function toAppendRpcArgs(event: SemanticEvent): Record<string, unknown> | null {
  const m = event.milestone;
  if (!m) return null;
  return {
    p_event_type: event.eventType,
    p_schema_version: event.eventVersion,
    p_occurred_at: event.occurredAt,
    p_aggregate_type: event.aggregateType,
    p_aggregate_id: event.aggregateId,
    p_aggregate_ref: m.aggregateRef ?? event.aggregateId,
    p_aggregate_version: String(event.aggregateVersion),
    p_case_type: m.caseType,
    p_case_ref: m.caseRef,
    p_correlation_id: event.correlationId,
    p_causation_id: event.causationId,
    p_source_system: "audit_events",
    p_source_action: event.sourceAction,
    p_idempotency_key: event.idempotencyKey,
    p_before_state: m.beforeState ?? null,
    p_after_state: m.afterState ?? null,
    p_semantic_payload: event.payload,
    p_source_audit_event_id: m.sourceAuditEventId,
  };
}

/**
 * Supabase-backed emitter. Off by default. When FEATURE_M2_05_EVENT_ADAPTER=shared
 * it emits genuine registered milestones through the canonical M2-05 RPC
 * `append_semantic_audit_event` (source-proven, immutable, idempotent). Generic
 * transitions (no `milestone` block) are never promoted — they return an honest
 * `{emitted:false, reason:"not_a_registered_milestone"}` and write nothing.
 * RPC/RLS rejection surfaces as honest failure, never a silent success.
 */
export function supabaseEventEmitter(sb: SupabaseClient): EventEmitter {
  const mode = resolveFeatureFlag(process.env.FEATURE_M2_05_EVENT_ADAPTER, EVENT_ADAPTER_MODES, "off");
  if (mode !== "shared") return disabledEventEmitter;
  return {
    async emit(event: SemanticEvent): Promise<EmitResult> {
      const args = toAppendRpcArgs(event);
      if (!args) return { emitted: false, reason: "not_a_registered_milestone" };
      const { data, error } = await sb.rpc("append_semantic_audit_event", args);
      if (error) return { emitted: false, reason: `append_boundary_error:${error.code ?? "unknown"}` };
      return { emitted: true, id: data ? String(data) : undefined };
    },
  };
}
