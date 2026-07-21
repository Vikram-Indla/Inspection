// M8 — Planning lifecycle helpers (PLN-CON-011): governed return/cancellation
// reason lookups and the append-only visit_lifecycle_events stream.
//
// Reasons are NEVER free text encoded in a notes prefix: the governed key
// comes from planning_lookups (return_reason / cancellation_reason kinds),
// comments ride alongside, and every transition appends a lifecycle event
// carrying the prior-state snapshot (previous inspector / window / status).
// The stream is append-only by RLS (insert via planning.manage/cancel/
// reassign/reschedule/edit_draft capabilities; no update/delete policies).
import type { SupabaseClient } from "@supabase/supabase-js";

export type LifecycleEventType =
  | "return" | "cancel" | "republish" | "expire"
  | "duplicate" | "reschedule" | "reassign" | "discard_draft";

export type ReasonOption = {
  key: string;
  label_en: string;
  label_ar: string | null;
  metadata: Record<string, unknown>;
};

/** Active governed reason options for a lookup kind, ordered for display. */
export async function getReasonOptions(
  sb: SupabaseClient,
  kind: "return_reason" | "cancellation_reason",
): Promise<{ options: ReasonOption[]; error: string | null }> {
  const { data, error } = await sb.from("planning_lookups")
    .select("key, label_en, label_ar, metadata")
    .eq("kind", kind).eq("is_active", true)
    .order("sort_order").order("key");
  if (error) {
    console.error(`[planning.lifecycle] ${kind} lookup read failed:`, error.message);
    return { options: [], error: error.message };
  }
  return { options: (data ?? []) as ReasonOption[], error: null };
}

/**
 * Validate a submitted governed reason. The key must be an active lookup key;
 * 'other' (and any key whose metadata sets comments_required) requires
 * non-empty comments. Returns a neutral error string or null.
 */
export function validateReason(
  options: ReasonOption[], key: string, comments: string, noun: string,
): string | null {
  const opt = options.find(o => o.key === key);
  if (!opt) return `Choose a governed ${noun} reason from the list (PLN-CON-011)`;
  const commentsRequired = key === "other" || opt.metadata?.comments_required === true;
  if (commentsRequired && !comments.trim()) return `Comments are mandatory when the ${noun} reason is "${opt.label_en}" (PLN-CON-011)`;
  return null;
}

/**
 * Append a lifecycle event. The caller's capability (RLS insert policy) is the
 * authority; actor is stamped from the verified session. Returns the provider
 * error message (already logged) or null on success — callers decide how to
 * surface a stream-write failure against an already-committed transition,
 * exactly like the queued-notification pattern (never a silent gap, never a
 * rollback of the committed state).
 */
export async function recordLifecycleEvent(
  sb: SupabaseClient,
  event: {
    visitId: string;
    eventType: LifecycleEventType;
    reasonKey?: string | null;
    comments?: string | null;
    actor: string | null;
    previous?: Record<string, unknown>;
  },
): Promise<string | null> {
  const { error } = await sb.from("visit_lifecycle_events").insert({
    visit_id: event.visitId,
    event_type: event.eventType,
    reason_key: event.reasonKey ?? null,
    comments: event.comments?.trim() ? event.comments.trim() : null,
    actor: event.actor,
    previous: event.previous ?? {},
  });
  if (error) {
    console.error(`[planning.lifecycle] ${event.eventType} event for ${event.visitId} failed:`, error.message);
    return error.message;
  }
  return null;
}
