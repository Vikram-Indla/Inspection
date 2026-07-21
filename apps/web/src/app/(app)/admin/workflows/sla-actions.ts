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
  if (timer.due_at == null || timer.calendar_id == null) {
    return { blocked: "SLA activation is on hold: no authorized working calendar (DEC-003). The timer stays pending; pause/resume remain available." };
  }
  const { error, count } = await sb.from("sla_timers").update({ status: "running" }, { count: "exact" })
    .eq("id", timer.id).eq("status", "pending_activation");
  if (error) {
    // The activation guard raises when the calendar is not authorized/complete.
    return { blocked: "SLA activation blocked by governance guard (DEC-003): calendar not authorized/complete." };
  }
  if (!count) return { error: "Timer is not pending activation." };
  return { ok: true };
}

export async function pauseSlaTimer(_: SlaResult, formData: FormData): Promise<SlaResult> {
  const ctx = await loadTimer(String(formData.get("timer_id") ?? ""));
  if ("error" in ctx) return { error: ctx.error };
  const { sb, user, timer } = ctx;
  const reason = String(formData.get("reason") ?? "").trim();
  const decision = evaluatePause(timer.status as SlaStatus, reason);
  if (!decision.ok) return { error: decision.why };
  const { error, count } = await sb.from("sla_timers")
    .update({ status: "paused", paused_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", timer.id).eq("status", "running");
  if (error) { logProviderError("sla pause", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "Pause blocked — timer not running or insufficient role." };
  await sb.from("audit_events").insert({
    actor: user.id, object_type: "sla_timer", object_id: timer.id, action: "sla_paused",
    before_state: { status: "running" }, after_state: { status: "paused", reason },
  });
  return { ok: true };
}

export async function resumeSlaTimer(_: SlaResult, formData: FormData): Promise<SlaResult> {
  const ctx = await loadTimer(String(formData.get("timer_id") ?? ""));
  if ("error" in ctx) return { error: ctx.error };
  const { sb, user, timer } = ctx;
  const decision = evaluateResume(timer.status as SlaStatus);
  if (!decision.ok) return { error: decision.why };
  if (!isSlaTransitionAllowed("paused", "running")) return { error: "Resume not permitted." };
  const { error, count } = await sb.from("sla_timers")
    .update({ status: "running", paused_at: null }, { count: "exact" })
    .eq("id", timer.id).eq("status", "paused");
  if (error) { logProviderError("sla resume", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "Resume blocked — timer not paused or insufficient role." };
  await sb.from("audit_events").insert({
    actor: user.id, object_type: "sla_timer", object_id: timer.id, action: "sla_resumed",
    before_state: { status: "paused" }, after_state: { status: "running" },
  });
  return { ok: true };
}
