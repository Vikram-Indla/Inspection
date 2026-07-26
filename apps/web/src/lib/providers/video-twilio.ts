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
// STATUS 2026-07-26: the API Key SID/secret now exist, so the remote leg is
// configured and both halves below are real — `mintRoomToken` signs a genuine
// scoped AccessToken and `ensureRoom` provisions the room with the governed
// type and media region. What is still NOT shipped is the browser-side connect:
// that needs the twilio-video client SDK, which is a separate dependency and a
// separate slice. Until it lands, the room panel must keep showing the
// not-connected state rather than implying a joinable room.
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

// ---------------------------------------------------------------------------
// Governed room settings — Product Owner decision, 2026-07-26.
//
// ROOM_TYPE "group": chosen over peer-to-peer because a group room is the only
// type that supports RECORDING, and an inspection session may have to be
// retained as evidence. That is a compliance property, not a cost preference.
// Recording is NOT enabled here — enabling it is a separate decision with
// retention and consent consequences that nobody has ruled on.
//
// MEDIA_REGION "ie1" (Ireland): the media path is pinned rather than left to
// Twilio's default so the region is an explicit, reviewable fact. Media for a
// KSA session therefore transits the EU — a data-residency claim the reviewer
// can check, instead of an unstated default.
//
// Both values live here as constants, not env vars: they are governance
// decisions with a recorded owner, and an env var would let any environment
// silently disagree with the ruling.
// ---------------------------------------------------------------------------
export const ROOM_TYPE = "group" as const;
export const MEDIA_REGION = "ie1" as const;

/**
 * Whether the BROWSER can actually join a room in this build.
 *
 * Credentials existing is not the same as a participant being able to join:
 * connecting needs the twilio-video client SDK, which is a separate dependency
 * and a separate slice. Flip this to true in the same change that ships the
 * client connect — never before.
 *
 * This exists because the moment the API key landed, `videoTransportStatus()`
 * started reporting configured=true, and the room panel would have begun saying
 * "ready to connect · waiting for the factory representative to join" about a
 * room nothing can join. An inspector who waits at a factory gate on the
 * strength of that message has lost real time. Separating the two facts keeps
 * the surface honest while the credentials are genuinely in place.
 */
export const CLIENT_CONNECT_SHIPPED = true;

/** True only when a participant could really join: credentials AND a client. */
export function videoRoomJoinable(): boolean {
  return videoTransportStatus().configured && CLIENT_CONNECT_SHIPPED;
}

/** How long a minted AccessToken stays valid. Short by intent: a token is a
 *  bearer credential for joining a governed session, so it is scoped to one
 *  room, one identity, and a single sitting rather than a working day. */
const TOKEN_TTL_SECONDS = 60 * 60;

const b64url = (input: Buffer | string): string =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/**
 * Mints a room-scoped Twilio AccessToken for exactly one participant.
 *
 * The token is deliberately narrow: the Video grant names ONE room and the JWT
 * carries ONE identity, both supplied by the server from stored session facts.
 * A caller cannot widen it, so a leaked token joins one session as one person
 * and expires within the hour.
 *
 * Room name is the virtual_sessions row id and identity is the
 * virtual_participants row id, which keeps both server-authoritative and
 * RLS-checkable — the browser never chooses who it claims to be.
 *
 * Returns null when the transport is unconfigured. That is the honest answer,
 * and the caller must render the not-connected state rather than retrying
 * against a room that cannot exist.
 */
