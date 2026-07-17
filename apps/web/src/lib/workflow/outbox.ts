// M2-02 Workflow, SLA & Notification Studio — idempotent side-effect outbox.
// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0031 · design GAP-09.
//
// The single boundary through which a transition's side effects are enqueued.
// Each command gets a deterministic idempotency key derived from the aggregate,
// its version, the transition, and the side-effect position. Enqueue is
// exactly-once: a retry of the same transition derives the same keys, and the
// unique index on workflow_outbox.idempotency_key makes the re-enqueue a no-op.
//
// Provider dispatch (notify/EBDA/SMS/email/push) is NOT done here — that is
// provider-dependent and honestly pending (GAP-10). A row is an enqueued
// command, never proof of delivery.

import type { WfTransition, WfSideEffect } from "./validate";

export type Aggregate = { type: string; id: string; version: number };

export type SideEffectCommand = {
  idempotencyKey: string;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number;
  sideEffectKind: string;
  payload: Record<string, unknown>;
};

/**
 * Deterministic idempotency key for one side-effect instance.
 * Same (aggregate, version, transition, fx index) → same key → dedupe on retry.
 */
export function deriveIdempotencyKey(
  agg: Aggregate,
  from: string,
  to: string,
  fxKind: string,
  fxIndex: number,
): string {
  return `${agg.type}:${agg.id}:v${agg.version}:${from}->${to}:${fxKind}#${fxIndex}`;
}

/** Build the ordered command list for a transition's declared side effects. */
export function buildSideEffectCommands(
  transition: WfTransition,
  agg: Aggregate,
  payload: Record<string, unknown> = {},
): SideEffectCommand[] {
  const fx: WfSideEffect[] = transition.fx ?? [];
  return fx.map((f, i) => ({
    idempotencyKey: deriveIdempotencyKey(agg, transition.from, transition.to, f.kind, i),
    aggregateType: agg.type,
    aggregateId: agg.id,
    aggregateVersion: agg.version,
    sideEffectKind: f.kind,
    payload,
  }));
}

// Minimal client interface so the enqueue logic is testable without a live DB.
export interface OutboxClient {
  // Insert commands, ignoring any whose idempotency_key already exists.
  // Returns the idempotency keys that were newly inserted.
  insertIgnoringConflicts(commands: SideEffectCommand[]): Promise<string[]>;
}

export type EnqueueOutcome = {
  enqueued: string[];   // newly inserted keys (fired for the first time)
  deduped: string[];    // keys already present (safe retry — no double fire)
};

/**
 * Exactly-once enqueue. Splits the commands into newly-enqueued vs deduped so a
 * retry is observably safe (deduped, non-empty enqueued only on first run).
 */
export async function enqueueSideEffects(
  client: OutboxClient,
  commands: SideEffectCommand[],
): Promise<EnqueueOutcome> {
  if (commands.length === 0) return { enqueued: [], deduped: [] };
  const inserted = new Set(await client.insertIgnoringConflicts(commands));
  const enqueued: string[] = [];
  const deduped: string[] = [];
  for (const c of commands) (inserted.has(c.idempotencyKey) ? enqueued : deduped).push(c.idempotencyKey);
  return { enqueued, deduped };
}

// Supabase-backed OutboxClient. Uses upsert with ignoreDuplicates so concurrent
// or retried enqueues never double-insert; the returned rows are the inserts
// that actually happened.
import type { SupabaseClient } from "@supabase/supabase-js";

export function supabaseOutboxClient(sb: SupabaseClient, createdBy?: string): OutboxClient {
  return {
    async insertIgnoringConflicts(commands: SideEffectCommand[]): Promise<string[]> {
      const rows = commands.map((c) => ({
        idempotency_key: c.idempotencyKey,
        aggregate_type: c.aggregateType,
        aggregate_id: c.aggregateId,
        aggregate_version: c.aggregateVersion,
        side_effect_kind: c.sideEffectKind,
        payload: c.payload,
        created_by: createdBy ?? null,
      }));
      const { data, error } = await sb
        .from("workflow_outbox")
        .upsert(rows, { onConflict: "idempotency_key", ignoreDuplicates: true })
        .select("idempotency_key");
      if (error) throw error;
      return (data ?? []).map((r: { idempotency_key: string }) => r.idempotency_key);
    },
  };
}
