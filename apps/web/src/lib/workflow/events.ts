// M2-02 → M2-05 semantic-event adapter.
// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · shared contract with MVP2-CD-031-M2-05.
//
// M2-05 owns the semantic event registry / replay. M2-02 emits through the
// shared audited append boundary via this typed adapter. Until the M2-05 shared
// migration is merged (no `semantic_events` table exists on this branch yet),
// the adapter is OFF by default and reports honestly — it NEVER silently
// pretends an event was recorded. No competing event table is created here and
// nothing is written into replay projections.

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";

// Versioned semantic event envelope (fields per the M2-02/M2-05 shared contract).
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

/**
 * Supabase-backed emitter. Off by default. When FEATURE_M2_05_EVENT_ADAPTER=shared
 * AND the M2-05 shared table exists, it appends the envelope; if the table is
 * absent (shared migration not yet merged), it reports `shared_migration_absent`
 * rather than fabricating success. It never writes a competing local event table.
 */
export function supabaseEventEmitter(sb: SupabaseClient): EventEmitter {
  const mode = resolveFeatureFlag(process.env.FEATURE_M2_05_EVENT_ADAPTER, EVENT_ADAPTER_MODES, "off");
  if (mode !== "shared") return disabledEventEmitter;
  return {
    async emit(event: SemanticEvent): Promise<EmitResult> {
      const row = {
        event_type: event.eventType, event_version: event.eventVersion,
        aggregate_type: event.aggregateType, aggregate_id: event.aggregateId,
        aggregate_version: event.aggregateVersion, actor: event.actor,
        scope: event.scope, occurred_at: event.occurredAt, recorded_at: event.recordedAt,
        correlation_id: event.correlationId, causation_id: event.causationId,
        idempotency_key: event.idempotencyKey, payload: event.payload, source_action: event.sourceAction,
      };
      // Target the M2-05-owned shared append boundary. Missing table / RLS →
      // honest failure, never a silent success.
      const { data, error } = await sb.from("semantic_events")
        .upsert(row, { onConflict: "idempotency_key", ignoreDuplicates: true })
        .select("id").maybeSingle();
      if (error) return { emitted: false, reason: `shared_boundary_error:${error.code ?? "unknown"}` };
      return { emitted: true, id: data?.id ? String(data.id) : undefined };
    },
  };
}
