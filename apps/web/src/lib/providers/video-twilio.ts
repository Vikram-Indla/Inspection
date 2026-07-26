// Twilio Video — the selected remote-inspection transport (Product Owner,
// 2026-07-26; supersedes the "no vendor selected" note in ./video.ts).
//
// SPLIT OF RESPONSIBILITY, and why it matters for what the console may claim:
//
//   LOCAL media  (camera, microphone, screen share, self-view)
//     Pure browser capability — getUserMedia / getDisplayMedia. Needs no
//     vendor, no token, no network. It works today and is implemented in
//     RoomStage.tsx.
//
//   REMOTE media (the factory representative's stream, the shared room)
//     Needs a Twilio Video room plus a signed AccessToken. A token can only
//     be signed with an API Key SID + Secret — the account auth token cannot
//     sign one. Until those exist the remote leg cannot connect, and the
//     console must say so rather than paint an empty tile as "waiting".
//
// Fail-closed by contract: this module never fabricates a room, a token or a
// participant. `videoTransportStatus()` reports exactly which credentials are
// absent, and the UI renders that fact.
//
// Identity/OTP verification is unrelated to this module and is already real
// (vp_request_otp / vp_verify_otp, supabase/migrations/0009_virtual_otp.sql).

/** Credentials a Twilio Video AccessToken requires, in mint order. */
const REQUIRED_VIDEO_ENV = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_API_KEY_SID",
  "TWILIO_API_KEY_SECRET",
] as const;

export type VideoTransportStatus = {
  /** True only when every credential needed to mint an AccessToken exists. */
  configured: boolean;
  provider: "twilio";
  /** Env var names that are absent — drives the operator-facing reason. */
  missing: string[];
};

/**
 * Server-only. Reports whether the remote leg can be established at all.
 * Never throws and never partially reports: a missing credential is a missing
 * credential, not a degraded connection.
 */
export function videoTransportStatus(): VideoTransportStatus {
  const missing = REQUIRED_VIDEO_ENV.filter(key => {
    const v = process.env[key];
    return !v || v.trim().length === 0;
  });
  return { configured: missing.length === 0, provider: "twilio", missing };
}

/**
 * Release integration point. Mints a room-scoped Twilio AccessToken for one
 * participant. Deliberately unimplemented while credentials are absent —
 * returning null is the honest answer, and the caller must render the
 * not-connected state rather than retrying against a room that cannot exist.
 *
 * When the credentials land, this signs a JWT with the Video grant
 * (room = the virtual_sessions row id, identity = the virtual_participants
 * row id) so the room name and participant identity both stay
 * server-authoritative and RLS-checkable.
 */
export async function mintRoomToken(
  _sessionId: string,
  _participantId: string,
): Promise<string | null> {
  if (!videoTransportStatus().configured) return null;
  // No signing path is shipped yet: minting a token requires the Video API
  // key/secret pair to be provisioned and an accepted decision on room type
  // (group vs peer-to-peer) and media region. Both are ungoverned values, so
  // they are not invented here.
  return null;
}
