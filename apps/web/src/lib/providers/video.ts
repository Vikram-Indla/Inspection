// Cycle 2 Wave 2.A — Video Inspection provider adapter.
// Real vendor SDK is NOT integrated (no video vendor selected — DEC-pending,
// matches the existing "provider adapter is not connected" UI already shown
// on /virtual/[id]). This module defines the application-facing interface a
// real adapter would implement, plus a staging-only deterministic stub.
//
// Identity/OTP verification during join is already real (vp_request_otp /
// vp_verify_otp RPCs, supabase/migrations/0009_virtual_otp.sql) — this
// provider only covers the media/room connection layer that has no real
// implementation yet.
import { assertNonProduction, resolveFeatureFlag, seededFraction } from "./env-gate";

export type VideoSessionState =
  | "waiting_room" | "connecting" | "connected" | "degraded" | "reconnecting" | "provider_unavailable" | "ended";

export type MediaPermissionState = "granted" | "denied" | "prompt";

export type VideoTimelineEvent = { at: string; event: string; detail?: Record<string, unknown> };

export type VideoJoinResult = {
  state: VideoSessionState;
  roomToken: string | null;
  camera: MediaPermissionState;
  mic: MediaPermissionState;
  provider: "stub" | "real";
  fixtureId: string | null;
};

export interface VideoInspectionProvider {
  readonly name: "stub" | "real";
  joinRoom(sessionId: string, participantId: string): Promise<VideoJoinResult>;
  endSession(sessionId: string): Promise<{ endedAt: string; timeline: VideoTimelineEvent[] }>;
}

/**
 * Deterministic staging stub. Scenario is derived from a seeded hash of
 * sessionId+participantId so the same pair always reproduces the same
 * outcome (happy / degraded-then-recover / provider-unavailable) — required
 * for repeatable test evidence. UI callers MUST render the `SIMULATED VIDEO
 * SESSION` badge whenever provider === "stub" (this module never claims to
 * be a real connection).
 */
export class StagingVideoProvider implements VideoInspectionProvider {
  readonly name = "stub" as const;

  constructor() { assertNonProduction("StagingVideoProvider"); }

  async joinRoom(sessionId: string, participantId: string): Promise<VideoJoinResult> {
    const f = seededFraction(`${sessionId}:${participantId}`);
    const fixtureId = `video-fixture-${sessionId.slice(0, 8)}`;
    if (f < 0.08) {
      return { state: "provider_unavailable", roomToken: null, camera: "prompt", mic: "prompt", provider: "stub", fixtureId };
    }
    if (f < 0.2) {
      // camera/mic permission denied — a real, common device-permission failure mode
      return { state: "waiting_room", roomToken: null, camera: "denied", mic: "prompt", provider: "stub", fixtureId };
    }
    if (f < 0.35) {
      // connects, then network degrades — reconnect path
      return { state: "degraded", roomToken: `stub-room-${sessionId}`, camera: "granted", mic: "granted", provider: "stub", fixtureId };
    }
    return { state: "connected", roomToken: `stub-room-${sessionId}`, camera: "granted", mic: "granted", provider: "stub", fixtureId };
  }

  async endSession(sessionId: string): Promise<{ endedAt: string; timeline: VideoTimelineEvent[] }> {
    const endedAt = new Date().toISOString();
    return {
      endedAt,
      timeline: [
        { at: endedAt, event: "session_ended", detail: { sessionId, provider: "stub" } },
      ],
    };
  }
}

export const VIDEO_PROVIDER_MODES = ["stub", "off"] as const;
export type VideoProviderMode = (typeof VIDEO_PROVIDER_MODES)[number];

/** Release integration point: a real vendor adapter registers here once selected. */
export function selectVideoProvider(): VideoInspectionProvider | null {
  // Default OFF: the existing /virtual/[id] "provider adapter pending" UI is
  // the honest default. The stub only activates on explicit opt-in so it can
  // never silently start rendering a simulated session nobody asked for.
  const mode = resolveFeatureFlag(process.env.NEXT_PUBLIC_FEATURE_VIDEO_PROVIDER, VIDEO_PROVIDER_MODES, "off");
  if (mode === "off") return null;
  return new StagingVideoProvider();
}
