"use server";
// M05-002 — virtual session creation (appointment scheduling) with validations.
// RLS is the authority: vs_write (0002) restricts inserts to planner/ops/the
// assigned inspector; the visit must be a published virtual visit without a
// session (DB unique on visit_id backs the app check).
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { insertNotification } from "@/lib/notify";

const SYSTEM_ERROR = "The session could not be scheduled. Try again or contact support.";

export type VirtualActionResult = { error?: string; ok?: string };

export async function scheduleSession(_: VirtualActionResult, fd: FormData): Promise<VirtualActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const visit_id = String(fd.get("visit_id") ?? "");
  const appointment_at = String(fd.get("appointment_at") ?? "");
  const rep_name = String(fd.get("rep_name") ?? "").trim();
  if (!visit_id) return { error: "Missing visit id." };
  if (!appointment_at || Number.isNaN(Date.parse(appointment_at)))
    return { error: "A valid appointment date/time is required (M05-002)." };
  if (!rep_name) return { error: "Factory representative name is required (STM-VIR-002 — identity binds to the OTP)." };

  const { data: visit, error: vErr } = await sb.from("visits")
    .select("id, execution_mode, planning_status, factories(name), virtual_sessions(id), assignments(inspector_id, profiles(full_name))")
    .eq("id", visit_id).single();
  if (vErr) { console.error("[virtual schedule visit read]", vErr); return { error: SYSTEM_ERROR }; }
  if (visit.execution_mode !== "virtual") return { error: "Visit is not a virtual visit (M05-002 validation)." };
  if (visit.planning_status !== "published") return { error: `Visit is ${visit.planning_status} — only published visits can be scheduled (M05-002).` };
  // visits -> virtual_sessions is a TO-ONE embed (unique visit_id): object|null.
  const existing = visit.virtual_sessions as unknown;
  if (Array.isArray(existing) ? existing.length > 0 : !!existing)
    return { error: "A session already exists for this visit — reschedule it from the room." };

  const appointmentIso = new Date(appointment_at).toISOString();
  const { data: session, error: sErr } = await sb.from("virtual_sessions").insert({
    visit_id,
    appointment_at: appointmentIso,
    timeline: [{ event: "scheduled", at: new Date().toISOString(), actor: user.id, detail: { appointment_at: appointmentIso } }],
  }).select("id").single();
  if (sErr) { console.error("[virtual schedule session write]", sErr); return { error: SYSTEM_ERROR }; }

  const asg = (visit.assignments as unknown as { inspector_id: string; profiles: { full_name: string } | null }[])?.[0];
  const participants = [
    { session_id: session.id, display_name: rep_name, role: "factory_rep" },
    ...(asg ? [{ session_id: session.id, display_name: asg.profiles?.full_name ?? "Inspector", role: "inspector" }] : []),
  ];
  const { error: pErr } = await sb.from("virtual_participants").insert(participants);
  if (pErr) { console.error("[virtual schedule participants]", pErr); return { error: "The session could not bind its participants. Try again or contact support." }; }

  const factoryName = (visit.factories as unknown as { name: string } | null)?.name ?? "";
  const notes: string[] = [];
  if (asg?.inspector_id) {
    const n = await insertNotification(sb, {
      event_key: "virtual_scheduled", recipient: asg.inspector_id,
      payload: { session_id: session.id, visit_id, appointment_at: appointmentIso, factory: factoryName },
    });
    if (n.error) notes.push("inspector notification could not be queued");
  }
  // Factory rep is an external party — SMS channel; no provider is configured
  // in this environment, so the row is stored honestly as not_configured.
  const rep = await insertNotification(sb, {
    event_key: "virtual_scheduled", recipient: null, channel: "sms",
    payload: { session_id: session.id, visit_id, appointment_at: appointmentIso, factory: factoryName, rep_name },
  });
  if (rep.error) notes.push("factory representative notification could not be queued");

  revalidatePath("/virtual");
  return { ok: `Session scheduled for ${appointmentIso.slice(0, 16).replace("T", " ")} (M05-002)${notes.length ? ` — ${notes.join("; ")}` : ""}` };
}
