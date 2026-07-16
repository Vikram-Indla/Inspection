"use server";
// M05 session room actions — guarded state transitions (scheduled → waiting →
// joined → verified → in_progress → closed; trg_guard_virtual in 0018 rejects
// backward moves and any edit to a closed session), timeline events
// (vs_append_event, RLS vs_write authority) and notification legs (ENG-11).
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

const SYSTEM_ERROR = "The session could not be updated. Try again or contact support.";
import { insertNotification } from "@/lib/notify";

const DELIVERY_DEGRADED = "Some follow-up updates could not be queued. The session change itself was saved.";

// CD-043 / SCR-VIR-720 (S13) — optimistic-concurrency: the client submits the
// revision token (state:timelineLength) it rendered from. If the session has
// advanced since (a concurrent join/verify/begin/close), the mutation is
// refused before any write so the operator reloads the true state. No schema
// change — state + timeline length are already server-authoritative.
const STALE = "This session changed since you loaded it. Reload to see the latest state, then act.";
const sessionRev = (state: string, timeline: unknown): string =>
  `${state}:${Array.isArray(timeline) ? timeline.length : 0}`;

export type RoomActionResult = { error?: string; ok?: string; stale?: boolean };

async function appendEvent(sb: Awaited<ReturnType<typeof supabaseServer>>, session_id: string, event: string, detail: Record<string, unknown> = {}) {
  const { error } = await sb.rpc("vs_append_event", { p_session: session_id, p_event: event, p_detail: detail });
  if (error) console.error(`[virtual ${event} timeline]`, error);
  return !!error;
}

// M05-002 — reschedule: appointment change is only legal before anyone joins.
export async function rescheduleSession(_: RoomActionResult, fd: FormData): Promise<RoomActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const session_id = String(fd.get("session_id") ?? "");
  const appointment_at = String(fd.get("appointment_at") ?? "");
  const clientRev = String(fd.get("rev") ?? "");
  if (!appointment_at || Number.isNaN(Date.parse(appointment_at)))
    return { error: "A valid appointment date/time is required (M05-002)." };
  const { data: s, error: sErr } = await sb.from("virtual_sessions")
    .select("id, state, timeline, visit_id, visits(factories(name), assignments(inspector_id))").eq("id", session_id).single();
  if (sErr) { console.error("[virtual reschedule session read]", sErr); return { error: SYSTEM_ERROR }; }
  if (clientRev && clientRev !== sessionRev(s.state, s.timeline))
    return { error: STALE, stale: true };
  if (!["scheduled", "waiting"].includes(s.state))
    return { error: `Session is ${s.state.replace(/_/g, " ")} — rescheduling is only allowed before participants join (STM-VIR).` };
  const appointmentIso = new Date(appointment_at).toISOString();
  // Compare-and-swap on state: the appointment_at write itself keeps state
  // unchanged, so the STM-VIR guard trigger (which only blocks state moves and
  // edits to a closed row) would let a reschedule land on an already-joined
  // session if a concurrent join advanced it between the read above and this
  // write. The state filter closes that TOCTOU — a race loses the row and the
  // reschedule is refused, mirroring openWaitingRoom's guarded transition.
  const { data: upd, error } = await sb.from("virtual_sessions")
    .update({ appointment_at: appointmentIso })
    .eq("id", session_id).in("state", ["scheduled", "waiting"]).select("id");
  if (error) { console.error("[virtual reschedule session write]", error); return { error: SYSTEM_ERROR }; }
  if (!upd?.length) return { error: "No row updated — the session moved past scheduling (a participant joined concurrently), or RLS denied (vs_write: planner/ops/assigned inspector only)." };
  const evErr = await appendEvent(sb, session_id, "rescheduled", { appointment_at: appointmentIso });
  const asg = (s.visits as unknown as { assignments: { inspector_id: string }[]; factories: { name: string } } | null);
  const notes: string[] = [];
  if (evErr) notes.push(DELIVERY_DEGRADED);
  if (asg?.assignments?.[0]?.inspector_id) {
    const n = await insertNotification(sb, {
      event_key: "virtual_rescheduled", recipient: asg.assignments[0].inspector_id,
      payload: { session_id, appointment_at: appointmentIso, factory: asg.factories?.name },
    });
    if (n.error) { console.error("[virtual rescheduled inspector notification]", n.error); notes.push(DELIVERY_DEGRADED); }
  }
  const rep = await insertNotification(sb, {
    event_key: "virtual_rescheduled", recipient: null, channel: "sms",
    payload: { session_id, appointment_at: appointmentIso, factory: asg?.factories?.name },
  });
  if (rep.error) { console.error("[virtual rescheduled factory notification]", rep.error); notes.push(DELIVERY_DEGRADED); }
  revalidatePath(`/virtual/${session_id}`);
  return { ok: `Rescheduled to ${appointmentIso.slice(0, 16).replace("T", " ")}${notes.length ? ` — ${notes.join("; ")}` : ""}` };
}

