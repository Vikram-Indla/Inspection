// M2-02 Workflow, SLA & Notification Studio — governed transition orchestrator.
// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0027..0031.
//
// Ties the canonical decision (evaluateTransition), the idempotent side-effect
// outbox, the M2-05 semantic-event emit, and the audit append into one governed
// step. Pure over injected dependencies so it is fully testable without a DB and
// so the exact same orchestration runs in the deterministic simulation (with a
// no-op outbox/emit) as in production.
//
// It does NOT itself patch an operational status column — the object's own
// canonical engine (e.g. set_operational_state for visits) applies the state.
// Direct status mutation stays prohibited; this layer authorizes + records.

import type { WfPayload } from "./validate";
import { evaluateTransition } from "./transition";
import type { GuardContext, GuardResult } from "./guards";
import { buildSideEffectCommands, enqueueSideEffects, type OutboxClient, type Aggregate, type EnqueueOutcome } from "./outbox";
import { buildSemanticEvent, type EventEmitter, type EmitResult } from "./events";

export type AuditEntry = {
  actor: string | null;
  object_type: string;
  object_id: string;
  action: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  requirement_refs?: string[];
};

export type GovernedTransitionDeps = {
  getDefinition: (input: GovernedTransitionInput) => Promise<WfPayload | null>;
  outbox: OutboxClient;
  emit: EventEmitter;
  audit: (entry: AuditEntry) => Promise<void>;
  now: () => string;                 // injected clock (deterministic in tests)
  correlationId: () => string;       // injected id source (deterministic in tests)
};

export type GovernedTransitionInput = {
  workflowObject: string;            // logical object type (visit, report, …)
  aggregate: Aggregate;              // { type, id, version }
  fromState: string;
  trigger: string;
  ctx: GuardContext;
  effectPayload?: Record<string, unknown>;
  requirementRefs?: string[];
};

export type GovernedTransitionResult = {
  allowed: boolean;
  toState?: string;
  denials: GuardResult[];
  enqueue?: EnqueueOutcome;
  emit?: EmitResult;
};

export async function runGovernedTransition(
  deps: GovernedTransitionDeps,
  input: GovernedTransitionInput,
): Promise<GovernedTransitionResult> {
  const { aggregate, fromState, trigger, ctx } = input;
  const scope = { branch: (ctx as { branch?: unknown }).branch ?? null };

  const def = await deps.getDefinition(input);
  if (!def) {
    await deps.audit({
      actor: ctx.actor.id, object_type: aggregate.type, object_id: aggregate.id,
      action: "workflow_transition_denied",
      before_state: { state: fromState, trigger },
      after_state: { reason: "no_published_workflow_definition" },
      requirement_refs: input.requirementRefs,
    });
    return { allowed: false, denials: [{ id: "definition", ok: false, why: "No published workflow definition for this object." }] };
  }

  const decision = evaluateTransition(def, fromState, trigger, ctx);
  if (!decision.allowed) {
    await deps.audit({
      actor: ctx.actor.id, object_type: aggregate.type, object_id: aggregate.id,
      action: "workflow_transition_denied",
      before_state: { state: fromState, trigger },
      after_state: { denials: decision.denials.map((d) => d.id) },
      requirement_refs: input.requirementRefs,
    });
    return { allowed: false, denials: decision.denials };
  }

  const toState = decision.transition!.to;

  // Idempotent side effects — exactly-once / safe retry (MVP2-REQ-0031).
  const commands = buildSideEffectCommands(decision.transition!, aggregate, input.effectPayload ?? {});
  const enqueue = await enqueueSideEffects(deps.outbox, commands);

  // M2-05 semantic event (honest emit result; disabled adapter reports false).
  const occurredAt = deps.now();
  const correlationId = deps.correlationId();
  const event = buildSemanticEvent({
    eventType: `workflow.${aggregate.type}.transitioned`,
    aggregate, actor: ctx.actor.id, scope,
    occurredAt, correlationId,
    idempotencyKey: `${aggregate.type}:${aggregate.id}:v${aggregate.version}:${fromState}->${toState}`,
    payload: { from: fromState, to: toState, trigger, sideEffects: commands.map((c) => c.sideEffectKind) },
    sourceAction: "runGovernedTransition",
  });
  const emit = await deps.emit.emit(event);

  await deps.audit({
    actor: ctx.actor.id, object_type: aggregate.type, object_id: aggregate.id,
    action: "workflow_transition_allowed",
    before_state: { state: fromState, trigger },
    after_state: { state: toState, enqueued: enqueue.enqueued.length, deduped: enqueue.deduped.length, event_emitted: emit.emitted },
    requirement_refs: input.requirementRefs,
  });

  return { allowed: true, toState, denials: [], enqueue, emit };
}
