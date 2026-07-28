"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_LOAD_ERROR, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { evaluatePause, evaluateResume, isSlaTransitionAllowed, type SlaStatus } from "@/lib/workflow/sla";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0033 · DEC-003-honest.
// Human-usable SLA operations. There is NO scheduler and NO automatic breach
// execution; activation of a running timer is blocked at the DB (trg_sla_timer_
// activation) until an authorized calendar exists. These actions never invent a
// duration/threshold — pause/resume operate on already-configured timers, and
// the start path reports the honest blocked/configuration-ready state.

export type SlaResult = { error?: string; ok?: boolean; blocked?: string };

function slaMutationError(error: { message?: string } | null, action: "activate" | "pause" | "resume"): SlaResult {
  const message = error?.message ?? "";
  if (message.includes("SLA-TIMER-REASON")) return { error: `A reason is required to ${action} this SLA timer.` };
  if (message.includes("SLA-TIMER-NOT-FOUND")) return { error: "SLA timer not found." };
  if (message.includes("SLA-TIMER-STATE")) return { error: "The SLA timer changed or that action is no longer permitted. Reload and try again." };
  if (message.includes("SLA-TIMER-DENIED")) return { error: "SLA timer change blocked — an authorized administration role is required." };
  if (action === "activate" && (
    message.includes("SLA activation blocked")
    || message.includes("DEC-003")
  )) {
    return { blocked: "SLA activation blocked by governance guard: calendar not authorized/complete." };
  }
  return { error: NEUTRAL_WRITE_ERROR };
}

async function mutateSlaTimer(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  timerId: string,
  action: "activate" | "pause" | "resume",
  reason: string,
): Promise<SlaResult> {
  const { error } = await sb.rpc("mutate_sla_timer", {
    p_timer: timerId,
    p_action: action,
    p_reason: reason,
    p_correlation_id: crypto.randomUUID(),
  });
  if (error) {
    logProviderError(`atomic SLA timer ${action}`, error);
    return slaMutationError(error, action);
  }
  return { ok: true };
}

async function loadTimer(timerId: string) {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const { data: timer, error } = await sb.from("sla_timers")
    .select("id, status, calendar_id, duration_minutes, due_at").eq("id", timerId).maybeSingle();
  if (error) { logProviderError("sla timer load", error); return { error: NEUTRAL_LOAD_ERROR }; }
  if (!timer) return { error: "SLA timer not found." };
  return { sb, user, timer };
}

// Attempt to move a timer to running. When no authorized calendar has resolved
// due_at, the DB guard blocks it — surfaced here as an honest configuration hold,
// never a fabricated running clock.
export async function requestSlaActivation(_: SlaResult, formData: FormData): Promise<SlaResult> {
  const ctx = await loadTimer(String(formData.get("timer_id") ?? ""));
  if ("error" in ctx) return { error: ctx.error };
  const { sb, timer } = ctx;
  const reason = String(formData.get("reason") ?? "").trim();
  if (timer.due_at == null || timer.calendar_id == null) {
    return { blocked: "SLA activation is on hold: no authorized working calendar. The timer stays pending; pause/resume remain available." };
  }
  if (!reason) return { error: "An activation reason is required." };
  return mutateSlaTimer(sb, timer.id, "activate", reason);
}

export async function pauseSlaTimer(_: SlaResult, formData: FormData): Promise<SlaResult> {
  const ctx = await loadTimer(String(formData.get("timer_id") ?? ""));
  if ("error" in ctx) return { error: ctx.error };
  const { sb, timer } = ctx;
  const reason = String(formData.get("reason") ?? "").trim();
  const decision = evaluatePause(timer.status as SlaStatus, reason);
  if (!decision.ok) return { error: decision.why };
  return mutateSlaTimer(sb, timer.id, "pause", reason);
}

export async function resumeSlaTimer(_: SlaResult, formData: FormData): Promise<SlaResult> {
  const ctx = await loadTimer(String(formData.get("timer_id") ?? ""));
  if ("error" in ctx) return { error: ctx.error };
  const { sb, timer } = ctx;
  const reason = String(formData.get("reason") ?? "").trim();
  const decision = evaluateResume(timer.status as SlaStatus);
  if (!decision.ok) return { error: decision.why };
  if (!isSlaTransitionAllowed("paused", "running")) return { error: "Resume not permitted." };
  if (!reason) return { error: "A resume reason is required." };
  return mutateSlaTimer(sb, timer.id, "resume", reason);
}