// STM-VIR — waiting room opened (scheduled → waiting).
export async function openWaitingRoom(_: RoomActionResult, fd: FormData): Promise<RoomActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const session_id = String(fd.get("session_id") ?? "");
  const { data: upd, error } = await sb.from("virtual_sessions")
    .update({ state: "waiting" }).eq("id", session_id).eq("state", "scheduled").select("id");
  if (error) { console.error("[virtual waiting room]", error); return { error: SYSTEM_ERROR }; }
  if (!upd?.length) return { error: "No transition — session is not in scheduled state, or RLS denied (STM-VIR)." };
  const evErr = await appendEvent(sb, session_id, "waiting_opened");
  revalidatePath(`/virtual/${session_id}`);
  return { ok: evErr ? `Waiting room opened — ${DELIVERY_DEGRADED}` : "Waiting room opened" };
}

// M05-009/010 — participant join: joined_at persisted + session advances.
export async function joinParticipant(_: RoomActionResult, fd: FormData): Promise<RoomActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const session_id = String(fd.get("session_id") ?? "");
  const participant_id = String(fd.get("participant_id") ?? "");
  const { data: p, error: pErr } = await sb.from("virtual_participants")
    .update({ joined_at: new Date().toISOString() })
    .eq("id", participant_id).eq("session_id", session_id).is("joined_at", null)
    .select("display_name, role").maybeSingle();
  if (pErr) { console.error("[virtual participant read]", pErr); return { error: SYSTEM_ERROR }; }
  if (!p) return { error: "No row updated — participant already joined, or RLS denied." };
  // Advance scheduled/waiting → joined (forward-only; guard enforces).
  await sb.from("virtual_sessions").update({ state: "joined" })
    .eq("id", session_id).in("state", ["scheduled", "waiting"]);
  const evErr = await appendEvent(sb, session_id, "joined", { participant: p.display_name, role: p.role });
  revalidatePath(`/virtual/${session_id}`);
  return { ok: evErr ? `${p.display_name} joined — ${DELIVERY_DEGRADED}` : `${p.display_name} joined` };
}

// M05-018 — one RLS-scoped RPC proves the verified factory representative(s),
// advances the canonical state and appends the timeline event atomically.
export async function markSessionVerified(_: RoomActionResult, fd: FormData): Promise<RoomActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const session_id = String(fd.get("session_id") ?? "");
  const participant_id = String(fd.get("participant_id") ?? "");
  if (!session_id || !participant_id) return { error: SYSTEM_ERROR };
  const { data: transitioned, error } = await sb.rpc("vs_mark_session_verified", {
    p_session: session_id,
    p_participant: participant_id,
  });
  if (error) { console.error("[virtual session verified]", error); return { error: SYSTEM_ERROR }; }
  revalidatePath(`/virtual/${session_id}`);
  if (!transitioned) return { ok: "Identity verified (session already verified or further along)" };
  return { ok: "Session verified" };
}