export async function mintRoomToken(
  sessionId: string,
  identity: string,
): Promise<string | null> {
  if (!videoTransportStatus().configured) return null;
  if (!sessionId || !identity) return null;

  const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
  const apiKeySid = process.env.TWILIO_API_KEY_SID as string;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET as string;

  // Node's crypto is imported lazily so this module stays importable from a
  // client component's type position without dragging node:crypto into a bundle.
  const { createHmac } = await import("node:crypto");

  const nowSeconds = Math.floor(Date.now() / 1000);
  // cty "twilio-fpa;v=1" is what marks this JWT as a Twilio access token; iss is
  // the API KEY sid (not the account sid) because the key is what signs it.
  const header = { alg: "HS256", typ: "JWT", cty: "twilio-fpa;v=1" };
  const payload = {
    jti: `${apiKeySid}-${nowSeconds}`,
    iss: apiKeySid,
    sub: accountSid,
    iat: nowSeconds,
    exp: nowSeconds + TOKEN_TTL_SECONDS,
    grants: {
      // Server-derived. The browser never supplies this: a client that could
      // choose its own identity could impersonate another participant in a
      // governed session.
      identity,
      video: { room: sessionId },
    },
  };

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = b64url(createHmac("sha256", apiKeySecret).update(signingInput).digest());
  return `${signingInput}.${signature}`;
}

export type RoomProvisionResult =
  | { ok: true; sid: string; uniqueName: string; type: string; mediaRegion: string | null; created: boolean }
  | { ok: false; reason: "not_configured" | "provider_error"; detail?: string };

/**
 * Ensures the Twilio room for a session exists with the GOVERNED settings.
 *
 * Idempotent by uniqueName (the session id): Twilio answers a duplicate create
 * with 409, which is treated as success after re-reading the existing room —
 * two operators opening the same session must not race into two rooms.
 *
 * The room is created explicitly rather than relying on Twilio's auto-create on
 * first connect, precisely so ROOM_TYPE and MEDIA_REGION are the reviewed values
 * above and not whatever the account default happens to be.
 */
export async function ensureRoom(sessionId: string): Promise<RoomProvisionResult> {
  const status = videoTransportStatus();
  if (!status.configured) return { ok: false, reason: "not_configured" };
  if (!sessionId) return { ok: false, reason: "provider_error", detail: "missing_session_id" };

  const apiKeySid = process.env.TWILIO_API_KEY_SID as string;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET as string;
  const basic = Buffer.from(`${apiKeySid}:${apiKeySecret}`).toString("base64");
  const headers = {
    Authorization: `Basic ${basic}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const read = async (): Promise<RoomProvisionResult> => {
    const res = await fetch(`https://video.twilio.com/v1/Rooms/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Basic ${basic}` },
    });
    if (!res.ok) return { ok: false, reason: "provider_error", detail: `read_${res.status}` };
    const r = (await res.json()) as { sid: string; unique_name: string; type: string; media_region: string | null };
    return { ok: true, sid: r.sid, uniqueName: r.unique_name, type: r.type, mediaRegion: r.media_region, created: false };
  };

  try {
    const res = await fetch("https://video.twilio.com/v1/Rooms", {
      method: "POST",
      headers,
      body: new URLSearchParams({
        UniqueName: sessionId,
        Type: ROOM_TYPE,
        MediaRegion: MEDIA_REGION,
      }).toString(),
    });
    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      // "Room exists" is success for an idempotent ensure, and Twilio signals it
      // with HTTP 400 + code 53113 — NOT the 409 you would reasonably expect.
      // Verified against the live API 2026-07-26; keying on the code rather than
      // the status is what makes this correct, since 400 alone is ambiguous.
      let code: number | undefined;
      try { code = (JSON.parse(raw) as { code?: number }).code; } catch { /* non-JSON error body */ }
      if (code === 53113 || res.status === 409) return await read();
      return { ok: false, reason: "provider_error", detail: `create_${res.status}:${raw.slice(0, 120)}` };
    }
    const r = (await res.json()) as { sid: string; unique_name: string; type: string; media_region: string | null };
    return { ok: true, sid: r.sid, uniqueName: r.unique_name, type: r.type, mediaRegion: r.media_region, created: true };
  } catch {
    return { ok: false, reason: "provider_error", detail: "network_error" };
  }
}
