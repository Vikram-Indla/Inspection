"use server";
// Room admission for the console side of a virtual session.
//
// This is the security boundary for joining. Three rules hold it:
//
//  1. IDENTITY IS SERVER-DERIVED. The browser never says who it is. A client
//     that could choose its own identity could join a governed session as
//     somebody else, and the recording/audit trail would name the wrong person.
//
//  2. SCOPE IS PROVEN BY RLS, not by a role string. The session row is read
//     with the caller's own credentials, so if vs_read does not expose that
//     session to this user, there is no token. No separate permission list to
//     drift out of step with the policy.
//
//  3. A CLOSED SESSION CANNOT BE JOINED. Closed sessions are immutable by
//     contract; handing out a token for one would let media attach to a record
//     that is supposed to be finished.
//
// SCOPE LIMIT, stated plainly: this admits an AUTHENTICATED CONSOLE USER only.
// The factory representative has no auth account (they are verified by OTP, and
// virtual_participants carries no user_id) and no join surface, so they still
// cannot join a room. This does NOT yet deliver an inspector-to-representative
// call — it delivers console participants joining a real Twilio room.
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { ensureRoom, mintRoomToken, videoRoomJoinable } from "@/lib/providers/video-twilio";

export type RoomAdmission =
  | { ok: true; token: string; identity: string; roomSid: string }
  | { ok: false; error: string };

const GENERIC = "The room could not be opened. Try again or contact support.";

export async function requestRoomToken(sessionId: string): Promise<RoomAdmission> {
  if (!videoRoomJoinable()) {
    return { ok: false, error: "Joining a room is not available in this environment." };
  }
  if (!sessionId) return { ok: false, error: GENERIC };

  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { ok: false, error: "Session expired — sign in again." };

  // Rule 2: RLS decides. A session this user cannot read is a session this user
  // cannot join, and the failure is deliberately indistinguishable from "not
  // found" so the response does not confirm that a session exists.
  const { data: session, error } = await sb
    .from("virtual_sessions")
    .select("id, state")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) {
    console.error("[virtual room admission read]", error);
    return { ok: false, error: GENERIC };
  }
  if (!session) return { ok: false, error: "Wrong appointment or out of scope." };

  // Rule 3.
  if (session.state === "closed") {
    return { ok: false, error: "This session is closed — closed sessions cannot be joined." };
  }

  // Rule 1: identity comes from the verified session, prefixed so a console user
  // can never collide with a future factory-representative identity space.
  const identity = `user:${user.id}`;

  const room = await ensureRoom(sessionId);
  if (!room.ok) {
    console.error("[virtual room provision]", room.reason, room.detail ?? "");
    return { ok: false, error: GENERIC };
  }

  const token = await mintRoomToken(sessionId, identity);
  if (!token) {
    console.error("[virtual room token] mint returned null despite joinable transport");
    return { ok: false, error: GENERIC };
  }

  return { ok: true, token, identity, roomSid: room.sid };
}
