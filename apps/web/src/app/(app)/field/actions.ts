"use server";
// Field home write legs (SCR-IPAD-600).
// M03-001 — inspector inbox mark-read (notifications.delivery_state).
// RLS is the authority: notif_update_recipient (0015) scopes updates to the
// recipient; until that migration is applied the DB reports zero rows and we
// surface that honestly instead of pretending success.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type FieldActionResult = { error?: string; ok?: string };

export async function markNotificationRead(_: FieldActionResult, fd: FormData): Promise<FieldActionResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) {
    console.error("[field mark notification auth]", authError.message);
    return { error: "Notification status could not be updated. Try again." };
  }
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
  if (error) {
    console.error("[field mark notification]", error.message, error.code);
    return { error: "Notification status could not be updated. Try again." };
  }
  if (!data?.length) return { error: "This notification is already read or is no longer available." };
  revalidatePath("/field");
  return { ok: "read" };
}

// F3 · M03-005 — drag-reschedule REQUEST from the field calendar. The inspector
// cannot update visits (visits_update RLS is planner/ops): request_visit_reschedule
// (0020, SECURITY DEFINER, RBAC-009-guarded) records the proposed window on
// visits.reschedule_requested and notifies planners. Provider errors remain
// diagnostic-only; the field UI receives stable recovery copy.
export async function requestVisitReschedule(
  visitId: string, proposedStartIso: string, proposedEndIso: string,
): Promise<FieldActionResult> {
  if (!visitId || !proposedStartIso || !proposedEndIso) {
    return { error: "Missing visit or proposed window (M03-005)." };
  }
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) {
    console.error("[field reschedule auth]", authError.message);
    return { error: "The reschedule request could not be sent. Your visit is unchanged — try again." };
  }
  if (!user) return { error: "Session expired — sign in again." };
  const { error } = await sb.rpc("request_visit_reschedule", {
    p_visit: visitId, p_start: proposedStartIso, p_end: proposedEndIso, p_reason: null,
  });
  if (error) {
    console.error("[field reschedule request]", error.message, error.code);
    return { error: "The reschedule request could not be sent. Your visit is unchanged — try again." };
  }
  revalidatePath("/field");
  return { ok: "reschedule_requested" };
}
