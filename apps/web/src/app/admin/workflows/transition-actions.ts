"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_LOAD_ERROR } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { supabaseOutboxClient } from "@/lib/workflow/outbox";
import { supabaseEventEmitter } from "@/lib/workflow/events";
import { runGovernedTransition, type GovernedTransitionInput, type GovernedTransitionResult, type AuditEntry } from "@/lib/workflow/governed-transition";
import type { WfPayload } from "@/lib/workflow/validate";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0027..0031.
// Server entry for the canonical governed transition. Feature-flagged OFF by
// default (FEATURE_WORKFLOW_TRANSITION=on to enable) — it stays dark until the
// per-object context resolution and the M2-05 shared event migration land.
// It authorizes + enqueues idempotent side effects + emits the semantic event +
// appends audit. It does NOT patch an operational status column: the object's
// own canonical engine applies the resolved state.

const TRANSITION_MODES = ["off", "on"] as const;

export type TransitionActionInput = GovernedTransitionInput & { workflowVersionId: string };
export type TransitionActionResult = { error?: string } | (GovernedTransitionResult & { error?: undefined });

export async function applyGovernedTransition(input: TransitionActionInput): Promise<TransitionActionResult> {
  const mode = resolveFeatureFlag(process.env.FEATURE_WORKFLOW_TRANSITION, TRANSITION_MODES, "off");
  if (mode !== "on") {
    return { error: "Governed transition is feature-flagged off (FEATURE_WORKFLOW_TRANSITION)." };
  }

  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  // Load the published workflow definition (immutable published payload).
  const { data: version, error: verr } = await sb.from("config_versions")
    .select("payload, status").eq("id", input.workflowVersionId)
    .eq("engine", "workflow").eq("status", "published").maybeSingle();
  if (verr) { logProviderError("governed transition definition read", verr); return { error: NEUTRAL_LOAD_ERROR }; }
  if (!version) return { error: "No published workflow version for this object." };

  const definition = version.payload as WfPayload;

  const result = await runGovernedTransition(
    {
      getDefinition: async () => definition,
      outbox: supabaseOutboxClient(sb, user.id),
      emit: supabaseEventEmitter(sb),
      audit: async (entry: AuditEntry) => {
        const { error } = await sb.from("audit_events").insert({
          actor: entry.actor, object_type: entry.object_type, object_id: entry.object_id,
          action: entry.action, before_state: entry.before_state, after_state: entry.after_state,
          requirement_refs: entry.requirement_refs ?? null,
        });
        if (error) logProviderError("governed transition audit", error);
      },
      now: () => new Date().toISOString(),
      correlationId: () => crypto.randomUUID(),
    },
    input,
  );

  return result;
}
