"use server";
// Field home write legs (SCR-IPAD-600).
// M03-001 — inspector inbox mark-read (notifications.delivery_state).
// RLS is the authority: notif_update_recipient (0015) scopes updates to the
// recipient; until that migration is applied the DB reports zero rows and we
// surface that honestly instead of pretending success.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export type FieldActionResult = { error?: string; ok?: string };

export async function markNotificationRead(_: FieldActionResult, fd: FormData): Promise<FieldActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const id = String(fd.get("notification_id") ?? "");
  if (!id) return { error: "Missing notification id." };

  const { data, error } = await sb
    .from("notifications")
    .update({ delivery_state: "read" })
    .eq("id", id)
    .eq("recipient", user.id)          // belt — RLS notif_update_recipient is the authority
    .eq("delivery_state", "queued")    // only unread rows transition; 'handled' (ops) stays
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "No row updated — already read, or notifications UPDATE not granted by RLS (0015 pending)." };
  revalidatePath("/field");
  return { ok: "read" };
}

// F3 · M03-005 — drag-reschedule REQUEST from the field calendar. The inspector
// cannot update visits (visits_update RLS is planner/ops): request_visit_reschedule
// (0020, SECURITY DEFINER, RBAC-009-guarded) records the proposed window on
// visits.reschedule_requested and notifies planners. Errors surface verbatim.
export async function requestVisitReschedule(
  visitId: string, proposedStartIso: string, proposedEndIso: string,
): Promise<FieldActionResult> {
  if (!visitId || !proposedStartIso || !proposedEndIso) {
    return { error: "Missing visit or proposed window (M03-005)." };
  }
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };
  const { error } = await sb.rpc("request_visit_reschedule", {
    p_visit: visitId, p_start: proposedStartIso, p_end: proposedEndIso, p_reason: null,
  });
  if (error) return { error: error.message };
  revalidatePath("/field");
  return { ok: "reschedule_requested" };
}