// M05-019/020 — begin remote inspection: same workspace + submission flow as
// physical. Creates the in_progress inspection against the frozen package.
export async function beginRemote(_: RoomActionResult, fd: FormData): Promise<RoomActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const session_id = String(fd.get("session_id") ?? "");
  const clientRev = String(fd.get("rev") ?? "");
  const { data: s, error: sErr } = await sb.from("virtual_sessions")
    .select("id, state, timeline, visit_id, visits(package_version_id, inspections(id))").eq("id", session_id).single();
  if (sErr) { console.error("[virtual begin session read]", sErr); return { error: SYSTEM_ERROR }; }
  if (clientRev && clientRev !== sessionRev(s.state, s.timeline))
    return { error: STALE, stale: true };
  if (s.state !== "verified" && s.state !== "in_progress")
    return { error: "Verification gates execution — verify the factory representative first (STM-VIR-002, no bypass)." };
  const v = s.visits as unknown as { package_version_id: string; inspections: unknown };
  // visits -> inspections is a TO-ONE embed (unique visit_id): object|null.
  const insEmbed = v.inspections;
  let inspectionId = (Array.isArray(insEmbed) ? insEmbed[0] : insEmbed as { id: string } | null)?.id as string | undefined;
  if (!inspectionId) {
    const { data: ins, error: iErr } = await sb.from("inspections").insert({
      visit_id: s.visit_id, status: "in_progress", package_version_id: v.package_version_id,
      started_at: new Date().toISOString(),
    }).select("id").single();
    if (iErr) { console.error("[virtual begin inspection]", iErr); return { error: SYSTEM_ERROR }; }
    inspectionId = ins.id;
  }
  // Advance verified → in_progress and record the begin event on EVERY entry
  // path (not only when the inspection is freshly created — WA-02). The
  // .eq("state","verified") filter makes this forward-only and fires the begin
  // event exactly once; a session already in_progress no-ops safely.
  const { data: adv, error: aErr } = await sb.from("virtual_sessions")
    .update({ state: "in_progress" }).eq("id", session_id).eq("state", "verified").select("id");
  if (aErr) { console.error("[virtual begin advance]", aErr); return { error: SYSTEM_ERROR }; }
  if (adv?.length) {
    const evErr = await appendEvent(sb, session_id, "begin", { inspection_id: inspectionId });
    if (evErr) { console.error("[virtual begin timeline]", evErr); return { error: "The inspection started, but its timeline could not be updated. Contact support." }; }
  }
  redirect(`/field/inspection/${inspectionId}`);
}

// M05-005/006 — session-scoped close/cancel with mandatory reason + comments.
export async function closeSession(_: RoomActionResult, fd: FormData): Promise<RoomActionResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const session_id = String(fd.get("session_id") ?? "");
  const reason = String(fd.get("reason") ?? "").trim();
  const comments = String(fd.get("comments") ?? "").trim();
  const clientRev = String(fd.get("rev") ?? "");
  if (!reason) return { error: "A close/cancel reason is mandatory (M05-006)." };
  const { data: s, error: sErr } = await sb.from("virtual_sessions")
    .select("id, state, timeline, visits(factories(name), assignments(inspector_id))").eq("id", session_id).single();
  if (sErr) { console.error("[virtual close session read]", sErr); return { error: SYSTEM_ERROR }; }
  if (clientRev && clientRev !== sessionRev(s.state, s.timeline))
    return { error: STALE, stale: true };
  if (s.state === "closed") return { error: "Session is already closed (closed sessions are immutable — STM-VIR)." };
  // State + closing timeline event land in ONE update: after it, the guard
  // trigger makes the row immutable, so the event must ride along.
  const closedEvent = { event: "closed", at: new Date().toISOString(), actor: user.id, detail: { reason, comments: comments || null } };
  const { data: upd, error } = await sb.from("virtual_sessions")
    .update({ state: "closed", timeline: [...((s.timeline as unknown[]) ?? []), closedEvent] })
    .eq("id", session_id).select("id");
  if (error) { console.error("[virtual close session write]", error); return { error: SYSTEM_ERROR }; }
  if (!upd?.length) return { error: "No row updated — RLS denied (vs_write: planner/ops/assigned inspector only)." };
  const asg = (s.visits as unknown as { assignments: { inspector_id: string }[]; factories: { name: string } } | null);
  if (asg?.assignments?.[0]?.inspector_id) {
    const n = await insertNotification(sb, {
      event_key: "virtual_closed", recipient: asg.assignments[0].inspector_id,
      payload: { session_id, reason, comments: comments || null, factory: asg.factories?.name },
    });
    if (n.error) return { error: "Session closed, but the inspector notification could not be queued." };
  }
  revalidatePath(`/virtual/${session_id}`);
  revalidatePath("/virtual");
  return { ok: "Session closed — reason recorded on the timeline (M05-005/006, audited)" };
}
